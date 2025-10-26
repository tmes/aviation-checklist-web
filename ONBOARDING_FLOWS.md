# AEROCHECK - ONBOARDING FLOWS

Complete flows voor email verification en member onboarding.

---

## 1. EMAIL VERIFICATION FLOW

### Waarom Email Verification?

**Security redenen:**
- ✅ Voorkomt fake accounts
- ✅ Voorkomt email typos
- ✅ Verifieert dat email echt van gebruiker is
- ✅ Nodig voor password reset emails
- ✅ Nodig voor belangrijke notificaties

### Database Schema Addition

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP NULL;
ALTER TABLE users ADD INDEX idx_email_verified (email_verified);

-- Users kunnen NIET inloggen tot email verified (optioneel, kan ook warnings geven)
```

### Flow: Nieuwe User Registratie

```
1. User vult registratie form in
   - Email, password, naam

2. Backend:
   - Valideer input
   - Check of email al bestaat
   - Hash password
   - Generate verification token (random 32 chars)
   - Set expiry (24 uur)
   - Insert user met email_verified = FALSE
   - Stuur verification email

3. Verification Email Template:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Subject: Verify your Aerocheck account

   Hi {firstName},

   Welcome to Aerocheck! Please verify your email address
   by clicking the link below:

   https://aerocheck.com/verify-email?token={token}

   This link expires in 24 hours.

   If you didn't create an account, you can ignore this email.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. User klikt link → Frontend route /verify-email

5. Frontend:
   - Haalt token uit URL
   - Calls API: POST /api/auth/verify-email
   - Shows success message
   - Redirects naar /login (of auto-login)

6. Backend /api/auth/verify-email:
   - Valideer token
   - Check expiry
   - Update user: email_verified = TRUE
   - Delete token (security)
   - Return success

7. User kan nu inloggen (email geverifieerd)
```

### Login Flow met Email Verification

**Optie A: Harde blokkade (strict)**
```php
// Login endpoint
if (!$user['email_verified']) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Email not verified',
        'message' => 'Please check your email and verify your account before logging in'
    ]);
    return;
}
```

**Optie B: Soft warning (lenient)** ← RECOMMENDED
```php
// Login endpoint - allow login but show warning
$response = [
    'token' => $token,
    'user' => $user,
];

if (!$user['email_verified']) {
    $response['warning'] = 'Email not verified';
    $response['email_verification_required'] = true;
}

echo json_encode($response);

// Frontend toont banner: "Please verify your email"
// Sommige acties geblokkeerd (bijv. organization aanmaken)
```

**Aanbeveling:** Optie B - gebruikers kunnen inloggen maar bepaalde features zijn beperkt tot email verified.

### API Endpoints

```php
POST   /api/auth/register
       Body: { email, password, firstName, lastName }
       Response: {
         message: "Account created. Please check your email to verify.",
         user: { ... },
         emailVerificationSent: true
       }
       Note: Geen token returned, user moet eerst email verifiëren

POST   /api/auth/verify-email
       Body: { token }
       Response: {
         message: "Email verified successfully",
         token: "...", // Auto-login na verificatie
         user: { ... }
       }

POST   /api/auth/resend-verification
       Body: { email }
       Response: {
         message: "Verification email sent"
       }
       Rate limit: Max 3x per uur
```

### Email Sending (Shared Hosting Compatible)

**Optie 1: PHP mail() function** (basic, vaak geblokkeerd door hosts)
```php
mail($to, $subject, $body, $headers);
```

**Optie 2: PHPMailer met SMTP** ← RECOMMENDED
```bash
composer require phpmailer/phpmailer
```

```php
use PHPMailer\PHPMailer\PHPMailer;

