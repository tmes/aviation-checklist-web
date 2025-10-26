-- AEROCHECK DATABASE SCHEMA
-- Version: 1.1
-- Date: 2025-10-26
-- Description: Complete database schema with email verification, system settings, and monetization

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS supported_languages;
DROP TABLE IF EXISTS system_settings_history;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS user_purchases;
DROP TABLE IF EXISTS checklist_marketplace;
DROP TABLE IF EXISTS organization_subscriptions;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS organization_join_requests;
DROP TABLE IF EXISTS organization_invites;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS sync_conflicts;
DROP TABLE IF EXISTS sync_queue;
DROP TABLE IF EXISTS flight_checklist_progress;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS checklist_items;
DROP TABLE IF EXISTS checklist_versions;
DROP TABLE IF EXISTS checklists;
DROP TABLE IF EXISTS checklist_templates;
DROP TABLE IF EXISTS aircraft;
DROP TABLE IF EXISTS organization_memberships;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS users;

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  -- Super Admin Flag
  is_super_admin BOOLEAN DEFAULT FALSE,

  -- Email Verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(100) UNIQUE,
  email_verification_expires TIMESTAMP NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,

  -- Indexes
  INDEX idx_email (email),
  INDEX idx_email_verified (email_verified),
  INDEX idx_super_admin (is_super_admin),
  INDEX idx_verification_token (email_verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORGANIZATIONS
-- ============================================

CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('flying_club', 'flight_school', 'individual') DEFAULT 'flying_club',
  description TEXT,

  -- Contact Info
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),

  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_postal_code VARCHAR(20),
  address_country VARCHAR(100),

  -- Public Join Settings
  allow_public_join BOOLEAN DEFAULT FALSE,
  public_join_role ENUM('member', 'instructor') DEFAULT 'member',
  public_slug VARCHAR(100) UNIQUE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_type (type),
  INDEX idx_public_slug (public_slug),
  FULLTEXT idx_name_description (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization_memberships (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('admin', 'instructor', 'member') NOT NULL DEFAULT 'member',

  -- Timestamps
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership (organization_id, user_id),

  -- Indexes
  INDEX idx_user_org (user_id, organization_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MEMBER ONBOARDING
-- ============================================

CREATE TABLE organization_invites (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('admin', 'instructor', 'member') NOT NULL DEFAULT 'member',
  invited_by CHAR(36) NOT NULL,
  token VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_org_invites (organization_id, email, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization_join_requests (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  message TEXT,
  status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by CHAR(36),

  -- Constraints
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_pending_request (organization_id, user_id, status),

  -- Indexes
  INDEX idx_pending (organization_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AIRCRAFT
-- ============================================

CREATE TABLE aircraft (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,

  -- Basic Info
  registration VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  category ENUM('single_engine', 'multi_engine', 'helicopter', 'glider', 'ultralight') DEFAULT 'single_engine',

  -- Technical Details
  year_manufactured YEAR,
  serial_number VARCHAR(100),
  max_weight_kg INT,
  fuel_capacity_liters INT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  notes TEXT,

  -- Images
  photo_url VARCHAR(500),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Constraints
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_org_aircraft (organization_id, is_active),
  INDEX idx_registration (registration),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHECKLISTS
-- ============================================

CREATE TABLE checklist_templates (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  aircraft_type VARCHAR(100),
  category ENUM('single_engine', 'multi_engine', 'helicopter', 'glider', 'ultralight'),
  description TEXT,

  -- Marketplace
  is_public BOOLEAN DEFAULT FALSE,
  created_by CHAR(36),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_aircraft_type (aircraft_type),
  INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE checklists (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  aircraft_id CHAR(36),
  template_id CHAR(36),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Versioning
  current_version INT DEFAULT 1,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_org_checklists (organization_id, is_active),
  INDEX idx_aircraft (aircraft_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE checklist_versions (
  id CHAR(36) PRIMARY KEY,
  checklist_id CHAR(36) NOT NULL,
  version_number INT NOT NULL,

  -- Version metadata
  change_description TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Snapshot of checklist items (JSON)
  items_snapshot JSON NOT NULL,

  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_version (checklist_id, version_number),

  INDEX idx_checklist_versions (checklist_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE checklist_items (
  id CHAR(36) PRIMARY KEY,
  checklist_id CHAR(36) NOT NULL,

  -- Item details
  phase ENUM('pre_flight', 'startup', 'taxi', 'before_takeoff', 'takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing', 'after_landing', 'shutdown', 'post_flight', 'emergency') NOT NULL,
  item_text TEXT NOT NULL,
  expected_value VARCHAR(255),
  sort_order INT DEFAULT 0,

  -- Status
  is_critical BOOLEAN DEFAULT FALSE,
  requires_confirmation BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,

  INDEX idx_checklist_phase (checklist_id, phase, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FLIGHTS & PROGRESS
-- ============================================

CREATE TABLE flights (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  aircraft_id CHAR(36) NOT NULL,
  pilot_id CHAR(36) NOT NULL,
  checklist_id CHAR(36),

  -- Flight details
  departure_airport VARCHAR(10),
  arrival_airport VARCHAR(10),
  flight_date DATE,

  -- Times
  scheduled_departure DATETIME,
  actual_departure DATETIME,
  actual_arrival DATETIME,

  -- Status
  status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',

  -- Notes
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE,
  FOREIGN KEY (pilot_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE SET NULL,

  INDEX idx_org_flights (organization_id, flight_date),
  INDEX idx_pilot_flights (pilot_id, flight_date),
  INDEX idx_aircraft_flights (aircraft_id, flight_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE flight_checklist_progress (
  id CHAR(36) PRIMARY KEY,
  flight_id CHAR(36) NOT NULL,
  checklist_item_id CHAR(36) NOT NULL,

  -- Progress
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  completed_by CHAR(36),

  -- Notes
  notes TEXT,

  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_progress (flight_id, checklist_item_id),

  INDEX idx_flight_progress (flight_id, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OFFLINE SYNC (PWA)
-- ============================================

CREATE TABLE sync_queue (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,

  -- Sync details
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  operation ENUM('create', 'update', 'delete') NOT NULL,

  -- Data
  payload JSON NOT NULL,

  -- Status
  status ENUM('pending', 'synced', 'conflict', 'failed') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_pending (user_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sync_conflicts (
  id CHAR(36) PRIMARY KEY,
  sync_queue_id CHAR(36) NOT NULL,

  -- Conflict details
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36) NOT NULL,

  -- Conflict data
  client_version JSON NOT NULL,
  server_version JSON NOT NULL,

  -- Resolution
  resolution ENUM('pending', 'use_client', 'use_server', 'merge', 'manual') DEFAULT 'pending',
  resolved_at TIMESTAMP NULL,
  resolved_by CHAR(36),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sync_queue_id) REFERENCES sync_queue(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_pending_conflicts (resolution, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ACTIVITY LOG & AUDIT
-- ============================================

CREATE TABLE activity_log (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  organization_id CHAR(36),

  -- Activity details
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36),
  action VARCHAR(50) NOT NULL,
  description TEXT,

  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Changes (for auditing)
  changes JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,

  INDEX idx_user_activity (user_id, created_at),
  INDEX idx_org_activity (organization_id, created_at),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RATE LIMITING (Shared Hosting Compatible)
-- ============================================

CREATE TABLE rate_limits (
  id CHAR(36) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  attempts INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_identifier (identifier),
  INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM SETTINGS (Database-Driven Config)
-- ============================================

CREATE TABLE system_settings (
  id CHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type ENUM('string', 'integer', 'boolean', 'json', 'url') DEFAULT 'string',
  category VARCHAR(50) NOT NULL,
  description TEXT,

  -- Access Control
  is_public BOOLEAN DEFAULT FALSE,
  requires_super_admin BOOLEAN DEFAULT TRUE,

  -- Validation
  validation_rules JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),

  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_category (category),
  INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_settings_history (
  id CHAR(36) PRIMARY KEY,
  setting_id CHAR(36) NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_by CHAR(36),
  change_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (setting_id) REFERENCES system_settings(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_setting_history (setting_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INTERNATIONALIZATION (i18n)
-- ============================================

CREATE TABLE supported_languages (
  language_code VARCHAR(5) PRIMARY KEY,
  language_name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_rtl BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE translations (
  id CHAR(36) PRIMARY KEY,
  translation_key VARCHAR(255) NOT NULL,
  language_code VARCHAR(5) NOT NULL,
  translation_text TEXT NOT NULL,
  namespace VARCHAR(50) DEFAULT 'common',
  context VARCHAR(100),
  description TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),

  UNIQUE KEY unique_translation (translation_key, language_code, namespace),
  INDEX idx_language (language_code),
  INDEX idx_namespace (namespace),
  INDEX idx_key (translation_key),
  FOREIGN KEY (language_code) REFERENCES supported_languages(language_code) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MONETIZATION & SUBSCRIPTIONS
-- ============================================

CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly_cents INT NOT NULL,
  price_yearly_cents INT,

  -- Limits
  max_organizations INT,
  max_members_per_org INT,
  max_aircraft_per_org INT,

  -- Features (JSON flags)
  features JSON NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_active (is_active, is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,

  -- Billing
  billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',

  -- Payment Provider
  payment_provider VARCHAR(50),
  payment_provider_subscription_id VARCHAR(255),
  payment_provider_customer_id VARCHAR(255),

  -- Status
  status ENUM('active', 'cancelled', 'past_due', 'paused') DEFAULT 'active',

  -- Dates
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),

  INDEX idx_user_active (user_id, status),
  INDEX idx_period_end (current_period_end, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization_subscriptions (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  subscribed_by CHAR(36) NOT NULL,

  -- Billing
  billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',

  -- Payment Provider
  payment_provider VARCHAR(50),
  payment_provider_subscription_id VARCHAR(255),
  payment_provider_customer_id VARCHAR(255),

  -- Status
  status ENUM('active', 'cancelled', 'past_due', 'paused') DEFAULT 'active',

  -- Dates
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  FOREIGN KEY (subscribed_by) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_org_active (organization_id, status),
  INDEX idx_period_end (current_period_end, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHECKLIST MARKETPLACE
-- ============================================

CREATE TABLE checklist_marketplace (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,

  -- Seller Info
  seller_id CHAR(36) NOT NULL,

  -- Pricing
  price_cents INT NOT NULL,

  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Stats
  total_purchases INT DEFAULT 0,
  total_revenue_cents INT DEFAULT 0,
  average_rating DECIMAL(3,2),
  total_reviews INT DEFAULT 0,

  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_published (is_published, is_featured),
  INDEX idx_seller (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_purchases (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  marketplace_item_id CHAR(36) NOT NULL,

  -- Purchase details
  price_paid_cents INT NOT NULL,
  payment_provider VARCHAR(50) NOT NULL,
  payment_provider_transaction_id VARCHAR(255),

  -- Platform revenue (30%)
  platform_fee_cents INT NOT NULL,
  seller_revenue_cents INT NOT NULL,

  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marketplace_item_id) REFERENCES checklist_marketplace(id) ON DELETE CASCADE,
  UNIQUE KEY unique_purchase (user_id, marketplace_item_id),

  INDEX idx_user_purchases (user_id, purchased_at),
  INDEX idx_marketplace_purchases (marketplace_item_id, purchased_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_transactions (
  id CHAR(36) PRIMARY KEY,

  -- User/Org
  user_id CHAR(36),
  organization_id CHAR(36),

  -- Transaction details
  type ENUM('subscription', 'purchase', 'refund') NOT NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Payment Provider
  payment_provider VARCHAR(50) NOT NULL,
  payment_provider_transaction_id VARCHAR(255),
  payment_provider_status VARCHAR(50),

  -- Related entities
  subscription_id CHAR(36),
  purchase_id CHAR(36),

  -- Status
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',

  -- Metadata
  metadata JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,

  INDEX idx_user_transactions (user_id, created_at),
  INDEX idx_org_transactions (organization_id, created_at),
  INDEX idx_provider_transaction (payment_provider, payment_provider_transaction_id),
  INDEX idx_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA: SYSTEM SETTINGS
-- ============================================

INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public, requires_super_admin) VALUES
-- App URLs
(UUID(), 'app.url', 'https://aerocheck.com', 'url', 'urls', 'Main application URL', TRUE, TRUE),
(UUID(), 'app.name', 'Aerocheck', 'string', 'general', 'Application name', TRUE, FALSE),

-- Email URLs (Templates)
(UUID(), 'email.verify_url_template', '{{app_url}}/verify-email?token={{token}}', 'url', 'urls', 'Email verification URL template', FALSE, TRUE),
(UUID(), 'email.invite_url_template', '{{app_url}}/invites/accept/{{token}}', 'url', 'urls', 'Organization invite URL template', FALSE, TRUE),
(UUID(), 'email.reset_password_url_template', '{{app_url}}/reset-password?token={{token}}', 'url', 'urls', 'Password reset URL template', FALSE, TRUE),

-- Email Configuration
(UUID(), 'email.from_address', 'noreply@aerocheck.com', 'string', 'email', 'From email address', FALSE, TRUE),
(UUID(), 'email.from_name', 'Aerocheck', 'string', 'email', 'From name', FALSE, TRUE),
(UUID(), 'email.verification_expires_hours', '24', 'integer', 'email', 'Email verification expiry (hours)', FALSE, TRUE),
(UUID(), 'email.invite_expires_days', '7', 'integer', 'email', 'Invite expiry (days)', FALSE, TRUE),

-- Feature Flags
(UUID(), 'features.email_verification_required', 'false', 'boolean', 'features', 'Require email verification to login', TRUE, TRUE),
(UUID(), 'features.public_organization_join', 'true', 'boolean', 'features', 'Allow public organization join links', TRUE, TRUE),
(UUID(), 'features.marketplace_enabled', 'true', 'boolean', 'features', 'Enable checklist marketplace', TRUE, FALSE),

-- Limits (Free Tier)
(UUID(), 'limits.free.max_aircraft', '5', 'integer', 'limits', 'Max aircraft for free users', TRUE, TRUE),
(UUID(), 'limits.free.max_checklists', '10', 'integer', 'limits', 'Max checklists for free users', TRUE, TRUE),

-- Rate Limiting
(UUID(), 'rate_limit.login_attempts', '5', 'integer', 'security', 'Max login attempts', FALSE, TRUE),
(UUID(), 'rate_limit.login_window_seconds', '300', 'integer', 'security', 'Login rate limit window (seconds)', FALSE, TRUE),
(UUID(), 'rate_limit.api_requests_per_minute', '60', 'integer', 'security', 'API requests per minute', FALSE, TRUE);

-- ============================================
-- SEED DATA: LANGUAGES & TRANSLATIONS
-- ============================================

-- Supported Languages
INSERT INTO supported_languages (language_code, language_name, native_name, is_active, is_default, is_rtl) VALUES
('en', 'English', 'English', TRUE, TRUE, FALSE),
('nl', 'Dutch', 'Nederlands', TRUE, FALSE, FALSE),
('fr', 'French', 'Français', TRUE, FALSE, FALSE),
('de', 'German', 'Deutsch', TRUE, FALSE, FALSE),
('es', 'Spanish', 'Español', TRUE, FALSE, FALSE);

-- English Translations (Base)
INSERT INTO translations (id, translation_key, language_code, translation_text, namespace, description) VALUES
-- Auth
(UUID(), 'auth.login', 'en', 'Login', 'auth', 'Login button text'),
(UUID(), 'auth.register', 'en', 'Register', 'auth', 'Register button text'),
(UUID(), 'auth.logout', 'en', 'Logout', 'auth', 'Logout button text'),
(UUID(), 'auth.email', 'en', 'Email', 'auth', 'Email field label'),
(UUID(), 'auth.password', 'en', 'Password', 'auth', 'Password field label'),
(UUID(), 'auth.firstName', 'en', 'First Name', 'auth', 'First name field label'),
(UUID(), 'auth.lastName', 'en', 'Last Name', 'auth', 'Last name field label'),
(UUID(), 'auth.emailNotVerified', 'en', 'Email not verified', 'auth', 'Email verification warning'),
(UUID(), 'auth.resendVerification', 'en', 'Resend Email', 'auth', 'Resend verification button'),
(UUID(), 'auth.checkYourEmail', 'en', 'Check your email', 'auth', 'Registration success message'),

-- Common
(UUID(), 'common.save', 'en', 'Save', 'common', 'Save button'),
(UUID(), 'common.cancel', 'en', 'Cancel', 'common', 'Cancel button'),
(UUID(), 'common.delete', 'en', 'Delete', 'common', 'Delete button'),
(UUID(), 'common.edit', 'en', 'Edit', 'common', 'Edit button'),
(UUID(), 'common.create', 'en', 'Create', 'common', 'Create button'),
(UUID(), 'common.loading', 'en', 'Loading...', 'common', 'Loading state'),
(UUID(), 'common.error', 'en', 'Error', 'common', 'Error message'),
(UUID(), 'common.success', 'en', 'Success', 'common', 'Success message'),

-- Aircraft
(UUID(), 'aircraft.title', 'en', 'Aircraft', 'aircraft', 'Aircraft page title'),
(UUID(), 'aircraft.create', 'en', 'Add Aircraft', 'aircraft', 'Create aircraft button'),
(UUID(), 'aircraft.registration', 'en', 'Registration', 'aircraft', 'Aircraft registration field'),
(UUID(), 'aircraft.type', 'en', 'Type', 'aircraft', 'Aircraft type field'),

-- Checklists
(UUID(), 'checklists.title', 'en', 'Checklists', 'checklists', 'Checklists page title'),
(UUID(), 'checklists.create', 'en', 'Create Checklist', 'checklists', 'Create checklist button'),

-- Errors
(UUID(), 'errors.network', 'en', 'Network error. Please try again.', 'errors', 'Network error message'),
(UUID(), 'errors.unauthorized', 'en', 'Unauthorized. Please login again.', 'errors', 'Unauthorized error');

-- Dutch Translations (Sample)
INSERT INTO translations (id, translation_key, language_code, translation_text, namespace, description) VALUES
(UUID(), 'auth.login', 'nl', 'Inloggen', 'auth', 'Login knop tekst'),
(UUID(), 'auth.register', 'nl', 'Registreren', 'auth', 'Registreer knop tekst'),
(UUID(), 'auth.logout', 'nl', 'Uitloggen', 'auth', 'Uitlog knop tekst'),
(UUID(), 'auth.email', 'nl', 'E-mail', 'auth', 'E-mail veld label'),
(UUID(), 'auth.password', 'nl', 'Wachtwoord', 'auth', 'Wachtwoord veld label'),
(UUID(), 'auth.firstName', 'nl', 'Voornaam', 'auth', 'Voornaam veld label'),
(UUID(), 'auth.lastName', 'nl', 'Achternaam', 'auth', 'Achternaam veld label'),
(UUID(), 'auth.emailNotVerified', 'nl', 'E-mail niet geverifieerd', 'auth', 'Email verificatie waarschuwing'),
(UUID(), 'auth.resendVerification', 'nl', 'Opnieuw versturen', 'auth', 'Verificatie opnieuw versturen knop'),
(UUID(), 'common.save', 'nl', 'Opslaan', 'common', 'Opslaan knop'),
(UUID(), 'common.cancel', 'nl', 'Annuleren', 'common', 'Annuleren knop'),
(UUID(), 'common.delete', 'nl', 'Verwijderen', 'common', 'Verwijderen knop'),
(UUID(), 'common.loading', 'nl', 'Laden...', 'common', 'Laad status'),
(UUID(), 'aircraft.title', 'nl', 'Luchtvaartuigen', 'aircraft', 'Luchtvaartuigen pagina titel'),
(UUID(), 'checklists.title', 'nl', 'Checklists', 'checklists', 'Checklists pagina titel');

-- ============================================
-- SEED DATA: SUBSCRIPTION PLANS
-- ============================================

INSERT INTO subscription_plans (id, name, description, price_monthly_cents, price_yearly_cents, max_organizations, max_members_per_org, max_aircraft_per_org, features, is_active, is_public) VALUES
('free', 'Free', 'Perfect for individual pilots getting started', 0, 0, 1, 1, 5, '{"premium_checklists": false, "offline_mode": true, "basic_support": true}', TRUE, TRUE),
('pro', 'Pro', 'For serious pilots who need unlimited aircraft and premium checklists', 499, 4990, 1, 1, -1, '{"premium_checklists": true, "offline_mode": true, "priority_support": true, "custom_checklists": true}', TRUE, TRUE),
('club_starter', 'Club Starter', 'Small flying clubs and schools', 1900, 19000, -1, 20, -1, '{"premium_checklists": true, "offline_mode": true, "priority_support": true, "member_management": true, "instructor_features": true}', TRUE, TRUE),
('club_pro', 'Club Pro', 'Growing clubs with active membership', 4900, 49000, -1, 100, -1, '{"premium_checklists": true, "offline_mode": true, "priority_support": true, "member_management": true, "instructor_features": true, "advanced_reporting": true, "api_access": true}', TRUE, TRUE),
('enterprise', 'Enterprise', 'Large organizations with unlimited needs', 14900, 149000, -1, -1, -1, '{"premium_checklists": true, "offline_mode": true, "priority_support": true, "member_management": true, "instructor_features": true, "advanced_reporting": true, "api_access": true, "white_label": true, "dedicated_support": true}', TRUE, TRUE);

-- ============================================
-- SEED DATA: SUPER ADMIN USER (Default)
-- ============================================

-- Password: Admin123! (you should change this immediately after first login)
-- This is just for initial setup
INSERT INTO users (id, email, password_hash, first_name, last_name, is_super_admin, email_verified, created_at) VALUES
(UUID(), 'admin@aerocheck.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lJ3lCx9wKW3m', 'Super', 'Admin', TRUE, TRUE, NOW());

-- ============================================
-- END OF SCHEMA
-- ============================================
