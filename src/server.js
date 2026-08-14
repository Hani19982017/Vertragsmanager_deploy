require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const A = require('./auth');
const { pool } = require('./db');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
// Stripe needs the raw body to verify its signature — mount before the JSON parser
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }),
  require('./routes/billing.routes'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(A.attach);

app.get('/healthz', (_req, res) => res.type('text').send('ok'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'too_many_attempts' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot', authLimiter);
app.use('/api/auth/reset', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/team/accept', authLimiter);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/contracts', require('./routes/contracts.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/team', require('./routes/team.routes'));
app.use('/api/campaigns', require('./routes/campaigns.routes'));
app.use('/api/assistant', require('./routes/assistant.routes'));
app.use('/api/inbox', require('./routes/inbox.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/cron', require('./routes/cron.routes'));
app.use('/api', require('./routes/misc.routes'));

app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err, _req, res, _next) => {
  console.error('error:', err.message);
  const code = err.status || 500;
  res.status(code).json({ error: code === 500 ? 'server_error' : err.message });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log('vertragsmanager listening on ' + port));

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
