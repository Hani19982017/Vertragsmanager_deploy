-- ============================================================
-- Vertragsmanager — PostgreSQL schema
-- Multi-tenant contract archive and renewal reminder system
-- Target: PostgreSQL 14+
-- ============================================================
-- Run once against an empty database:
--   psql "$DATABASE_URL" -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE plan_t          AS ENUM ('starter','growth','pro','enterprise');
CREATE TYPE tenant_status_t AS ENUM ('trial','active','past_due','suspended','cancelled');
CREATE TYPE user_role_t     AS ENUM ('owner','agent');
CREATE TYPE user_status_t   AS ENUM ('invited','active','disabled');
CREATE TYPE service_t       AS ENUM ('electricity','gas','internet','mobile',
                                     'kfz','health','liability','home','legal','other');
CREATE TYPE contract_st_t   AS ENUM ('active','renewal_due','contacted','renewed',
                                     'lost','cancelled_early','expired');
CREATE TYPE submission_t    AS ENUM ('submitted','review','confirmed','rejected');
CREATE TYPE channel_t       AS ENUM ('whatsapp','email','phone','letter');
CREATE TYPE outcome_t       AS ENUM ('pending','renewed','refused','postponed','no_answer');
CREATE TYPE extraction_t    AS ENUM ('pending','extracted','verified','failed');
CREATE TYPE campaign_st_t   AS ENUM ('draft','running','paused','completed');
CREATE TYPE recipient_st_t  AS ENUM ('pending','sent','delivered','read','failed','opted_out');

-- ============================================================
-- TENANTS — one row per subscribing brokerage
-- ============================================================

CREATE TABLE tenants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      text        NOT NULL,
  contact_email     citext,
  phone             text,
  street            text,
  postal_code       text,
  city              text,
  country           text        NOT NULL DEFAULT 'DE',
  plan              plan_t      NOT NULL DEFAULT 'starter',
  max_customers     integer     NOT NULL DEFAULT 100,
  max_seats         integer     NOT NULL DEFAULT 1,
  status            tenant_status_t NOT NULL DEFAULT 'trial',
  trial_ends_at     timestamptz,
  default_lead_days integer     NOT NULL DEFAULT 90,
  locale            text        NOT NULL DEFAULT 'de',
  restrict_agents   boolean     NOT NULL DEFAULT true,  -- agents see only own customers
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  services          text[] NOT NULL DEFAULT ARRAY['electricity','gas','internet','mobile',
                      'kfz','health','liability','home','legal','other']::text[],
  digest_enabled    boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- USERS — profile linked to the auth provider account
-- No password is stored here.
-- ============================================================

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id  text UNIQUE,                    -- reserved: external auth provider id
  password_hash text,                            -- bcrypt, set by the application
  invite_token  text UNIQUE,
  invite_expires timestamptz,
  reset_token   text UNIQUE,
  reset_expires timestamptz,
  totp_secret   text,
  totp_enabled  boolean NOT NULL DEFAULT false,
  name          text NOT NULL,
  email         citext NOT NULL UNIQUE,
  role          user_role_t  NOT NULL DEFAULT 'agent',
  status        user_status_t NOT NULL DEFAULT 'invited',
  locale        text,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX users_tenant_idx ON users (tenant_id);

-- ============================================================
-- PROVIDERS — energy / telecom / insurance companies
-- tenant_id NULL means a globally shared provider
-- ============================================================

CREATE TABLE providers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name               text NOT NULL,
  service_type       service_t,
  default_notice_days integer,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX providers_tenant_idx ON providers (tenant_id);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  phone             text,
  whatsapp          text,
  email             citext,
  street            text,
  postal_code       text,
  city              text,
  country           text NOT NULL DEFAULT 'DE',
  preferred_channel channel_t,
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_at        timestamptz,
  consent_source    text,
  moved_at          date,                       -- Umzug
  notes             text,
  assigned_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_tenant_idx   ON customers (tenant_id);
CREATE INDEX customers_assigned_idx ON customers (tenant_id, assigned_user_id);
CREATE INDEX customers_phone_idx    ON customers (tenant_id, phone);
CREATE INDEX customers_name_idx     ON customers (tenant_id, lower(last_name), lower(first_name));
CREATE INDEX customers_addr_idx     ON customers (tenant_id, postal_code, lower(street));

-- ============================================================
-- CONTRACTS — the core table
--
-- cancel_deadline is the governing date of the whole system.
-- It is generated, never written by the application.
-- ============================================================

