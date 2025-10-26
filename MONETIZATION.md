# AEROCHECK - MONETIZATION STRATEGY

Complete pricing strategy, subscription management, en feature limits.

---

## EXECUTIVE SUMMARY

**Freemium Model met 3 Revenue Streams:**

1. **Free Tier** - Individuele piloten (gratis, altijd)
2. **Checklist Marketplace** - Eenmalige aankoop premium checklists
3. **Club Subscriptions** - Maandelijks/jaarlijks voor vliegclubs

**Doel:** Maximale adoptie door lage drempel, schaal via organizations.

---

## PRICING TIERS

### TIER 1: FREE (Individual Pilot)

**Target:** Hobbypiloten, studenten, freelance instructeurs

**Prijs:** €0 (altijd gratis)

**Features:**
- ✅ Onbeperkt persoonlijke aircraft
- ✅ Onbeperkt persoonlijke checklists aanmaken
- ✅ Checklist execution & progress tracking
- ✅ CSV import/export
- ✅ Offline support (PWA)
- ✅ Dark mode
- ✅ Basic analytics (eigen gebruik)
- ❌ Geen organization features
- ❌ Geen premium checklists (wel marketplace toegang)
- ❌ Geen checklist templates delen
- ❌ Max 5 aircraft

**Limits:**
```
max_aircraft: 5
max_checklists: unlimited (own created)
max_organizations: 0 (cannot create, can join 1 free org)
premium_checklists: cannot buy/use
storage_mb: 10MB (voor avatars/exports)
api_rate_limit: 100 requests/min
```

**Conversion Strategy:**
- Pilot groeit → Wordt lid van club → Club upgrade naar betaald
- Pilot wil premium checklists → Marketplace purchases

---

### TIER 2: PRO (Individual Pilot)

**Target:** Professionele piloten, charter operators

**Prijs:** €4.99/maand of €49/jaar (2 maanden gratis)

**Features:**
- ✅ Alles van Free
- ✅ Premium checklist marketplace toegang
- ✅ Unlimited aircraft
- ✅ Kan 1 kleine organization aanmaken (max 5 leden)
- ✅ Priority support
- ✅ Advanced analytics
- ✅ Custom branding (logo, kleuren)
- ✅ Export naar PDF
- ✅ Voice commands (future)

**Limits:**
```
max_aircraft: unlimited
max_checklists: unlimited
max_organizations: 1
max_org_members: 5
premium_checklists: unlimited purchases
storage_mb: 100MB
api_rate_limit: 500 requests/min
```

**Conversion:**
- Pilot met veel aircraft
- Wil premium checklists
- Kleine groep (bijv. partnership met 3 mensen)

---

### TIER 3: CLUB STARTER (Flying Club)

**Target:** Kleine vliegclubs, flying schools (5-20 leden)

**Prijs:** €19/maand of €199/jaar (2 maanden gratis)

**Features:**
- ✅ Organization met max 20 leden
- ✅ Unlimited club aircraft
- ✅ Checklist distribution (publish naar leden)
- ✅ Member management (roles: owner/admin/instructor/member)
- ✅ Aircraft qualifications
- ✅ Basic analytics (usage stats)
- ✅ Priority support
- ❌ Geen custom branding
- ❌ Geen API access

**Limits:**
```
max_members: 20
max_aircraft: unlimited
max_checklists: unlimited
checklist_distribution: yes
premium_checklists: included (5 per month)
storage_mb: 500MB
api_rate_limit: 1000 requests/min
sub_organizations: 0
```

**Value Proposition:**
- €19 / 20 leden = €0.95 per lid per maand
- Veel goedkoper dan individuele Pro accounts (€4.99)

---

### TIER 4: CLUB PRO (Flying Club)

**Target:** Middelgrote clubs (20-100 leden)

**Prijs:** €49/maand of €499/jaar (2 maanden gratis)

**Features:**
- ✅ Organization met max 100 leden
- ✅ Alles van Club Starter
- ✅ Custom branding (logo, kleuren, subdomain)
- ✅ Advanced analytics & compliance reports
- ✅ Audit logs (wie heeft wat gedaan)
- ✅ Export alles naar PDF
- ✅ Email support (24h response)
- ✅ Premium checklists included (unlimited)
- ✅ API access (voor integraties)

**Limits:**
```
max_members: 100
max_aircraft: unlimited
max_checklists: unlimited
checklist_distribution: yes
premium_checklists: unlimited included
storage_mb: 2GB
api_rate_limit: 5000 requests/min
sub_organizations: 0
custom_domain: yes (subdomain)
```

**Value Proposition:**
- €49 / 100 leden = €0.49 per lid per maand
- Custom branding voor professionele uitstraling
- Compliance reports voor audits

