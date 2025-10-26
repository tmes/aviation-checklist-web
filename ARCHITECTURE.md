# 🏗️ AEROCHECK - COMPLETE ARCHITECTURE & ROADMAP

**Multi-Tenant Aviation Checklist Platform**

Version: 1.0
Last Updated: October 25, 2025
Status: In Development (Week 2)

---

## 📖 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Architecture](#frontend-architecture)
7. [Offline-First Strategy](#offline-first-strategy)
8. [Security & Authorization](#security--authorization)
9. [Development Roadmap](#development-roadmap)
10. [Deployment Strategy](#deployment-strategy)

---

## 1. EXECUTIVE SUMMARY

### Vision
Aerocheck is een Progressive Web App voor vliegclubs en piloten om aviation checklists te beheren, distribueren en uitvoeren. De app werkt offline-first en ondersteunt multi-tenant organizaties.

### Key Features
- ✅ **Personal Aircraft Management** - Piloten beheren hun eigen vliegtuigen
- ✅ **Personal Checklists** - Custom checklists per aircraft/type
- ✅ **Checklist Execution** - Real-time progress tracking
- ✅ **Multi-Tenant Organizations** - Vliegclubs met leden en rollen
- ✅ **Club Aircraft Fleet** - Shared aircraft met qualifications
- ✅ **Checklist Distribution** - Publish & sync naar leden
- ✅ **Offline Support** - Werkt zonder internet (IndexedDB)
- ✅ **Import/Export** - CSV voor checklist data
- 🔄 **Sync Engine** - Offline changes syncen naar server

### Target Users
1. **Individual Pilots** - Personal aircraft & checklists
2. **Flight Schools** - Student tracking & standardized procedures
3. **Flying Clubs** - Shared fleet & member management
4. **Corporate Aviation** - Compliance & audit trails

---

## 2. TECHNOLOGY STACK

### Backend
```
Runtime:       PHP 8.2+
Framework:     Slim Framework 4
Database:      MySQL 8.0
Auth:          JWT (firebase/php-jwt)
Validation:    Respect/Validation
Environment:   vlucas/phpdotenv
Testing:       PHPUnit
```

### Frontend
```
Runtime:       Node.js 20+ (build only, not for production)
Framework:     React 19
Language:      TypeScript 5.9
Build Tool:    Vite 7 (rolldown-vite)
Routing:       React Router v7
State:         Zustand (global) + TanStack Query (server)
Styling:       Tailwind CSS 3.4
Icons:         Lucide React (NO emoticons anywhere)
Components:    Custom (no UI library yet)
Forms:         Native React state (React Hook Form later)
Validation:    Native + Zod (later)
Offline:       IndexedDB (idb library)
PWA:           Vite PWA Plugin
```

### Infrastructure
```
Frontend Host: Same Shared Webhosting as backend
              - Upload build files to public_html/
              - Static files (HTML, CSS, JS)
              - NO Node.js required on server
              - Build locally, upload dist/

Backend Host:  Shared Webhosting (cPanel, Plesk, DirectAdmin)
              - PHP 8.2+ required
              - MySQL database included
              - NO root access needed
              - NO shell access required
              - Standard .htaccess support

Database:      MySQL 8.0 (included with shared hosting)
SSL:           Let's Encrypt (via hosting provider)
Monitoring:    Sentry (errors) + Plausible (analytics)
```

### Development Tools
```
Version Control: Git + GitHub
Package Mgmt:    npm (frontend) + Composer (backend)
Code Quality:    ESLint + TypeScript + PHP CS Fixer
API Testing:     Postman / Insomnia / curl
Local Server:    PHP built-in server (dev) + nginx (prod)
```

---

## 3. SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       USER DEVICE                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React PWA (Browser)                                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   UI Layer   │  │  State Mgmt  │  │  IndexedDB  │ │ │
│  │  │   (React)    │◄─┤   (Zustand)  │◄─┤  (Offline)  │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │         ▲                  ▲                           │ │
│  │         │                  │                           │ │
│  │         ▼                  ▼                           │ │
│  │  ┌──────────────────────────────────┐                 │ │
│  │  │     TanStack Query (Cache)       │                 │ │
│  │  └──────────────────────────────────┘                 │ │
│  │                    ▲                                   │ │
│  │                    │ HTTP/JSON                         │ │
│  │                    ▼                                   │ │
│  │  ┌──────────────────────────────────┐                 │ │
│  │  │      API Client (fetch)          │                 │ │
│  │  │      + JWT Token Handling        │                 │ │
│  │  └──────────────────────────────────┘                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS + JWT
                           │
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND SERVER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PHP 8.2 + Slim Framework                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Routing    │─►│  Middleware  │─►│ Controllers │ │ │
│  │  │ (index.php)  │  │   (Auth)     │  │             │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │                                              │         │ │
│  │                                              ▼         │ │
│  │                                    ┌─────────────────┐ │ │
│  │                                    │    Services     │ │ │
│  │                                    │  (JWT, RBAC)    │ │ │
│  │                                    └─────────────────┘ │ │
│  │                                              │         │ │
│  │                                              ▼         │ │
│  │                                    ┌─────────────────┐ │ │
│  │                                    │   Database      │ │ │
│  │                                    │   Connection    │ │ │
│  │                                    │   (PDO)         │ │ │
│  │                                    └─────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   MySQL 8.0  │
                   │   Database   │
                   └──────────────┘
```

### Request Flow

**Authenticated Request:**
```
1. User action in React
2. TanStack Query checks cache
3. If stale/missing → API call
4. API Client adds JWT token to header
5. Backend: AuthMiddleware validates token
6. Backend: RBAC checks permissions
7. Backend: Controller processes request
8. Backend: Database query (PDO)
9. Backend: JSON response
10. TanStack Query updates cache
11. React re-renders UI
12. IndexedDB syncs (if offline-mode enabled)
```

**Offline Request:**
```
1. User action in React
2. Detect offline (navigator.onLine === false)
3. Save to IndexedDB with "pending sync" flag
4. UI updates immediately (optimistic)
5. Background: Queue for sync
6. When online: Sync service pushes changes
7. Backend processes queued changes
8. IndexedDB updated with server response
```

---

## 4. DATABASE SCHEMA

### MySQL Schema (Complete)

```sql
-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE, -- SUPER ADMIN: can see/manage EVERYTHING
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email),
  INDEX idx_active (is_active),
  INDEX idx_super_admin (is_super_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ORGANIZATIONS (Vliegclubs)
-- ============================================================================

CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  location VARCHAR(255),
  country CHAR(2), -- ISO 3166-1 alpha-2
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_slug (slug),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MEMBERSHIPS (User <-> Organization relation)
-- ============================================================================

CREATE TABLE memberships (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'instructor', 'member') NOT NULL DEFAULT 'member',
  status ENUM('pending', 'active', 'inactive') NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_membership (user_id, organization_id),
  INDEX idx_user_memberships (user_id, status),
  INDEX idx_org_members (organization_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INVITES
-- ============================================================================

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
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_org_invites (organization_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AIRCRAFT TYPES (predefined + custom)
-- ============================================================================

CREATE TABLE aircraft_types (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100),
  category ENUM('SEP', 'MEP', 'JET', 'UL', 'HELI', 'GLIDER', 'OTHER') NOT NULL,
  description TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by CHAR(36), -- NULL for system types
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_custom (is_custom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AIRCRAFT (Personal + Organization)
-- ============================================================================

CREATE TABLE aircraft (
  id CHAR(36) PRIMARY KEY,
  aircraft_type_id CHAR(36) NOT NULL,

  -- Owner (either user OR organization)
  owner_type ENUM('user', 'organization') NOT NULL,
  owner_user_id CHAR(36),
  owner_org_id CHAR(36),

  -- Aircraft details
  registration VARCHAR(20), -- N12345, PH-ABC, etc.
  callsign VARCHAR(50) NOT NULL,
  hobbs_time DECIMAL(10, 2),
  tach_time DECIMAL(10, 2),

  -- Status
  status ENUM('airworthy', 'maintenance', 'grounded') DEFAULT 'airworthy',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (aircraft_type_id) REFERENCES aircraft_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  CHECK (
    (owner_type = 'user' AND owner_user_id IS NOT NULL AND owner_org_id IS NULL) OR
    (owner_type = 'organization' AND owner_org_id IS NOT NULL AND owner_user_id IS NULL)
  ),

  INDEX idx_owner_user (owner_type, owner_user_id),
  INDEX idx_owner_org (owner_type, owner_org_id),
  INDEX idx_type (aircraft_type_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AIRCRAFT QUALIFICATIONS (who can fly which aircraft)
-- ============================================================================

CREATE TABLE aircraft_qualifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  aircraft_id CHAR(36) NOT NULL,
  qualified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  qualified_by CHAR(36), -- instructor who checked out
  expires_at TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE,
  FOREIGN KEY (qualified_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_qualification (user_id, aircraft_id),
  INDEX idx_user_quals (user_id),
  INDEX idx_aircraft_quals (aircraft_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FLIGHT PHASES (predefined, seeded)
-- ============================================================================

CREATE TABLE flight_phases (
  id VARCHAR(50) PRIMARY KEY, -- 'preflight', 'startup', etc.
  name VARCHAR(100) NOT NULL,
  display_order INT NOT NULL,
  icon VARCHAR(50),
  category ENUM('normal', 'emergency', 'abnormal') NOT NULL DEFAULT 'normal',
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHECKLISTS
-- ============================================================================

CREATE TABLE checklists (
  id CHAR(36) PRIMARY KEY,

  -- Ownership (either user OR organization)
  owner_type ENUM('user', 'organization') NOT NULL,
  owner_user_id CHAR(36),
  owner_org_id CHAR(36),

  -- Linked to aircraft
  aircraft_id CHAR(36), -- specific aircraft (optional)
  aircraft_type_id CHAR(36), -- aircraft type (fallback)

  -- Checklist metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('normal', 'emergency', 'abnormal') NOT NULL DEFAULT 'normal',
  phase VARCHAR(50), -- references flight_phases.id
  sequence_in_phase INT DEFAULT 0,

  -- Versioning
  version VARCHAR(20) DEFAULT '1.0',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',

  -- Template & forking
  is_template BOOLEAN DEFAULT FALSE,
  parent_checklist_id CHAR(36), -- if forked from org checklist

  -- Audit
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,

  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE SET NULL,
  FOREIGN KEY (aircraft_type_id) REFERENCES aircraft_types(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_checklist_id) REFERENCES checklists(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

  CHECK (
    (owner_type = 'user' AND owner_user_id IS NOT NULL AND owner_org_id IS NULL) OR
    (owner_type = 'organization' AND owner_org_id IS NOT NULL AND owner_user_id IS NULL)
  ),

  INDEX idx_owner_user (owner_type, owner_user_id, status),
  INDEX idx_owner_org (owner_type, owner_org_id, status),
  INDEX idx_aircraft (aircraft_id, aircraft_type_id),
  INDEX idx_phase (phase, sequence_in_phase),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHECKLIST ITEMS
-- ============================================================================

CREATE TABLE checklist_items (
  id CHAR(36) PRIMARY KEY,
  checklist_id CHAR(36) NOT NULL,
  sequence_number INT NOT NULL,
  text VARCHAR(255) NOT NULL,
  action VARCHAR(255),
  expected_response VARCHAR(255),
  is_critical BOOLEAN DEFAULT FALSE,
  notes TEXT,
  voice_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  INDEX idx_checklist_sequence (checklist_id, sequence_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHECKLIST EXECUTIONS (tracking when checklists are used)
-- ============================================================================

CREATE TABLE checklist_executions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  checklist_id CHAR(36) NOT NULL,
  aircraft_id CHAR(36),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  status ENUM('in_progress', 'completed', 'aborted') DEFAULT 'in_progress',
  flight_type ENUM('training', 'solo', 'dual', 'commercial', 'other'),
  weather_conditions TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE SET NULL,
  INDEX idx_user_executions (user_id, started_at DESC),
  INDEX idx_checklist_executions (checklist_id, started_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHECKLIST ITEM ACTIONS (what happened during execution)
-- ============================================================================

CREATE TABLE checklist_item_actions (
  id CHAR(36) PRIMARY KEY,
  execution_id CHAR(36) NOT NULL,
  checklist_item_id CHAR(36) NOT NULL,
  action ENUM('completed', 'skipped', 'deferred', 'failed') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason ENUM('not_applicable', 'emergency', 'instructor_override', 'weather_dependent', 'equipment_unavailable', 'custom'),
  reason_text TEXT,
  authorized_by CHAR(36), -- for overrides
  actual_response TEXT,
  duration_seconds INT,
  voice_confirmed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (execution_id) REFERENCES checklist_executions(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
  FOREIGN KEY (authorized_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_execution_actions (execution_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHECKLIST DISTRIBUTIONS (tracking which checklists were pushed to members)
-- ============================================================================

CREATE TABLE checklist_distributions (
  id CHAR(36) PRIMARY KEY,
  checklist_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  distributed_to_role ENUM('all', 'admin', 'instructor', 'member'),
  distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  distributed_by CHAR(36) NOT NULL,
  version VARCHAR(20),
  force_update BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (distributed_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_org_distributions (organization_id, distributed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYNC LOG (for offline sync conflict resolution)
-- ============================================================================

CREATE TABLE sync_log (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'checklist', 'aircraft', 'progress'
  entity_id CHAR(36) NOT NULL,
  action ENUM('create', 'update', 'delete') NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  client_timestamp TIMESTAMP,
  data_snapshot JSON, -- snapshot of data for conflict resolution
  conflict_resolved BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sync (user_id, synced_at DESC),
  INDEX idx_entity_sync (entity_type, entity_id, synced_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'checklist_update', 'invite', 'aircraft_status'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON, -- extra context
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notifications (user_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ACTIVITY LOG (for super admin monitoring)
-- ============================================================================

CREATE TABLE activity_log (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  organization_id CHAR(36),
  entity_type VARCHAR(50) NOT NULL, -- 'user', 'organization', 'aircraft', 'checklist', etc.
  entity_id CHAR(36),
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'login', 'invite', etc.
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON, -- additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_user_activity (user_id, created_at DESC),
  INDEX idx_org_activity (organization_id, created_at DESC),
  INDEX idx_entity_activity (entity_type, entity_id, created_at DESC),
  INDEX idx_action (action, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- USER SETTINGS
-- ============================================================================

CREATE TABLE user_settings (
  user_id CHAR(36) PRIMARY KEY,
  dark_mode BOOLEAN DEFAULT FALSE,
  voice_enabled BOOLEAN DEFAULT FALSE,
  active_aircraft_id CHAR(36),
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  share_progress_with_org BOOLEAN DEFAULT FALSE,
  settings_json JSON, -- for future extensibility
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (active_aircraft_id) REFERENCES aircraft(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Seed Data

```sql
-- Flight Phases (predefined)
INSERT INTO flight_phases (id, name, display_order, icon, category, description) VALUES
('preflight', 'Pre-Flight', 100, 'CheckCircle', 'normal', 'Aircraft inspection and preparation before flight'),
('startup', 'Startup', 200, 'Zap', 'normal', 'Engine start and initial system checks'),
('after-startup', 'After Startup', 300, 'Play', 'normal', 'Post-engine start procedures and radio checks'),
('taxi', 'Taxi', 400, 'Car', 'normal', 'Ground movement and taxi procedures'),
('runup', 'Run-up', 500, 'Gauge', 'normal', 'Engine and system checks before takeoff'),
('takeoff', 'Takeoff', 600, 'Plane', 'normal', 'Takeoff preparation and execution'),
('climb', 'Climb', 700, 'TrendingUp', 'normal', 'Initial climb and cruise climb procedures'),
('cruise', 'Cruise', 800, 'Navigation', 'normal', 'Normal cruise flight operations'),
('descent', 'Descent', 900, 'TrendingDown', 'normal', 'Descent procedures and preparation for landing'),
('approach', 'Approach', 1000, 'Crosshair', 'normal', 'Approach preparation and execution'),
('final', 'Final', 1100, 'Radio', 'normal', 'Final approach and landing preparation'),
('landing', 'Landing', 1200, 'PlaneLanding', 'normal', 'Landing execution and rollout'),
('after-landing', 'After Landing', 1300, 'Check', 'normal', 'Post-landing procedures and taxi to parking'),
('shutdown', 'Shutdown', 1400, 'StopCircle', 'normal', 'Engine shutdown and aircraft securing'),
('emergency', 'Emergency', 9000, 'AlertTriangle', 'emergency', 'Emergency procedures and abnormal situations'),
('abnormal', 'Abnormal', 9100, 'AlertCircle', 'abnormal', 'Abnormal procedures and system malfunctions');

-- Aircraft Types (predefined)
-- See frontend/src/lib/data/aircraftTypes.ts for full list
-- These should be inserted via seed script
```

---

## 5. API ENDPOINTS

### Base URL
```
Development: http://localhost:8000/api
Production:  https://api.aerocheck.com/api
```

### Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": { ... }
}
```

**Paginated:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Endpoints

#### Authentication
```
POST   /api/auth/register
       Body: { email, password, firstName, lastName }
       Response: { token, user }

POST   /api/auth/login
       Body: { email, password }
       Response: { token, user }

GET    /api/users/me
       Headers: Authorization: Bearer {token}
       Response: { data: user }

PATCH  /api/users/me
       Headers: Authorization: Bearer {token}
       Body: { firstName?, lastName?, avatarUrl? }
       Response: { data: user }

POST   /api/auth/logout
       Headers: Authorization: Bearer {token}
       Response: { message }
```

#### Organizations
```
GET    /api/organizations
       Headers: Authorization: Bearer {token}
       Response: { data: [organizations] }

POST   /api/organizations
       Headers: Authorization: Bearer {token}
       Body: { name, slug, description?, location?, country? }
       Response: { data: organization }

GET    /api/organizations/:id
       Headers: Authorization: Bearer {token}
       Response: { data: organization }

PATCH  /api/organizations/:id
       Headers: Authorization: Bearer {token}
       Body: { name?, description?, location?, country? }
       Response: { data: organization }

DELETE /api/organizations/:id
       Headers: Authorization: Bearer {token}
       Response: { message }
```

#### Memberships
```
GET    /api/organizations/:id/members
       Headers: Authorization: Bearer {token}
       Response: { data: [memberships] }

POST   /api/organizations/:id/invite
       Headers: Authorization: Bearer {token}
       Body: { email, role }
       Response: { data: invite }

PATCH  /api/organizations/:id/members/:userId
       Headers: Authorization: Bearer {token}
       Body: { role }
       Response: { data: membership }

DELETE /api/organizations/:id/members/:userId
       Headers: Authorization: Bearer {token}
       Response: { message }

POST   /api/invites/accept/:token
       Headers: Authorization: Bearer {token}
       Response: { data: membership }
```

#### Aircraft Types
```
GET    /api/aircraft-types
       Response: { data: [aircraftTypes] }

POST   /api/aircraft-types
       Headers: Authorization: Bearer {token}
       Body: { name, manufacturer, category, description }
       Response: { data: aircraftType }
```

#### Aircraft
```
GET    /api/aircraft
       Headers: Authorization: Bearer {token}
       Query: ?owner_type=user|organization&organization_id=xxx
       Response: { data: [aircraft] }

POST   /api/aircraft
       Headers: Authorization: Bearer {token}
       Body: { aircraftTypeId, ownerType, ownerOrgId?, registration?, callsign, status? }
       Response: { data: aircraft }

GET    /api/aircraft/:id
       Headers: Authorization: Bearer {token}
       Response: { data: aircraft }

PATCH  /api/aircraft/:id
       Headers: Authorization: Bearer {token}
       Body: { registration?, callsign?, hobbsTime?, tachTime?, status? }
       Response: { data: aircraft }

DELETE /api/aircraft/:id
       Headers: Authorization: Bearer {token}
       Response: { message }
```

#### Aircraft Qualifications
```
GET    /api/aircraft/:id/qualifications
       Headers: Authorization: Bearer {token}
       Response: { data: [qualifications] }

POST   /api/aircraft/:id/qualifications
       Headers: Authorization: Bearer {token}
       Body: { userId, expiresAt?, notes? }
       Response: { data: qualification }

DELETE /api/aircraft/:id/qualifications/:userId
       Headers: Authorization: Bearer {token}
       Response: { message }
```

#### Checklists
```
GET    /api/checklists
       Headers: Authorization: Bearer {token}
       Query: ?owner_type=user|organization&organization_id=xxx&aircraft_id=xxx&phase=xxx
       Response: { data: [checklists] }

POST   /api/checklists
       Headers: Authorization: Bearer {token}
       Body: { ownerType, ownerOrgId?, aircraftId?, aircraftTypeId?, title, description?, category, phase, version? }
       Response: { data: checklist }

GET    /api/checklists/:id
       Headers: Authorization: Bearer {token}
       Response: { data: checklist (with items) }

PATCH  /api/checklists/:id
       Headers: Authorization: Bearer {token}
       Body: { title?, description?, category?, phase?, status? }
       Response: { data: checklist }

DELETE /api/checklists/:id
       Headers: Authorization: Bearer {token}
       Response: { message }

POST   /api/checklists/:id/fork
       Headers: Authorization: Bearer {token}
       Response: { data: newChecklist }

POST   /api/checklists/:id/publish
       Headers: Authorization: Bearer {token}
       Response: { data: checklist }

POST   /api/checklists/:id/distribute
       Headers: Authorization: Bearer {token}
       Body: { distributeTo: 'all'|'admin'|'instructor'|'member', forceUpdate? }
       Response: { data: distribution }
```

#### Checklist Items
```
GET    /api/checklists/:id/items
       Headers: Authorization: Bearer {token}
       Response: { data: [items] }

POST   /api/checklists/:id/items
       Headers: Authorization: Bearer {token}
       Body: { text, action?, expectedResponse?, isCritical?, notes?, voiceEnabled?, sequenceNumber }
       Response: { data: item }

PATCH  /api/checklists/:id/items/:itemId
       Headers: Authorization: Bearer {token}
       Body: { text?, action?, expectedResponse?, isCritical?, notes?, voiceEnabled? }
       Response: { data: item }

DELETE /api/checklists/:id/items/:itemId
       Headers: Authorization: Bearer {token}
       Response: { message }

PATCH  /api/checklists/:id/items/reorder
       Headers: Authorization: Bearer {token}
       Body: { items: [{ id, sequenceNumber }] }
       Response: { data: items }
```

#### Checklist Executions
```
GET    /api/executions
       Headers: Authorization: Bearer {token}
       Query: ?checklist_id=xxx&aircraft_id=xxx&status=xxx
       Response: { data: [executions] }

POST   /api/executions
       Headers: Authorization: Bearer {token}
       Body: { checklistId, aircraftId?, flightType?, weatherConditions?, notes? }
       Response: { data: execution }

GET    /api/executions/:id
       Headers: Authorization: Bearer {token}
       Response: { data: execution (with actions) }

PATCH  /api/executions/:id
       Headers: Authorization: Bearer {token}
       Body: { status?, completedAt?, notes? }
       Response: { data: execution }

POST   /api/executions/:id/actions
       Headers: Authorization: Bearer {token}
       Body: { checklistItemId, action, reason?, reasonText?, actualResponse?, voiceConfirmed? }
       Response: { data: action }
```

#### Sync
```
POST   /api/sync/pull
       Headers: Authorization: Bearer {token}
       Body: { lastSyncAt, entities: ['checklists', 'aircraft', 'executions'] }
       Response: { data: { checklists: [], aircraft: [], executions: [] }, syncTimestamp }

POST   /api/sync/push
       Headers: Authorization: Bearer {token}
       Body: { changes: [{ entityType, entityId, action, data, clientTimestamp }] }
       Response: { data: { applied: [], conflicts: [] } }

GET    /api/sync/status
       Headers: Authorization: Bearer {token}
       Response: { data: { lastSync, pendingChanges, conflicts } }
```

#### Notifications
```
GET    /api/notifications
       Headers: Authorization: Bearer {token}
       Query: ?unread=true
       Response: { data: [notifications] }

PATCH  /api/notifications/:id/read
       Headers: Authorization: Bearer {token}
       Response: { data: notification }

DELETE /api/notifications/:id
       Headers: Authorization: Bearer {token}
       Response: { message }
```

#### Import/Export
```
POST   /api/checklists/import
       Headers: Authorization: Bearer {token}
       Body: FormData (CSV file)
       Response: { data: { success: [checklists], errors: [] } }

GET    /api/checklists/:id/export
       Headers: Authorization: Bearer {token}
       Response: CSV file download
```

#### Super Admin (Platform-Wide Management)
```
🔐 SUPER ADMIN ONLY - All endpoints require is_super_admin = true

GET    /api/admin/dashboard
       Headers: Authorization: Bearer {token}
       Response: {
         data: {
           totalUsers, totalOrganizations, totalAircraft, totalChecklists,
           recentActivity, systemHealth
         }
       }

GET    /api/admin/users
       Headers: Authorization: Bearer {token}
       Query: ?page=1&limit=50&search=xxx&is_active=true
       Response: { data: [users], pagination: {...} }

GET    /api/admin/users/:id
       Headers: Authorization: Bearer {token}
       Response: {
         data: {
           user,
           organizations: [...],
           aircraft: [...],
           checklists: [...],
           activity: [...]
         }
       }

PATCH  /api/admin/users/:id
       Headers: Authorization: Bearer {token}
       Body: { firstName?, lastName?, isActive?, isSuperAdmin? }
       Response: { data: user }

DELETE /api/admin/users/:id
       Headers: Authorization: Bearer {token}
       Response: { message }

POST   /api/admin/impersonate/:userId
       Headers: Authorization: Bearer {token}
       Response: { token: impersonationToken }

GET    /api/admin/organizations
       Headers: Authorization: Bearer {token}
       Query: ?page=1&limit=50&search=xxx
       Response: { data: [organizations], pagination: {...} }

GET    /api/admin/organizations/:id
       Headers: Authorization: Bearer {token}
       Response: {
         data: {
           organization,
           members: [...],
           aircraft: [...],
           checklists: [...],
           activity: [...]
         }
       }

PATCH  /api/admin/organizations/:id
       Headers: Authorization: Bearer {token}
       Body: { name?, description?, isActive? }
       Response: { data: organization }

DELETE /api/admin/organizations/:id
       Headers: Authorization: Bearer {token}
       Response: { message }

GET    /api/admin/aircraft
       Headers: Authorization: Bearer {token}
       Query: ?page=1&limit=50&search=xxx&status=xxx
       Response: { data: [aircraft], pagination: {...} }

GET    /api/admin/checklists
       Headers: Authorization: Bearer {token}
       Query: ?page=1&limit=50&search=xxx&status=xxx
       Response: { data: [checklists], pagination: {...} }

GET    /api/admin/activity-log
       Headers: Authorization: Bearer {token}
       Query: ?page=1&limit=100&entity_type=xxx&user_id=xxx&start_date=xxx&end_date=xxx
       Response: { data: [activities], pagination: {...} }

GET    /api/admin/stats
       Headers: Authorization: Bearer {token}
       Query: ?period=day|week|month|year
       Response: {
         data: {
           userGrowth: [...],
           organizationGrowth: [...],
           checklistUsage: [...],
           topOrganizations: [...],
           topUsers: [...]
         }
       }

GET    /api/admin/system-settings
       Headers: Authorization: Bearer {token}
       Response: { data: { settings... } }

PATCH  /api/admin/system-settings
       Headers: Authorization: Bearer {token}
       Body: { setting: value }
       Response: { data: settings }
```

---

## 6. FRONTEND ARCHITECTURE

### Folder Structure

```
frontend/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   └── icons/                  # App icons (various sizes)
├── src/
│   ├── main.tsx                # App entry point
│   ├── App.tsx                 # Root component with routing
│   ├── index.css               # Global styles + Tailwind
│   │
│   ├── components/             # Reusable components
│   │   ├── ui/                 # UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   └── auth/
│   │       └── ProtectedRoute.tsx
│   │
│   ├── pages/                  # Page components (routes)
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── aircraft/
│   │   │   ├── AircraftList.tsx
│   │   │   ├── AircraftDetail.tsx
│   │   │   ├── AircraftForm.tsx
│   │   │   └── index.ts
│   │   ├── checklists/
│   │   │   ├── ChecklistList.tsx
│   │   │   ├── ChecklistDetail.tsx
│   │   │   ├── ChecklistBuilder.tsx
│   │   │   ├── ChecklistExecution.tsx
│   │   │   └── index.ts
│   │   ├── organizations/
│   │   │   ├── OrganizationList.tsx
│   │   │   ├── OrganizationDashboard.tsx
│   │   │   ├── MemberManagement.tsx
│   │   │   └── index.ts
│   │   └── settings/
│   │       └── UserSettings.tsx
│   │
│   ├── features/               # Feature-based modules
│   │   ├── aircraft/
│   │   │   ├── components/     # Feature-specific components
│   │   │   ├── hooks/          # Feature hooks (useAircraft, etc.)
│   │   │   ├── api.ts          # API calls for aircraft
│   │   │   └── types.ts        # Feature types
│   │   ├── checklists/
│   │   ├── organizations/
│   │   ├── sync/
│   │   └── notifications/
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts          # Dark mode, sidebar state, etc.
│   │   └── syncStore.ts        # Sync status
│   │
│   ├── lib/                    # Libraries & utilities
│   │   ├── api/
│   │   │   ├── client.ts       # Base API client
│   │   │   ├── auth.ts         # Auth endpoints
│   │   │   ├── aircraft.ts     # Aircraft endpoints
│   │   │   ├── checklists.ts   # Checklist endpoints
│   │   │   └── ...
│   │   ├── db/                 # IndexedDB wrapper
│   │   │   ├── schema.ts       # DB schema
│   │   │   ├── client.ts       # IDB client
│   │   │   ├── aircraft.ts     # Aircraft DB operations
│   │   │   ├── checklists.ts   # Checklists DB operations
│   │   │   └── sync.ts         # Sync operations
│   │   ├── sync/               # Sync engine
│   │   │   ├── engine.ts       # Main sync logic
│   │   │   ├── strategies.ts   # Conflict resolution
│   │   │   └── queue.ts        # Pending changes queue
│   │   ├── utils/
│   │   │   ├── uuid.ts
│   │   │   ├── date.ts
│   │   │   ├── validators.ts
│   │   │   └── ...
│   │   └── data/
│   │       ├── aircraftTypes.ts
│   │       └── flightPhases.ts
│   │
│   ├── hooks/                  # Global custom hooks
│   │   ├── useAuth.ts
│   │   ├── useOnlineStatus.ts
│   │   ├── useSync.ts
│   │   └── ...
│   │
│   └── types/                  # TypeScript types
│       └── index.ts
│
├── .env.local                  # Environment variables
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

### State Management Strategy

**Global State (Zustand):**
- Auth state (user, token, isAuthenticated)
- UI state (dark mode, sidebar open, active aircraft)
- Sync state (last sync, pending changes, conflicts)

**Server State (TanStack Query):**
- Aircraft data
- Checklists data
- Organizations data
- Notifications
- **Caching strategy:** staleTime: 5min, cacheTime: 30min

**Local State (useState):**
- Form inputs
- Modal open/close
- Temporary UI state

**Persistent State (IndexedDB):**
- Offline copies of all data
- Pending sync changes
- Progress tracking

### React Query Setup

```typescript
// Query keys
export const queryKeys = {
  aircraft: ['aircraft'] as const,
  aircraftDetail: (id: string) => ['aircraft', id] as const,
  checklists: ['checklists'] as const,
  checklistDetail: (id: string) => ['checklists', id] as const,
  organizations: ['organizations'] as const,
  // ...
};

// Query client config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
```

---

## 7. OFFLINE-FIRST STRATEGY

### Architecture

```
┌─────────────────────────────────────────┐
│         User Action (React)              │
└─────────────────────────────────────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │  Is Online?           │
       └───────────────────────┘
          │                │
    YES   │                │  NO
          ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│  API Call        │  │  IndexedDB       │
│  (TanStack Query)│  │  (Immediate)     │
└──────────────────┘  └──────────────────┘
          │                │
          ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│  Update IDB      │  │  Queue for Sync  │
│  Cache           │  │                  │
└──────────────────┘  └──────────────────┘
          │                │
          └────────┬───────┘
                   ▼
         ┌──────────────────┐
         │  Update UI       │
         └──────────────────┘
```

### IndexedDB Schema

```typescript
// IDB Schema
const DB_NAME = 'aerocheck';
const DB_VERSION = 1;

const stores = {
  aircraft: {
    keyPath: 'id',
    indexes: ['userId', 'aircraftTypeId', 'status']
  },
  checklists: {
    keyPath: 'id',
    indexes: ['userId', 'aircraftId', 'phase', 'status']
  },
  checklistItems: {
    keyPath: 'id',
    indexes: ['checklistId', 'sequenceNumber']
  },
  executions: {
    keyPath: 'id',
    indexes: ['userId', 'checklistId', 'status']
  },
  actions: {
    keyPath: 'id',
    indexes: ['executionId', 'checklistItemId']
  },
  pendingSync: {
    keyPath: 'id',
    indexes: ['entityType', 'createdAt']
  },
  syncMetadata: {
    keyPath: 'key' // lastSyncTimestamp, etc.
  }
};
```

### Sync Strategy

**1. Initial Sync (on login):**
```
- Pull all user data from server
- Store in IndexedDB
- Set lastSyncTimestamp
```

**2. Periodic Sync (every 5 min when online):**
```
- Check for pending changes in IDB
- Push pending changes to server
- Pull updates from server (since lastSyncTimestamp)
- Merge updates into IDB
- Update lastSyncTimestamp
```

**3. Manual Sync (user-triggered):**
```
- Same as periodic, but with UI feedback
```

**4. Offline Changes:**
```
- Save to IndexedDB immediately
- Add to pendingSync queue with metadata:
  { id, entityType, entityId, action, data, clientTimestamp }
- UI updates optimistically
```

**5. Conflict Resolution:**
```
Strategy: Last-Write-Wins (LWW) with timestamp

For User-Owned Data:
  - Client timestamp vs Server updated_at
  - If client newer → server accepts
  - If server newer → client overrides local

For Org-Owned Data (read-only for members):
  - Server always wins
  - Client changes rejected
  - Prompt user to fork checklist
```

### Implementation Example

```typescript
// Sync Service
class SyncService {
  async sync() {
    if (!navigator.onLine) return;

    const lastSync = await db.getSyncTimestamp();

    // Push local changes
    const pending = await db.getPendingChanges();
    if (pending.length > 0) {
      const result = await api.post('/sync/push', { changes: pending });
      await this.handleConflicts(result.conflicts);
      await db.clearPendingChanges(result.applied);
    }

    // Pull server updates
    const updates = await api.post('/sync/pull', {
      lastSyncAt: lastSync,
      entities: ['aircraft', 'checklists', 'executions']
    });

    // Merge into IDB
    await db.mergeUpdates(updates.data);
    await db.setSyncTimestamp(updates.syncTimestamp);
  }

  async handleConflicts(conflicts: Conflict[]) {
    // Show UI for user to resolve
    // Or apply automatic resolution strategy
  }
}
```

---

## 8. SECURITY & AUTHORIZATION

### Authentication Flow

```
1. User submits login credentials
2. Backend validates email + password
3. Backend generates JWT token (exp: 7 days)
4. Frontend stores token in:
   - Zustand store (memory)
   - localStorage (persistence)
5. All API requests include:
   Authorization: Bearer {token}
6. Backend middleware validates token
7. Backend extracts userId from token
8. Backend checks permissions
```

### JWT Payload

```json
{
  "iat": 1234567890,
  "exp": 1235172690,
  "data": {
    "userId": "uuid-here",
    "email": "pilot@example.com"
  }
}
```

### Role-Based Access Control (RBAC)

**Platform Roles:**
```
SUPER ADMIN:  Platform-wide access - can see and manage EVERYTHING
              - All users (view, edit, delete, impersonate)
              - All organizations (view, edit, delete)
              - All aircraft (view, edit, delete)
              - All checklists (view, edit, delete)
              - System settings
              - Activity logs & analytics
              - NO restrictions whatsoever
```

**Organization Roles:**
```
owner:      All permissions within their organization
admin:      Manage aircraft, checklists, members (not delete org)
instructor: Create/publish checklists, grant qualifications
member:     View org resources, fork checklists
```

**Permissions Matrix:**

| Action | Owner | Admin | Instructor | Member |
|--------|-------|-------|------------|--------|
| Update org details | ✅ | ✅ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Add org aircraft | ✅ | ✅ | ❌ | ❌ |
| Edit org aircraft | ✅ | ✅ | ❌ | ❌ |
| Delete org aircraft | ✅ | ✅ | ❌ | ❌ |
| View org aircraft | ✅ | ✅ | ✅ | ✅* |
| Grant qualifications | ✅ | ✅ | ✅ | ❌ |
| Create org checklists | ✅ | ✅ | ✅ | ❌ |
| Edit org checklists | ✅ | ✅ | ✅ | ❌ |
| Publish checklists | ✅ | ✅ | ✅ | ❌ |
| Delete org checklists | ✅ | ✅ | ✅ | ❌ |
| View org checklists | ✅ | ✅ | ✅ | ✅ |
| Fork org checklists | ✅ | ✅ | ✅ | ✅ |

*Only aircraft they're qualified for

### PHP Implementation

```php
// Middleware: AuthMiddleware.php
public static function authenticate(): ?string
{
    $token = JWTService::getTokenFromHeader();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        exit();
    }

    try {
        $decoded = JWTService::decode($token);
        return $decoded->data->userId;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit();
    }
}

// Service: RBACService.php
class RBACService
{
    public static function checkOrgPermission(
        string $userId,
        string $orgId,
        string $permission
    ): bool {
        // Get user's role in organization
        $role = self::getUserRoleInOrg($userId, $orgId);

        if (!$role) {
            return false;
        }

        $permissions = self::getPermissions($role);

        return in_array($permission, $permissions) || in_array('*', $permissions);
    }

    private static function getPermissions(string $role): array
    {
        return match($role) {
            'owner' => ['*'],
            'admin' => [
                'org.update', 'aircraft.*', 'checklist.*',
                'member.invite', 'member.remove', 'member.update'
            ],
            'instructor' => [
                'checklist.create', 'checklist.update', 'checklist.publish',
                'qualification.grant'
            ],
            'member' => [
                'aircraft.view', 'checklist.view', 'checklist.fork'
            ],
            default => []
        };
    }
}
```

### Data Access Rules

**Aircraft:**
```sql
-- User sees own aircraft
SELECT * FROM aircraft
WHERE owner_type = 'user' AND owner_user_id = :userId;

-- User sees org aircraft they're qualified for
SELECT a.* FROM aircraft a
INNER JOIN aircraft_qualifications q ON a.id = q.aircraft_id
WHERE a.owner_type = 'organization'
  AND a.owner_org_id IN (SELECT organization_id FROM memberships WHERE user_id = :userId)
  AND q.user_id = :userId;
```

**Checklists:**
```sql
-- User sees own checklists
SELECT * FROM checklists
WHERE owner_type = 'user' AND owner_user_id = :userId;

-- User sees org checklists (read-only)
SELECT c.* FROM checklists c
INNER JOIN memberships m ON c.owner_org_id = m.organization_id
WHERE c.owner_type = 'organization'
  AND m.user_id = :userId
  AND m.status = 'active';
```

---

## 9. DEVELOPMENT ROADMAP

### Phase 1: Core Features (Weeks 1-5)

#### ✅ Week 1: Foundation (COMPLETED)
**Status:** ✅ Done

**Completed:**
- [x] Vite + React + TypeScript
- [x] Tailwind CSS
- [x] React Router v7
- [x] Zustand + TanStack Query
- [x] TypeScript types
- [x] JWT Authentication
- [x] Login/Register UI
- [x] Protected routes
- [x] PHP backend structure
- [x] MySQL connection
- [x] Auth endpoints working

**Deliverable:** Auth system fully functional

---

#### 🔄 Week 2: Aircraft Management (CURRENT)

**Database:**
- [ ] Create `backend/database/schema.sql` with aircraft tables
- [ ] Seed aircraft_types (8 predefined)
- [ ] Run migrations

**Backend (PHP):**
- [ ] `AircraftController.php`
- [ ] `AircraftTypeController.php`
- [ ] CRUD endpoints (6 endpoints)
- [ ] Validation with Respect/Validation
- [ ] Authorization checks (user can only edit own aircraft)

**Frontend:**
- [ ] `/aircraft` page - Aircraft list
- [ ] `/aircraft/new` page - Add aircraft form
- [ ] `/aircraft/:id` page - Aircraft detail/edit
- [ ] Aircraft card component
- [ ] Aircraft type selector (dropdown with search)
- [ ] Status badges (airworthy/maintenance/grounded)
- [ ] Delete confirmation modal
- [ ] TanStack Query integration
- [ ] Optimistic updates

**Deliverable:** Users can manage personal aircraft

**Estimated Time:** 8-10 hours

---

#### Week 3: Checklist Management

**Database:**
- [ ] Checklists + items tables
- [ ] Seed flight_phases

**Backend (PHP):**
- [ ] `ChecklistController.php`
- [ ] `ChecklistItemController.php`
- [ ] CRUD endpoints (12 endpoints)
- [ ] Reorder items endpoint
- [ ] Cascade delete items

**Frontend:**
- [ ] `/checklists` page - List grouped by phase
- [ ] `/checklists/new` page - Create checklist
- [ ] `/checklists/:id/edit` page - Checklist builder
  - [ ] Item list with drag-drop reordering
  - [ ] Add/edit/delete items inline
  - [ ] Critical item toggle
  - [ ] Phase selector
  - [ ] Aircraft/type selector
- [ ] Delete checklist confirmation

**Deliverable:** Users can create and edit checklists

**Estimated Time:** 12-15 hours

---

#### Week 4: Checklist Execution

**Database:**
- [ ] `checklist_executions` table
- [ ] `checklist_item_actions` table

**Backend (PHP):**
- [ ] `ExecutionController.php`
- [ ] Start execution
- [ ] Record item actions
- [ ] Complete/abort execution

**Frontend:**
- [ ] `/checklists/:id/execute` page - Execution mode
  - [ ] Full-screen mode toggle
  - [ ] Large touch-friendly checkboxes
  - [ ] Progress indicator (X/Y completed)
  - [ ] Phase navigation
  - [ ] Critical items highlighted
  - [ ] Skip with reason
  - [ ] Reset progress
  - [ ] Complete execution
- [ ] Execution history page

**Deliverable:** Users can execute checklists and track progress

**Estimated Time:** 10-12 hours

---

#### Week 5: Import/Export + Polish

**Backend (PHP):**
- [ ] CSV parser
- [ ] Import validation
- [ ] Export generator

**Frontend:**
- [ ] Import UI (drag-drop CSV)
- [ ] Import preview
- [ ] Export button
- [ ] Dark mode implementation
- [ ] Settings page
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Responsive design polish
- [ ] Accessibility audit

**Deliverable:** Polished app with import/export

**Estimated Time:** 8-10 hours

---

### Phase 2: PWA + Offline (Weeks 6-7)

#### Week 6: IndexedDB + Offline Storage

**Frontend:**
- [ ] Install `idb` library
- [ ] Create IDB schema
- [ ] IDB wrapper functions
- [ ] Sync TanStack Query with IDB
- [ ] Offline detection hook
- [ ] Queue pending changes
- [ ] Show offline indicator

**Deliverable:** App works offline

**Estimated Time:** 10-12 hours

---

#### Week 7: PWA Features

**Frontend:**
- [ ] manifest.json
- [ ] App icons (generate all sizes)
- [ ] Service Worker (Vite PWA plugin)
- [ ] Cache strategies
- [ ] Install prompt
- [ ] Update notification

**Backend:**
- [ ] Optimize responses (gzip)
- [ ] Cache headers

**Deployment:**
- [ ] Deploy to Vercel
- [ ] Deploy backend to VPS
- [ ] HTTPS setup
- [ ] Test PWA on mobile

**Deliverable:** Installable PWA

**Estimated Time:** 8-10 hours

---

### Phase 3: Multi-Tenant (Weeks 8-10)

#### Week 8: Organizations

**Database:**
- [ ] Organizations tables
- [ ] Memberships tables
- [ ] Invites table

**Backend (PHP):**
- [ ] `OrganizationController.php`
- [ ] `MembershipController.php`
- [ ] RBAC implementation
- [ ] Invite system

**Frontend:**
- [ ] Create org flow
- [ ] Org dashboard
- [ ] Member management
- [ ] Invite UI
- [ ] Role management

**Deliverable:** Orgs can be created

**Estimated Time:** 12-15 hours

---

#### Week 9: Club Aircraft

**Database:**
- [ ] Update aircraft schema (owner_type, owner_org_id)
- [ ] Qualifications table

**Backend (PHP):**
- [ ] Update aircraft endpoints
- [ ] Qualifications endpoints
- [ ] Permission checks

**Frontend:**
- [ ] Club aircraft view
- [ ] Add club aircraft
- [ ] Qualification management
- [ ] Filter by qualified

**Deliverable:** Clubs can manage fleet

**Estimated Time:** 10-12 hours

---

#### Week 10: Checklist Distribution

**Database:**
- [ ] Update checklists schema
- [ ] Distributions table

**Backend (PHP):**
- [ ] Publish endpoint
- [ ] Distribute endpoint
- [ ] Fork endpoint

**Frontend:**
- [ ] Publish UI
- [ ] Distribution settings
- [ ] Fork button
- [ ] Update notifications

**Deliverable:** Checklist distribution works

**Estimated Time:** 12-15 hours

---

### Phase 4: Sync + Notifications (Weeks 11-12)

#### Week 11: Sync Engine

**Database:**
- [ ] Sync log table

**Backend (PHP):**
- [ ] Sync pull endpoint
- [ ] Sync push endpoint
- [ ] Conflict detection

**Frontend:**
- [ ] Sync service
- [ ] Auto-sync
- [ ] Manual sync button
- [ ] Conflict resolution UI

**Deliverable:** Sync works

**Estimated Time:** 15-18 hours

---

#### Week 12: Notifications

**Database:**
- [ ] Notifications table

**Backend (PHP):**
- [ ] Notifications endpoints
- [ ] Notification triggers

**Frontend:**
- [ ] Notification center
- [ ] Unread badge
- [ ] Mark as read
- [ ] Navigation

**Deliverable:** Notifications work

**Estimated Time:** 8-10 hours

---

### Total Estimated Time: 120-150 hours

---

## 10. DEPLOYMENT STRATEGY

### Development Environment
```
Frontend: http://localhost:5173 (Vite dev server)
Backend:  http://localhost:8000 (PHP built-in server)
Database: localhost:3306 (MySQL via MAMP Pro)
```

### Staging Environment
```
Frontend: https://staging.aerocheck.com (Vercel)
Backend:  https://api-staging.aerocheck.com (VPS)
Database: Remote MySQL (managed)
```

### Production Environment
```
SAME shared hosting account for everything:

Frontend: https://aerocheck.com (public_html/)
Backend:  https://aerocheck.com/api (public_html/api/)
Database: MySQL 8.0 (included with shared hosting)
SSL:      Let's Encrypt (via hosting control panel)

File structure on server:
public_html/
├── index.html           # Frontend (React build)
├── assets/              # Frontend assets
│   ├── index-xxx.js
│   └── index-xxx.css
├── manifest.json        # PWA manifest
├── icons/               # App icons
└── api/                 # Backend PHP
    ├── public/
    │   ├── index.php    # Backend entry point
    │   └── .htaccess
    ├── src/
    ├── vendor/
    └── .env
```

### CI/CD Pipeline

**Frontend (Manual Deployment):**
```bash
# 1. Build locally
cd frontend
npm install
npm run build
# Creates: frontend/dist/

# 2. Upload via FTP/cPanel File Manager
# Upload contents of frontend/dist/ to public_html/
# - index.html → public_html/index.html
# - assets/ → public_html/assets/
# - manifest.json → public_html/manifest.json
# - icons/ → public_html/icons/

# 3. Update API URL in build
# Before building, ensure .env has production API URL:
# VITE_API_URL=https://yourdomain.com/api

# Optional: Use GitHub Actions to auto-deploy via FTP
on: [push]
jobs:
  deploy:
    - npm install
    - npm run build
    - FTP upload dist/ to public_html/
```

**Backend (Shared Hosting):**
```bash
# Deployment Steps (via cPanel File Manager or FTP)

1. Build locally:
   composer install --no-dev --optimize-autoloader

2. Upload files via FTP/SFTP:
   - Upload backend/ folder to public_html/api/ (or subdomain)
   - Exclude: .git, .env, vendor (if large, upload separately)
   - Set public/ as web root (via cPanel domain settings)

3. Database setup via cPanel:
   - Create MySQL database via phpMyAdmin
   - Import schema.sql
   - Run seed scripts
   - Update .env with database credentials

4. .htaccess configuration:
   - Ensure mod_rewrite is enabled (contact host if not)
   - Place .htaccess in public/ folder

5. File permissions:
   - Set 755 for directories
   - Set 644 for files
   - No special permissions needed (no cache folders to write to)

6. Test:
   curl https://api.aerocheck.com/health
```

**Backend .htaccess (public/.htaccess):**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Redirect all requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.php [QSA,L]
</IfModule>

<IfModule mod_headers.c>
    # CORS headers (adjust origin for production)
    Header set Access-Control-Allow-Origin "https://app.aerocheck.com"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# PHP settings
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 30
```

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
```

**Backend (.env):**
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aerocheck
DB_USER=root
DB_PASS=secret
JWT_SECRET=your-secret-key
JWT_EXPIRY=604800
```

---

## CONCLUSION

This architecture provides:
- ✅ Scalable multi-tenant platform
- ✅ Offline-first PWA
- ✅ Secure authentication & authorization
- ✅ Clear development roadmap
- ✅ Realistic time estimates
- ✅ Complete database schema
- ✅ Comprehensive API design
- ✅ Modern frontend architecture

**Total Project Timeline:** 12 weeks (3 months)
**MVP (Phase 1):** 5 weeks
**Full Platform (Phases 1-4):** 12 weeks

Ready to proceed with Week 2: Aircraft Management! ✈️
