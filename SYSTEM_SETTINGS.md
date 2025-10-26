# AEROCHECK - SYSTEM SETTINGS & CONFIGURATION

Configureerbare settings in database (niet hardcoded).

---

## WAAROM DATABASE SETTINGS?

**Problemen met hardcoded values:**
- ❌ Code change nodig voor URL wijziging
- ❌ Geen multi-environment support
- ❌ Super admin kan niets aanpassen
- ❌ Redeployment nodig voor kleine changes

**Voordelen database settings:**
- ✅ Super admin kan alles aanpassen via UI
- ✅ Per-environment settings (dev/staging/prod)
- ✅ Geen code changes nodig
- ✅ Audit trail (wie wijzigde wat)
- ✅ Rollback mogelijk

---

## DATABASE SCHEMA

```sql
-- System-wide settings
CREATE TABLE system_settings (
  id CHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type ENUM('string', 'integer', 'boolean', 'json', 'url') DEFAULT 'string',
  category VARCHAR(50) NOT NULL, -- 'email', 'urls', 'features', 'limits', etc.
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Can frontend read this?
  is_editable BOOLEAN DEFAULT TRUE, -- Can super admin edit?

  -- Audit
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36), -- super admin who changed it

  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_public (is_public)
) ENGINE=InnoDB;

-- Setting change history (audit trail)
CREATE TABLE system_settings_history (
  id CHAR(36) PRIMARY KEY,
  setting_id CHAR(36) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by CHAR(36),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (setting_id) REFERENCES system_settings(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_setting_history (setting_id, changed_at DESC)
) ENGINE=InnoDB;
```

---

## DEFAULT SETTINGS (SEED DATA)

```sql
-- URLs (used in emails and frontend)
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
(UUID(), 'app.url', 'https://aerocheck.com', 'url', 'urls', 'Base URL for frontend application', TRUE),
(UUID(), 'api.url', 'https://aerocheck.com/api', 'url', 'urls', 'Base URL for API', TRUE),
(UUID(), 'app.name', 'Aerocheck', 'string', 'branding', 'Application name', TRUE),
(UUID(), 'app.tagline', 'Aviation Checklist Management', 'string', 'branding', 'Application tagline', TRUE),
(UUID(), 'app.support_email', 'support@aerocheck.com', 'string', 'contact', 'Support email address', TRUE);

-- Email templates URLs
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
(UUID(), 'email.verify_url_template', '{{app_url}}/verify-email?token={{token}}', 'string', 'email_templates', 'Email verification URL template', FALSE),
(UUID(), 'email.invite_url_template', '{{app_url}}/invites/accept/{{token}}', 'string', 'email_templates', 'Organization invite URL template', FALSE),
(UUID(), 'email.password_reset_url_template', '{{app_url}}/reset-password?token={{token}}', 'string', 'email_templates', 'Password reset URL template', FALSE);

-- Email configuration
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
(UUID(), 'email.from_address', 'noreply@aerocheck.com', 'string', 'email', 'Email from address', FALSE),
(UUID(), 'email.from_name', 'Aerocheck', 'string', 'email', 'Email from name', FALSE),
(UUID(), 'email.verification_expiry_hours', '24', 'integer', 'email', 'Email verification token expiry (hours)', FALSE),
(UUID(), 'email.invite_expiry_days', '7', 'integer', 'email', 'Organization invite expiry (days)', FALSE);

-- Feature flags
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
(UUID(), 'features.email_verification_required', 'false', 'boolean', 'features', 'Require email verification before login', TRUE),
(UUID(), 'features.registrations_enabled', 'true', 'boolean', 'features', 'Allow new user registrations', TRUE),
(UUID(), 'features.marketplace_enabled', 'false', 'boolean', 'features', 'Enable checklist marketplace', TRUE),
(UUID(), 'features.subscriptions_enabled', 'false', 'boolean', 'features', 'Enable paid subscriptions', TRUE),
(UUID(), 'features.public_organizations', 'true', 'boolean', 'features', 'Allow public organization join links', TRUE);

-- Limits (free tier)
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
(UUID(), 'limits.free_max_aircraft', '5', 'integer', 'limits', 'Max aircraft for free users', TRUE),
(UUID(), 'limits.free_max_storage_mb', '10', 'integer', 'limits', 'Max storage (MB) for free users', TRUE),
(UUID(), 'limits.rate_limit_per_minute', '100', 'integer', 'limits', 'API rate limit for free users', FALSE);

-- Social/Legal URLs
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
(UUID(), 'legal.terms_url', 'https://aerocheck.com/terms', 'url', 'legal', 'Terms of Service URL', TRUE),
(UUID(), 'legal.privacy_url', 'https://aerocheck.com/privacy', 'url', 'legal', 'Privacy Policy URL', TRUE),
(UUID(), 'social.twitter_url', 'https://twitter.com/aerocheck', 'url', 'social', 'Twitter profile URL', TRUE),
(UUID(), 'social.github_url', 'https://github.com/aerocheck', 'url', 'social', 'GitHub URL', TRUE);

-- Maintenance mode
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
(UUID(), 'maintenance.enabled', 'false', 'boolean', 'maintenance', 'Enable maintenance mode', TRUE),
(UUID(), 'maintenance.message', 'We are performing scheduled maintenance. Please check back soon.', 'string', 'maintenance', 'Maintenance mode message', TRUE);
```

