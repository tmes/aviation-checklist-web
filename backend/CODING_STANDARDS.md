# Aerocheck Backend Coding Standards

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Naming Conventions](#naming-conventions)
3. [JSON Response Handling](#json-response-handling)
4. [Database Standards](#database-standards)
5. [API Response Format](#api-response-format)

---

## Architecture Overview

This application follows industry-standard naming conventions across different layers:

```
┌─────────────────────────────────────────────────────────┐
│ Database Layer (MySQL)                                  │
│ Convention: snake_case                                  │
│ Example: email_verified, is_super_admin, first_name    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Application Layer (PHP)                                 │
│ Convention: snake_case                                  │
│ PDO returns arrays with snake_case keys from database   │
│ Example: $user['email_verified'], $user['first_name']  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Conversion Layer (JsonHelper)                           │
│ Purpose: Convert snake_case → camelCase                 │
│ Handles: Boolean conversion (TINYINT → true/false)      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ API Layer (JSON Response)                               │
│ Convention: camelCase                                   │
│ Example: emailVerified, isSuperAdmin, firstName         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend Layer (TypeScript/JavaScript)                  │
│ Convention: camelCase                                   │
│ Example: user.emailVerified, user.firstName             │
└─────────────────────────────────────────────────────────┘
```

---

## Naming Conventions

### Database (MySQL)
- **Tables**: snake_case, plural
  - ✅ `users`, `aircraft_types`, `supported_languages`
  - ❌ `User`, `AircraftType`, `SupportedLanguage`

- **Columns**: snake_case
  - ✅ `email_verified`, `is_super_admin`, `created_at`
  - ❌ `emailVerified`, `isSuperAdmin`, `createdAt`

- **Boolean fields**: TINYINT(1), prefixed with `is_` or descriptive name
  - ✅ `is_active`, `is_public`, `email_verified`
  - ❌ `active` (ambiguous), `verified` (what is verified?)

### PHP Application Layer
- **Classes**: PascalCase
  - ✅ `AuthController`, `JsonHelper`, `EmailService`
  - ❌ `auth_controller`, `jsonhelper`

- **Methods**: camelCase
  - ✅ `getUserById()`, `sendVerificationEmail()`
  - ❌ `get_user_by_id()`, `send_verification_email()`

- **Variables from database**: snake_case (matches PDO output)
  - ✅ `$user['email_verified']`, `$user['first_name']`
  - ❌ `$user['emailVerified']` (creates inconsistency)

### JSON API Responses
- **Keys**: camelCase (JavaScript/JSON standard)
  - ✅ `emailVerified`, `isSuperAdmin`, `firstName`
  - ❌ `email_verified`, `is_super_admin` (violates JSON convention)

---

## JSON Response Handling

### ❌ NEVER use `json_encode()` directly

```php
// ❌ WRONG - Inconsistent, no conversion
http_response_code(400);
echo json_encode(["error" => "Something went wrong"]);

// ❌ WRONG - Manual conversion, error-prone
echo json_encode([
    "emailVerified" => $user["email_verified"],
    "isSuperAdmin" => (bool)$user["is_super_admin"]
]);
```

### ✅ ALWAYS use `JsonHelper` methods

```php
// ✅ CORRECT - Error response
JsonHelper::error("Something went wrong", 400);

// ✅ CORRECT - Success response
JsonHelper::success("Operation successful", ["id" => $userId]);

// ✅ CORRECT - Generic response
JsonHelper::send([
    "user" => $user,  // Automatic snake_case → camelCase conversion
    "token" => $token
]);
```

### JsonHelper Methods

#### `JsonHelper::send(array $data, int $statusCode = 200)`
Sends any data with automatic snake_case → camelCase conversion.

```php
JsonHelper::send([
    "message" => "Success",
    "user" => $user,  // email_verified → emailVerified
    "data" => $data
], 200);
```

#### `JsonHelper::error(string $message, int $statusCode = 400, array $extra = [])`
Sends error response with consistent format.

```php
JsonHelper::error("Invalid credentials", 401);

// With extra data
JsonHelper::error("Validation failed", 400, [
    "field" => "email",
    "reason" => "Invalid format"
]);
```

#### `JsonHelper::success(string $message, array $data = [], int $statusCode = 200)`
Sends success response with consistent format.

```php
JsonHelper::success("User created", ["id" => $userId], 201);
```

---

## Database Standards

### Boolean Fields

MySQL does not have a native BOOLEAN type. It uses `TINYINT(1)`:
- `0` = false
- `1` = true

**PDO returns TINYINT as integers (`0` or `1`), NOT booleans.**

#### Problem:
```php
$user = $stmt->fetch();  // PDO fetch
// $user['email_verified'] = 1 (integer)

echo json_encode($user);
// Output: {"email_verified": 1}  ❌ JavaScript sees 1, not true
```

#### Solution:
JsonHelper automatically converts registered boolean fields:

```php
// In JsonHelper.php
private static array $booleanFields = [
    "email_verified",
    "is_super_admin",
    "is_active",
    "is_public",
    // ... add new boolean fields here
];
```

```php
JsonHelper::send(["user" => $user]);
// Output: {"user": {"emailVerified": true}}  ✅
```

**When adding new boolean database fields:**
1. Name them with `is_` prefix or descriptive name
2. Add to `$booleanFields` array in `JsonHelper`
3. Document in API schema

---

## API Response Format

### Standard Success Response
```json
{
  "message": "Operation successful",
  "data": { ... },
  "additionalField": "..."
}
```

### Standard Error Response
```json
{
  "error": "Error message",
  "field": "fieldName",  // optional
  "code": "ERROR_CODE"   // optional
}
```

### Examples

#### User Login Success
```json
{
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true,
    "isSuperAdmin": false,
    "createdAt": "2025-01-15 10:30:00"
  }
}
```

#### Validation Error
```json
{
  "error": "Validation failed",
  "field": "email",
  "reason": "Invalid email format"
}
```

---

## Why This Architecture?

### Industry Standards
- **SQL databases**: Use snake_case (SQL standard, PostgreSQL, MySQL conventions)
- **JSON APIs**: Use camelCase (JavaScript, JSON, REST API conventions)
- **PHP**: Historically uses snake_case for database work, camelCase for OOP

### Consistency Benefits
1. **Database queries are readable**: `SELECT email_verified FROM users`
2. **Frontend code is idiomatic**: `user.emailVerified` (not `user.email_verified`)
3. **No manual conversion**: JsonHelper handles it automatically
4. **Type safety**: Boolean conversion prevents `1` vs `true` bugs
5. **Maintainability**: One clear rule, documented here

### Why NOT Convert Database Schema?

❌ **Bad approach**: Change database to camelCase
```sql
-- ❌ WRONG - Violates SQL conventions
CREATE TABLE users (
    emailVerified TINYINT(1),  -- Non-standard SQL
    isSuperAdmin TINYINT(1),   -- Harder to read
    firstName VARCHAR(100)     -- Inconsistent with SQL ecosystem
);
```

✅ **Good approach**: Use conversion layer (JsonHelper)
```sql
-- ✅ CORRECT - Standard SQL
CREATE TABLE users (
    email_verified TINYINT(1),  -- Readable, standard
    is_super_admin TINYINT(1),  -- Clear boolean intent
    first_name VARCHAR(100)     -- SQL convention
);
```

### References
- [Google JSON Style Guide](https://google.github.io/styleguide/jsoncstyleguide.xml) - Recommends camelCase for JSON
- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) - Uses snake_case
- [MySQL Best Practices](https://dev.mysql.com/doc/refman/8.0/en/identifier-case-sensitivity.html) - Recommends lowercase with underscores

---

## Checklist for New Features

When creating new API endpoints:

- [ ] Database fields use snake_case
- [ ] Boolean fields added to `JsonHelper::$booleanFields`
- [ ] All responses use `JsonHelper` methods (never raw `json_encode`)
- [ ] PHP variables from database keep snake_case (don't rename)
- [ ] API documentation shows camelCase field names
- [ ] Frontend TypeScript types use camelCase

---

## Common Pitfalls

### ❌ Pitfall 1: Manual Conversion
```php
// ❌ WRONG - Manual, error-prone
$response = [
    "emailVerified" => $user["email_verified"],
    "firstName" => $user["first_name"],
];
echo json_encode($response);
```

**Solution**: Let JsonHelper handle it
```php
// ✅ CORRECT
JsonHelper::send(["user" => $user]);
```

### ❌ Pitfall 2: Forgetting Boolean Conversion
```php
// ❌ WRONG - Returns 1/0 instead of true/false
echo json_encode(["isActive" => $user["is_active"]]);
// Output: {"isActive": 1}
```

**Solution**: Add field to JsonHelper and use JsonHelper::send()
```php
// In JsonHelper.php
private static array $booleanFields = [
    "is_active",  // Add here
    // ...
];

// In controller
JsonHelper::send(["user" => $user]);
// Output: {"user": {"isActive": true}}
```

### ❌ Pitfall 3: Inconsistent Naming
```php
// ❌ WRONG - Mixing conventions
$userData = [
    "email" => $user["email"],           // OK
    "emailVerified" => $user["email_verified"],  // Manual conversion
    "is_super_admin" => $user["is_super_admin"]  // Forgot to convert
];
```

**Solution**: Keep application layer in snake_case, let JsonHelper convert
```php
// ✅ CORRECT - Everything in snake_case
$user = $stmt->fetch();  // Already snake_case from PDO
JsonHelper::send(["user" => $user]);  // Auto-converts to camelCase
```

---

## Migration Guide

If you find old code using `json_encode()` directly:

1. Import JsonHelper:
   ```php
   use App\Helpers\JsonHelper;
   ```

2. Replace patterns:
   ```php
   // OLD
   http_response_code(400);
   echo json_encode(["error" => $message]);

   // NEW
   JsonHelper::error($message, 400);
   ```

   ```php
   // OLD
   http_response_code(200);
   echo json_encode(["message" => "Success", "data" => $data]);

   // NEW
   JsonHelper::success("Success", $data);
   ```

   ```php
   // OLD
   echo json_encode($result);

   // NEW
   JsonHelper::send($result);
   ```

3. Remove any manual field conversions (snake_case → camelCase)

4. Verify boolean fields are in `JsonHelper::$booleanFields`

---

**Last Updated**: 2025-01-26
**Author**: Development Team
**Review**: Required for all pull requests