---

### TIER 5: CLUB ENTERPRISE (Large Organizations)

**Target:** Grote schools, airline training centers (100+ leden)

**Prijs:** €149/maand of €1499/jaar (custom pricing vanaf 500+ leden)

**Features:**
- ✅ Unlimited leden
- ✅ Alles van Club Pro
- ✅ Dedicated support (email + phone)
- ✅ SLA garantie (99.9% uptime)
- ✅ Custom integrations
- ✅ White-label option
- ✅ On-premise deployment (optioneel)
- ✅ Multi-organization hierarchy (sub-clubs)
- ✅ Advanced RBAC (custom rollen)
- ✅ SSO integration (SAML)

**Limits:**
```
max_members: unlimited
max_aircraft: unlimited
max_checklists: unlimited
checklist_distribution: yes
premium_checklists: unlimited included
storage_mb: unlimited
api_rate_limit: unlimited
sub_organizations: unlimited
custom_domain: yes (full domain)
white_label: yes
sso: yes
dedicated_support: yes
```

**Value Proposition:**
- Enterprise features
- Dedicated support
- Custom solutions

---

## CHECKLIST MARKETPLACE

**Concept:** Professionals/vendors kunnen high-quality checklists verkopen

### Marketplace Model

**Free Checklists:**
- Community contributed
- Basic templates
- Open source

**Premium Checklists:**
- Created by professionals (instructeurs, examiners)
- Aircraft-specific (type-certified)
- Compliance certified
- Prijs: €2.99 - €19.99 per checklist set

**Revenue Split:**
- 70% naar creator
- 30% naar platform

**Examples:**
```
Basic Cessna 172 Checklist          - Gratis (community)
EASA Approved Cessna 172 Set        - €9.99 (professional)
Diamond DA40 Complete Package        - €14.99 (manufacturer approved)
Emergency Procedures Bundle          - €4.99
PPL Training Checklist Set           - €19.99
```

**Premium Features:**
- ✅ Professionally verified
- ✅ Compliance certified
- ✅ Regular updates
- ✅ Support van creator
- ✅ Print-ready PDFs included

**Pro/Club accounts:** Included credits
- Club Starter: 5 premium checklists/maand
- Club Pro: Unlimited
- Individual Pro: Unlimited

---

## PRICING COMPARISON TABLE

| Feature | Free | Pro | Club Starter | Club Pro | Enterprise |
|---------|------|-----|--------------|----------|------------|
| **Price** | €0 | €4.99/mo | €19/mo | €49/mo | €149/mo |
| **Members** | 1 | 1 | 20 | 100 | Unlimited |
| **Aircraft** | 5 | ∞ | ∞ | ∞ | ∞ |
| **Checklists** | ∞ | ∞ | ∞ | ∞ | ∞ |
| **Organizations** | Join only | 1 (5 members) | 1 | 1 | Unlimited |
| **Distribution** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Premium Checklists** | Buy only | ∞ | 5/mo | ∞ | ∞ |
| **Analytics** | Basic | Advanced | Basic | Advanced | Custom |
| **Branding** | ❌ | Basic | ❌ | ✅ | White-label |
| **Support** | Community | Email | Email | Priority | Dedicated |
| **API Access** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Storage** | 10MB | 100MB | 500MB | 2GB | ∞ |

---

## SUBSCRIPTION MANAGEMENT

### Database Schema