---

## SETTINGS SERVICE (PHP)

```php
class SettingsService
{
    private static ?array $cache = null;

    /**
     * Get setting value
     */
    public static function get(string $key, $default = null)
    {
        self::loadCache();

        if (!isset(self::$cache[$key])) {
            return $default;
        }

        $setting = self::$cache[$key];

        // Type conversion
        return self::castValue($setting['value'], $setting['type']);
    }

    /**
     * Get multiple settings by category
     */
    public static function getByCategory(string $category): array
    {
        self::loadCache();

        $result = [];
        foreach (self::$cache as $key => $setting) {
            if ($setting['category'] === $category) {
                $result[$key] = self::castValue($setting['value'], $setting['type']);
            }
        }

        return $result;
    }

    /**
     * Get public settings (accessible to frontend)
     */
    public static function getPublicSettings(): array
    {
        self::loadCache();

        $result = [];
        foreach (self::$cache as $key => $setting) {
            if ($setting['is_public']) {
                $result[$key] = self::castValue($setting['value'], $setting['type']);
            }
        }

        return $result;
    }

    /**
     * Set setting value (super admin only)
     */
    public static function set(string $key, $value, string $userId): bool
    {
        $pdo = Connection::getInstance();

        // Get current setting
        $stmt = $pdo->prepare("SELECT id, setting_value, setting_type FROM system_settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $current = $stmt->fetch();

        if (!$current) {
            return false; // Setting doesn't exist
        }

        // Convert value to string
        $newValue = self::valueToString($value, $current['setting_type']);

        // Update setting
        $stmt = $pdo->prepare("
            UPDATE system_settings
            SET setting_value = ?, updated_at = NOW(), updated_by = ?
            WHERE setting_key = ?
        ");
        $stmt->execute([$newValue, $userId, $key]);

        // Insert history
        $stmt = $pdo->prepare("
            INSERT INTO system_settings_history (id, setting_id, old_value, new_value, changed_by)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            self::generateUuid(),
            $current['id'],
            $current['setting_value'],
            $newValue,
            $userId
        ]);

        // Clear cache
        self::$cache = null;

        return true;
    }

    /**
     * Build URL from template (for emails)
     */
    public static function buildUrl(string $templateKey, array $variables): string
    {
        $template = self::get($templateKey);

        if (!$template) {
            throw new Exception("URL template not found: $templateKey");
        }

        // Get app URL
        $appUrl = self::get('app.url');

        // Replace variables
        $replacements = array_merge(['app_url' => $appUrl], $variables);

        $url = $template;
        foreach ($replacements as $key => $value) {
            $url = str_replace('{{' . $key . '}}', $value, $url);
        }

        return $url;
    }

    // Private helpers

    private static function loadCache(): void
    {
        if (self::$cache !== null) {
            return;
        }

        $pdo = Connection::getInstance();
        $stmt = $pdo->query("SELECT setting_key, setting_value, setting_type, category, is_public FROM system_settings");

        self::$cache = [];
        while ($row = $stmt->fetch()) {
            self::$cache[$row['setting_key']] = [
                'value' => $row['setting_value'],
                'type' => $row['setting_type'],
                'category' => $row['category'],
                'is_public' => (bool)$row['is_public']
            ];
        }
    }

    private static function castValue($value, string $type)
    {
        switch ($type) {
            case 'integer':
                return (int)$value;
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }

    private static function valueToString($value, string $type): string
    {
        switch ($type) {
            case 'boolean':
                return $value ? 'true' : 'false';
            case 'json':
                return json_encode($value);
            default:
                return (string)$value;
        }
    }

    private static function generateUuid(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
```

