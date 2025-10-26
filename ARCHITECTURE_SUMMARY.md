# ARCHITECTURE UPDATE SUMMARY

**Version:** 1.1
**Last Updated:** October 25, 2025
**Changes:** Added Super Admin role, Shared Hosting compatibility, Lucide Icons

---

## KEY CHANGES FROM V1.0

### 1. SUPER ADMIN ROLE

**Database Changes:**
```sql
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD INDEX idx_super_admin (is_super_admin);

CREATE TABLE activity_log (...); -- For monitoring all platform activity
```

**Permissions:**
- Super Admin can see and manage EVERYTHING platform-wide
- Access to all users, organizations, aircraft, checklists
- View activity logs & analytics
- Manage system settings
- Impersonate users for support
- NO restrictions whatsoever

**New API Endpoints:**
```
GET    /api/admin/dashboard           - Platform stats
GET    /api/admin/users               - All users (paginated)
GET    /api/admin/users/:id           - User details with full context
PATCH  /api/admin/users/:id           - Edit any user
DELETE /api/admin/users/:id           - Delete any user
POST   /api/admin/impersonate/:userId - Impersonate user
GET    /api/admin/organizations       - All organizations
GET    /api/admin/organizations/:id   - Org details with members
PATCH  /api/admin/organizations/:id   - Edit any organization
DELETE /api/admin/organizations/:id   - Delete any organization
GET    /api/admin/aircraft            - All aircraft platform-wide
GET    /api/admin/checklists          - All checklists platform-wide
GET    /api/admin/activity-log        - Full activity log
GET    /api/admin/stats               - Platform-wide statistics
GET    /api/admin/system-settings     - System configuration
PATCH  /api/admin/system-settings     - Update system config
```

**Frontend:**
```
New pages needed:
- /admin/dashboard        - Platform overview with stats
- /admin/users            - User management table
- /admin/users/:id        - User detail with activity
- /admin/organizations    - Organization management
- /admin/organizations/:id - Org detail with members
- /admin/activity-log     - System-wide activity log
- /admin/stats            - Analytics dashboard
- /admin/settings         - System settings
```

---

### 2. SHARED HOSTING COMPATIBILITY

**Infrastructure Changed:**
```diff
- Backend Host: VPS (DigitalOcean) with shell access
+ Backend Host: Shared Webhosting (cPanel/Plesk/DirectAdmin)
              - PHP 8.2+ required (no special extensions)
              - MySQL database included
              - NO root access needed
              - NO shell access required
              - Standard .htaccess for routing
```

**Deployment Process:**
1. **Local Build:**
   ```bash
   composer install --no-dev --optimize-autoloader
   ```

2. **Upload via FTP/cPanel File Manager:**
   - Upload backend folder to `public_html/api/`
   - Set `public/` as document root via cPanel

3. **Database Setup (via phpMyAdmin):**
   - Create database
   - Import `schema.sql`
   - Import seed data
   - Update `.env` credentials

4. **.htaccess Configuration:**
   ```apache
   # Rewrite rules for routing
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ index.php [QSA,L]

   # CORS headers
   Header set Access-Control-Allow-Origin "https://app.aerocheck.com"
   Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
   Header set Access-Control-Allow-Headers "Content-Type, Authorization"
   ```

5. **File Permissions:**
   - 755 for directories
   - 644 for files
   - No writable cache folders needed

**No Special Requirements:**
- No Redis (session in JWT only)
- No Supervisor (no queue workers)
- No Cronjobs (sync is client-initiated)
- No Node.js on server (build locally)
- No SSH access needed

---

### 3. ICON SYSTEM (LUCIDE REACT)

**STRICT RULE:** NO emoticons anywhere in the codebase or UI

**Installation:**
```bash
npm install lucide-react
```

**Usage:**
```tsx
import { Plane, CheckCircle, User, Settings } from 'lucide-react';

<Plane className="w-5 h-5 text-blue-600" />
```

