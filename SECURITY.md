# AEROCHECK - API SECURITY

Complete security implementation for PHP backend on shared hosting.

---

## SECURITY LAYERS

### 1. INPUT VALIDATION & SANITIZATION

**All user input must be validated and sanitized:**

```php
// NEVER trust user input
$email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
if (!$email) {
    throw new ValidationException('Invalid email format');
}

// Sanitize strings
$name = htmlspecialchars(trim($_POST['name']), ENT_QUOTES, 'UTF-8');

// Validate with Respect/Validation
use Respect\Validation\Validator as v;

$validator = v::key('email', v::email())
               ->key('password', v::stringType()->length(6, null))
               ->key('firstName', v::stringType()->length(1, 100));

$validator->assert($input); // Throws exception if invalid
```

**Implementation in every controller:**
```php
class AircraftController
{
    public function create(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        if (!isset($input['callsign']) || !isset($input['aircraftTypeId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        // Validate types
        if (!is_string($input['callsign']) || strlen($input['callsign']) > 50) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid callsign']);
            return;
        }

        // Validate UUID format
        if (!$this->isValidUuid($input['aircraftTypeId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid aircraft type ID']);
            return;
        }

        // Proceed with creation...
    }

    private function isValidUuid(string $uuid): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid) === 1;
    }
}
```

---

### 2. SQL INJECTION PREVENTION

**ALWAYS use prepared statements with PDO:**

```php
// ✅ SAFE - Using prepared statements
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);

// ✅ SAFE - Named parameters
$stmt = $pdo->prepare("UPDATE aircraft SET callsign = :callsign WHERE id = :id");
$stmt->execute([
    'callsign' => $callsign,
    'id' => $aircraftId
]);

// ❌ NEVER DO THIS - SQL injection vulnerability
$query = "SELECT * FROM users WHERE email = '$email'"; // DANGEROUS!
$pdo->query($query); // NEVER!
```

**PDO Configuration (in Connection.php):**
```php
self::$instance = new PDO(
    "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
    $user,
    $pass,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false, // IMPORTANT: Real prepared statements
        PDO::ATTR_STRINGIFY_FETCHES => false,
    ]
);
```

---

### 3. AUTHENTICATION & AUTHORIZATION

**JWT Token Security:**

```php
// JWTService.php
class JWTService
{
    private static function getSecret(): string
    {
        $secret = $_ENV['JWT_SECRET'];

        // IMPORTANT: Secret must be strong (min 256 bits)
        if (strlen($secret) < 32) {
            throw new Exception('JWT_SECRET must be at least 32 characters');
        }

        return $secret;
    }

    public static function generate(array $payload): string
    {
        $issuedAt = time();
        $expire = $issuedAt + self::getExpiry();

        $token = [
            'iat' => $issuedAt,
            'exp' => $expire,
            'data' => $payload,
        ];

        return JWT::encode($token, self::getSecret(), 'HS256');
    }

    public static function decode(string $token): object
    {
        try {
            return JWT::decode($token, new Key(self::getSecret(), 'HS256'));
        } catch (Exception $e) {
            throw new Exception('Invalid or expired token');
        }
    }
}
```

**AuthMiddleware - Protect all endpoints:**
```php
class AuthMiddleware
{
    public static function authenticate(): string
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
}

// Usage in index.php
if ($uri === '/api/aircraft' && $method === 'GET') {
    $userId = AuthMiddleware::authenticate(); // ✅ Required auth
    $controller = new AircraftController();
    $controller->getAll($userId);
    exit();
}
```

