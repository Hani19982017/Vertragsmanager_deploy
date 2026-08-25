const router = require('express').Router();
const A = require('../auth');
const storage = require('../storage');
const { ok, fail, asyncH, str, date } = require('../util');

router.use(A.requireAuth);

// GET /api/customers?q=&tab=
router.get('/', asyncH(async (req, res) => {
  const q = str(req.query.q, 80);
  const tab = str(req.query.tab, 20) || 'all';
  const rows = await A.scope(req, async (c) => {
    const p = [];
    let w = 'WHERE cu.is_active';
    if (req.user.role !== 'owner' && req.user.restrict_agents) {
      p.push(req.user.id); w += ` AND cu.assigned_user_id = $${p.length}`;
    }
    if (q) {
      p.push('%' + q.toLowerCase() + '%');
      w += ` AND (lower(cu.first_name||' '||cu.last_name) LIKE $${p.length}
                 OR lower(coalesce(cu.email,'')) LIKE $${p.length}
                 OR coalesce(cu.phone,'') LIKE $${p.length}
                 OR EXISTS (SELECT 1 FROM contracts x WHERE x.customer_id=cu.id
                            AND lower(coalesce(x.contract_number,'')) LIKE $${p.length}))`;
    }
    if (tab === 'due') w += ` AND EXISTS (SELECT 1 FROM contracts x WHERE x.customer_id=cu.id
        AND x.status IN ('renewal_due','contacted'))`;
    if (tab === 'renewed') w += ` AND EXISTS (SELECT 1 FROM contracts x WHERE x.customer_id=cu.id AND x.status='renewed')`;
    if (tab === 'lost') w += ` AND EXISTS (SELECT 1 FROM contracts x WHERE x.customer_id=cu.id AND x.status='lost')`;

    const r = await c.query(
      `SELECT cu.*,
              (SELECT count(*)::int FROM contracts x WHERE x.customer_id=cu.id) AS contract_count,
              (SELECT min(x.cancel_deadline) FROM contracts x
                 WHERE x.customer_id=cu.id AND x.status NOT IN ('renewed','lost')) AS next_deadline
         FROM customers cu ${w}
        ORDER BY next_deadline NULLS LAST, cu.last_name
        LIMIT 300`, p);
    return r.rows;
  });
  ok(res, rows);
}));

// GET /api/customers/:id  — full record
router.get('/:id', asyncH(async (req, res) => {
  const out = await A.scope(req, async (c) => {
    const cu = (await c.query('SELECT * FROM customers WHERE id=$1', [req.params.id])).rows[0];
    if (!cu) return null;
    if (req.user.role !== 'owner' && req.user.restrict_agents
        && cu.assigned_user_id !== req.user.id) return 'forbidden';
    const contracts = (await c.query(
      `SELECT *, (cancel_deadline - CURRENT_DATE) AS days_remaining
         FROM contracts WHERE customer_id=$1 ORDER BY cancel_deadline`, [cu.id])).rows;
    const activities = (await c.query(
      `SELECT a.*, u.name AS user_name FROM activities a
         LEFT JOIN users u ON u.id=a.user_id
        WHERE a.customer_id=$1 ORDER BY a.created_at DESC LIMIT 50`, [cu.id])).rows;
    const documents = (await c.query(
      `SELECT id, file_name, mime_type, size_bytes, contract_id, created_at
         FROM documents WHERE customer_id=$1 ORDER BY created_at DESC`, [cu.id])).rows;
    const filesBytes = documents.reduce((sum, d) => sum + (Number(d.size_bytes) || 0), 0);
    // Real stored size of this customer's own database rows (their record,
    // their contracts, their activity log, and each document's metadata —
    // NOT the uploaded file bytes themselves, which are counted in filesBytes
    // above). pg_column_size() reports PostgreSQL's actual on-disk row size.
    const textRow = (await c.query(
      `SELECT
         pg_column_size(cu.*) AS cust,
         (SELECT COALESCE(SUM(pg_column_size(ct.*)),0) FROM contracts ct WHERE ct.customer_id=$1) AS ctr,
         (SELECT COALESCE(SUM(pg_column_size(a.*)),0) FROM activities a WHERE a.customer_id=$1) AS act,
         (SELECT COALESCE(SUM(pg_column_size(d.*)),0) FROM documents d WHERE d.customer_id=$1) AS doc
       FROM customers cu WHERE cu.id=$1`, [cu.id])).rows[0];
    const textBytes = Number(textRow.cust) + Number(textRow.ctr) + Number(textRow.act) + Number(textRow.doc);
    const storageBytes = filesBytes + textBytes; // grand total for this customer
    const cross = (await c.query(
      `SELECT service FROM v_cross_sell WHERE customer_id=$1`, [cu.id])).rows.map(r => r.service);
    const household = (await c.query(
      `SELECT id, first_name, last_name FROM customers
        WHERE id<>$1 AND postal_code=$2 AND lower(coalesce(street,''))=lower(coalesce($3,''))
          AND street IS NOT NULL AND is_active`,
      [cu.id, cu.postal_code, cu.street])).rows;
    return { customer: cu, contracts, activities, documents,
             filesBytes, textBytes, storageBytes, cross, household };
  });
  if (out === null) return fail(res, 404, 'not_found');
  if (out === 'forbidden') return fail(res, 403, 'forbidden');
  ok(res, out);
}));

