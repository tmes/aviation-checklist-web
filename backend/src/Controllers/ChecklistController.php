<?php

namespace App\Controllers;

use App\Database\Connection;
use App\Helpers\JsonHelper;
use PDO;
use PDOException;

class ChecklistController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    /**
     * Get all checklists for user (personal + organization checklists)
     * GET /api/checklists
     */
    public function list(string $userId): void
    {
        try {
            // Get user's organizations
            $stmt = $this->db->prepare("
                SELECT organization_id FROM organization_memberships
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $memberships = $stmt->fetchAll();
            $orgIds = array_column($memberships, 'organization_id');

            // Build query for both personal and organization checklists
            if (empty($orgIds)) {
                // Only personal checklists
                $stmt = $this->db->prepare("
                    SELECT
                        c.*,
                        a.registration as aircraft_registration,
                        a.type as aircraft_type,
                        NULL as organization_name,
                        (SELECT COUNT(*) FROM checklist_items WHERE checklist_id = c.id) as item_count
                    FROM checklists c
                    LEFT JOIN aircraft a ON a.id = c.aircraft_id
                    WHERE c.owner_user_id = ?
                    ORDER BY c.created_at DESC
                ");
                $stmt->execute([$userId]);
            } else {
                // Both personal and organization checklists
                $placeholders = implode(',', array_fill(0, count($orgIds), '?'));
                $stmt = $this->db->prepare("
                    SELECT
                        c.*,
                        a.registration as aircraft_registration,
                        a.type as aircraft_type,
                        o.name as organization_name,
                        (SELECT COUNT(*) FROM checklist_items WHERE checklist_id = c.id) as item_count
                    FROM checklists c
                    LEFT JOIN aircraft a ON a.id = c.aircraft_id
                    LEFT JOIN organizations o ON o.id = c.organization_id
                    WHERE c.owner_user_id = ? OR c.organization_id IN ($placeholders)
                    ORDER BY c.created_at DESC
                ");
                $stmt->execute(array_merge([$userId], $orgIds));
            }

            $checklists = $stmt->fetchAll();
            JsonHelper::send(["data" => $checklists]);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to fetch checklists: " . $e->getMessage(), 500);
        }
    }

    /**
     * Get single checklist with its items
     * GET /api/checklists/{id}
     */
    public function get(string $userId, string $checklistId): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    c.*,
                    a.registration as aircraft_registration,
                    a.type as aircraft_type,
                    o.name as organization_name
                FROM checklists c
                LEFT JOIN aircraft a ON a.id = c.aircraft_id
                LEFT JOIN organizations o ON o.id = c.organization_id
                WHERE c.id = ?
            ");
            $stmt->execute([$checklistId]);
            $checklist = $stmt->fetch();

            if (!$checklist) {
                JsonHelper::error("Checklist not found", 404);
                return;
            }

            // Verify user has access
            if (!$this->userHasAccess($userId, $checklist)) {
                JsonHelper::error("Access denied", 403);
                return;
            }

            // Get checklist items
            $stmt = $this->db->prepare("
                SELECT *
                FROM checklist_items
                WHERE checklist_id = ?
                ORDER BY phase, sort_order ASC
            ");
            $stmt->execute([$checklistId]);
            $checklist['items'] = $stmt->fetchAll();

            JsonHelper::send(["data" => $checklist]);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to fetch checklist: " . $e->getMessage(), 500);
        }
    }

    /**
     * Create new checklist
     * POST /api/checklists
     */
    public function create(string $userId): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        // Validation
        if (empty($input["name"])) {
            JsonHelper::error("Name is required", 400);
            return;
        }

        try {
            $this->db->beginTransaction();

            $checklistId = $this->generateUUID();

            // Determine if this is personal or organization checklist
            $organizationId = $input["organizationId"] ?? null;
            $ownerUserId = $organizationId ? null : $userId;

            // If organization is specified, verify user is member
            if ($organizationId) {
                if (!$this->userIsMemberOfOrganization($userId, $organizationId)) {
                    JsonHelper::error("Access denied to organization", 403);
                    return;
                }
            }

            $stmt = $this->db->prepare("
                INSERT INTO checklists (id, organization_id, owner_user_id, aircraft_id, name, description, created_by, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ");

            $stmt->execute([
                $checklistId,
                $organizationId,
                $ownerUserId,
                $input["aircraftId"] ?? null,
                $input["name"],
                $input["description"] ?? null,
                $userId,
            ]);

            // Add checklist items if provided
            if (!empty($input["items"]) && is_array($input["items"])) {
                $this->addChecklistItems($checklistId, $input["items"]);
            }

            $this->db->commit();

            // Fetch the created checklist
            $this->get($userId, $checklistId);
        } catch (PDOException $e) {
            $this->db->rollBack();
            JsonHelper::error("Failed to create checklist: " . $e->getMessage(), 500);
        }
    }

    /**
     * Update checklist
     * PUT /api/checklists/{id}
     */
    public function update(string $userId, string $checklistId): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        try {
            // Verify checklist exists and user has access
            $stmt = $this->db->prepare("SELECT * FROM checklists WHERE id = ?");
            $stmt->execute([$checklistId]);
            $checklist = $stmt->fetch();

            if (!$checklist) {
                JsonHelper::error("Checklist not found", 404);
                return;
            }

            if (!$this->userHasAccess($userId, $checklist)) {
                JsonHelper::error("Access denied", 403);
                return;
            }

            $this->db->beginTransaction();

            // Update checklist
            $fields = [];
            $params = [];

            if (isset($input["name"])) {
                $fields[] = "name = ?";
                $params[] = $input["name"];
            }

            if (isset($input["description"])) {
                $fields[] = "description = ?";
                $params[] = $input["description"];
            }

            if (isset($input["aircraftId"])) {
                $fields[] = "aircraft_id = ?";
                $params[] = $input["aircraftId"];
            }

            if (isset($input["isActive"])) {
                $fields[] = "is_active = ?";
                $params[] = $input["isActive"] ? 1 : 0;
            }

            if (!empty($fields)) {
                $params[] = $checklistId;
                $sql = "UPDATE checklists SET " . implode(", ", $fields) . " WHERE id = ?";
                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
            }

            // Update items if provided
            if (isset($input["items"]) && is_array($input["items"])) {
                // Delete existing items
                $stmt = $this->db->prepare("DELETE FROM checklist_items WHERE checklist_id = ?");
                $stmt->execute([$checklistId]);

                // Add new items
                $this->addChecklistItems($checklistId, $input["items"]);
            }

            $this->db->commit();

            // Fetch updated checklist
            $this->get($userId, $checklistId);
        } catch (PDOException $e) {
            $this->db->rollBack();
            JsonHelper::error("Failed to update checklist: " . $e->getMessage(), 500);
        }
    }

    /**
     * Delete checklist
     * DELETE /api/checklists/{id}
     */
    public function delete(string $userId, string $checklistId): void
    {
        try {
            // Verify checklist exists and user has access
            $stmt = $this->db->prepare("SELECT * FROM checklists WHERE id = ?");
            $stmt->execute([$checklistId]);
            $checklist = $stmt->fetch();

            if (!$checklist) {
                JsonHelper::error("Checklist not found", 404);
                return;
            }

            if (!$this->userHasAccess($userId, $checklist)) {
                JsonHelper::error("Access denied", 403);
                return;
            }

            // Delete checklist (items will cascade delete)
            $stmt = $this->db->prepare("DELETE FROM checklists WHERE id = ?");
            $stmt->execute([$checklistId]);

            JsonHelper::success("Checklist deleted successfully");
        } catch (PDOException $e) {
            JsonHelper::error("Failed to delete checklist: " . $e->getMessage(), 500);
        }
    }

    /**
     * Helper: Add checklist items
     */
    private function addChecklistItems(string $checklistId, array $items): void
    {
        $stmt = $this->db->prepare("
            INSERT INTO checklist_items (id, checklist_id, phase, item_text, expected_value, sort_order, is_critical, requires_confirmation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($items as $index => $item) {
            $stmt->execute([
                $this->generateUUID(),
                $checklistId,
                $item["phase"],
                $item["itemText"],
                $item["expectedValue"] ?? null,
                $item["sortOrder"] ?? $index,
                ($item["isCritical"] ?? false) ? 1 : 0,
                ($item["requiresConfirmation"] ?? true) ? 1 : 0,
            ]);
        }
    }

    /**
     * Helper: Check if user has access to checklist
     */
    private function userHasAccess(string $userId, array $checklist): bool
    {
        // Personal owner
        if ($checklist['owner_user_id'] === $userId) {
            return true;
        }

        // Organization member
        if ($checklist['organization_id']) {
            return $this->userIsMemberOfOrganization($userId, $checklist['organization_id']);
        }

        return false;
    }

    /**
     * Helper: Check if user is member of organization
     */
    private function userIsMemberOfOrganization(string $userId, string $organizationId): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count
            FROM organization_memberships
            WHERE user_id = ? AND organization_id = ?
        ");
        $stmt->execute([$userId, $organizationId]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
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
