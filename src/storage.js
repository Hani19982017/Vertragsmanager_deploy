/**
 * File storage with encryption at rest.
 * Uses an S3-compatible bucket when S3_BUCKET is set, otherwise local disk.
 * Every object is encrypted with AES-256-GCM using STORAGE_KEY.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(DIR, { recursive: true });

const useS3 = !!process.env.S3_BUCKET;
let s3 = null;
if (useS3) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3 = new S3Client({
    region: process.env.S3_REGION || 'eu-central-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: process.env.S3_ACCESS_KEY_ID ? {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    } : undefined
  });
}

function key() {
  const k = process.env.STORAGE_KEY;
  if (!k) return null;
  return crypto.createHash('sha256').update(k).digest();
}

function encrypt(buf) {
  const k = key();
  if (!k) return { data: buf, enc: false };
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const out = Buffer.concat([c.update(buf), c.final()]);
  return { data: Buffer.concat([iv, c.getAuthTag(), out]), enc: true };
}

function decrypt(buf) {
  const k = key();
  if (!k || buf.length < 29) return buf;
  const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), body = buf.subarray(28);
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', k, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(body), d.final()]);
  } catch (_) {
    return buf; // stored before encryption was switched on
  }
}

async function put(name, buffer) {
  const id = crypto.randomUUID() + path.extname(name || '').slice(0, 10);
  const { data } = encrypt(buffer);
  if (useS3) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET, Key: id, Body: data
    }));
  } else {
    fs.writeFileSync(path.join(DIR, id), data);
  }
  return id;
}

async function get(id) {
  let raw;
  if (useS3) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const r = await s3.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET, Key: path.basename(id)
    }));
    const chunks = [];
    for await (const c of r.Body) chunks.push(c);
    raw = Buffer.concat(chunks);
  } else {
    const p = path.join(DIR, path.basename(id));
    if (!fs.existsSync(p)) return null;
    raw = fs.readFileSync(p);
  }
  return decrypt(raw);
}

async function del(id) {
  if (useS3) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET, Key: path.basename(id)
    })).catch(() => {});
  } else {
    try { fs.unlinkSync(path.join(DIR, path.basename(id))); } catch (_) {}
  }
}

module.exports = { put, get, del, backend: useS3 ? 's3' : 'disk', encrypted: !!key() };