CREATE TABLE contracts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id         uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider_id         uuid REFERENCES providers(id) ON DELETE SET NULL,
  provider_name       text,                     -- free text fallback
  service_type        service_t NOT NULL,
  contract_number     text,
  tariff_name         text,

  signed_date         date,                     -- start of the 14-day withdrawal window
  start_date          date,
  duration_months     integer,
  end_date            date NOT NULL,
  notice_period_days  integer NOT NULL DEFAULT 42,

  cancel_deadline     date GENERATED ALWAYS AS (end_date - notice_period_days) STORED,

  reminder_lead_days  integer NOT NULL DEFAULT 90,
  reminder_muted      boolean NOT NULL DEFAULT false,

  status              contract_st_t NOT NULL DEFAULT 'active',
  submission_status   submission_t  NOT NULL DEFAULT 'submitted',
  submitted_at        date,
  rejection_reason    text,

  commission_received boolean NOT NULL DEFAULT false,

  follow_up_date      date,
  follow_up_note      text,

  consumption_kwh     integer,                  -- optional, enables savings calculation
  price_per_unit      numeric(10,5),

  assigned_user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  previous_contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  source_document_id  uuid,                     -- FK added after documents table

  created_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT contracts_dates_ck  CHECK (start_date IS NULL OR end_date >= start_date),
  CONSTRAINT contracts_notice_ck CHECK (notice_period_days BETWEEN 0 AND 365)
);

-- The index every dashboard query depends on
CREATE INDEX contracts_due_idx      ON contracts (tenant_id, cancel_deadline, status);
CREATE INDEX contracts_customer_idx ON contracts (tenant_id, customer_id);
CREATE INDEX contracts_followup_idx ON contracts (tenant_id, follow_up_date)
  WHERE follow_up_date IS NOT NULL;
CREATE INDEX contracts_submission_idx ON contracts (tenant_id, submission_status)
  WHERE submission_status IN ('submitted','review','rejected');
CREATE INDEX contracts_provider_idx  ON contracts (tenant_id, provider_name);

-- ============================================================
-- DOCUMENTS — the signed contract files
-- ============================================================

CREATE TABLE documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id       uuid REFERENCES customers(id) ON DELETE CASCADE,
  contract_id       uuid REFERENCES contracts(id) ON DELETE SET NULL,
  file_name         text NOT NULL,
  storage_key       text NOT NULL,              -- S3-compatible object key
  mime_type         text,
  size_bytes        bigint,
  extraction_status extraction_t NOT NULL DEFAULT 'pending',
  extracted_data    jsonb,                      -- {field: {value, confidence}}
  extracted_text    text,                       -- full text, enables document search
  verified_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  verified_at       timestamptz,
  uploaded_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_tenant_idx   ON documents (tenant_id);
CREATE INDEX documents_contract_idx ON documents (tenant_id, contract_id);
CREATE INDEX documents_text_idx     ON documents USING gin (to_tsvector('german', coalesce(extracted_text,'')));

ALTER TABLE contracts
  ADD CONSTRAINT contracts_source_doc_fk
  FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- ============================================================
-- ACTIVITIES — contact log
-- ============================================================

CREATE TABLE activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  channel     channel_t NOT NULL,
  outcome     outcome_t NOT NULL DEFAULT 'pending',
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activities_customer_idx ON activities (tenant_id, customer_id, created_at DESC);
CREATE INDEX activities_pending_idx  ON activities (tenant_id, outcome) WHERE outcome = 'pending';

-- ============================================================
-- AUDIT LOG — written server-side only, never by a client
-- ============================================================

CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  tenant_id  uuid NOT NULL,
  user_id    uuid,
  table_name text NOT NULL,
  record_id  uuid NOT NULL,
  field_name text NOT NULL,
  old_value  text,
  new_value  text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_record_idx ON audit_log (tenant_id, table_name, record_id, created_at DESC);

-- ============================================================
-- ACCESS LOG — exports and bulk reads, protects the customer base
-- ============================================================