**Icon Mapping:**
- See `DESIGN_SYSTEM.md` for complete icon mapping
- Flight phases: CheckCircle, Zap, Plane, TrendingUp, etc.
- Aircraft status: CheckCircle (green), Wrench (orange), XCircle (red)
- User roles: Shield (super admin), Crown (owner), GraduationCap (instructor)
- UI actions: Plus, Edit, Trash2, Save, X, Upload, Download

**Components to Build:**
```tsx
// Badge with icon
<Badge variant="success" icon={CheckCircle}>
  Airworthy
</Badge>

// Button with icon
<Button icon={Plus} iconPosition="left">
  Add Aircraft
</Button>

// Navigation with icon
<NavLink to="/aircraft" icon={Plane}>
  Aircraft
</NavLink>
```

---

## UPDATED TECH STACK

### Backend
```
Runtime:       PHP 8.2+
Framework:     Slim Framework 4
Database:      MySQL 8.0
Auth:          JWT (firebase/php-jwt)
Hosting:       Shared Webhosting (cPanel compatible)
Requirements:  - PHP 8.2+
               - MySQL 8.0+
               - mod_rewrite enabled
               - .htaccess support
               NO root access needed
               NO shell access needed
```

### Frontend
```
Framework:     React 19
Language:      TypeScript 5.9
Build:         Vite 7 (rolldown-vite)
Routing:       React Router v7
State:         Zustand + TanStack Query
Styling:       Tailwind CSS 3.4
Icons:         Lucide React (NO emoticons!)
Hosting:       Static hosting (Vercel/Cloudflare/Netlify)
```

---

## DATABASE SCHEMA UPDATES

### New Tables
```sql
-- Activity log for super admin monitoring
CREATE TABLE activity_log (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  organization_id CHAR(36),
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36),
  action VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- indexes...
);
```

### Modified Tables
```sql
-- Users table: added is_super_admin flag
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD INDEX idx_super_admin (is_super_admin);
```

---

## ROADMAP ADDITIONS

### Super Admin Development

**New Sprint (can be added to Phase 3 or 4):**

**Week X: Super Admin Platform**

**Database:**
- [x] Add `is_super_admin` to users table
- [x] Create `activity_log` table

**Backend (PHP):**
- [ ] `AdminController.php` - Super admin endpoints
- [ ] `ActivityLogService.php` - Log all important actions
- [ ] Middleware: Check `is_super_admin` flag
- [ ] User impersonation logic
- [ ] Platform stats aggregation

**Frontend:**
- [ ] `/admin/*` routes protected by `is_super_admin` check
- [ ] Admin dashboard with platform metrics
- [ ] User management table (search, filter, pagination)
- [ ] Organization management table
- [ ] Activity log viewer (filterable by date, user, action)
- [ ] Analytics charts (user growth, checklist usage)
- [ ] System settings panel
- [ ] Impersonate user feature (with exit button)

**Deliverable:** Super admin can monitor and manage entire platform

**Estimated Time:** 15-20 hours

---

## SECURITY CONSIDERATIONS

### Super Admin Access
```php
// Middleware: SuperAdminMiddleware.php
public static function requireSuperAdmin(string $userId): void
{
    $stmt = $pdo->prepare("SELECT is_super_admin FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user || !$user['is_super_admin']) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Super admin access required']);
        exit();
    }
}
```

### Activity Logging
```php
// Log important actions for audit trail
ActivityLogService::log([
    'user_id' => $userId,
    'entity_type' => 'aircraft',
    'entity_id' => $aircraftId,
    'action' => 'delete',
    'description' => 'Deleted aircraft: Cessna 172',
    'ip_address' => $_SERVER['REMOTE_ADDR'],
    'user_agent' => $_SERVER['HTTP_USER_AGENT']
]);
```

### User Impersonation
```php
// Generate impersonation token with original admin ID embedded
$impersonationToken = JWTService::generate([
    'userId' => $targetUserId,
    'impersonatedBy' => $adminUserId, // Super admin who is impersonating
    'isImpersonation' => true
]);

// Frontend shows banner: "You are viewing as User X (Exit)"
```