class EmailService
{
    public static function sendVerification(string $email, string $token, string $firstName): void
    {
        $mail = new PHPMailer(true);

        // SMTP config (via .env)
        $mail->isSMTP();
        $mail->Host = $_ENV['SMTP_HOST']; // bijv. smtp.gmail.com
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['SMTP_USER'];
        $mail->Password = $_ENV['SMTP_PASS'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Email content
        $mail->setFrom('noreply@aerocheck.com', 'Aerocheck');
        $mail->addAddress($email, $firstName);
        $mail->Subject = 'Verify your Aerocheck account';

        $verifyUrl = $_ENV['APP_URL'] . '/verify-email?token=' . $token;

        $mail->Body = "
            Hi $firstName,

            Welcome to Aerocheck! Please verify your email address by clicking the link below:

            $verifyUrl

            This link expires in 24 hours.

            If you didn't create an account, you can ignore this email.

            Best regards,
            Aerocheck Team
        ";

        $mail->send();
    }
}
```

**SMTP Providers (gratis tiers):**
- SendGrid: 100 emails/dag gratis
- Mailgun: 100 emails/dag gratis
- Amazon SES: 62,000 emails/maand gratis (eerste jaar)
- Gmail SMTP: 500 emails/dag (via eigen Gmail account)

**.env addition:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
APP_URL=https://aerocheck.com
```

---

## 2. MEMBER ONBOARDING FLOW

### Use Cases

**Scenario 1: Vliegclub voegt leden toe**
- Club admin kent alle leden (fysiek aanwezig)
- Admin nodigt leden uit via email
- Leden registreren via invite link

**Scenario 2: Pilot wil zich aansluiten bij club**
- Pilot heeft account
- Pilot zoekt club op
- Pilot vraagt membership aan
- Club admin keurt goed/af

**Scenario 3: Club deelt invite link**
- Club heeft publieke signup link
- Iedereen met link kan zich aanmelden
- Automatisch member worden (of wachten op approval)

### RECOMMENDED: Hybrid Approach

**Drie flows ondersteunen:**
1. **Email Invite** - Club admin nodigt specifiek email uit (PRIMAIR)
2. **Join Request** - User vraagt membership aan (SECUNDAIR)
3. **Public Link** - Publieke invite link delen (OPTIONEEL)

---

### FLOW 1: EMAIL INVITE (Primary - Club Initieert)

**Beste flow voor vliegclubs!**

```
1. Club Admin (in dashboard):
   - Gaat naar "Members" sectie
   - Klikt "Invite Member"
   - Vult email in
   - Selecteert role (member/instructor/admin)
   - Klikt "Send Invite"

2. Backend:
   - Check: Is admin geautoriseerd? (RBAC)
   - Check: Bestaat email al als lid? → Error
   - Check: Is er al een pending invite? → Resend of error
   - Generate invite token (32 chars, random)
   - Set expiry (7 dagen)
   - Insert into organization_invites table
   - Send invite email

3. Invite Email Template:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Subject: You're invited to join {OrgName} on Aerocheck

   Hi,

   {AdminName} has invited you to join {OrgName} on Aerocheck
   as a {role}.

   Click the link below to accept:
   https://aerocheck.com/invites/accept/{token}

   This invitation expires in 7 days.

   About {OrgName}:
   {orgDescription}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. Recipient klikt link:

   A. Als recipient GEEN account heeft:
      - Redirect naar /register?invite={token}
      - Registratie form met invite token
      - Na registratie → auto-accept invite
      - Email verification + organization membership in één keer

   B. Als recipient WEL account heeft:
      - Redirect naar /invites/accept/{token}
      - Shows: "You've been invited to join {OrgName}"
      - Button: "Accept Invite"
      - After accept → toegevoegd aan org

   C. Als recipient al lid is:
      - Shows: "You're already a member of {OrgName}"

5. Backend accept invite:
   - Validate token
   - Check expiry
   - Check user not already member
   - Create membership record
   - Delete invite (consumed)
   - Send confirmation email
   - Activity log

6. Success:
   - User is nu lid van organization
   - User ziet org in "My Organizations"
   - User heeft toegang tot org aircraft/checklists
```

**Database:**
```sql
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
  INDEX idx_email (email),
  INDEX idx_org_invites (organization_id, email, expires_at)
);
```

---

### FLOW 2: JOIN REQUEST (Secondary - User Initieert)

**Voor wanneer user al een account heeft en club wil joinen:**

```
1. User (logged in):
   - Gaat naar "Find Organizations"
   - Zoekt club: "Amsterdam Flying Club"
   - Klikt "Request to Join"

2. Frontend modal:
   - "Why do you want to join?"
   - Text area voor message
   - Button: "Send Request"

3. Backend:
   - Check: User not already member
   - Check: No pending request
   - Create join_requests record
   - Notify club admins (email + in-app notification)

4. Club Admin krijgt notificatie:
   - Email: "{UserName} wants to join {OrgName}"
   - In-app: Badge op "Members" tab
   - Admin gaat naar "Pending Requests"
   - Ziet: User naam, email, message
   - Buttons: "Approve" / "Deny"

5. Admin approves:
   - Create membership record
   - Delete join request
   - Send confirmation email to user
   - User ziet org in "My Organizations"

6. Admin denies:
   - Delete join request
   - (Optioneel) Send rejection email
   - User can request again after 30 days
```

**Database:**
```sql
CREATE TABLE organization_join_requests (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  message TEXT,
  status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by CHAR(36),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_request (organization_id, user_id, status),
  INDEX idx_pending (organization_id, status, created_at)
);
```

---

### FLOW 3: PUBLIC INVITE LINK (Optional - Voor Open Clubs)

**Voor clubs die iedereen toelaten (bijv. open flying clubs):**

```
1. Club Admin genereert public link:
   - Settings → "Public Invite Link"
   - Toggle: "Enable public invites"
   - Selecteer default role: member/instructor
   - Generate: https://aerocheck.com/join/abc-flying-club

2. Club deelt link (website, social media, email)

3. User klikt link:
   - Als ingelogd → Direct join (met confirmatie)
   - Als niet ingelogd → Register first, then auto-join

4. Backend:
   - Validate org allows public joins
   - Check user not already member
   - Create membership
   - Done!
```

**Database:**
```sql
ALTER TABLE organizations ADD COLUMN allow_public_join BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN public_join_role ENUM('member', 'instructor') DEFAULT 'member';
ALTER TABLE organizations ADD COLUMN public_slug VARCHAR(100) UNIQUE; -- voor mooie URLs
```

---

## COMBINED REGISTRATION + INVITE FLOW

**Best UX: Registratie + Organization Join in één keer**

```
User klikt invite link (heeft nog geen account):

1. Redirect naar: /register?invite={token}

2. Registration form shows:
   ┌─────────────────────────────────────────┐
   │  You've been invited to join            │
   │  Amsterdam Flying Club                   │
   │                                          │
   │  Create your account to accept:          │
   │                                          │
   │  First Name: [_____________]            │
   │  Last Name:  [_____________]            │
   │  Email:      pilot@example.com (locked) │
   │  Password:   [_____________]            │
   │                                          │
   │  [✓] I accept the terms                 │
   │                                          │
   │  [ Create Account & Join Club ]         │
   └─────────────────────────────────────────┘

3. Backend:
   - Create user account
   - Send email verification (of skip als via invite)
   - Accept invite automatically
   - Create membership
   - Return auth token
   - User is ingelogd + lid van club!

4. Success screen:
   "Welcome to Aerocheck!
    You're now a member of Amsterdam Flying Club."

   → Redirect to organization dashboard
```

---

## RECOMMENDATION: WELKE FLOW PRIMAIR?

**Voor vliegclubs (jouw use case):**

**Primary Flow: EMAIL INVITE** ✅
- Club admin heeft controle
- Veilig (alleen genodigden kunnen joinen)
- Typisch voor vliegclubs (admins kennen hun leden)
- Email verification ingebouwd

**Secondary Flow: JOIN REQUEST** ✅
- Voor pilots die club vinden via zoeken
- Admin kan goedkeuren/afwijzen
- Extra veiligheid

**Optional Flow: PUBLIC LINK** ⚠️
- Alleen voor open clubs
- Optioneel feature
- Kan later toegevoegd worden

---

## API ENDPOINTS SUMMARY

```php
// Email Verification
POST   /api/auth/register              - Sends verification email
POST   /api/auth/verify-email          - Verify token
POST   /api/auth/resend-verification   - Resend email

// Organization Invites (Club → User)
POST   /api/organizations/:id/invite                    - Admin invites user
GET    /api/invites/:token                             - Get invite details
POST   /api/invites/:token/accept                      - Accept invite
DELETE /api/invites/:token                             - Decline invite
GET    /api/organizations/:id/invites                  - List pending invites
DELETE /api/organizations/:id/invites/:inviteId        - Cancel invite

// Join Requests (User → Club)
POST   /api/organizations/:id/join-request             - User requests to join
GET    /api/organizations/:id/join-requests            - Admin sees requests
POST   /api/organizations/:id/join-requests/:id/approve - Approve request
POST   /api/organizations/:id/join-requests/:id/deny    - Deny request

// Public Join (Optional)
PATCH  /api/organizations/:id/settings                 - Enable/disable public join
POST   /api/organizations/:slug/join                   - Join via public link
```

---

## NEXT STEPS FOR IMPLEMENTATION

**Phase 1 (Week 2): Email Verification**
- [ ] Add email fields to users table
- [ ] Implement EmailService with PHPMailer
- [ ] Create verify-email endpoint
- [ ] Create frontend verify-email page
- [ ] Update registration flow

**Phase 2 (Week 8-9): Organization Invites**
- [ ] Create organization_invites table
- [ ] Implement invite endpoints
- [ ] Create invite UI (admin)
- [ ] Create accept invite page
- [ ] Email templates

**Phase 3 (Week 9): Join Requests** (optional)
- [ ] Create join_requests table
- [ ] Implement request flow
- [ ] Create admin approval UI

**Phase 4 (Later): Public Links** (optional)
- [ ] Add public_join fields to orgs
- [ ] Public join endpoint
- [ ] Settings UI

---

## ENVIRONMENT VARIABLES NEEDED

```bash
# .env additions
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key
SMTP_FROM_EMAIL=noreply@aerocheck.com
SMTP_FROM_NAME=Aerocheck
APP_URL=https://aerocheck.com
```

---

## AANBEVELING VOOR NU

**Start simpel, bouw uit:**

1. **Week 2 (nu):** Email verification bij registratie
2. **Week 8:** Email invites (club → user)
3. **Week 9:** Join requests (user → club) (optioneel)
4. **Later:** Public links (helemaal optioneel)

**Voordeel:** Je bouwt stap voor stap, test elke flow, geen overkill.

**Klaar om te starten met Week 2 + Email Verification?**
