<?php

namespace App\Services;

use App\Database\Connection;
use PDO;

class SettingsService
{
    private static ?PDO $db = null;
    private static array $cache = [];

    /**
     * Get database instance
     */
    private static function getDb(): PDO
    {
        if (self::$db === null) {
            self::$db = Connection::getInstance();
        }
        return self::$db;
    }

    /**
     * Get setting value by key
     *
     * @param string $key Setting key (e.g., 'app.url')
     * @param mixed $default Default value if setting not found
     * @return mixed Parsed setting value
     */
    public static function get(string $key, $default = null)
    {
        // Check cache first
        if (isset(self::$cache[$key])) {
            return self::$cache[$key];
        }

        $stmt = self::getDb()->prepare("
            SELECT setting_value, setting_type
            FROM system_settings
            WHERE setting_key = ?
        ");
        $stmt->execute([$key]);
        $result = $stmt->fetch();

        if (!$result) {
            return $default;
        }

        $value = self::parseValue($result['setting_value'], $result['setting_type']);

        // Cache the value
        self::$cache[$key] = $value;

        return $value;
    }

    /**
     * Get all public settings (cacheable by frontend)
     *
     * @return array Associative array of public settings
     */
    public static function getPublic(): array
    {
        $stmt = self::getDb()->query("
            SELECT setting_key, setting_value, setting_type
            FROM system_settings
            WHERE is_public = TRUE
        ");

        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = self::parseValue(
                $row['setting_value'],
                $row['setting_type']
            );
        }

        return $settings;
    }

    /**
     * Get all settings (Super Admin only)
     *
     * @return array Complete settings with metadata
     */
    public static function getAll(): array
    {
        $stmt = self::getDb()->query("
            SELECT * FROM system_settings
            ORDER BY category, setting_key
        ");

        return $stmt->fetchAll();
    }

    /**
     * Set setting value (Super Admin only)
     *
     * @param string $key Setting key
     * @param mixed $value New value
     * @param string $userId User making the change
     * @param string|null $reason Reason for change
     * @throws \Exception
     */
    public static function set(string $key, $value, string $userId, ?string $reason = null): void
    {
        // Check super admin permission
        if (!self::isSuperAdmin($userId)) {
            throw new \Exception('Unauthorized: Only super admins can modify system settings');
        }

        // Get current setting
        $stmt = self::getDb()->prepare("
            SELECT id, setting_value FROM system_settings
            WHERE setting_key = ?
        ");
        $stmt->execute([$key]);
        $current = $stmt->fetch();

        if (!$current) {
            throw new \Exception("Setting not found: {$key}");
        }

        $oldValue = $current['setting_value'];
        $settingId = $current['id'];

        // Update setting
        $stmt = self::getDb()->prepare("
            UPDATE system_settings
            SET setting_value = ?, updated_by = ?, updated_at = NOW()
            WHERE setting_key = ?
        ");
        $stmt->execute([
            is_array($value) ? json_encode($value) : (string)$value,
            $userId,
            $key
        ]);

        // Log change in history
        self::logChange($settingId, $oldValue, $value, $userId, $reason);

        // Clear cache
        unset(self::$cache[$key]);
    }

    /**
     * Build URL from template
     *
     * @param string $templateKey Setting key containing URL template
     * @param array $variables Variables to replace in template (e.g., ['token' => '123'])
     * @return string Complete URL with variables replaced
     */
    public static function buildUrl(string $templateKey, array $variables): string
    {
        $template = self::get($templateKey);
        if (!$template) {
            throw new \Exception("URL template not found: {$templateKey}");
        }

        $appUrl = self::get('app.url', 'https://aerocheck.com');

        // Merge app_url into variables
        $replacements = array_merge(['app_url' => $appUrl], $variables);

        // Replace {{variable}} with actual values
        foreach ($replacements as $key => $value) {
            $template = str_replace('{{' . $key . '}}', $value, $template);
        }

        return $template;
    }

    /**
     * Parse value according to type
     *
     * @param string $value Raw value from database
     * @param string $type Type (string, integer, boolean, json, url)
     * @return mixed Parsed value
     */
    private static function parseValue(string $value, string $type)
    {
        return match($type) {
            'integer' => (int)$value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($value, true),
            'url', 'string' => $value,
            default => $value,
        };
    }

    /**
     * Check if user is super admin
     *
     * @param string $userId User ID
     * @return bool True if super admin
     */
    private static function isSuperAdmin(string $userId): bool
    {
        $stmt = self::getDb()->prepare("
            SELECT is_super_admin FROM users WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        return $user && $user['is_super_admin'];
    }

    /**
     * Log setting change to history
     *
     * @param string $settingId Setting ID
     * @param string $oldValue Old value
     * @param mixed $newValue New value
     * @param string $userId User who made the change
     * @param string|null $reason Reason for change
     */
    private static function logChange(
        string $settingId,
        string $oldValue,
        $newValue,
        string $userId,
        ?string $reason
    ): void {
        $stmt = self::getDb()->prepare("
            INSERT INTO system_settings_history
            (id, setting_id, old_value, new_value, changed_by, change_reason)
            VALUES (UUID(), ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $settingId,
            $oldValue,
            is_array($newValue) ? json_encode($newValue) : (string)$newValue,
            $userId,
            $reason
        ]);
    }

    /**
     * Get setting history (Super Admin only)
     *
     * @param string $key Setting key
     * @return array History records
     */
    public static function getHistory(string $key): array
    {
        $stmt = self::getDb()->prepare("
            SELECT
                h.*,
                u.email as changed_by_email,
                u.first_name,
                u.last_name
            FROM system_settings_history h
            JOIN system_settings s ON s.id = h.setting_id
            LEFT JOIN users u ON u.id = h.changed_by
            WHERE s.setting_key = ?
            ORDER BY h.created_at DESC
        ");
        $stmt->execute([$key]);

        return $stmt->fetchAll();
    }

    /**
     * Clear cache (useful after bulk updates)
     */
    public static function clearCache(): void
    {
        self::$cache = [];
    }
}
