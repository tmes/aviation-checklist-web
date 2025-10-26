<?php

namespace App\Controllers;

use App\Database\Connection;
use App\Helpers\JsonHelper;
use App\Services\PermissionService;
use PDO;

class TranslationController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    /**
     * Get all translations for a specific language
     * GET /api/translations/{language_code}
     */
    public function getTranslations(string $languageCode): void
    {
        // Validate language code
        $stmt = $this->db->prepare("
            SELECT * FROM supported_languages WHERE language_code = ? AND is_active = TRUE
        ");
        $stmt->execute([$languageCode]);

        if (!$stmt->fetch()) {
            JsonHelper::error('Language not supported', 404);
            return;
        }

        // Get all translations for this language, grouped by namespace
        $stmt = $this->db->prepare("
            SELECT translation_key, translation_text, namespace
            FROM translations
            WHERE language_code = ?
            ORDER BY namespace, translation_key
        ");
        $stmt->execute([$languageCode]);

        $translations = [];
        while ($row = $stmt->fetch()) {
            $namespace = $row['namespace'] ?? 'common';

            if (!isset($translations[$namespace])) {
                $translations[$namespace] = [];
            }

            // Use dot notation for keys (auth.login, common.save, etc.)
            $translations[$namespace][$row['translation_key']] = $row['translation_text'];
        }

        // Flatten to single object with namespaced keys
        $flatTranslations = [];
        foreach ($translations as $namespace => $keys) {
            foreach ($keys as $key => $text) {
                $flatTranslations[$key] = $text;
            }
        }

        // Set cache headers (1 hour)
        header('Cache-Control: public, max-age=3600');

        // Note: Translations are already in the correct format (flat key-value pairs)
        // No camelCase conversion needed for translation keys
        http_response_code(200);
        echo json_encode($flatTranslations);
    }

    /**
     * Get all supported languages
     * GET /api/translations/languages
     */
    public function getLanguages(): void
    {
        $stmt = $this->db->query("
            SELECT * FROM supported_languages
            WHERE is_active = TRUE
            ORDER BY is_default DESC, language_name ASC
        ");

        $languages = $stmt->fetchAll();

        JsonHelper::send(['data' => $languages]);
    }

    /**
     * Get all translations with metadata (Super Admin only)
     * GET /api/admin/translations
     */
    public function getAllTranslations(string $userId): void
    {
        try {
            PermissionService::require($userId, 'system.translations.edit');

            $stmt = $this->db->query("
                SELECT
                    t.*,
                    u.email as updated_by_email,
                    u.first_name,
                    u.last_name
                FROM translations t
                LEFT JOIN users u ON u.id = t.updated_by
                ORDER BY t.language_code, t.namespace, t.translation_key
            ");

            $translations = $stmt->fetchAll();

            JsonHelper::send([
                'data' => $translations,
                'total' => count($translations)
            ]);
        } catch (\Exception $e) {
            JsonHelper::error($e->getMessage(), 403);
        }
    }

    /**
     * Create or update translation (Super Admin only)
     * PUT /api/admin/translations
     */
    public function updateTranslation(string $userId): void
    {
        try {
            PermissionService::require($userId, 'system.translations.edit');

            $input = json_decode(file_get_contents('php://input'), true);

            // Validation
            $required = ['translation_key', 'language_code', 'translation_text'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    JsonHelper::error("Field required: {$field}", 400);
                    return;
                }
            }

            // Check if translation exists
            $stmt = $this->db->prepare("
                SELECT id FROM translations
                WHERE translation_key = ? AND language_code = ? AND namespace = ?
            ");
            $stmt->execute([
                $input['translation_key'],
                $input['language_code'],
                $input['namespace'] ?? 'common'
            ]);

            $existing = $stmt->fetch();

            if ($existing) {
                // Update existing
                $stmt = $this->db->prepare("
                    UPDATE translations
                    SET translation_text = ?,
                        description = ?,
                        updated_by = ?,
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([
                    $input['translation_text'],
                    $input['description'] ?? null,
                    $userId,
                    $existing['id']
                ]);

                JsonHelper::success('Translation updated successfully', ['id' => $existing['id']]);
            } else {
                // Create new
                $translationId = $this->generateUUID();

                $stmt = $this->db->prepare("
                    INSERT INTO translations
                    (id, translation_key, language_code, translation_text, namespace, description, updated_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $translationId,
                    $input['translation_key'],
                    $input['language_code'],
                    $input['translation_text'],
                    $input['namespace'] ?? 'common',
                    $input['description'] ?? null,
                    $userId
                ]);

                JsonHelper::success('Translation created successfully', ['id' => $translationId], 201);
            }
        } catch (\Exception $e) {
            JsonHelper::error($e->getMessage(), 403);
        }
    }

    /**
     * Delete translation (Super Admin only)
     * DELETE /api/admin/translations/{id}
     */
    public function deleteTranslation(string $userId, string $translationId): void
    {
        try {
            PermissionService::require($userId, 'system.translations.edit');

            $stmt = $this->db->prepare("DELETE FROM translations WHERE id = ?");
            $stmt->execute([$translationId]);

            JsonHelper::success('Translation deleted successfully');
        } catch (\Exception $e) {
            JsonHelper::error($e->getMessage(), 403);
        }
    }

    /**
     * Bulk import translations (Super Admin only)
     * POST /api/admin/translations/import
     */
    public function importTranslations(string $userId): void
    {
        try {
            PermissionService::require($userId, 'system.translations.edit');

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['translations']) || !is_array($input['translations'])) {
                JsonHelper::error('translations array required', 400);
                return;
            }

            $imported = 0;
            $errors = [];

            foreach ($input['translations'] as $translation) {
                try {
                    // Check if exists
                    $stmt = $this->db->prepare("
                        SELECT id FROM translations
                        WHERE translation_key = ? AND language_code = ?
                    ");
                    $stmt->execute([
                        $translation['translation_key'],
                        $translation['language_code']
                    ]);

                    if ($stmt->fetch()) {
                        // Update
                        $stmt = $this->db->prepare("
                            UPDATE translations
                            SET translation_text = ?, updated_by = ?, updated_at = NOW()
                            WHERE translation_key = ? AND language_code = ?
                        ");
                        $stmt->execute([
                            $translation['translation_text'],
                            $userId,
                            $translation['translation_key'],
                            $translation['language_code']
                        ]);
                    } else {
                        // Insert
                        $stmt = $this->db->prepare("
                            INSERT INTO translations
                            (id, translation_key, language_code, translation_text, namespace, updated_by)
                            VALUES (UUID(), ?, ?, ?, ?, ?)
                        ");
                        $stmt->execute([
                            $translation['translation_key'],
                            $translation['language_code'],
                            $translation['translation_text'],
                            $translation['namespace'] ?? 'common',
                            $userId
                        ]);
                    }

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'key' => $translation['translation_key'] ?? 'unknown',
                        'error' => $e->getMessage()
                    ];
                }
            }

            JsonHelper::send([
                'message' => "Imported {$imported} translations",
                'imported' => $imported,
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            JsonHelper::error($e->getMessage(), 403);
        }
    }

    /**
     * Helper: Generate UUID v4
     */
    private function generateUUID(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
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
