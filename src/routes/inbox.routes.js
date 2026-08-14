const router = require('express').Router();
const A = require('../auth');
const S = require('../storage');
const { seal, open } = require('../crypto');
const { ok, fail, asyncH, str, int, EMAIL } = require('../util');

router.use(A.requireAuth);

const PRESETS = {
  Gmail:     ['imap.gmail.com', 993, 'smtp.gmail.com', 465],
  Outlook:   ['outlook.office365.com', 993, 'smtp.office365.com', 587],
  IONOS:     ['imap.ionos.de', 993, 'smtp.ionos.de', 465],
  Strato:    ['imap.strato.de', 993, 'smtp.strato.de', 465],
  Hostinger: ['imap.hostinger.com', 993, 'smtp.hostinger.com', 465]
};
router.get('/presets', (_r, res) => ok(res, PRESETS));

// POST /api/inbox/connect  (owner only)
router.post('/connect', A.requireOwner, asyncH(async (req, res) => {
  const b = req.body || {};
  if (!b.email || !EMAIL.test(b.email)) return fail(res, 400, 'bad_email');
  if (!b.imap_host || !b.password) return fail(res, 400, 'missing_fields');
  const row = await A.scope(req, async (c) => {
    await c.query('DELETE FROM mail_accounts');
    const r = await c.query(
      `INSERT INTO mail_accounts (tenant_id, email, imap_host, imap_port,
                                  smtp_host, smtp_port, secret_enc, is_default)
       VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,$6,true)
       RETURNING id, email, imap_host, imap_port, smtp_host, smtp_port`,
      [b.email, str(b.imap_host, 120), int(b.imap_port, 993),
       str(b.smtp_host, 120) || b.imap_host.replace(/^imap/, 'smtp'),
       int(b.smtp_port, 465), seal(b.password)]);
    await c.query(
      `INSERT INTO sender_addresses (tenant_id, email, is_default)
       VALUES (current_setting('app.tenant_id')::uuid,$1,
               NOT EXISTS (SELECT 1 FROM sender_addresses))
       ON CONFLICT DO NOTHING`, [b.email]);
    return r.rows[0];
  });
  ok(res, row);
}));

router.delete('/connect', A.requireOwner, asyncH(async (req, res) => {
  await A.scope(req, (c) => c.query('DELETE FROM mail_accounts'));
  ok(res);
}));

/**
 * POST /api/inbox/sync
 * Pulls recent messages that carry an attachment or come from a known provider.
 * Nothing is filed automatically — every hit lands in the suggestion list and
 * waits for a human to confirm.
 */
router.post('/sync', asyncH(async (req, res) => {
  const acct = await A.scope(req, (c) =>
    c.query('SELECT * FROM mail_accounts ORDER BY created_at LIMIT 1'));
  const a = acct.rows[0];
  if (!a) return fail(res, 400, 'no_account');

  let client;
  try {
    const { ImapFlow } = require('imapflow');
    client = new ImapFlow({
      host: a.imap_host, port: a.imap_port, secure: a.imap_port === 993,
      auth: { user: a.email, pass: open(a.secret_enc) }, logger: false
    });
    await client.connect();
  } catch (e) {
    return fail(res, 502, 'imap_connect_failed');
  }

  let found = 0;
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - 30 * 86400000);
      const uids = await client.search({ since });
      const recent = (uids || []).slice(-60);
      const { simpleParser } = require('mailparser');
      for (const uid of recent) {
        const msg = await client.fetchOne(uid, { source: true, uid: true });
        if (!msg || !msg.source) continue;
        const p = await simpleParser(msg.source);
        const att = (p.attachments || []).filter(x =>
          /pdf|image/.test(x.contentType || '') && x.size < 15 * 1024 * 1024)[0];
        const text = (p.text || '').slice(0, 100000);
        const looksLikeContract = att ||
          /vertrag|police|versicherungsschein|kündig|preisanpassung|preiserhöhung/i
            .test((p.subject || '') + ' ' + text);
        if (!looksLikeContract) continue;

        await A.scope(req, async (c) => {
          const dup = await c.query(
            'SELECT 1 FROM inbox_messages WHERE account_id=$1 AND uid=$2', [a.id, String(uid)]);
          if (dup.rowCount) return;
          let docId = null;
          if (att) {
            const skey = await S.put(att.filename || 'anhang.pdf', att.content);
            const d = await c.query(
              `INSERT INTO documents (tenant_id, file_name, storage_key, mime_type, size_bytes,
                                      extraction_status, extracted_text, uploaded_by)
               VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,'pending',$5,$6)
               RETURNING id`,
              [(att.filename || 'anhang.pdf').slice(0, 200), skey, att.contentType,
               att.size, text, req.user.id]);
            docId = d.rows[0].id;
          }
          const guess = await c.query(
            `SELECT id FROM customers
              WHERE is_active AND (
                (email IS NOT NULL AND position(lower(email) in lower($1)) > 0) OR
                position(lower(first_name || ' ' || last_name) in lower($1)) > 0)
              LIMIT 1`, [(p.subject || '') + ' ' + text]);
          await c.query(
            `INSERT INTO inbox_messages (tenant_id, account_id, uid, from_email, from_name,
              subject, body_text, received_at, has_attachment, attachment_name,
              document_id, customer_id)
             VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             ON CONFLICT DO NOTHING`,
            [a.id, String(uid),
             (p.from && p.from.value[0] && p.from.value[0].address) || '',
             (p.from && p.from.value[0] && p.from.value[0].name) || '',
             (p.subject || '').slice(0, 300), text, p.date || new Date(),
             !!att, att ? (att.filename || '').slice(0, 200) : null, docId,
             guess.rows[0] ? guess.rows[0].id : null]);
          found++;
        });
      }
    } finally { lock.release(); }
    await A.scope(req, (c) =>
      c.query('UPDATE mail_accounts SET last_sync_at = now() WHERE id=$1', [a.id]));
  } catch (e) {
    return fail(res, 502, 'imap_read_failed');
  } finally {
    try { await client.logout(); } catch (_) {}
  }
  ok(res, { imported: found });
}));

// GET /api/inbox
router.get('/', asyncH(async (req, res) => {
  const r = await A.scope(req, (c) => c.query(
    `SELECT m.*, cu.first_name, cu.last_name
       FROM inbox_messages m LEFT JOIN customers cu ON cu.id = m.customer_id
      WHERE m.state <> 'ignored'
      ORDER BY m.received_at DESC LIMIT 100`));
  ok(res, r.rows);
}));

router.post('/:id/ignore', asyncH(async (req, res) => {
  await A.scope(req, (c) =>
    c.query("UPDATE inbox_messages SET state='ignored' WHERE id=$1", [req.params.id]));
  ok(res);
}));

router.post('/:id/archived', asyncH(async (req, res) => {
  await A.scope(req, (c) =>
    c.query("UPDATE inbox_messages SET state='archived' WHERE id=$1", [req.params.id]));
  ok(res);
}));

module.exports = router;