---

## USAGE EXAMPLES

### Email Verification URL

**Old (hardcoded):**
```php
$verifyUrl = "https://aerocheck.com/verify-email?token=" . $token;
```

**New (configurable):**
```php
$verifyUrl = SettingsService::buildUrl('email.verify_url_template', [
    'token' => $token
]);
// Result: https://aerocheck.com/verify-email?token=abc123
```

### Organization Invite URL

```php
$inviteUrl = SettingsService::buildUrl('email.invite_url_template', [
    'token' => $inviteToken
]);
// Result: https://aerocheck.com/invites/accept/abc123
```

### Feature Flags

```php
// Check if registrations are enabled
if (!SettingsService::get('features.registrations_enabled', true)) {
    http_response_code(403);
    echo json_encode(['error' => 'Registrations are currently disabled']);
    return;
}

// Check if email verification is required
$emailVerificationRequired = SettingsService::get('features.email_verification_required', false);

if ($emailVerificationRequired && !$user['email_verified']) {
    http_response_code(403);
    echo json_encode(['error' => 'Please verify your email first']);
    return;
}
```

### Limits

```php
$maxAircraft = SettingsService::get('limits.free_max_aircraft', 5);

if ($currentAircraftCount >= $maxAircraft) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Limit reached',
        'message' => "Free users can have max $maxAircraft aircraft"
    ]);
    return;
}
```

---

## API ENDPOINTS

```php
// Public settings (no auth needed)
GET    /api/settings/public
       Response: {
         data: {
           "app.url": "https://aerocheck.com",
           "app.name": "Aerocheck",
           "features.registrations_enabled": true,
           "limits.free_max_aircraft": 5,
           ...
         }
       }

// All settings (super admin only)
GET    /api/admin/settings
       Headers: Authorization: Bearer {token}
       Response: {
         data: {
           "app.url": {...},
           "email.from_address": {...},
           ...
         }
       }

// Update setting (super admin only)
PATCH  /api/admin/settings/:key
       Headers: Authorization: Bearer {token}
       Body: { value: "new value" }
       Response: {
         data: {
           key: "app.url",
           value: "https://new-domain.com",
           updated_at: "2025-10-26 12:00:00"
         }
       }

// Get setting history (super admin only)
GET    /api/admin/settings/:key/history
       Headers: Authorization: Bearer {token}
       Response: {
         data: [
           {
             old_value: "https://old-domain.com",
             new_value: "https://new-domain.com",
             changed_by: { id: "...", name: "Admin User" },
             changed_at: "2025-10-26 12:00:00"
           },
           ...
         ]
       }
```

---

## FRONTEND INTEGRATION

### Loading Public Settings

```typescript
// frontend/src/lib/settings.ts
interface PublicSettings {
  'app.url': string;
  'app.name': string;
  'app.tagline': string;
  'features.registrations_enabled': boolean;
  'limits.free_max_aircraft': number;
  // ...
}

let settingsCache: PublicSettings | null = null;

export async function getPublicSettings(): Promise<PublicSettings> {
  if (settingsCache) {
    return settingsCache;
  }

  const response = await fetch('/api/settings/public');
  const { data } = await response.json();
  settingsCache = data;

  return data;
}

export function getSetting<K extends keyof PublicSettings>(
  key: K
): PublicSettings[K] | undefined {
  return settingsCache?.[key];
}
```

### Using in Components

