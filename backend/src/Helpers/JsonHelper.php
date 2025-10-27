<?php

namespace App\Helpers;

/**
 * JSON Response Helper
 *
 * Converts PHP arrays (snake_case) to JSON (camelCase) according to industry standards:
 * - Database layer: snake_case (SQL standard)
 * - Application layer: snake_case (PHP arrays from PDO)
 * - API layer: camelCase (JSON/JavaScript standard)
 *
 * This class provides the conversion layer between application and API.
 */
class JsonHelper
{
    /**
     * Database fields that should be converted to boolean in JSON
     * (MySQL BOOLEAN is stored as TINYINT(1), PDO returns as integer)
     */
    private static array $booleanFields = [
        "email_verified",
        "is_super_admin",
        "is_active",
        "is_available",
        "is_public",
        "is_template",
        "is_default",
        "can_edit",
        "can_delete",
        "allow_guest_access",
        "is_critical",              // Checklist items
        "requires_confirmation",    // Checklist items
    ];

    /**
     * Convert array keys from snake_case to camelCase recursively
     * Also handles MySQL boolean conversion
     *
     * @param array $array Data to convert
     * @return array Converted array with camelCase keys
     */
    public static function toCamelCase(array $array): array
    {
        $result = [];

        foreach ($array as $key => $value) {
            $camelKey = self::snakeToCamel($key);

            // Handle boolean fields (MySQL TINYINT -> JavaScript boolean)
            if (in_array($key, self::$booleanFields) && ($value === 0 || $value === 1 || $value === "0" || $value === "1")) {
                $result[$camelKey] = (bool) $value;
            }
            // Recursively convert nested arrays
            elseif (is_array($value)) {
                $result[$camelKey] = self::toCamelCase($value);
            }
            // Keep other values as-is
            else {
                $result[$camelKey] = $value;
            }
        }

        return $result;
    }

    /**
     * Convert snake_case string to camelCase
     *
     * @param string $string snake_case string
     * @return string camelCase string
     */
    private static function snakeToCamel(string $string): string
    {
        return lcfirst(str_replace("_", "", ucwords($string, "_")));
    }

    /**
     * Send JSON response with proper HTTP status code
     * Automatically converts snake_case to camelCase
     *
     * @param array $data Response data
     * @param int $statusCode HTTP status code (default 200)
     * @return void
     */
    public static function send(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        echo json_encode(self::toCamelCase($data));
    }

    /**
     * Send error response with consistent format
     *
     * @param string $message Error message
     * @param int $statusCode HTTP status code (default 400)
     * @param array $extra Additional error data (optional)
     * @return void
     */
    public static function error(string $message, int $statusCode = 400, array $extra = []): void
    {
        $data = array_merge(["error" => $message], $extra);
        self::send($data, $statusCode);
    }

    /**
     * Send success response with consistent format
     *
     * @param string $message Success message
     * @param array $data Additional data (optional)
     * @param int $statusCode HTTP status code (default 200)
     * @return void
     */
    public static function success(string $message, array $data = [], int $statusCode = 200): void
    {
        $response = array_merge(["message" => $message], $data);
        self::send($response, $statusCode);
    }
}