**RBAC - Role-based access control:**
```php
class RBACService
{
    // Check if user has permission for organization action
    public static function requireOrgPermission(
        string $userId,
        string $orgId,
        string $permission
    ): void {
        $pdo = Connection::getInstance();

        // Get user's role in organization
        $stmt = $pdo->prepare("
            SELECT role FROM memberships
            WHERE user_id = ? AND organization_id = ? AND status = 'active'
        ");
        $stmt->execute([$userId, $orgId]);
        $membership = $stmt->fetch();

        if (!$membership) {
            http_response_code(403);
            echo json_encode(['error' => 'You are not a member of this organization']);
            exit();
        }

        // Check permission
        if (!self::hasPermission($membership['role'], $permission)) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            exit();
        }
    }

    private static function hasPermission(string $role, string $permission): bool
    {
        $permissions = [
            'owner' => ['*'], // All permissions
            'admin' => [
                'aircraft.create', 'aircraft.update', 'aircraft.delete',
                'checklist.create', 'checklist.update', 'checklist.delete', 'checklist.publish',
                'member.invite', 'member.update', 'member.remove'
            ],
            'instructor' => [
                'checklist.create', 'checklist.update', 'checklist.publish',
                'qualification.grant'
            ],
            'member' => [
                'aircraft.view', 'checklist.view', 'checklist.fork'
            ]
        ];

        $rolePerms = $permissions[$role] ?? [];

        return in_array('*', $rolePerms) || in_array($permission, $rolePerms);
    }
}
```

**Super Admin Check:**
```php
class SuperAdminMiddleware
{
    public static function requireSuperAdmin(string $userId): void
    {
        $pdo = Connection::getInstance();
        $stmt = $pdo->prepare("SELECT is_super_admin FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !$user['is_super_admin']) {
            http_response_code(403);
            echo json_encode(['error' => 'Super admin access required']);
            exit();
        }
    }
}

// Usage
if (str_starts_with($uri, '/api/admin/')) {
    $userId = AuthMiddleware::authenticate();
    SuperAdminMiddleware::requireSuperAdmin($userId);
    // Proceed with admin endpoint...
}
```

---

### 4. CORS SECURITY

**Strict CORS configuration in .htaccess:**

```apache
<IfModule mod_headers.c>
    # PRODUCTION: Set specific origin (NEVER use *)
    Header set Access-Control-Allow-Origin "https://app.aerocheck.com"

    # DEV: Allow localhost
    # Header set Access-Control-Allow-Origin "http://localhost:5173"

    # Allowed methods
    Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"

    # Allowed headers
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"

    # Allow credentials (for cookies if needed)
    Header set Access-Control-Allow-Credentials "true"

    # Max age for preflight requests (24 hours)
    Header set Access-Control-Max-Age "86400"
</IfModule>
```

**Handle OPTIONS requests in index.php:**
```php
// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
```

---

### 5. PASSWORD SECURITY

**Strong password hashing with bcrypt:**

```php
// Registration
$passwordHash = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => 12]);

// Store in database
$stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
$stmt->execute([$userId, $email, $passwordHash]);

// Login verification
$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($input['password'], $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit();
}

// Rehash if needed (algorithm upgraded)
if (password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
    $newHash = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$newHash, $user['id']]);
}
```

**Password requirements:**
- Minimum 6 characters (consider 8+ for production)
- Check against common passwords list (optional)
- No maximum length (bcrypt handles truncation at 72 chars)

---

### 6. XSS PREVENTION

**Output encoding:**

```php
// When outputting user data in HTML (if ever needed)
echo htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8');

// JSON encoding (already safe)
echo json_encode(['data' => $userData]); // Safe, escapes automatically

// NEVER use eval() or similar functions
// NEVER include user input in JavaScript code
```

**Content Security Policy (.htaccess):**
```apache
<IfModule mod_headers.c>
    # Prevent XSS
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"

    # Content Security Policy (adjust for your needs)
    Header set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
</IfModule>
```

---

### 7. RATE LIMITING

**Simple rate limiting (shared hosting compatible):**

