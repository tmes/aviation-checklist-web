<?php

// Enable error reporting for development
error_reporting(E_ALL);
ini_set("display_errors", "1");

// CORS Headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Load Composer autoloader
require_once __DIR__ . "/../vendor/autoload.php";

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

// Import controllers and middleware
use App\Controllers\AuthController;
use App\Controllers\AircraftController;
use App\Controllers\ChecklistController;
use App\Controllers\ExecutionController;
use App\Controllers\TranslationController;
use App\Helpers\JsonHelper;
use App\Middleware\AuthMiddleware;

// Parse request
$method = $_SERVER["REQUEST_METHOD"];
$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = rtrim($uri, "/"); // Remove trailing slash

// Simple router
try {
    // Health check endpoint
    if ($uri === "/api/health" && $method === "GET") {
        $pdo = App\Database\Connection::getInstance();
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM aircraft_types");
        $result = $stmt->fetch();

        JsonHelper::send([
            "status" => "ok",
            "message" => "Aerocheck API is running",
            "database" => "connected",
            "aircraft_types" => $result["count"],
            "timestamp" => date("Y-m-d H:i:s"),
        ]);
        exit();
    }

    // Auth routes (public)
    if ($uri === "/api/auth/register" && $method === "POST") {
        $controller = new AuthController();
        $controller->register();
        exit();
    }

    if ($uri === "/api/auth/login" && $method === "POST") {
        $controller = new AuthController();
        $controller->login();
        exit();
    }

    if ($uri === "/api/auth/verify-email" && $method === "POST") {
        $controller = new AuthController();
        $controller->verifyEmail();
        exit();
    }

    if ($uri === "/api/auth/resend-verification" && $method === "POST") {
        $controller = new AuthController();
        $controller->resendVerification();
        exit();
    }

    // Protected routes (require authentication)
    if ($uri === "/api/users/me" && $method === "GET") {
        $userId = AuthMiddleware::authenticate();
        $controller = new AuthController();
        $controller->me($userId);
        exit();
    }

    if ($uri === "/api/users/profile" && $method === "PUT") {
        $userId = AuthMiddleware::authenticate();
        $controller = new AuthController();
        $controller->updateProfile($userId);
        exit();
    }

    if ($uri === "/api/users/password" && $method === "PUT") {
        $userId = AuthMiddleware::authenticate();
        $controller = new AuthController();
        $controller->changePassword($userId);
        exit();
    }

    // Aircraft routes (protected)
    if ($uri === "/api/aircraft" && $method === "GET") {
        $userId = AuthMiddleware::authenticate();
        $controller = new AircraftController();
        $controller->list($userId);
        exit();
    }

    if ($uri === "/api/aircraft" && $method === "POST") {
        $userId = AuthMiddleware::authenticate();
        $controller = new AircraftController();
        $controller->create($userId);
        exit();
    }

    if (preg_match('#^/api/aircraft/([a-f0-9-]{36})$#', $uri, $matches) && $method === "GET") {
        $userId = AuthMiddleware::authenticate();
        $aircraftId = $matches[1];
        $controller = new AircraftController();
        $controller->get($userId, $aircraftId);
        exit();
    }

    if (preg_match('#^/api/aircraft/([a-f0-9-]{36})$#', $uri, $matches) && $method === "PUT") {
        $userId = AuthMiddleware::authenticate();
        $aircraftId = $matches[1];
        $controller = new AircraftController();
        $controller->update($userId, $aircraftId);
        exit();
    }

    if (preg_match('#^/api/aircraft/([a-f0-9-]{36})$#', $uri, $matches) && $method === "DELETE") {
        $userId = AuthMiddleware::authenticate();
        $aircraftId = $matches[1];
        $controller = new AircraftController();
        $controller->delete($userId, $aircraftId);
        exit();
    }

    // Checklist routes (protected)
    if ($uri === "/api/checklists" && $method === "GET") {
        $userId = AuthMiddleware::authenticate();
        $controller = new ChecklistController();
        $controller->list($userId);
        exit();
    }

    if ($uri === "/api/checklists" && $method === "POST") {
        $userId = AuthMiddleware::authenticate();
        $controller = new ChecklistController();
        $controller->create($userId);
        exit();
    }

    if (preg_match('#^/api/checklists/([a-f0-9-]{36})$#', $uri, $matches) && $method === "GET") {
        $userId = AuthMiddleware::authenticate();
        $checklistId = $matches[1];
        $controller = new ChecklistController();
        $controller->get($userId, $checklistId);
        exit();
    }

    if (preg_match('#^/api/checklists/([a-f0-9-]{36})$#', $uri, $matches) && $method === "PUT") {
        $userId = AuthMiddleware::authenticate();
        $checklistId = $matches[1];
        $controller = new ChecklistController();
        $controller->update($userId, $checklistId);
        exit();
    }

    if (preg_match('#^/api/checklists/([a-f0-9-]{36})$#', $uri, $matches) && $method === "DELETE") {
        $userId = AuthMiddleware::authenticate();
        $checklistId = $matches[1];
        $controller = new ChecklistController();
        $controller->delete($userId, $checklistId);
        exit();
    }

    // Execution routes (protected)
    if ($uri === "/api/executions" && $method === "POST") {
        $userId = AuthMiddleware::authenticate();
        $controller = new ExecutionController();
        $controller->start($userId);
        exit();
    }

    if (preg_match('#^/api/executions/([a-f0-9-]{36})$#', $uri, $matches) && $method === "GET") {
        $userId = AuthMiddleware::authenticate();
        $executionId = $matches[1];
        $controller = new ExecutionController();
        $controller->get($userId, $executionId);
        exit();
    }

    if (preg_match('#^/api/executions/([a-f0-9-]{36})/items/([a-f0-9-]{36})$#', $uri, $matches) && $method === "POST") {
        $userId = AuthMiddleware::authenticate();
        $executionId = $matches[1];
        $itemId = $matches[2];
        $controller = new ExecutionController();
        $controller->updateItem($userId, $executionId, $itemId);
        exit();
    }

    if (preg_match('#^/api/executions/([a-f0-9-]{36})/complete$#', $uri, $matches) && $method === "POST") {
        $userId = AuthMiddleware::authenticate();
        $executionId = $matches[1];
        $controller = new ExecutionController();
        $controller->complete($userId, $executionId);
        exit();
    }

    if (preg_match('#^/api/executions/([a-f0-9-]{36})/abort$#', $uri, $matches) && $method === "POST") {
        $userId = AuthMiddleware::authenticate();
        $executionId = $matches[1];
        $controller = new ExecutionController();
        $controller->abort($userId, $executionId);
        exit();
    }

    // Translation routes (public - cacheable)
    if (preg_match('#^/api/translations/([a-z]{2,5})$#', $uri, $matches) && $method === "GET") {
        $languageCode = $matches[1];
        $controller = new TranslationController();
        $controller->getTranslations($languageCode);
        exit();
    }

    if ($uri === "/api/translations/languages" && $method === "GET") {
        $controller = new TranslationController();
        $controller->getLanguages();
        exit();
    }

    // Translation admin routes (Super Admin only)
    if ($uri === "/api/admin/translations" && $method === "GET") {
        $userId = AuthMiddleware::authenticate();
        $controller = new TranslationController();
        $controller->getAllTranslations($userId);
        exit();
    }

    if ($uri === "/api/admin/translations" && $method === "PUT") {
        $userId = AuthMiddleware::authenticate();
        $controller = new TranslationController();
        $controller->updateTranslation($userId);
        exit();
    }

    if (preg_match('#^/api/admin/translations/([a-f0-9-]{36})$#', $uri, $matches) && $method === "DELETE") {
        $userId = AuthMiddleware::authenticate();
        $translationId = $matches[1];
        $controller = new TranslationController();
        $controller->deleteTranslation($userId, $translationId);
        exit();
    }

    if ($uri === "/api/admin/translations/import" && $method === "POST") {
        $userId = AuthMiddleware::authenticate();
        $controller = new TranslationController();
        $controller->importTranslations($userId);
        exit();
    }

    // Root endpoint
    if ($uri === "" || $uri === "/" || $uri === "/api") {
        JsonHelper::send([
            "name" => "Aerocheck API",
            "version" => "1.0.0",
            "status" => "running",
            "endpoints" => [
                "GET /api/health" => "Health check",
                "POST /api/auth/register" => "Register new user",
                "POST /api/auth/login" => "Login user",
                "POST /api/auth/verify-email" => "Verify email with token",
                "POST /api/auth/resend-verification" => "Resend verification email",
                "GET /api/users/me" => "Get current user (protected)",
            ],
        ]);
        exit();
    }

    // 404 - Route not found
    JsonHelper::error("Endpoint not found", 404, [
        "path" => $uri,
        "method" => $method,
    ]);
} catch (Exception $e) {
    JsonHelper::error("Server error: " . $e->getMessage(), 500);
}
