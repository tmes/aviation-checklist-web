# AEROCHECK - IMPROVEMENT PLAN & MISSING FEATURES

**Date:** October 26, 2025
**Version:** 1.2 - Comprehensive Analysis

---

## CRITICAL GAPS (Must Fix)

### 1. ❌ NO AJAX/SPA IMPLEMENTATION (CRITICAL!)

**Current Problem:**
- React is een SPA, MAAR data fetching is niet optimaal
- Directe `fetch()` calls in components
- Geen caching, geen optimistic updates
- Geen global loading/error states

**Solution: TanStack Query (React Query)**

```typescript
// Current (BAD):
const handleSubmit = async () => {
  const response = await fetch('/api/aircraft', {...});
  const data = await response.json();
}

// Should be (GOOD):
const { mutate, isLoading } = useMutation({
  mutationFn: createAircraft,
  onSuccess: () => {
    queryClient.invalidateQueries(['aircraft']);
  }
});
```

**Benefits:**
- ✅ Automatic background refetching
- ✅ Caching & deduplication
- ✅ Optimistic updates (instant UI feedback)
- ✅ Automatic retry logic
- ✅ Loading/error states handled globally
- ✅ Infinite scroll support
- ✅ Prefetching

**Implementation Required:**
```bash
npm install @tanstack/react-query
```

---

### 2. ❌ NO INTERNATIONALIZATION (i18n)

**Current Problem:**
- All text is hardcoded in English
- "Email not verified", "Login", etc. are hardcoded strings
- Impossible to add Dutch, French, German without code changes

**Solution: react-i18next + Database Translations**

**Architecture:**
```
Frontend: react-i18next
Backend: translations table in database
Super Admin: Can edit translations via UI
```

**Database Schema:**
```sql
CREATE TABLE translations (
  id CHAR(36) PRIMARY KEY,
  translation_key VARCHAR(255) NOT NULL,
  language_code VARCHAR(5) NOT NULL,
  translation_text TEXT NOT NULL,
  context VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),

  UNIQUE KEY unique_translation (translation_key, language_code),
  INDEX idx_language (language_code),
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supported_languages (
  language_code VARCHAR(5) PRIMARY KEY,
  language_name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data
INSERT INTO supported_languages VALUES
  ('en', 'English', 'English', TRUE, TRUE, NOW()),
  ('nl', 'Dutch', 'Nederlands', TRUE, FALSE, NOW()),
  ('fr', 'French', 'Français', TRUE, FALSE, NOW()),
  ('de', 'German', 'Deutsch', TRUE, FALSE, NOW());
```

**Frontend Implementation:**
```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    backend: {
      loadPath: '/api/translations/{{lng}}',
    },
  });

// Usage in components:
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<button>{t('auth.login')}</button>
```

**Backend API:**
```php
GET /api/translations/{language_code}
// Returns: { "auth.login": "Login", "auth.register": "Register", ... }

// Super Admin only:
PUT /api/translations/{key}
// Update translation for specific key
```

---

### 3. ⚠️ SYSTEM SETTINGS NOT IMPLEMENTED

**Current Problem:**
- SYSTEM_SETTINGS.md exists, maar niet geïmplementeerd
- Veel hardcoded values:
  - Email templates met hardcoded URLs
  - Rate limits (5 attempts, 300 seconds) hardcoded
  - Feature flags niet in database
  - Subscription limits hardcoded

**Solution: SettingsService Implementation**

**Backend: SettingsService.php**
```php
class SettingsService
{
    private static ?PDO $db = null;
    private static array $cache = [];

    public static function get(string $key, $default = null)
    {
        if (isset(self::$cache[$key])) {
            return self::$cache[$key];
        }

        $stmt = self::getDb()->prepare("
            SELECT setting_value, setting_type FROM system_settings
            WHERE setting_key = ?
        ");
        $stmt->execute([$key]);
        $result = $stmt->fetch();

        if (!$result) {
            return $default;
        }

        $value = self::parseValue($result['setting_value'], $result['setting_type']);
        self::$cache[$key] = $value;
        return $value;
    }

    private static function parseValue($value, $type)
    {
        return match($type) {
            'integer' => (int)$value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    public static function buildUrl(string $templateKey, array $variables): string
    {
        $template = self::get($templateKey);
        $appUrl = self::get('app.url');

        $replacements = array_merge(['app_url' => $appUrl], $variables);

        foreach ($replacements as $key => $value) {
            $template = str_replace('{{' . $key . '}}', $value, $template);
        }

        return $template;
    }

    // Super Admin only
    public static function set(string $key, $value, string $userId): void
    {
        // Check super admin permission
        if (!self::isSuperAdmin($userId)) {
            throw new \Exception('Unauthorized');
        }

        // Get old value for history
        $oldValue = self::get($key);

        // Update setting
        $stmt = self::getDb()->prepare("
            UPDATE system_settings
            SET setting_value = ?, updated_by = ?, updated_at = NOW()
            WHERE setting_key = ?
        ");
        $stmt->execute([$value, $userId, $key]);

        // Log change in history
        self::logChange($key, $oldValue, $value, $userId);

        // Clear cache
        unset(self::$cache[$key]);
    }
}
```