```php
class RateLimiter
{
    // Store in database instead of Redis (shared hosting)
    public static function check(string $identifier, int $maxAttempts = 5, int $windowSeconds = 60): void
    {
        $pdo = Connection::getInstance();

        // Create rate_limit table if not exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS rate_limits (
                identifier VARCHAR(255) PRIMARY KEY,
                attempts INT DEFAULT 1,
                window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_window (window_start)
            ) ENGINE=InnoDB
        ");

        // Clean old entries (older than 1 hour)
        $pdo->exec("DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)");

        // Get current attempts
        $stmt = $pdo->prepare("
            SELECT attempts, window_start
            FROM rate_limits
            WHERE identifier = ?
        ");
        $stmt->execute([$identifier]);
        $record = $stmt->fetch();

        if (!$record) {
            // First attempt
            $stmt = $pdo->prepare("
                INSERT INTO rate_limits (identifier, attempts, window_start)
                VALUES (?, 1, NOW())
            ");
            $stmt->execute([$identifier]);
            return;
        }

        // Check if window expired
        $windowStart = strtotime($record['window_start']);
        $now = time();

        if ($now - $windowStart > $windowSeconds) {
            // Reset window
            $stmt = $pdo->prepare("
                UPDATE rate_limits
                SET attempts = 1, window_start = NOW()
                WHERE identifier = ?
            ");
            $stmt->execute([$identifier]);
            return;
        }

        // Increment attempts
        if ($record['attempts'] >= $maxAttempts) {
            http_response_code(429);
            echo json_encode([
                'error' => 'Too many requests',
                'retry_after' => $windowSeconds - ($now - $windowStart)
            ]);
            exit();
        }

        $stmt = $pdo->prepare("
            UPDATE rate_limits
            SET attempts = attempts + 1
            WHERE identifier = ?
        ");
        $stmt->execute([$identifier]);
    }
}

// Usage in login endpoint
RateLimiter::check('login:' . $email, 5, 300); // 5 attempts per 5 minutes
```

---

### 8. FILE UPLOAD SECURITY

**If implementing CSV import:**

```php
class FileUploadValidator
{
    public static function validateCSV(array $file): void
    {
        // Check file was uploaded via HTTP POST
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new Exception('Invalid file upload');
        }

        // Check file size (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new Exception('File too large (max 5MB)');
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = ['text/plain', 'text/csv', 'application/csv'];
        if (!in_array($mimeType, $allowedMimes)) {
            throw new Exception('Invalid file type (CSV only)');
        }

        // Check file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, ['csv', 'txt'])) {
            throw new Exception('Invalid file extension');
        }
    }

    public static function parseCSV(string $filePath): array
    {
        $rows = [];
        $handle = fopen($filePath, 'r');

        if ($handle === false) {
            throw new Exception('Failed to open file');
        }

        // Limit rows (prevent DoS)
        $maxRows = 1000;
        $rowCount = 0;

        while (($data = fgetcsv($handle)) !== false) {
            if (++$rowCount > $maxRows) {
                fclose($handle);
                throw new Exception('CSV file too large (max 1000 rows)');
            }

            $rows[] = $data;
        }

        fclose($handle);
        return $rows;
    }
}
```

---

### 9. ERROR HANDLING

**Never expose sensitive information in errors:**

```php
// Production error handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // Log error to file (not database to avoid recursion)
    error_log("Error [$errno]: $errstr in $errfile on line $errline");

    // Return generic error to client
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    exit();
});

// Exception handler
set_exception_handler(function($exception) {
    // Log full exception
    error_log("Exception: " . $exception->getMessage() . "\n" . $exception->getTraceAsString());

    // Return safe error to client
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred']);
    exit();
});

// Development vs Production
if ($_ENV['APP_ENV'] === 'production') {
    error_reporting(0);
    ini_set('display_errors', '0');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
}
```

---

### 10. SESSION SECURITY

**JWT instead of sessions (stateless):**

```php
// NO PHP sessions needed
// session_start(); // Don't use this

// JWT tokens stored client-side (localStorage)
// Backend is completely stateless
// Each request includes token in Authorization header
```

---

### 11. HTTPS ENFORCEMENT

**.htaccess - Force HTTPS:**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Force HTTPS (production only)
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
</IfModule>
```

---

### 12. DATABASE SECURITY

**Secure database connection:**

```php
// .env file (NEVER commit to git)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aerocheck_prod
DB_USER=aerocheck_user  # NOT root!
DB_PASS=<strong-random-password>

