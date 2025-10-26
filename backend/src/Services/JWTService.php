<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JWTService
{
    private static function getSecret(): string
    {
        return $_ENV["JWT_SECRET"];
    }

    private static function getExpiry(): int
    {
        return (int) ($_ENV["JWT_EXPIRY"] ?? 604800); // Default 7 days
    }

    /**
     * Generate JWT token for user
     */
    public static function generate(array $payload): string
    {
        $issuedAt = time();
        $expire = $issuedAt + self::getExpiry();

        $token = [
            "iat" => $issuedAt,
            "exp" => $expire,
            "data" => $payload,
        ];

        return JWT::encode($token, self::getSecret(), "HS256");
    }

    /**
     * Decode and verify JWT token
     */
    public static function decode(string $token): object
    {
        try {
            return JWT::decode($token, new Key(self::getSecret(), "HS256"));
        } catch (Exception $e) {
            throw new Exception(
                "Invalid or expired token: " . $e->getMessage()
            );
        }
    }

    /**
     * Extract token from Authorization header
     */
    public static function getTokenFromHeader(): ?string
    {
        $headers = getallheaders();
        $authHeader =
            $headers["Authorization"] ?? ($headers["authorization"] ?? null);

        if (!$authHeader) {
            return null;
        }

        // Remove "Bearer " prefix
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
