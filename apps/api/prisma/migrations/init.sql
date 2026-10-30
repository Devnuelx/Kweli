-- Authoritative Kweli Database Migration (Clean Schema Init)
-- Run this directly in Supabase Dashboard -> SQL Editor

CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CONSUMER', 'BRAND_STAFF', 'BRAND_ADMIN', 'MODERATOR', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "KybStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('ISSUED', 'ACTIVATED', 'FLAGGED_SUSPICIOUS', 'RECALLED');

-- CreateEnum
CREATE TYPE "VerificationOutcome" AS ENUM ('AUTHENTIC_FIRST_SCAN', 'AUTHENTIC_ACTIVATED', 'ALREADY_ACTIVATED_WARNING', 'SUSPICIOUS_REPETITION', 'INVALID_OR_UNKNOWN_CODE', 'PRODUCT_RECALLED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RECEIVED', 'TRIAGE', 'UNDER_INVESTIGATION', 'SUBSTANTIATED', 'INCONCLUSIVE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportSubmissionMode" AS ENUM ('ANONYMOUS', 'AUTHENTICATED');

-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('REPORT_SUBMITTED_CREDIT', 'REPORT_SUBSTANTIATED_BONUS', 'MANUAL_ADMIN_ADJUSTMENT', 'AWARD_REVERSAL_FRAUD', 'REDEMPTION_AIRTIME_CLAIM');

-- CreateTable: Users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(50),
    "role" "UserRole" NOT NULL DEFAULT 'CONSUMER',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Refresh Sessions
CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Organizations
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legal_name" VARCHAR(255) NOT NULL,
    "trading_name" VARCHAR(255),
    "registration_num" VARCHAR(100),
    "kyb_status" "KybStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "website_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Organization Members
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BRAND_STAFF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: API Keys
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "key_prefix" VARCHAR(12) NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Brands
CREATE TABLE "brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Products
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "gtin" VARCHAR(14),
    "sku" VARCHAR(100),
    "category" VARCHAR(100),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Batches
CREATE TABLE "product_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "batch_number" VARCHAR(100) NOT NULL,
    "mfg_date" TIMESTAMP(3),
    "exp_date" TIMESTAMP(3),
    "batch_size" INTEGER NOT NULL,
    "is_recalled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product Units
CREATE TABLE "product_units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID NOT NULL,
    "public_serial" VARCHAR(64) NOT NULL,
    "scratch_pin_hash" VARCHAR(255) NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'ISSUED',
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "first_scanned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Scan Events
CREATE TABLE "scan_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unit_id" UUID,
    "raw_code_input" VARCHAR(255),
    "outcome" "VerificationOutcome" NOT NULL,
    "masked_ip" VARCHAR(45),
    "user_agent" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Reports
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_ref" VARCHAR(32) NOT NULL,
    "access_secret" VARCHAR(64) NOT NULL,
    "user_id" UUID,
    "unit_id" UUID,
    "product_name" VARCHAR(255) NOT NULL,
    "brand_name" VARCHAR(255),
    "description" TEXT NOT NULL,
    "purchase_location" VARCHAR(255),
    "mode" "ReportSubmissionMode" NOT NULL DEFAULT 'ANONYMOUS',
    "status" "ReportStatus" NOT NULL DEFAULT 'RECEIVED',
    "moderator_notes" TEXT,
    "points_awarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Report Evidence
CREATE TABLE "report_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Point Accounts
CREATE TABLE "point_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetime_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Point Ledger Entries
CREATE TABLE "point_ledger_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "report_id" UUID,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- Unique & Search Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "refresh_sessions_user_id_idx" ON "refresh_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "refresh_sessions_token_hash_idx" ON "refresh_sessions"("token_hash");

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_registration_num_key" ON "organizations"("registration_num");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_key" ON "api_keys"("key_hash");

CREATE UNIQUE INDEX IF NOT EXISTS "products_brand_id_sku_key" ON "products"("brand_id", "sku");
CREATE UNIQUE INDEX IF NOT EXISTS "product_batches_product_id_batch_number_key" ON "product_batches"("product_id", "batch_number");
CREATE UNIQUE INDEX IF NOT EXISTS "product_units_public_serial_key" ON "product_units"("public_serial");
CREATE INDEX IF NOT EXISTS "product_units_public_serial_idx" ON "product_units"("public_serial");

CREATE INDEX IF NOT EXISTS "scan_events_unit_id_idx" ON "scan_events"("unit_id");
CREATE INDEX IF NOT EXISTS "scan_events_created_at_idx" ON "scan_events"("created_at" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "reports_report_ref_key" ON "reports"("report_ref");
CREATE INDEX IF NOT EXISTS "reports_report_ref_idx" ON "reports"("report_ref");
CREATE INDEX IF NOT EXISTS "reports_user_id_idx" ON "reports"("user_id");
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "point_accounts_user_id_key" ON "point_accounts"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "point_ledger_entries_idempotency_key_key" ON "point_ledger_entries"("idempotency_key");
CREATE INDEX IF NOT EXISTS "point_ledger_entries_account_id_idx" ON "point_ledger_entries"("account_id");
CREATE INDEX IF NOT EXISTS "point_ledger_entries_idempotency_key_idx" ON "point_ledger_entries"("idempotency_key");

-- Foreign Keys
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brands" ADD CONSTRAINT "brands_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "product_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "product_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report_evidence" ADD CONSTRAINT "report_evidence_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "point_accounts" ADD CONSTRAINT "point_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "point_ledger_entries" ADD CONSTRAINT "point_ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "point_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "point_ledger_entries" ADD CONSTRAINT "point_ledger_entries_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
