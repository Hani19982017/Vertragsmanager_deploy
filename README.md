# Vertragsmanager

Contract archive and renewal reminder system for German energy, telecom and
insurance brokers. Multi-tenant SaaS. German and Arabic interface with full
right-to-left support.

Node + Express + PostgreSQL. No build step, no bundler, no framework lock-in.

---

## Deploy on Render (5 minutes)

1. Push this folder to a Git repository.

2. Render → **New → Blueprint** → select the repository.
   `render.yaml` provisions the web service, the PostgreSQL database and the
   disk for uploads, all in Frankfurt.

3. After the first deploy, set `APP_URL` to the service URL. Invitation links,
   password reset links and the daily job all depend on it.

`JWT_SECRET`, `STORAGE_KEY` and `CRON_SECRET` are generated automatically.
Everything else (SMTP, Stripe, S3) is optional — the app runs without them and
degrades gracefully.

That is all. `npm run migrate` runs automatically on start and creates the
schema on first boot. It is idempotent — later deploys skip it.

### Manual setup instead of the blueprint

| Setting | Value |
|---|---|
| Type | Web Service |
| Runtime | Node |
| Region | Frankfurt |
| Build command | `npm ci` |
| Start command | `npm run migrate && npm start` |
| Health check | `/healthz` |

Add a PostgreSQL instance and a disk mounted at `/var/data`, then set:

```
DATABASE_URL   from the database
JWT_SECRET     long random string
APP_URL        https://your-service.onrender.com
UPLOAD_DIR     /var/data/uploads
NODE_ENV       production
```

### Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install
npm run migrate
npm start                 # http://localhost:3000
```

---

## First use

Open the URL and choose **Create account**. That creates the company (tenant)
and its owner, and starts a 15-day trial with every feature unlocked.

---

## Optional integrations

Each one is off until you set its variables, and nothing breaks while it is off.

| Feature | Variables | Behaviour when unset |
|---|---|---|
| Sending e-mail | `SMTP_*` | Messages are written to the log instead of sent; reset links are printed there |
| Billing | `STRIPE_*` | Plans are shown, checkout returns `501` |
| Object storage | `S3_*` | Files are stored on the mounted disk |
| Encryption at rest | `STORAGE_KEY` | Files and mailbox passwords stored unencrypted — set it |
| Daily job | `CRON_SECRET` | `/api/cron/daily` refuses every call |

## What it does

**Archive a signed contract.** Upload the PDF or a photo. The text is read in
the browser (pdf.js, OCR via tesseract.js) and German contract fields are
extracted — contract number, start, end, notice period, provider, service type,
name, address, phone. Fields the parser is unsure about stay empty and are
outlined orange. Nothing is saved until a human confirms.

**Never lose a customer.** `cancel_deadline = end_date - notice_period_days` is
a generated column and is the governing date of the whole system. The priority
list is sorted by it, coloured by urgency, and a daily job flips contracts to
`renewal_due` without anyone opening the app.

**Close the loop.** Every contact ends in an outcome. *Renewed* opens the
successor contract automatically. *Refused* asks which provider the customer
signed with and for how long, creates that competitor contract, and the customer
returns to the queue for the next cycle instead of disappearing. *Postponed*
and *no answer* set a follow-up date with a note.

**Catch what silently fails.** Provider confirmation status (submitted, in
review, confirmed, rejected), the 14-day withdrawal window, moves that end
energy contracts instantly, duplicate customers, cross-selling gaps, and a
price-increase tool that lists every customer of a given provider — all of whom
gain a special right of termination.

**Protect the customer base.** Agents can be limited to their own customers and
can never export the list. Every export is written to an access log with user,
row count and time.

**Write the letters.** The assistant produces finished German documents from the
stored data — Kündigung, Widerruf, Sonderkündigung wegen Preiserhöhung, Umzug,
renewal offer, cross-selling offer, document request. Free text in German or
Arabic picks the right template. Copy, print, or open as e-mail.

**Reach the right people, safely.** Campaigns segment by missing service, by
provider, or by expiring contract. Marketing category automatically excludes
anyone without consent. An opt-out line is appended if you forget it. Daily
limits are capped at 250 new WhatsApp contacts per day, and a campaign pauses
itself if failures pass five percent. E-mail is sent through your SMTP;
WhatsApp is prepared but never sent through an unofficial channel.

**Let the mailbox do the filing.** Connect the office mailbox over IMAP — Gmail,
Outlook, IONOS, Strato, Hostinger or any server. Provider confirmations with
attachments are pulled in, matched to a customer, and offered as suggestions.
Nothing is filed without a human clicking confirm. Mailbox passwords are
encrypted with AES-256-GCM before they touch the database.

**See where it leaks.** Reports show contracts by service, by agent, and by
month, plus a data quality panel: contracts with no end date, no notice period,
no document, or commission still outstanding. Those are the ones that fail
silently.

---

## Three rules that must not be broken

1. **`cancel_deadline` is generated by the database.** Never write it from
   application code and never trigger a reminder off `end_date`.

2. **Tenant isolation lives in PostgreSQL, not in JavaScript.** Every request
   runs inside a transaction that sets `app.tenant_id` and `app.user_id`; row
   level security policies read them. `src/db.js → withTenant()` is the only
   sanctioned path to tenant data. The database role must not be a superuser.
   The only functions allowed to read across tenants are the four
   `auth_*` SECURITY DEFINER functions, which exist because login happens
   before a tenant is known.

3. **The status job is server-side.** `job_refresh_due()` in the database, called
   daily by the cron service in `render.yaml`. It flips contracts to
   `renewal_due` and mails each owner a morning digest. Reminders must never
   depend on a user opening the app.

---

## Project layout

```
db/schema.sql               13 tables, 4 views, RLS policies, audit trigger
src/server.js               Express app, helmet CSP, rate limits, SPA fallback
src/db.js                   pool + withTenant() transaction wrapper
src/auth.js                 bcrypt, JWT cookie, requireAuth / requireOwner
src/routes/auth.routes.js       signup, login, logout, me
src/routes/customers.routes.js  list, detail, create, patch, move
src/routes/contracts.routes.js  due, followups, unconfirmed, withdrawal,
                                by-provider, create, patch, outcome, followup
