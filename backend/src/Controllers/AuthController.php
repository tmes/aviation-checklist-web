<?php

namespace App\Controllers;

use App\Database\Connection;
use App\Helpers\JsonHelper;
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
            JsonHelper::error("Email and password are required", 400);
            return;
        }

        if (!filter_var($input["email"], FILTER_VALIDATE_EMAIL)) {
            JsonHelper::error("Invalid email format", 400);
            return;
        }

        if (strlen($input["password"]) < 6) {
            JsonHelper::error("Password must be at least 6 characters", 400);
            return;
        }

        // Check if user exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$input["email"]]);

        if ($stmt->fetch()) {
            JsonHelper::error("Email already registered", 409);
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

            JsonHelper::success(
                "Account created. Please check your email to verify your account.",
                [
                    "email_verification_sent" => true,
                    "email" => $input["email"],
                ],
                201
            );
        } catch (PDOException $e) {
            JsonHelper::error("Registration failed: " . $e->getMessage(), 500);
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
            JsonHelper::error("Email and password are required", 400);
            return;
        }

        // Find user
        $stmt = $this->db->prepare("
			SELECT id, email, password_hash, first_name, last_name, email_verified, is_super_admin
			FROM users
			WHERE email = ?
		");
        $stmt->execute([$input["email"]]);
        $user = $stmt->fetch();

        if (!$user) {
            JsonHelper::error("Invalid email or password", 401);
            return;
        }

        // Verify password
        if (!password_verify($input["password"], $user["password_hash"])) {
            JsonHelper::error("Invalid email or password", 401);
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
            $response["email_verification_required"] = true;
        }

        JsonHelper::send($response);
    }

    /**
     * Get current user
     * GET /api/users/me
     */
    public function me(string $userId): void
    {
        $user = $this->getUserById($userId);

        if (!$user) {
            JsonHelper::error("User not found", 404);
            return;
        }

        JsonHelper::send(["data" => $user]);
    }

    /**
     * Verify email with token
     * POST /api/auth/verify-email
     */
    public function verifyEmail(): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["token"])) {
            JsonHelper::error("Verification token is required", 400);
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
            JsonHelper::error("Invalid or expired verification token", 404);
            return;
        }

        // Check if token expired
        if (strtotime($user["email_verification_expires"]) < time()) {
            JsonHelper::error("Verification token has expired", 400, ["can_resend" => true]);
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

        JsonHelper::send([
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
            JsonHelper::error("Email is required", 400);
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
            JsonHelper::success("If that email is registered, a verification email has been sent.");
            return;
        }

        // Check if already verified
        if ($user["email_verified"]) {
            JsonHelper::error("Email already verified", 400);
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
            JsonHelper::error("Failed to send verification email", 500);
            return;
        }

        JsonHelper::success("Verification email sent");
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