// Use specific user with limited privileges
// GRANT SELECT, INSERT, UPDATE, DELETE ON aerocheck_prod.* TO 'aerocheck_user'@'localhost';
// NO DROP, CREATE, ALTER permissions in production
```

**Prevent SQL errors from leaking:**
```php
try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
} catch (PDOException $e) {
    // Log error
    error_log("Database error: " . $e->getMessage());

    // Return generic error to client
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    exit();
}
```

---

### 13. ACTIVITY LOGGING

**Log all important actions:**

```php
class ActivityLogger
{
    public static function log(array $data): void
    {
        $pdo = Connection::getInstance();

        $stmt = $pdo->prepare("
            INSERT INTO activity_log (
                id, user_id, organization_id, entity_type, entity_id,
                action, description, ip_address, user_agent, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            self::generateUuid(),
            $data['user_id'] ?? null,
            $data['organization_id'] ?? null,
            $data['entity_type'],
            $data['entity_id'] ?? null,
            $data['action'],
            $data['description'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            json_encode($data['metadata'] ?? [])
        ]);
    }
}

// Usage
ActivityLogger::log([
    'user_id' => $userId,
    'entity_type' => 'aircraft',
    'entity_id' => $aircraftId,
    'action' => 'delete',
    'description' => "Deleted aircraft: {$aircraft['callsign']}",
    'metadata' => ['callsign' => $aircraft['callsign'], 'type' => $aircraft['type']]
]);
```

---

## SECURITY CHECKLIST

**Pre-Production:**
- [ ] All endpoints require authentication (except login/register)
- [ ] All database queries use prepared statements
- [ ] Input validation on all user input
- [ ] Password hashing with bcrypt (cost 12+)
- [ ] JWT secret is strong (32+ characters)
- [ ] HTTPS enforced via .htaccess
- [ ] CORS set to specific origin (not *)
- [ ] Rate limiting on login/register endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Database user has minimal privileges (no DROP/ALTER)
- [ ] .env file in .gitignore
- [ ] File upload validation (if used)
- [ ] Activity logging for important actions
- [ ] Super admin access properly restricted
- [ ] RBAC permissions correctly implemented

**Post-Deployment:**
- [ ] Test all endpoints with invalid tokens
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts in form inputs
- [ ] Verify HTTPS is working
- [ ] Check CORS headers
- [ ] Monitor activity logs
- [ ] Set up error logging
- [ ] Regular security updates (PHP, dependencies)

---

## VULNERABILITY TESTING

**Manual tests to run:**

```bash
# 1. Test authentication bypass
curl https://api.aerocheck.com/api/aircraft
# Should return 401 Unauthorized

# 2. Test invalid token
curl -H "Authorization: Bearer invalid-token" https://api.aerocheck.com/api/aircraft
# Should return 401 Invalid token

# 3. Test SQL injection
curl -X POST https://api.aerocheck.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com OR 1=1--", "password": "test"}'
# Should return 400 Invalid email or no results

# 4. Test XSS in input
curl -X POST https://api.aerocheck.com/api/aircraft \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"callsign": "<script>alert(1)</script>"}'
# Should store safely, return escaped in JSON

# 5. Test CORS
curl -H "Origin: https://evil.com" https://api.aerocheck.com/api/health
# Should NOT include Access-Control-Allow-Origin: https://evil.com

# 6. Test rate limiting
for i in {1..10}; do
  curl -X POST https://api.aerocheck.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "password": "wrong"}'
done
# Should return 429 Too Many Requests after 5 attempts
```

---

## CONCLUSION

This security implementation provides:
- ✅ Protection against SQL injection
- ✅ Protection against XSS
- ✅ Protection against CSRF (stateless JWT)
- ✅ Strong authentication & authorization
- ✅ Rate limiting against brute force
- ✅ Secure password storage
- ✅ Input validation
- ✅ Activity logging for auditing
- ✅ HTTPS enforcement
- ✅ Secure CORS configuration

**The API is production-ready security-wise.**
