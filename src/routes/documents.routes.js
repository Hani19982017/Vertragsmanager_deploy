const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const A = require('../auth');
const { ok, fail, asyncH } = require('../util');

const DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(DIR, { recursive: true });

const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'];
const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, DIR),
    filename: (_r, f, cb) =>
      cb(null, crypto.randomUUID() + path.extname(f.originalname || '').slice(0, 10))
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => cb(null, ALLOWED.includes(f.mimetype))
});

router.use(A.requireAuth);

// POST /api/documents  (multipart: file, customer_id, extracted_text, extracted_data)
router.post('/', upload.single('file'), asyncH(async (req, res) => {
  if (!req.file) return fail(res, 400, 'file_required_or_type_not_allowed');
  const row = await A.scope(req, (c) => c.query(
    `INSERT INTO documents
      (tenant_id, customer_id, file_name, storage_key, mime_type, size_bytes,
       extraction_status, extracted_data, extracted_text, uploaded_by)
     VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,'extracted',$6,$7,$8)
     RETURNING id, file_name, mime_type, size_bytes, created_at`,
    [req.body.customer_id || null,
     (req.file.originalname || 'dokument').slice(0, 200),
     req.file.filename, req.file.mimetype, req.file.size,
     req.body.extracted_data ? JSON.parse(req.body.extracted_data) : null,
     (req.body.extracted_text || '').slice(0, 200000),
     req.user.id]));
  ok(res, row.rows[0]);
}));

// GET /api/documents/:id/file — streams the stored file
router.get('/:id/file', asyncH(async (req, res) => {
  const d = await A.scope(req, (c) =>
    c.query('SELECT * FROM documents WHERE id=$1', [req.params.id]));
  const doc = d.rows[0];
  if (!doc) return fail(res, 404, 'not_found');
  const p = path.join(DIR, path.basename(doc.storage_key));
  if (!fs.existsSync(p)) return fail(res, 410, 'file_missing');
  res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition',
    'inline; filename="' + encodeURIComponent(doc.file_name) + '"');
  fs.createReadStream(p).pipe(res);
}));

// GET /api/documents?q=  — full text search inside stored contracts
router.get('/', asyncH(async (req, res) => {
  const q = (req.query.q || '').trim();
  const rows = await A.scope(req, (c) => q
    ? c.query(
      `SELECT d.id, d.file_name, d.created_at, d.customer_id,
              cu.first_name, cu.last_name
         FROM documents d LEFT JOIN customers cu ON cu.id=d.customer_id
        WHERE to_tsvector('german', coalesce(d.extracted_text,'')) @@ plainto_tsquery('german',$1)
           OR lower(d.file_name) LIKE $2
        ORDER BY d.created_at DESC LIMIT 100`, [q, '%' + q.toLowerCase() + '%'])
    : c.query(
      `SELECT d.id, d.file_name, d.created_at, d.customer_id,
              cu.first_name, cu.last_name
         FROM documents d LEFT JOIN customers cu ON cu.id=d.customer_id
        ORDER BY d.created_at DESC LIMIT 100`));
  ok(res, rows.rows);
}));

module.exports = router;