src/routes/documents.routes.js  upload, stream, full-text search
src/routes/team.routes.js       list, invite, handover, accept
src/routes/misc.routes.js       stats, export.csv, access-log, duplicates
src/routes/campaigns.routes.js  preview, create, run batch, pause
src/routes/assistant.routes.js  German letter and message generation
src/routes/inbox.routes.js      IMAP connect, sync, suggestions
src/routes/settings.routes.js   company, services, sender addresses
src/routes/reports.routes.js    breakdowns and data quality
src/routes/billing.routes.js    Stripe checkout, portal, webhook
src/routes/cron.routes.js       daily job endpoint (shared secret)
src/letters.js              letter templates — pure functions, easy to test
src/mailer.js               SMTP, degrades to logging
src/storage.js              S3 or disk, AES-256-GCM at rest
src/crypto.js               seal/open for stored credentials
src/cron-run.js             what the Render Cron Job executes
public/                     the interface (vanilla JS, no build step)
```

Swapping the frontend for React later touches nothing in `src/` — the API is
plain REST with a session cookie.

---

## API

```
POST   /api/auth/signup          {company,name,email,password}
POST   /api/auth/login           {email,password}
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/customers?q=&tab=
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
POST   /api/customers/:id/move

GET    /api/contracts/due
GET    /api/contracts/followups
GET    /api/contracts/unconfirmed
GET    /api/contracts/withdrawal
GET    /api/contracts/providers
GET    /api/contracts/by-provider/:name
POST   /api/contracts
PATCH  /api/contracts/:id
POST   /api/contracts/:id/outcome    renewed | refused | postponed | no_answer
POST   /api/contracts/:id/followup

POST   /api/documents            multipart: file, customer_id, extracted_text
GET    /api/documents?q=         full-text search inside stored contracts
GET    /api/documents/:id/file

GET    /api/team
POST   /api/team/invite          owner only
POST   /api/team/handover        owner only
POST   /api/team/accept          {token,password}