CREATE TABLE access_log (
  id         bigserial PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  action     text NOT NULL,                     -- 'export' | 'bulk_view'
  row_count  integer,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX access_log_tenant_idx ON access_log (tenant_id, created_at DESC);

-- ============================================================
-- CAMPAIGNS
-- ============================================================

CREATE TABLE campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  channel       channel_t NOT NULL,
  category      text NOT NULL DEFAULT 'utility',   -- utility | marketing
  template_id   text,
  message_body  text,
  segment_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  daily_limit   integer NOT NULL DEFAULT 50,
  status        campaign_st_t NOT NULL DEFAULT 'draft',
  total_count   integer NOT NULL DEFAULT 0,
  sent_count    integer NOT NULL DEFAULT 0,
  blocked_count integer NOT NULL DEFAULT 0,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX campaigns_tenant_idx ON campaigns (tenant_id, created_at DESC);

CREATE TABLE campaign_recipients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status      recipient_st_t NOT NULL DEFAULT 'pending',
  sent_at     timestamptz,
  error_reason text,
  UNIQUE (campaign_id, customer_id)
);
CREATE INDEX campaign_recipients_idx ON campaign_recipients (tenant_id, campaign_id, status);

-- ============================================================
-- MAIL ACCOUNTS — IMAP / SMTP per tenant
-- Passwords must be encrypted by the application before insert.
-- ============================================================

CREATE TABLE mail_accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          citext NOT NULL,
  imap_host      text NOT NULL,
  imap_port      integer NOT NULL DEFAULT 993,
  smtp_host      text NOT NULL,
  smtp_port      integer NOT NULL DEFAULT 465,
  secret_enc     bytea NOT NULL,                -- encrypted app password
  is_default     boolean NOT NULL DEFAULT false,
  last_sync_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mail_accounts_tenant_idx ON mail_accounts (tenant_id);

-- Reserved for a future WhatsApp Business connection. Leave empty for now.
CREATE TABLE whatsapp_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  waba_id         text,
  phone_number_id text,
  display_number  text,
  token_enc       bytea,
  quality_rating  text,
  daily_limit     integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- SENDER ADDRESSES — the e-mail addresses a broker writes from
-- ============================================================

CREATE TABLE sender_addresses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email      citext NOT NULL,
  label      text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
CREATE INDEX sender_addresses_tenant_idx ON sender_addresses (tenant_id);

-- ============================================================
-- INBOX — messages fetched from the connected mailbox
-- ============================================================

CREATE TABLE inbox_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id   uuid REFERENCES mail_accounts(id) ON DELETE CASCADE,
  uid          text,
  from_email   text,
  from_name    text,
  subject      text,
  body_text    text,
  received_at  timestamptz,
  has_attachment boolean NOT NULL DEFAULT false,
  attachment_name text,
  document_id  uuid REFERENCES documents(id) ON DELETE SET NULL,
  customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL,
  state        text NOT NULL DEFAULT 'new',   -- new | archived | ignored
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, uid)
);
CREATE INDEX inbox_tenant_idx ON inbox_messages (tenant_id, received_at DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at maintenance
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_touch   BEFORE UPDATE ON tenants   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER users_touch     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER customers_touch BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER contracts_touch BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Audit every change to a date, notice period or status on a contract
CREATE OR REPLACE FUNCTION audit_contract_changes() RETURNS trigger AS $$
DECLARE
  actor uuid := nullif(current_setting('app.user_id', true), '')::uuid;
BEGIN
  IF NEW.end_date IS DISTINCT FROM OLD.end_date THEN
    INSERT INTO audit_log(tenant_id,user_id,table_name,record_id,field_name,old_value,new_value)
    VALUES (OLD.tenant_id,actor,'contracts',OLD.id,'end_date',OLD.end_date::text,NEW.end_date::text);
  END IF;
  IF NEW.start_date IS DISTINCT FROM OLD.start_date THEN
    INSERT INTO audit_log(tenant_id,user_id,table_name,record_id,field_name,old_value,new_value)
    VALUES (OLD.tenant_id,actor,'contracts',OLD.id,'start_date',OLD.start_date::text,NEW.start_date::text);
  END IF;
  IF NEW.notice_period_days IS DISTINCT FROM OLD.notice_period_days THEN
    INSERT INTO audit_log(tenant_id,user_id,table_name,record_id,field_name,old_value,new_value)
    VALUES (OLD.tenant_id,actor,'contracts',OLD.id,'notice_period_days',
            OLD.notice_period_days::text,NEW.notice_period_days::text);
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO audit_log(tenant_id,user_id,table_name,record_id,field_name,old_value,new_value)
    VALUES (OLD.tenant_id,actor,'contracts',OLD.id,'status',OLD.status::text,NEW.status::text);
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_audit AFTER UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION audit_contract_changes();

-- ============================================================
-- ROW LEVEL SECURITY
--
-- The application must run, per request, inside a transaction that sets:
--   SET LOCAL app.tenant_id = '<uuid>';
--   SET LOCAL app.user_id   = '<uuid>';
-- The database connection role must NOT be a superuser or table owner,
-- otherwise RLS is bypassed.
-- ============================================================

CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid
$$ LANGUAGE sql STABLE;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','providers','customers','contracts','documents','activities',
    'audit_log','access_log','campaigns','campaign_recipients','mail_accounts',
    'whatsapp_accounts','sender_addresses','inbox_messages'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format($f$
      CREATE POLICY %1$I_tenant_isolation ON %1$I
      USING (tenant_id = current_tenant())
      WITH CHECK (tenant_id = current_tenant())
    $f$, tbl);
  END LOOP;
END $$;

-- providers may also be global (tenant_id IS NULL)
DROP POLICY providers_tenant_isolation ON providers;
CREATE POLICY providers_tenant_isolation ON providers
  USING (tenant_id = current_tenant() OR tenant_id IS NULL)
  WITH CHECK (tenant_id = current_tenant() OR tenant_id IS NULL);

-- users is NOT forced: Render provisions a single database role, and that
-- role owns every object migrate.js creates — it is both the app's runtime
-- connection AND the table owner. FORCE ROW LEVEL SECURITY applies RLS even
-- to the owner, which silently breaks every SECURITY DEFINER auth_* function
-- below (auth_find_user, auth_email_exists, auth_start_reset, ...): they run
-- as that same owner role, so a forced policy hides the very row they exist
-- to find, and login/signup/password-reset fail 100% of the time in
-- production. Dropping FORCE here lets the owner (and hence those functions)
-- see all rows on this one table; every app-code query against `users` that
-- is NOT one of those pre-auth lookups has been given an explicit
-- tenant_id filter alongside the RLS policy (see auth.routes.js,
-- team.routes.js, reports.routes.js) so tenant isolation is preserved in
-- practice even though Postgres itself no longer forces it on this table.
ALTER TABLE users NO FORCE ROW LEVEL SECURITY;


-- ============================================================
-- AUTHENTICATION HELPERS
--
-- Login happens before a tenant is known, so these functions run
-- with the privileges of their owner and are the ONLY sanctioned
-- way to read users outside tenant scope. They return the minimum
-- needed and nothing else.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_email_exists(p_email citext)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE email = p_email)
$$;