```sql
-- Subscription Plans (system defined)
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'free', 'pro', 'club-starter', 'club-pro', 'enterprise'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly_cents INT NOT NULL, -- in cents (€19 = 1900)
  price_yearly_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Feature limits (JSON for flexibility)
  limits JSON NOT NULL,
  -- Example: {
  --   "max_members": 20,
  --   "max_aircraft": -1, (unlimited)
  --   "max_organizations": 1,
  --   "premium_checklists_per_month": 5,
  --   "storage_mb": 500,
  --   "api_rate_limit": 1000,
  --   "features": ["distribution", "analytics", "support"]
  -- }

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- User Subscriptions
CREATE TABLE user_subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,

  -- Billing
  billing_cycle ENUM('monthly', 'yearly') NOT NULL,
  status ENUM('active', 'canceled', 'expired', 'past_due') DEFAULT 'active',

  -- Dates
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  canceled_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,

  -- Payment
  payment_provider VARCHAR(50), -- 'stripe', 'mollie', 'manual'
  payment_provider_subscription_id VARCHAR(255), -- Stripe subscription ID
  payment_provider_customer_id VARCHAR(255), -- Stripe customer ID

  -- Trial
  trial_ends_at TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),

  INDEX idx_user (user_id, status),
  INDEX idx_status (status, current_period_end)
) ENGINE=InnoDB;

-- Organization Subscriptions
CREATE TABLE organization_subscriptions (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,

  billing_cycle ENUM('monthly', 'yearly') NOT NULL,
  status ENUM('active', 'canceled', 'expired', 'past_due') DEFAULT 'active',

  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  canceled_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,

  payment_provider VARCHAR(50),
  payment_provider_subscription_id VARCHAR(255),
  payment_provider_customer_id VARCHAR(255),

  trial_ends_at TIMESTAMP NULL,

  -- Billing contact
  billing_email VARCHAR(255),
  billing_name VARCHAR(255),

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),

  INDEX idx_org (organization_id, status),
  INDEX idx_status (status, current_period_end)
) ENGINE=InnoDB;

-- Marketplace Purchases
CREATE TABLE checklist_purchases (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  checklist_template_id CHAR(36) NOT NULL, -- premium checklist

  price_paid_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  payment_provider VARCHAR(50),
  payment_provider_transaction_id VARCHAR(255),

  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_purchases (user_id, purchased_at DESC)
) ENGINE=InnoDB;

-- Payment Transactions (for audit)
CREATE TABLE payment_transactions (
  id CHAR(36) PRIMARY KEY,

  entity_type ENUM('user', 'organization') NOT NULL,
  entity_id CHAR(36) NOT NULL,

  type ENUM('subscription', 'marketplace_purchase', 'refund') NOT NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  payment_provider VARCHAR(50),
  payment_provider_transaction_id VARCHAR(255),

  status ENUM('pending', 'succeeded', 'failed', 'refunded') DEFAULT 'pending',

  metadata JSON, -- extra info

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity (entity_type, entity_id, created_at DESC),
  INDEX idx_status (status, created_at DESC)
) ENGINE=InnoDB;
```

---

## PAYMENT PROVIDERS

### Option 1: Stripe (Recommended)

**Pros:**
- ✅ Best developer experience
- ✅ Automatic VAT handling (EU)
- ✅ Subscription management built-in
- ✅ Webhooks for events
- ✅ Excellent documentation
- ✅ Supports SEPA, iDEAL, cards

**Cons:**
- ❌ 1.5% + €0.25 per transaction (EU cards)
- ❌ American company (but EU compliant)

**Implementation:**
```bash
composer require stripe/stripe-php
```

```php
// Create subscription
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

$subscription = \Stripe\Subscription::create([
  'customer' => $stripeCustomerId,
  'items' => [['price' => 'price_club_starter_monthly']],
  'trial_period_days' => 14,
]);

// Webhook handler
$event = \Stripe\Webhook::constructEvent($payload, $signature, $webhookSecret);

if ($event->type === 'invoice.payment_succeeded') {
  // Renew subscription
}
```

**Pricing:**
- EU cards: 1.5% + €0.25
- Non-EU cards: 2.9% + €0.25

**Voor €19/maand club:** €0.53 transaction fee = 2.8%

### Option 2: Mollie (European Alternative)

**Pros:**
- ✅ European company (Netherlands)
- ✅ iDEAL, Bancontact, SEPA
- ✅ Lower fees for EU payments
- ✅ GDPR compliant

**Cons:**
- ❌ Less features than Stripe
- ❌ Subscription management less mature

**Pricing:**
- iDEAL: €0.29 per transaction
- Cards: 1.8% + €0.25

**Voor €19/maand club via iDEAL:** €0.29 = 1.5% (goedkoper!)

### Recommendation: **Mollie voor EU, Stripe als backup**

---

## FEATURE GATING

### Backend Implementation

```php
class SubscriptionService
{
    public static function canUserPerformAction(
        string $userId,
        string $feature,
        ?string $organizationId = null
    ): bool {
        if ($organizationId) {
            $limits = self::getOrganizationLimits($organizationId);
        } else {
            $limits = self::getUserLimits($userId);
        }

        return in_array($feature, $limits['features']);
    }

    public static function getUserLimits(string $userId): array
    {
        $pdo = Connection::getInstance();

        // Get active subscription
        $stmt = $pdo->prepare("
            SELECT sp.limits
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = ?
              AND us.status = 'active'
              AND us.current_period_end > NOW()
            ORDER BY us.current_period_end DESC
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();

        if (!$result) {
            // Return free plan limits
            return json_decode(self::getFreePlanLimits(), true);
        }

        return json_decode($result['limits'], true);
    }

    public static function checkLimit(
        string $userId,
        string $limitType,
        int $currentCount
    ): bool {
        $limits = self::getUserLimits($userId);
        $maxAllowed = $limits[$limitType] ?? 0;

        // -1 means unlimited
        if ($maxAllowed === -1) {
            return true;
        }

        return $currentCount < $maxAllowed;
    }
}

// Usage in controller
if (!SubscriptionService::checkLimit($userId, 'max_aircraft', $currentAircraftCount)) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Limit reached',
        'message' => 'Upgrade to Pro to add more aircraft',
        'current_plan' => 'free',
        'upgrade_url' => '/settings/billing/upgrade'
    ]);
    return;
}
```

