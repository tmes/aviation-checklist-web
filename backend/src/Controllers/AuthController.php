<?php

namespace App\Controllers;

use App\Database\Connection;
use App\Services\JWTService;
use App\Services\EmailService;
use PDO;
use PDOException;

class AuthController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    /**
     * Register new user
     * POST /api/auth/register
     */
    public function register(): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        // Validation
        if (empty($input["email"]) || empty($input["password"])) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required"]);
            return;
        }

        if (!filter_var($input["email"], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid email format"]);
            return;
        }

        if (strlen($input["password"]) < 6) {
            http_response_code(400);
            echo json_encode([
                "error" => "Password must be at least 6 characters",
            ]);
            return;
        }

        // Check if user exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$input["email"]]);

        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["error" => "Email already registered"]);
            return;
        }

        // Create user
        try {
            $userId = $this->generateUUID();
            $passwordHash = password_hash($input["password"], PASSWORD_BCRYPT);

            // Generate email verification token
            $verificationToken = bin2hex(random_bytes(32));
            $expiryHours = (int)($_ENV['EMAIL_VERIFICATION_EXPIRES_HOURS'] ?? 24);
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryHours} hours"));

            $stmt = $this->db->prepare("
				INSERT INTO users (id, email, password_hash, first_name, last_name,
				                  email_verified, email_verification_token, email_verification_expires)
				VALUES (?, ?, ?, ?, ?, 0, ?, ?)
			");

            $stmt->execute([
                $userId,
                $input["email"],
                $passwordHash,
                $input["firstName"] ?? "",
                $input["lastName"] ?? "",
                $verificationToken,
                $expiresAt,
            ]);

            // Send verification email
            try {
                EmailService::sendVerificationEmail(
                    $input["email"],
                    $verificationToken,
                    $input["firstName"] ?? "User"
                );
            } catch (\Exception $e) {
                error_log("Failed to send verification email: " . $e->getMessage());
                // Continue anyway - user can request resend
            }

            http_response_code(201);
            echo json_encode([
                "message" => "Account created. Please check your email to verify your account.",
                "emailVerificationSent" => true,
                "email" => $input["email"],
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Registration failed: " . $e->getMessage(),
            ]);
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    public function login(): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        // Validation
        if (empty($input["email"]) || empty($input["password"])) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required"]);
            return;
        }

        // Find user
        $stmt = $this->db->prepare("
			SELECT id, email, password_hash, first_name, last_name, email_verified
			FROM users
			WHERE email = ?
		");
        $stmt->execute([$input["email"]]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid email or password"]);
            return;
        }

        // Verify password
        if (!password_verify($input["password"], $user["password_hash"])) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid email or password"]);
            return;
        }

        // Update last login
        $stmt = $this->db->prepare(
            "UPDATE users SET last_login_at = NOW() WHERE id = ?"
        );
        $stmt->execute([$user["id"]]);

        // Generate JWT token
        $token = JWTService::generate([
            "userId" => $user["id"],
            "email" => $user["email"],
        ]);

        // Return user data (without password)
        unset($user["password_hash"]);

        $response = [
            "message" => "Login successful",
            "token" => $token,
            "user" => $user,
        ];

        // Soft warning for unverified email (Optie B - lenient approach)
        if (!$user["email_verified"]) {
            $response["warning"] = "Email not verified";
            $response["emailVerificationRequired"] = true;
        }

        echo json_encode($response);
    }

    /**
     * Get current user
     * GET /api/users/me
     */
    public function me(string $userId): void
    {
        $user = $this->getUserById($userId);

        if (!$user) {
            http_response_code(404);
            echo json_encode(["error" => "User not found"]);
            return;
        }

        echo json_encode(["data" => $user]);
    }

    /**
     * Verify email with token
     * POST /api/auth/verify-email
     */
    public function verifyEmail(): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["token"])) {
            http_response_code(400);
            echo json_encode(["error" => "Verification token is required"]);
            return;
        }

        // Find user with this token
        $stmt = $this->db->prepare("
            SELECT id, email, first_name, email_verification_expires
            FROM users
            WHERE email_verification_token = ?
        ");
        $stmt->execute([$input["token"]]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(["error" => "Invalid or expired verification token"]);
            return;
        }

        // Check if token expired
        if (strtotime($user["email_verification_expires"]) < time()) {
            http_response_code(400);
            echo json_encode([
                "error" => "Verification token has expired",
                "canResend" => true,
            ]);
            return;
        }

        // Update user: mark as verified and clear token
        $stmt = $this->db->prepare("
            UPDATE users
            SET email_verified = 1,
                email_verification_token = NULL,
                email_verification_expires = NULL
            WHERE id = ?
        ");
        $stmt->execute([$user["id"]]);

        // Send welcome email (non-blocking)
        try {
            EmailService::sendWelcomeEmail($user["email"], $user["first_name"]);
        } catch (\Exception $e) {
            error_log("Failed to send welcome email: " . $e->getMessage());
        }

        // Generate JWT token for auto-login
        $token = JWTService::generate([
            "userId" => $user["id"],
            "email" => $user["email"],
        ]);

        // Get updated user data
        $userData = $this->getUserById($user["id"]);

        echo json_encode([
            "message" => "Email verified successfully",
            "token" => $token,
            "user" => $userData,
        ]);
    }

    /**
     * Resend verification email
     * POST /api/auth/resend-verification
     */
    public function resendVerification(): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["email"])) {
            http_response_code(400);
            echo json_encode(["error" => "Email is required"]);
            return;
        }

        // Find user
        $stmt = $this->db->prepare("
            SELECT id, email, first_name, email_verified
            FROM users
            WHERE email = ?
        ");
        $stmt->execute([$input["email"]]);
        $user = $stmt->fetch();

        if (!$user) {
            // Don't reveal if email exists (security)
            http_response_code(200);
            echo json_encode([
                "message" => "If that email is registered, a verification email has been sent.",
            ]);
            return;
        }

        // Check if already verified
        if ($user["email_verified"]) {
            http_response_code(400);
            echo json_encode(["error" => "Email already verified"]);
            return;
        }

        // Generate new verification token
        $verificationToken = bin2hex(random_bytes(32));
        $expiryHours = (int)($_ENV['EMAIL_VERIFICATION_EXPIRES_HOURS'] ?? 24);
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryHours} hours"));

        $stmt = $this->db->prepare("
            UPDATE users
            SET email_verification_token = ?,
                email_verification_expires = ?
            WHERE id = ?
        ");
        $stmt->execute([$verificationToken, $expiresAt, $user["id"]]);

        // Send verification email
        try {
            EmailService::sendVerificationEmail(
                $user["email"],
                $verificationToken,
                $user["first_name"]
            );
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to send verification email"]);
            return;
        }

        echo json_encode([
            "message" => "Verification email sent",
        ]);
    }

    /**
     * Helper: Get user by ID
     */
    private function getUserById(string $userId): ?array
    {
        $stmt = $this->db->prepare("
			SELECT id, email, first_name, last_name, email_verified, is_super_admin,
				   created_at, updated_at, last_login_at
			FROM users
			WHERE id = ?
		");
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Helper: Generate UUID v4
     */
    private function generateUUID(): string
    {
        return sprintf(
            "%04x%04x-%04x-%04x-%04x-%04x%04x%04x",
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