```tsx
import { useQuery } from '@tanstack/react-query';
import { getPublicSettings } from '@/lib/settings';

function RegistrationPage() {
  const { data: settings } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: getPublicSettings,
    staleTime: Infinity, // Settings don't change often
  });

  if (!settings?.['features.registrations_enabled']) {
    return (
      <div>
        <h1>Registrations Closed</h1>
        <p>We're not accepting new registrations at this time.</p>
      </div>
    );
  }

  return <RegistrationForm />;
}
```

---

## SUPER ADMIN SETTINGS UI

```tsx
// frontend/src/pages/admin/Settings.tsx
function AdminSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get('/admin/settings'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      api.patch(`/admin/settings/${key}`, { value }),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">System Settings</h1>

      {/* URLs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">URLs</h2>
        <div className="space-y-4">
          <SettingInput
            label="App URL"
            settingKey="app.url"
            value={settings['app.url'].value}
            onSave={(value) => updateMutation.mutate({ key: 'app.url', value })}
          />
          <SettingInput
            label="API URL"
            settingKey="api.url"
            value={settings['api.url'].value}
            onSave={(value) => updateMutation.mutate({ key: 'api.url', value })}
          />
        </div>
      </section>

      {/* Feature Flags */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="space-y-4">
          <SettingToggle
            label="Enable Registrations"
            settingKey="features.registrations_enabled"
            value={settings['features.registrations_enabled'].value}
            onToggle={(value) =>
              updateMutation.mutate({
                key: 'features.registrations_enabled',
                value,
              })
            }
          />
          <SettingToggle
            label="Enable Marketplace"
            settingKey="features.marketplace_enabled"
            value={settings['features.marketplace_enabled'].value}
            onToggle={(value) =>
              updateMutation.mutate({
                key: 'features.marketplace_enabled',
                value,
              })
            }
          />
        </div>
      </section>

      {/* Limits */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Limits (Free Tier)</h2>
        <div className="space-y-4">
          <SettingInput
            label="Max Aircraft"
            type="number"
            settingKey="limits.free_max_aircraft"
            value={settings['limits.free_max_aircraft'].value}
            onSave={(value) =>
              updateMutation.mutate({ key: 'limits.free_max_aircraft', value })
            }
          />
        </div>
      </section>
    </div>
  );
}
```

---

## BENEFITS

**Flexibiliteit:**
- ✅ URLs wijzigen zonder code deploy
- ✅ Features aan/uit zetten (kill switch)
- ✅ Limits aanpassen zonder code
- ✅ Multi-environment (dev/staging/prod)

**Security:**
- ✅ Sensitive settings (SMTP) niet public
- ✅ Alleen super admin kan wijzigen
- ✅ Audit trail (wie wijzigde wat)
- ✅ History/rollback mogelijk

**Operations:**
- ✅ Maintenance mode activeren
- ✅ Registrations disablen bij problemen
- ✅ Feature flags voor geleidelijke rollout
- ✅ A/B testing mogelijk

**Development:**
- ✅ Geen hardcoded values
- ✅ Makkelijk testen (override settings)
- ✅ Per-environment configuratie
- ✅ Clean code

---

## MIGRATION PATH

**Week 2-5:**
- [ ] Create system_settings table
- [ ] Seed default settings
- [ ] Implement SettingsService
- [ ] Use in email verification

**Week 6-8:**
- [ ] Add public settings endpoint
- [ ] Frontend integration
- [ ] Use for feature flags

**Week 9-12:**
- [ ] Super admin settings UI
- [ ] Settings history viewer
- [ ] Full migration from hardcoded values

---

## SUMMARY

**All configurable via database:**
- URLs (app, API, email templates)
- Email configuration (from, expiry)
- Feature flags (registrations, marketplace)
- Limits (max aircraft, storage)
- Branding (name, tagline)
- Legal (terms, privacy)
- Maintenance mode

**Super admin can:**
- Change any setting via UI
- View change history
- Rollback if needed
- No code deploy required

**Developers can:**
- Add new settings easily
- Override for testing
- Multi-environment support
- Clean codebase

**Klaar om dit te implementeren?**