**Gebruik in code:**
```php
// Instead of hardcoded:
$maxAttempts = 5;
$windowSeconds = 300;

// Use settings:
$maxAttempts = SettingsService::get('rate_limit.login_attempts', 5);
$windowSeconds = SettingsService::get('rate_limit.login_window_seconds', 300);

// URL building:
$verifyUrl = SettingsService::buildUrl('email.verify_url_template', [
    'token' => $token
]);
```

**Frontend Settings API:**
```typescript
// Public settings (cached)
GET /api/settings/public
// Returns: { app_name, features.marketplace_enabled, etc. }

// Super Admin UI
GET /api/admin/settings
PUT /api/admin/settings/{key}
GET /api/admin/settings/{key}/history
```

---

### 4. ⚠️ MONETIZATION NOT FULLY DYNAMIC

**Current Status:**
- ✅ Database schema exists (subscription_plans table)
- ✅ Prices in database (can be changed)
- ❌ NO admin UI to change prices
- ❌ NO feature gating implemented
- ❌ NO subscription service

**What's Missing:**

**A. SubscriptionService.php**
```php
class SubscriptionService
{
    public static function getUserPlan(string $userId): ?array
    {
        // Get user's active subscription
        $stmt = $db->prepare("
            SELECT sp.* FROM subscription_plans sp
            JOIN user_subscriptions us ON us.plan_id = sp.id
            WHERE us.user_id = ? AND us.status = 'active'
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public static function canCreateAircraft(string $userId, string $orgId): bool
    {
        $plan = self::getUserPlan($userId);
        if (!$plan) {
            $plan = self::getFreePlan();
        }

        $currentCount = self::getAircraftCount($userId, $orgId);
        $maxAllowed = $plan['max_aircraft_per_org'];

        return $maxAllowed === -1 || $currentCount < $maxAllowed;
    }

    public static function getFeatures(string $userId): array
    {
        $plan = self::getUserPlan($userId);
        if (!$plan) {
            $plan = self::getFreePlan();
        }

        return json_decode($plan['features'], true);
    }

    public static function hasFeature(string $userId, string $feature): bool
    {
        $features = self::getFeatures($userId);
        return $features[$feature] ?? false;
    }
}
```

**B. Feature Gating Middleware**
```php
// In controllers:
if (!SubscriptionService::canCreateAircraft($userId, $orgId)) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Upgrade required',
        'message' => 'You have reached your aircraft limit. Upgrade to Pro for unlimited aircraft.',
        'current_plan' => 'free',
        'upgrade_url' => '/pricing'
    ]);
    return;
}
```

**C. Super Admin: Plan Management UI**
```php
// Super Admin endpoints
GET    /api/admin/plans
POST   /api/admin/plans
PUT    /api/admin/plans/{id}
PATCH  /api/admin/plans/{id}/pricing
```

**Frontend: Subscription Management**
```typescript
// User can see current plan
GET /api/users/me/subscription

// User can upgrade
POST /api/subscriptions/checkout
// Creates Mollie/Stripe payment

// Webhooks
POST /api/webhooks/mollie
POST /api/webhooks/stripe
```

---

### 5. ⚠️ LAYERED PERMISSIONS NOT COMPLETE

**Current Status:**
- ✅ is_super_admin flag exists
- ✅ Organization roles exist (admin, instructor, member)
- ❌ NO permission matrix
- ❌ NO gelaagde settings access

**Solution: Gelaagde Permissies**

```
┌─────────────────────────────────────────────┐
│ SUPER ADMIN                                 │
│ - Can change system settings                │
│ - Can edit translation keys                 │
│ - Can manage all organizations              │
│ - Can change subscription plans             │
│ - Can view all activity logs                │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ ORGANIZATION ADMIN                          │
│ - Can change org settings                   │
│ - Can invite/remove members                 │
│ - Can assign roles (instructor/member)      │
│ - Can manage aircraft                       │
│ - Can view org activity logs                │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ INSTRUCTOR                                  │
│ - Can manage students                       │
│ - Can create/edit checklists                │
│ - Can view student progress                 │
│ - Cannot invite members                     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ MEMBER                                      │
│ - Can use checklists                        │
│ - Can view aircraft                         │
│ - Can log flights                           │
│ - Cannot edit organization                  │
└─────────────────────────────────────────────┘
```