CREATE OR REPLACE FUNCTION auth_find_user(p_email citext)
RETURNS TABLE (id uuid, tenant_id uuid, role user_role_t,
               status user_status_t, password_hash text,
               totp_secret text, totp_enabled boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.tenant_id, u.role, u.status, u.password_hash,
         u.totp_secret, u.totp_enabled
    FROM users u WHERE u.email = p_email
$$;

CREATE OR REPLACE FUNCTION auth_load_session(p_user_id uuid)
RETURNS TABLE (id uuid, tenant_id uuid, name text, email citext,
               role user_role_t, status user_status_t, locale text,
               company_name text, plan plan_t, tenant_status tenant_status_t,
               max_customers integer, max_seats integer, restrict_agents boolean,
               trial_ends_at timestamptz, default_lead_days integer)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.status, u.locale,
         t.company_name, t.plan, t.status, t.max_customers, t.max_seats,
         t.restrict_agents, t.trial_ends_at, t.default_lead_days
    FROM users u JOIN tenants t ON t.id = u.tenant_id
   WHERE u.id = p_user_id
$$;

CREATE OR REPLACE FUNCTION auth_touch_login(p_user_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE users SET last_login_at = now() WHERE id = p_user_id
$$;

CREATE OR REPLACE FUNCTION auth_accept_invite(p_token text, p_hash text)
RETURNS TABLE (id uuid, tenant_id uuid, role user_role_t)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE users
     SET password_hash = p_hash, status = 'active',
         invite_token = NULL, invite_expires = NULL
   WHERE invite_token = p_token AND invite_expires > now()
  RETURNING users.id, users.tenant_id, users.role
$$;


CREATE OR REPLACE FUNCTION auth_start_reset(p_email citext, p_token text)
RETURNS TABLE (id uuid, name text, email citext)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE users SET reset_token = p_token, reset_expires = now() + interval '1 hour'
   WHERE email = p_email AND status = 'active'
  RETURNING users.id, users.name, users.email
$$;

CREATE OR REPLACE FUNCTION auth_finish_reset(p_token text, p_hash text)
RETURNS TABLE (id uuid, tenant_id uuid, role user_role_t)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE users SET password_hash = p_hash, reset_token = NULL, reset_expires = NULL
   WHERE reset_token = p_token AND reset_expires > now()
  RETURNING users.id, users.tenant_id, users.role
$$;

CREATE OR REPLACE FUNCTION auth_totp(p_user_id uuid)
RETURNS TABLE (totp_secret text, totp_enabled boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT u.totp_secret, u.totp_enabled FROM users u WHERE u.id = p_user_id
$$;

-- Daily job: flip contracts into renewal_due across ALL tenants.
-- Runs as owner, therefore outside row level security, by design.
CREATE OR REPLACE FUNCTION job_refresh_due()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE contracts
     SET status = 'renewal_due'
   WHERE status = 'active'
     AND reminder_muted = false
     AND (cancel_deadline - CURRENT_DATE) <= reminder_lead_days;
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE contracts SET status = 'expired'
   WHERE status IN ('active','renewal_due','contacted') AND end_date < CURRENT_DATE - 30;
  RETURN n;
END $$;

-- Per-tenant digest payload for the morning e-mail
CREATE OR REPLACE FUNCTION job_digest()
RETURNS TABLE (tenant_id uuid, company_name text, owner_email citext,
               urgent integer, followups integer, unconfirmed integer)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.company_name,
         (SELECT u.email FROM users u
           WHERE u.tenant_id = t.id AND u.role='owner' AND u.status='active' LIMIT 1),
         (SELECT count(*)::int FROM contracts c WHERE c.tenant_id=t.id
            AND c.status NOT IN ('renewed','lost','cancelled_early')
            AND (c.cancel_deadline - CURRENT_DATE) <= 14),
         (SELECT count(*)::int FROM contracts c WHERE c.tenant_id=t.id
            AND c.follow_up_date IS NOT NULL AND c.follow_up_date <= CURRENT_DATE),
         (SELECT count(*)::int FROM contracts c WHERE c.tenant_id=t.id
            AND c.submission_status IN ('submitted','review','rejected'))
    FROM tenants t
   WHERE t.status IN ('trial','active') AND t.digest_enabled
$$;

-- ============================================================
-- VIEWS used by the dashboard
-- ============================================================

-- Contracts that must be contacted now
CREATE VIEW v_due_contracts AS
SELECT c.*,
       (c.cancel_deadline - CURRENT_DATE) AS days_remaining
FROM contracts c
WHERE c.status NOT IN ('renewed','lost','cancelled_early')
  AND c.reminder_muted = false
  AND (c.cancel_deadline - CURRENT_DATE) <= c.reminder_lead_days;

-- Contracts still inside the 14-day withdrawal window
CREATE VIEW v_withdrawal_window AS
SELECT c.*, 14 - (CURRENT_DATE - c.signed_date) AS days_left
FROM contracts c
WHERE c.signed_date IS NOT NULL
  AND (CURRENT_DATE - c.signed_date) < 14;

-- Contracts the provider has not confirmed
CREATE VIEW v_unconfirmed AS
SELECT c.*, (CURRENT_DATE - c.submitted_at) AS days_waiting
FROM contracts c
WHERE c.submission_status IN ('submitted','review','rejected');

-- Cross-selling: services a customer does not hold
CREATE VIEW v_cross_sell AS
SELECT cu.tenant_id, cu.id AS customer_id, s.service
FROM customers cu
CROSS JOIN unnest(enum_range(NULL::service_t)) AS s(service)
WHERE NOT EXISTS (
  SELECT 1 FROM contracts c
  WHERE c.customer_id = cu.id
    AND c.service_type = s.service
    AND c.status NOT IN ('lost','cancelled_early')
);

-- ============================================================
-- SCHEDULED JOB (run once per day, server-side)
--
-- UPDATE contracts
--    SET status = 'renewal_due'
--  WHERE status = 'active'
--    AND reminder_muted = false
--    AND (cancel_deadline - CURRENT_DATE) <= reminder_lead_days;
--
-- Must not depend on a user opening the application.
-- ============================================================

-- ============================================================
-- SEED — global providers (optional)
-- ============================================================

INSERT INTO providers (tenant_id, name, service_type, default_notice_days) VALUES
  (NULL,'Vattenfall','electricity',42),
  (NULL,'E.ON','electricity',42),
  (NULL,'EWE','electricity',42),
  (NULL,'Yello Strom','electricity',42),
  (NULL,'LichtBlick','electricity',42),
  (NULL,'Telekom','internet',90),
  (NULL,'Vodafone','internet',90),
  (NULL,'1&1','internet',90),
  (NULL,'Allianz','liability',90),
  (NULL,'HUK-COBURG','kfz',30);
