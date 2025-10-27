<?php

namespace App\Controllers;

use App\Database\Connection;
use App\Helpers\JsonHelper;
use PDO;
use PDOException;

class ExecutionController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    /**
     * Start new checklist execution
     * POST /api/executions
     */
    public function start(string $userId): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["checklistId"])) {
            JsonHelper::error("Checklist ID is required", 400);
            return;
        }

        try {
            // Verify checklist exists and user has access
            $stmt = $this->db->prepare("
                SELECT c.* FROM checklists c
                WHERE c.id = ?
                AND (c.owner_user_id = ? OR c.organization_id IN (
                    SELECT organization_id FROM organization_memberships WHERE user_id = ?
                ))
            ");
            $stmt->execute([$input["checklistId"], $userId, $userId]);
            $checklist = $stmt->fetch();

            if (!$checklist) {
                JsonHelper::error("Checklist not found or access denied", 404);
                return;
            }

            $executionId = $this->generateUUID();

            $stmt = $this->db->prepare("
                INSERT INTO checklist_executions (id, user_id, checklist_id, notes, status)
                VALUES (?, ?, ?, ?, 'in_progress')
            ");
            $stmt->execute([
                $executionId,
                $userId,
                $input["checklistId"],
                $input["notes"] ?? null,
            ]);

            // Fetch the created execution with checklist details
            $this->get($userId, $executionId);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to start execution: " . $e->getMessage(), 500);
        }
    }

    /**
     * Get execution details with all items
     * GET /api/executions/{id}
     */
    public function get(string $userId, string $executionId): void
    {
        try {
            // Get execution with checklist details
            $stmt = $this->db->prepare("
                SELECT
                    e.*,
                    c.name as checklist_name,
                    c.description as checklist_description,
                    a.registration as aircraft_registration,
                    a.type as aircraft_type
                FROM checklist_executions e
                INNER JOIN checklists c ON c.id = e.checklist_id
                LEFT JOIN aircraft a ON a.id = c.aircraft_id
                WHERE e.id = ? AND e.user_id = ?
            ");
            $stmt->execute([$executionId, $userId]);
            $execution = $stmt->fetch();

            if (!$execution) {
                JsonHelper::error("Execution not found", 404);
                return;
            }

            // Get all checklist items
            $stmt = $this->db->prepare("
                SELECT * FROM checklist_items
                WHERE checklist_id = ?
                ORDER BY phase, sort_order ASC
            ");
            $stmt->execute([$execution['checklist_id']]);
            $allItems = $stmt->fetchAll();

            // Get completed execution items
            $stmt = $this->db->prepare("
                SELECT * FROM checklist_execution_items
                WHERE execution_id = ?
            ");
            $stmt->execute([$executionId]);
            $completedItems = $stmt->fetchAll();

            // Create a map of completed items by checklist_item_id
            $completedMap = [];
            foreach ($completedItems as $item) {
                $completedMap[$item['checklist_item_id']] = $item;
            }

            // Merge completed status into all items
            $items = array_map(function ($item) use ($completedMap) {
                $item['execution_status'] = null;
                $item['execution_action'] = null;
                $item['execution_notes'] = null;
                $item['execution_actual_value'] = null;
                $item['execution_completed_at'] = null;

                if (isset($completedMap[$item['id']])) {
                    $execItem = $completedMap[$item['id']];
                    $item['execution_status'] = $execItem['action'];
                    $item['execution_action'] = $execItem['action'];
                    $item['execution_notes'] = $execItem['notes'];
                    $item['execution_actual_value'] = $execItem['actual_value'];
                    $item['execution_completed_at'] = $execItem['completed_at'];
                }

                return $item;
            }, $allItems);

            $execution['items'] = $items;

            JsonHelper::send(["data" => $execution]);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to fetch execution: " . $e->getMessage(), 500);
        }
    }

    /**
     * Mark an item as completed/skipped/failed
     * POST /api/executions/{id}/items/{itemId}
     */
    public function updateItem(string $userId, string $executionId, string $itemId): void
    {
        $input = json_decode(file_get_contents("php://input"), true);

        try {
            // Verify execution belongs to user
            $stmt = $this->db->prepare("
                SELECT * FROM checklist_executions
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$executionId, $userId]);
            $execution = $stmt->fetch();

            if (!$execution) {
                JsonHelper::error("Execution not found", 404);
                return;
            }

            if ($execution['status'] !== 'in_progress') {
                JsonHelper::error("Execution is not in progress", 400);
                return;
            }

            $action = $input["action"] ?? "completed";
            if (!in_array($action, ['completed', 'skipped', 'failed'])) {
                JsonHelper::error("Invalid action", 400);
                return;
            }

            // Upsert execution item
            $stmt = $this->db->prepare("
                INSERT INTO checklist_execution_items (
                    id, execution_id, checklist_item_id, action, notes, actual_value
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    action = VALUES(action),
                    notes = VALUES(notes),
                    actual_value = VALUES(actual_value),
                    completed_at = CURRENT_TIMESTAMP
            ");

            $stmt->execute([
                $this->generateUUID(),
                $executionId,
                $itemId,
                $action,
                $input["notes"] ?? null,
                $input["actualValue"] ?? null,
            ]);

            JsonHelper::success("Item updated");
        } catch (PDOException $e) {
            JsonHelper::error("Failed to update item: " . $e->getMessage(), 500);
        }
    }

    /**
     * Complete the execution
     * POST /api/executions/{id}/complete
     */
    public function complete(string $userId, string $executionId): void
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE checklist_executions
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ? AND status = 'in_progress'
            ");
            $stmt->execute([$executionId, $userId]);

            if ($stmt->rowCount() === 0) {
                JsonHelper::error("Execution not found or already completed", 404);
                return;
            }

            JsonHelper::success("Execution completed");
        } catch (PDOException $e) {
            JsonHelper::error("Failed to complete execution: " . $e->getMessage(), 500);
        }
    }

    /**
     * Abort the execution
     * POST /api/executions/{id}/abort
     */
    public function abort(string $userId, string $executionId): void
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE checklist_executions
                SET status = 'aborted', completed_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ? AND status = 'in_progress'
            ");
            $stmt->execute([$executionId, $userId]);

            if ($stmt->rowCount() === 0) {
                JsonHelper::error("Execution not found or already completed", 404);
                return;
            }

            JsonHelper::success("Execution aborted");
        } catch (PDOException $e) {
            JsonHelper::error("Failed to abort execution: " . $e->getMessage(), 500);
        }
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