**Implementation:**
```php
class PermissionService
{
    const PERMISSIONS = [
        'system.settings.edit' => ['super_admin'],
        'organization.settings.edit' => ['super_admin', 'org_admin'],
        'organization.members.invite' => ['super_admin', 'org_admin'],
        'organization.aircraft.create' => ['super_admin', 'org_admin', 'instructor'],
        'checklist.create' => ['super_admin', 'org_admin', 'instructor'],
        'checklist.edit_own' => ['super_admin', 'org_admin', 'instructor', 'member'],
    ];

    public static function can(string $userId, string $permission, ?string $orgId = null): bool
    {
        // Check super admin
        if (self::isSuperAdmin($userId)) {
            return true;
        }

        // Check org role
        if ($orgId) {
            $role = self::getOrgRole($userId, $orgId);
            $allowedRoles = self::PERMISSIONS[$permission] ?? [];
            return in_array($role, $allowedRoles);
        }

        return false;
    }
}

// Usage:
if (!PermissionService::can($userId, 'organization.members.invite', $orgId)) {
    http_response_code(403);
    echo json_encode(['error' => 'Insufficient permissions']);
    return;
}
```

---

## MISSING FEATURES FOR ROBUST SYSTEM

### 6. ❌ NO OFFLINE SUPPORT (PWA)

**Required for Aviation App:**
- Service Worker voor offline caching
- IndexedDB voor offline data
- Sync queue (al in schema, maar niet geïmplementeerd)
- Conflict resolution

**Implementation:**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.aerocheck\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

### 7. ❌ NO ERROR HANDLING & MONITORING

**Missing:**
- Global error boundary
- Error logging (Sentry)
- Performance monitoring
- Health checks

**Implementation:**
```typescript
// ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

### 8. ❌ NO TESTING

**Missing:**
- Unit tests (backend: PHPUnit, frontend: Vitest)
- Integration tests
- E2E tests (Playwright)

**Example:**
```typescript
// aircraft.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Aircraft List', () => {
  it('should display aircraft list', async () => {
    render(<AircraftList />);
    expect(await screen.findByText('Cessna 172')).toBeInTheDocument();
  });
});
```

---

## SUGGESTED NEW FEATURES

### 9. 🆕 FLIGHT LOGGING & CURRENCY TRACKING

**Why Important:**
- Pilots moeten currency bijhouden (90-day rule, night currency, IFR)
- Automatische uren tracking
- Digital logbook

**Schema:**
```sql
CREATE TABLE flight_logs (
  id CHAR(36) PRIMARY KEY,
  pilot_id CHAR(36) NOT NULL,
  aircraft_id CHAR(36) NOT NULL,

  date DATE NOT NULL,
  departure_airport VARCHAR(10) NOT NULL,
  arrival_airport VARCHAR(10) NOT NULL,

  -- Times (in minutes)
  total_time INT NOT NULL,
  pic_time INT,
  dual_time INT,
  night_time INT,
  ifr_time INT,

  -- Landings
  day_landings INT DEFAULT 0,
  night_landings INT DEFAULT 0,

  -- Currency calculations (auto-calculated)
  is_current_90day BOOLEAN,
  night_currency_expires DATE,

  notes TEXT,

  FOREIGN KEY (pilot_id) REFERENCES users(id),
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
  INDEX idx_pilot_date (pilot_id, date)
);
```

**Features:**
- Auto-calculate currency
- Expiry warnings
- Export to CSV/PDF
- Charts & statistics

---

### 10. 🆕 WEATHER INTEGRATION

**API Integration:**
- METAR/TAF from aviationweather.gov
- Weather-dependent checklist items

```typescript
// Weather service
const getMetar = async (icao: string) => {
  const response = await fetch(
    `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`
  );
  return response.json();
};