// POST /api/customers
router.post('/', asyncH(async (req, res) => {
  const b = req.body || {};
  const fn = str(b.first_name, 80), ln = str(b.last_name, 80);
  if (!fn || !ln) return fail(res, 400, 'name_required');

  const out = await A.scope(req, async (c) => {
    const n = (await c.query('SELECT count(*)::int n FROM customers WHERE is_active')).rows[0].n;
    if (n >= req.user.max_customers) return 'limit';
    const r = await c.query(
      `INSERT INTO customers
        (tenant_id, first_name, last_name, phone, whatsapp, email, street, postal_code, city,
         marketing_consent, consent_at, consent_source, notes, assigned_user_id, created_by)
       VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,
               CASE WHEN $9 THEN now() ELSE NULL END,$10,$11,$12,$13)
       RETURNING *`,
      [fn, ln, str(b.phone,40), str(b.whatsapp,40), str(b.email,160), str(b.street,160),
       str(b.postal_code,10), str(b.city,80), !!b.marketing_consent, str(b.consent_source,80),
       str(b.notes,2000), b.assigned_user_id || req.user.id, req.user.id]);
    return r.rows[0];
  });
  if (out === 'limit') return fail(res, 402, 'customer_limit_reached');
  ok(res, out);
}));

// PATCH /api/customers/:id
router.patch('/:id', asyncH(async (req, res) => {
  const b = req.body || {};
  const allowed = ['first_name','last_name','phone','whatsapp','email','street',
                   'postal_code','city','notes','assigned_user_id','marketing_consent','moved_at'];
  const sets = [], params = [];
  for (const k of allowed) {
    if (b[k] === undefined) continue;
    params.push(k === 'moved_at' ? date(b[k])
              : k === 'marketing_consent' ? !!b[k]
              : (b[k] === '' ? null : b[k]));
    sets.push(`${k} = $${params.length}`);
  }
  if (!sets.length) return fail(res, 400, 'nothing_to_update');
  params.push(req.params.id);
  const r = await A.scope(req, (c) =>
    c.query(`UPDATE customers SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params));
  if (!r.rowCount) return fail(res, 404, 'not_found');
  ok(res, r.rows[0]);
}));

// POST /api/customers/:id/move — Umzug
router.post('/:id/move', asyncH(async (req, res) => {
  const d = date(req.body.moved_at);
  if (!d) return fail(res, 400, 'date_required');
  const out = await A.scope(req, async (c) => {
    await c.query(
      `UPDATE customers SET moved_at=$1, street=coalesce($2,street),
              postal_code=coalesce($3,postal_code), city=coalesce($4,city)
        WHERE id=$5`,
      [d, str(req.body.street,160), str(req.body.postal_code,10), str(req.body.city,80), req.params.id]);
    const r = await c.query(
      `UPDATE contracts SET status='renewal_due', follow_up_date=$1,
              follow_up_note='Umzug'
        WHERE customer_id=$2 AND service_type IN ('electricity','gas')
          AND status NOT IN ('renewed','lost') RETURNING id`, [d, req.params.id]);
    return r.rowCount;
  });
  ok(res, { affected_contracts: out });
}));

// DELETE /api/customers/:id — permanently delete a customer and ALL their
// data (contracts, activities, documents). This cannot be undone.
router.delete('/:id', asyncH(async (req, res) => {
  const out = await A.scope(req, async (c) => {
    const cu = (await c.query('SELECT * FROM customers WHERE id=$1', [req.params.id])).rows[0];
    if (!cu) return null;
    if (req.user.role !== 'owner' && req.user.restrict_agents
        && cu.assigned_user_id !== req.user.id) return 'forbidden';
    // collect every stored file key for this customer before the cascade wipes the rows
    const docs = (await c.query(
      'SELECT storage_key FROM documents WHERE customer_id=$1', [cu.id])).rows;
    // audit record (audit_log has no FK to customers, so it survives)
    await c.query(
      `INSERT INTO audit_log (tenant_id, user_id, table_name, record_id, field_name, old_value, new_value)
       VALUES (current_setting('app.tenant_id')::uuid,$1,'customers',$2,'deleted',$3,NULL)`,
      [req.user.id, cu.id, (cu.first_name + ' ' + cu.last_name)]);
    // deleting the customer cascades to contracts, activities and documents
    await c.query('DELETE FROM customers WHERE id=$1', [cu.id]);
    return docs;
  });
  if (out === null) return fail(res, 404, 'not_found');
  if (out === 'forbidden') return fail(res, 403, 'forbidden');
  for (const d of out) { try { await storage.del(d.storage_key); } catch (e) {} }
  ok(res);
}));

module.exports = router;
