<?php

namespace App\Controllers;

use App\Database\Connection;
use App\Helpers\JsonHelper;
use PDO;
use PDOException;

class AircraftController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    /**
     * Get all aircraft for user (personal + organization aircraft)
     * GET /api/aircraft
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

            // Build query for both personal and organization aircraft
            if (empty($orgIds)) {
                // Only personal aircraft
                $stmt = $this->db->prepare("
                    SELECT
                        a.*,
                        NULL as organization_name
                    FROM aircraft a
                    WHERE a.owner_user_id = ?
                    ORDER BY a.registration ASC
                ");
                $stmt->execute([$userId]);
            } else {
                // Both personal and organization aircraft
                $placeholders = implode(',', array_fill(0, count($orgIds), '?'));
                $stmt = $this->db->prepare("
                    SELECT
                        a.*,
                        o.name as organization_name
                    FROM aircraft a
                    LEFT JOIN organizations o ON o.id = a.organization_id
                    WHERE a.owner_user_id = ? OR a.organization_id IN ($placeholders)
                    ORDER BY a.registration ASC
                ");
                $stmt->execute(array_merge([$userId], $orgIds));
            }

            $aircraft = $stmt->fetchAll();
            JsonHelper::send(["data" => $aircraft]);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to fetch aircraft: " . $e->getMessage(), 500);
        }
    }

    /**
     * Get single aircraft
     * GET /api/aircraft/{id}
     */
    public function get(string $userId, string $aircraftId): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    a.*,
                    o.name as organization_name
                FROM aircraft a
                LEFT JOIN organizations o ON o.id = a.organization_id
                WHERE a.id = ?
            ");
            $stmt->execute([$aircraftId]);
            $aircraft = $stmt->fetch();

            if (!$aircraft) {
                JsonHelper::error("Aircraft not found", 404);
                return;
            }

            // Verify user has access (owner or organization member)
            $hasAccess = false;

            // Check if user is personal owner
            if ($aircraft['owner_user_id'] === $userId) {
                $hasAccess = true;
            }

            // Check if user is member of organization
            if (!$hasAccess && $aircraft['organization_id']) {
                $stmt = $this->db->prepare("
                    SELECT 1 FROM organization_memberships
                    WHERE user_id = ? AND organization_id = ?
                ");
                $stmt->execute([$userId, $aircraft['organization_id']]);
                $hasAccess = (bool)$stmt->fetch();
            }

            if (!$hasAccess) {
                JsonHelper::error("Access denied", 403);
                return;
            }

            JsonHelper::send(["data" => $aircraft]);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to fetch aircraft: " . $e->getMessage(), 500);
        }
    }

    /**
     * Create new aircraft (personal or organization)
     * POST /api/aircraft
     */
    public function create(string $userId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Validation - registration and type are always required
            $required = ['registration', 'type'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    JsonHelper::error("Field required: {$field}", 400);
                    return;
                }
            }

            // Validate ownership: must have EITHER organization_id OR create as personal
            $organizationId = $input['organization_id'] ?? null;
            $ownerUserId = null;

            if ($organizationId) {
                // Creating for organization - verify membership
                $stmt = $this->db->prepare("
                    SELECT role FROM organization_memberships
                    WHERE user_id = ? AND organization_id = ?
                ");
                $stmt->execute([$userId, $organizationId]);
                $membership = $stmt->fetch();

                if (!$membership) {
                    JsonHelper::error("You are not a member of this organization", 403);
                    return;
                }
            } else {
                // Creating personal aircraft
                $ownerUserId = $userId;
            }

            // Check if registration already exists
            $stmt = $this->db->prepare("SELECT id FROM aircraft WHERE registration = ?");
            $stmt->execute([$input['registration']]);
            if ($stmt->fetch()) {
                JsonHelper::error("Registration already exists", 409);
                return;
            }

            // Create aircraft
            $aircraftId = $this->generateUUID();

            $stmt = $this->db->prepare("
                INSERT INTO aircraft (
                    id, organization_id, owner_user_id, registration, type, manufacturer, model,
                    category, year_manufactured, serial_number, max_weight_kg,
                    fuel_capacity_liters, is_active, is_available, notes, photo_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $aircraftId,
                $organizationId,
                $ownerUserId,
                $input['registration'],
                $input['type'],
                $input['manufacturer'] ?? null,
                $input['model'] ?? null,
                $input['category'] ?? 'single_engine',
                $input['year_manufactured'] ?? null,
                $input['serial_number'] ?? null,
                $input['max_weight_kg'] ?? null,
                $input['fuel_capacity_liters'] ?? null,
                $input['is_active'] ?? true,
                $input['is_available'] ?? true,
                $input['notes'] ?? null,
                $input['photo_url'] ?? null,
            ]);

            // Fetch created aircraft
            $stmt = $this->db->prepare("
                SELECT
                    a.*,
                    o.name as organization_name
                FROM aircraft a
                LEFT JOIN organizations o ON o.id = a.organization_id
                WHERE a.id = ?
            ");
            $stmt->execute([$aircraftId]);
            $aircraft = $stmt->fetch();

            JsonHelper::success("Aircraft created successfully", ["aircraft" => $aircraft], 201);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to create aircraft: " . $e->getMessage(), 500);
        }
    }

    /**
     * Update aircraft
     * PUT /api/aircraft/{id}
     */
    public function update(string $userId, string $aircraftId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Get aircraft and verify access
            $stmt = $this->db->prepare("SELECT organization_id, owner_user_id FROM aircraft WHERE id = ?");
            $stmt->execute([$aircraftId]);
            $aircraft = $stmt->fetch();

            if (!$aircraft) {
                JsonHelper::error("Aircraft not found", 404);
                return;
            }

            // Verify user has access (owner or organization member)
            $hasAccess = false;

            // Check if user is personal owner
            if ($aircraft['owner_user_id'] === $userId) {
                $hasAccess = true;
            }

            // Check if user is member of organization
            if (!$hasAccess && $aircraft['organization_id']) {
                $stmt = $this->db->prepare("
                    SELECT role FROM organization_memberships
                    WHERE user_id = ? AND organization_id = ?
                ");
                $stmt->execute([$userId, $aircraft['organization_id']]);
                $hasAccess = (bool)$stmt->fetch();
            }

            if (!$hasAccess) {
                JsonHelper::error("Access denied", 403);
                return;
            }

            // Check if registration is being changed and already exists
            if (isset($input['registration'])) {
                $stmt = $this->db->prepare("
                    SELECT id FROM aircraft
                    WHERE registration = ? AND id != ?
                ");
                $stmt->execute([$input['registration'], $aircraftId]);
                if ($stmt->fetch()) {
                    JsonHelper::error("Registration already exists", 409);
                    return;
                }
            }

            // Build update query dynamically
            $allowedFields = [
                'registration', 'type', 'manufacturer', 'model', 'category',
                'year_manufactured', 'serial_number', 'max_weight_kg',
                'fuel_capacity_liters', 'is_active', 'is_available', 'notes', 'photo_url'
            ];

            $updates = [];
            $values = [];

            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updates[] = "{$field} = ?";
                    $values[] = $input[$field];
                }
            }

            if (empty($updates)) {
                JsonHelper::error("No valid fields to update", 400);
                return;
            }

            $values[] = $aircraftId;
            $updateSql = "UPDATE aircraft SET " . implode(', ', $updates) . " WHERE id = ?";

            $stmt = $this->db->prepare($updateSql);
            $stmt->execute($values);

            // Fetch updated aircraft
            $stmt = $this->db->prepare("
                SELECT
                    a.*,
                    o.name as organization_name
                FROM aircraft a
                LEFT JOIN organizations o ON o.id = a.organization_id
                WHERE a.id = ?
            ");
            $stmt->execute([$aircraftId]);
            $aircraft = $stmt->fetch();

            JsonHelper::success("Aircraft updated successfully", ["aircraft" => $aircraft]);
        } catch (PDOException $e) {
            JsonHelper::error("Failed to update aircraft: " . $e->getMessage(), 500);
        }
    }

    /**
     * Delete aircraft
     * DELETE /api/aircraft/{id}
     */
    public function delete(string $userId, string $aircraftId): void
    {
        try {
            // Get aircraft and verify access
            $stmt = $this->db->prepare("SELECT organization_id, owner_user_id FROM aircraft WHERE id = ?");
            $stmt->execute([$aircraftId]);
            $aircraft = $stmt->fetch();

            if (!$aircraft) {
                JsonHelper::error("Aircraft not found", 404);
                return;
            }

            // Verify user has delete permission
            $canDelete = false;

            // Check if user is personal owner
            if ($aircraft['owner_user_id'] === $userId) {
                $canDelete = true;
            }

            // Check if user is admin of organization
            if (!$canDelete && $aircraft['organization_id']) {
                $stmt = $this->db->prepare("
                    SELECT role FROM organization_memberships
                    WHERE user_id = ? AND organization_id = ?
                    AND role = 'admin'
                ");
                $stmt->execute([$userId, $aircraft['organization_id']]);
                $canDelete = (bool)$stmt->fetch();
            }

            if (!$canDelete) {
                JsonHelper::error("You don't have permission to delete this aircraft", 403);
                return;
            }

            // Delete aircraft
            $stmt = $this->db->prepare("DELETE FROM aircraft WHERE id = ?");
            $stmt->execute([$aircraftId]);

            JsonHelper::success("Aircraft deleted successfully");
        } catch (PDOException $e) {
            JsonHelper::error("Failed to delete aircraft: " . $e->getMessage(), 500);
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