### Frontend Implementation

```typescript
// Store user subscription
interface Subscription {
  plan: 'free' | 'pro' | 'club-starter' | 'club-pro' | 'enterprise';
  limits: {
    max_aircraft: number; // -1 = unlimited
    max_organizations: number;
    features: string[];
  };
  status: 'active' | 'canceled' | 'expired';
  current_period_end: Date;
}

// Check before showing UI
function CanAddAircraft({ currentCount, subscription }) {
  const max = subscription.limits.max_aircraft;
  const canAdd = max === -1 || currentCount < max;

  if (!canAdd) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <p>You've reached your aircraft limit ({max})</p>
        <Link to="/billing/upgrade">Upgrade to Pro →</Link>
      </div>
    );
  }

  return <AddAircraftButton />;
}
```

---

## MIGRATION STRATEGY

**Phase 1: Launch (Week 1-12)**
- ✅ Everything free
- ✅ Build user base
- ✅ Get feedback
- ✅ No payments yet

**Phase 2: Soft Launch Pricing (Month 3-6)**
- ✅ Announce future pricing
- ✅ Grandfather existing users (free forever or heavy discount)
- ✅ New users see pricing, get 3-month free trial
- ✅ Integrate Mollie/Stripe
- ✅ Test billing with beta customers

**Phase 3: Full Launch (Month 6+)**
- ✅ Enforce limits on new signups
- ✅ Existing free users: grandfathered or upgrade
- ✅ Marketplace launches
- ✅ Full billing operations

---

## REVENUE PROJECTIONS

**Scenario: Conservative Growth**

**Month 12:**
- 1000 free users
- 50 Pro users (€4.99) = €250/mo
- 10 Club Starter (€19) = €190/mo
- 3 Club Pro (€49) = €147/mo
- Marketplace: €200/mo
- **Total: €787/mo = €9,444/year**

**Month 24:**
- 5000 free users
- 200 Pro users = €1,000/mo
- 40 Club Starter = €760/mo
- 15 Club Pro = €735/mo
- 2 Enterprise = €298/mo
- Marketplace: €800/mo
- **Total: €3,593/mo = €43,116/year**

**Costs at Month 24:**
- Hosting: €50/mo
- Email (SendGrid): €15/mo
- Stripe/Mollie fees: ~3% = €108/mo
- Support/tools: €50/mo
- **Total costs: €223/mo**

**Profit: €3,370/mo = €40,440/year**

---

## COMPETITIVE PRICING ANALYSIS

**Competitors:**
- ForeFlight (aviation EFB): $99-299/year
- Garmin Pilot: $149/year
- CloudAhoy: $99/year
- Generic checklist apps: €5-15/mo

**Aerocheck positioning:**
- ✅ Goedkoper dan aviation apps
- ✅ Gratis tier (uniek)
- ✅ Club pricing (schaal voordeel)
- ✅ Marketplace (extra waarde)

---

## NEXT STEPS

**Week 2-5: Build Foundation**
- [ ] Implement free tier (no limits yet)
- [ ] Build all features
- [ ] Get users

**Week 6-8: Prepare Monetization**
- [ ] Create subscription_plans table
- [ ] Implement SubscriptionService
- [ ] Add billing pages (frontend)
- [ ] Integrate Mollie/Stripe (sandbox)

**Week 9-12: Beta Testing**
- [ ] Announce pricing to community
- [ ] Invite beta customers
- [ ] Test payment flows
- [ ] Fix issues

**Month 3: Soft Launch**
- [ ] Enable payments
- [ ] Enforce limits for new users
- [ ] Monitor conversions

**Month 6: Full Launch**
- [ ] Marketplace launch
- [ ] Full billing
- [ ] Growth focus

---

## SUMMARY

**Pricing Strategy:**
- Free forever voor pilots (max adoptie)
- €19/mo voor kleine clubs (betaalbaar)
- €49/mo voor midsize clubs (value)
- €149/mo voor enterprise (premium)

**Revenue Streams:**
- Subscriptions (primary)
- Marketplace (secondary)
- Future: Enterprise custom solutions

**Payment Provider:**
- Mollie (primary, EU, goedkoop)
- Stripe (backup, international)

**Key Success Factors:**
- Lage prijs voor maximale adoptie
- Gratis tier om pilots binnen te halen
- Club subscriptions voor schaal
- Marketplace voor extra value

**Klaar om dit te implementeren in de architectuur?**