POST   /api/auth/forgot         {email}
POST   /api/auth/reset          {token,password}
POST   /api/auth/totp/setup     returns secret + otpauth URL
POST   /api/auth/totp/enable    {code}
POST   /api/auth/totp/disable

POST   /api/campaigns/preview   {channel,category,segment,daily_limit}
POST   /api/campaigns
GET    /api/campaigns
GET    /api/campaigns/:id/recipients
POST   /api/campaigns/:id/run   sends the next daily batch
POST   /api/campaigns/:id/pause

POST   /api/assistant/generate  {customer_id,contract_id?,kind?|query?}
GET    /api/assistant/kinds

GET    /api/inbox/presets
POST   /api/inbox/connect       owner only
DELETE /api/inbox/connect       owner only
POST   /api/inbox/sync
GET    /api/inbox
POST   /api/inbox/:id/ignore

GET    /api/settings
PATCH  /api/settings            owner only
POST   /api/settings/senders    owner only
POST   /api/settings/senders/:id/default
DELETE /api/settings/senders/:id

GET    /api/reports
GET    /api/billing/plans
POST   /api/billing/checkout    owner only
POST   /api/billing/portal      owner only
POST   /api/billing/webhook     Stripe, raw body

POST   /api/cron/daily          header x-cron-secret

GET    /api/stats
GET    /api/export.csv           owner only, logged
GET    /api/access-log           owner only
GET    /api/duplicates           owner only
```

---

## Plans

| Plan | Price | Customers | Agent seats |
|---|---|---|---|
| Starter | 39 EUR / month | 100 | owner only |
| Growth | 69 EUR / month | 200 | 2 |
| Pro | 99 EUR / month | 400 | 4 |
| Enterprise | on request | custom | custom |

Trial: 15 days, everything unlocked, no automatic conversion. At the limit the
API returns `402` and refuses to create — it never deletes and never silently
exceeds.

Stripe is wired: checkout, customer portal, and a webhook that moves the plan,
its limits and the account status. A failed payment makes the account
`past_due`, never deleted. Create three recurring prices in Stripe and put their
IDs in `STRIPE_PRICE_STARTER`, `_GROWTH`, `_PRO`, then point a webhook at
`/api/billing/webhook`.

Messaging fees from WhatsApp providers are **not** part of the subscription.
Each broker connects their own account and is billed directly. Do not bundle
these costs.

---

## Before real customer data

- [ ] Create two tenants; confirm neither can read the other's rows
- [ ] Confirm the database role is not a superuser and not the table owner
- [ ] Verify `cancel_deadline` by hand on three contracts
- [ ] Schedule the daily status job
- [ ] Set `STORAGE_KEY`, then move uploads to S3-compatible storage
- [ ] Verify a WhatsApp campaign never sends without an official provider
- [ ] Send yourself a password reset and a morning digest end to end
- [ ] Fill in Impressum, Datenschutzerklärung and AGB, then have a German
      lawyer review them — they ship as drafts with placeholders
- [ ] Prepare the Auftragsverarbeitungsvertrag (Art. 28 GDPR) signed with every
      broker. Without it no serious German customer can legally sign up
- [ ] Enable daily backups and test a restore


---

## Known limits, stated plainly

**The schema has not been run against a live PostgreSQL.** It was written and
structurally verified — balanced quoting, creation order, enum defaults, RLS
coverage on all fourteen tenant tables — but no database was available during
development. Watch the first deploy log. If `npm run migrate` complains, the fix
is almost certainly one line.

**WhatsApp is prepared, not automated.** Campaign recipients are marked ready and
the message is composed, but nothing leaves through an unofficial channel. Wire
an official provider (360dialog, Twilio) to `campaigns.routes.js → run` when you
are ready. Fees are billed by that provider directly to each broker.

**The daily digest needs SMTP.** Without it the job still flips contract statuses,
it just cannot mail anyone.

**Legal texts are drafts.** Impressum, Datenschutzerklärung and AGB ship with
placeholders. Fill them in and have a German lawyer review them. The
Auftragsverarbeitungsvertrag is not included and must exist before any real
customer data is processed.