// Checklist item with weather condition
{
  text: "Check fuel quantity",
  expectedValue: "Sufficient for flight + reserves",
  weatherDependent: true,
  weatherCondition: "wind > 15kt", // Show warning
}
```

---

### 11. 🆕 DOCUMENT MANAGEMENT

**Track expiring documents:**
- Aircraft: Registration, insurance, airworthiness certificate
- Pilot: License, medical, ratings
- Automatic expiry notifications

```sql
CREATE TABLE documents (
  id CHAR(36) PRIMARY KEY,
  entity_type ENUM('aircraft', 'user', 'organization'),
  entity_id CHAR(36) NOT NULL,

  document_type VARCHAR(100) NOT NULL,
  document_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,

  file_path VARCHAR(500),

  INDEX idx_expiry (expiry_date),
  INDEX idx_entity (entity_type, entity_id)
);
```

---

### 12. 🆕 MAINTENANCE TRACKING

**Features:**
- AD/SB compliance
- Maintenance schedules (100hr, annual, etc.)
- Squawk list
- Grounding alerts

```sql
CREATE TABLE maintenance_events (
  id CHAR(36) PRIMARY KEY,
  aircraft_id CHAR(36) NOT NULL,
  event_type ENUM('inspection', 'repair', 'ad', 'sb', 'modification'),

  description TEXT NOT NULL,
  hobbs_at_event INT,
  tach_at_event INT,

  next_due_hobbs INT,
  next_due_tach INT,
  next_due_date DATE,

  is_grounding BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id)
);
```

---

### 13. 🆕 ANALYTICS & INSIGHTS

**For Super Admin:**
- Platform statistics
- Revenue tracking
- User engagement
- Most popular checklists

**For Org Admin:**
- Member activity
- Flight hours per aircraft
- Checklist completion rates
- Safety trends

**Dashboard:**
```typescript
// Analytics endpoint
GET /api/admin/analytics/overview
{
  totalUsers: 1250,
  activeSubscriptions: 320,
  monthlyRevenue: 3593,
  topOrganizations: [...],
  recentActivity: [...]
}
```

---

### 14. 🆕 VOICE COMMANDS (Schema exists, not implemented)

**Features:**
- Hands-free checklist operation
- Voice recognition
- Text-to-speech feedback

**Implementation:**
```typescript
// Web Speech API
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;

recognition.onresult = (event) => {
  const command = event.results[0][0].transcript.toLowerCase();

  if (command.includes('next')) {
    moveToNextItem();
  } else if (command.includes('check')) {
    markCurrentItemComplete();
  }
};
```

---

### 15. 🆕 AI/ML FEATURES

**Smart Suggestions:**
- Recommend checklists based on aircraft type, weather, flight type
- Anomaly detection: "You've skipped this item 5 times"
- Predictive maintenance: "Based on usage patterns, oil change due in 3 flights"

**Implementation:**
```python
# Backend ML service (Python microservice)
from sklearn.ensemble import RandomForestClassifier

def suggest_checklist(aircraft_type, weather, time_of_day):
    # Train model on historical data
    # Return checklist recommendations
    pass
```

---

## ARCHITECTURE.MD UPDATE REQUIRED

**Currently MISSING from ARCHITECTURE.md:**
- ❌ Email verification flow
- ❌ System settings table
- ❌ Translations table
- ❌ Monetization tables (subscription_plans, etc.)
- ❌ TanStack Query architecture
- ❌ i18n system
- ❌ Feature gating
- ❌ Layered permissions matrix
- ❌ PWA/offline support
- ❌ Voice commands
- ❌ Flight logging
- ❌ Weather integration
- ❌ Document management
- ❌ Maintenance tracking
- ❌ Analytics

**Must add all these to ARCHITECTURE.md!**

---

## PRIORITY IMPLEMENTATION ORDER

### PHASE 1: CRITICAL FIXES (Week 2-3)
1. ✅ TanStack Query implementation (AJAX/SPA)
2. ✅ i18n system (react-i18next + translations table)
3. ✅ SettingsService implementation (dynamic settings)
4. ✅ SubscriptionService + Feature Gating
5. ✅ Update ARCHITECTURE.md

### PHASE 2: ROBUSTNESS (Week 4-5)
6. ✅ Error boundaries + Sentry
7. ✅ PWA + Service Worker
8. ✅ Layered permissions system
9. ✅ Testing setup (Vitest, PHPUnit)

### PHASE 3: NEW FEATURES (Week 6-8)
10. ✅ Flight logging
11. ✅ Weather integration
12. ✅ Document management
13. ✅ Maintenance tracking

### PHASE 4: ADVANCED (Week 9-12)
14. ✅ Voice commands
15. ✅ Analytics dashboard
16. ✅ AI suggestions
17. ✅ Mobile app (React Native)

---

## SUMMARY

**Critical Issues Found:**
1. ❌ NO proper AJAX/SPA (missing TanStack Query)
2. ❌ NO internationalization (i18n)
3. ⚠️ System settings not implemented (only documented)
4. ⚠️ Monetization not fully dynamic (missing admin UI + feature gating)
5. ⚠️ Layered permissions incomplete
6. ❌ ARCHITECTURE.md not updated with new features

**Recommended Additions:**
- Flight logging & currency tracking
- Weather integration (METAR/TAF)
- Document management
- Maintenance tracking
- Analytics dashboard
- Voice commands
- AI/ML suggestions

**Next Steps:**
1. Implement TanStack Query (critical for SPA)
2. Implement i18n system
3. Implement SettingsService
4. Update ARCHITECTURE.md
5. Begin Phase 2 (robustness)