---

## SHARED HOSTING CHECKLIST

**Pre-Deployment:**
- [ ] Verify PHP 8.2+ available on hosting
- [ ] Check mod_rewrite enabled (contact host if not)
- [ ] Create MySQL database via cPanel
- [ ] Note database credentials (host, name, user, pass)

**Deployment:**
- [ ] Run `composer install --no-dev --optimize-autoloader` locally
- [ ] Upload backend folder via FTP/SFTP
- [ ] Create `.env` file with database credentials
- [ ] Set document root to `public/` folder
- [ ] Upload `.htaccess` to `public/` folder
- [ ] Import `schema.sql` via phpMyAdmin
- [ ] Import seed data (aircraft types, flight phases)
- [ ] Test: `curl https://api.yourdomain.com/api/health`

**Post-Deployment:**
- [ ] Enable SSL via Let's Encrypt (cPanel)
- [ ] Update frontend `.env` with API URL
- [ ] Test CORS from frontend domain
- [ ] Create first super admin user manually in database:
  ```sql
  UPDATE users SET is_super_admin = TRUE WHERE email = 'admin@yourdomain.com';
  ```

---

## MIGRATION FROM CURRENT STATE

**Current State:**
- Week 1 completed (Auth working)
- Backend: PHP with manual routing in `index.php`
- Frontend: React with Login/Register/Dashboard

**Next Steps:**

1. **Install Lucide Icons:**
   ```bash
   cd frontend
   npm install lucide-react
   ```

2. **Update Database Schema:**
   ```bash
   # Add to backend/database/schema.sql:
   - ALTER TABLE users ADD COLUMN is_super_admin
   - CREATE TABLE activity_log
   ```

3. **Create .htaccess:**
   ```bash
   # Create backend/public/.htaccess with routing rules
   ```

4. **Continue with Week 2:** Aircraft Management (as planned)

---

## FILES CREATED/UPDATED

**New Files:**
- `ARCHITECTURE.md` (v1.1) - Complete architecture with super admin
- `DESIGN_SYSTEM.md` - Icon system & design tokens
- `ARCHITECTURE_SUMMARY.md` (this file) - Change summary
- `backend/public/.htaccess` - Shared hosting routing

**Updated Files:**
- `ROADMAP.md` - Adjusted for shared hosting deployment

**To Create:**
- `backend/database/schema.sql` - Complete schema with all tables
- `backend/src/Middleware/SuperAdminMiddleware.php`
- `backend/src/Controllers/AdminController.php`
- `backend/src/Services/ActivityLogService.php`
- `frontend/src/pages/admin/*` - Super admin pages

---

## APPROVAL CHECKLIST

Please confirm:
- [x] **Super Admin role:** Can see/manage EVERYTHING platform-wide
- [x] **Shared hosting:** Works on standard cPanel hosting
- [x] **No emoticons:** Lucide React icons only
- [ ] **Ready to proceed:** Start Week 2 (Aircraft Management)

---

## NEXT SPRINT: WEEK 2 - AIRCRAFT MANAGEMENT

With these updates approved, we'll proceed with:

**Database:**
- [ ] Complete `schema.sql` with aircraft tables
- [ ] Seed aircraft_types data
- [ ] Add `is_super_admin` flag
- [ ] Create `activity_log` table

**Backend:**
- [ ] `AircraftController.php` - CRUD endpoints
- [ ] `AircraftTypeController.php` - Types endpoint
- [ ] Activity logging for aircraft actions
- [ ] Create `.htaccess` file

**Frontend:**
- [ ] Install `lucide-react`
- [ ] Create Badge component (with Lucide icons)
- [ ] Create Button component (with Lucide icons)
- [ ] Aircraft list page with icons
- [ ] Aircraft form with type selector
- [ ] Status badges (Airworthy, Maintenance, Grounded)

**Estimated Time:** 8-10 hours

---

**Ready to start building?** 🚀
