<?php

namespace App\Middleware;

use App\Services\JWTService;
use Exception;

class AuthMiddleware
{
    /**
     * Verify JWT token and return user ID
     */
    public static function authenticate(): ?string
    {
        $token = JWTService::getTokenFromHeader();

        if (!$token) {
            http_response_code(401);
            echo json_encode(["error" => "Authorization token required"]);
            exit();
        }

        try {
            $decoded = JWTService::decode($token);
            return $decoded->data->userId;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid or expired token"]);
            exit();
        }
    }
}
