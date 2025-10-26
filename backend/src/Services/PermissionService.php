<?php

namespace App\Services;

use App\Database\Connection;
use PDO;

class PermissionService
{
    private static ?PDO $db = null;

    // Permission definitions: permission => allowed roles
    const PERMISSIONS = [
        // System-wide (Super Admin only)
        'system.settings.view' => ['super_admin'],
        'system.settings.edit' => ['super_admin'],
        'system.translations.edit' => ['super_admin'],
        'system.users.view' => ['super_admin'],
        'system.organizations.view' => ['super_admin'],
        'system.plans.edit' => ['super_admin'],

        // Organization Management
        'organization.view' => ['super_admin', 'admin', 'instructor', 'member'],
        'organization.edit' => ['super_admin', 'admin'],
        'organization.delete' => ['super_admin', 'admin'],
        'organization.settings.edit' => ['super_admin', 'admin'],

        // Member Management
        'organization.members.view' => ['super_admin', 'admin', 'instructor', 'member'],
        'organization.members.invite' => ['super_admin', 'admin'],
        'organization.members.remove' => ['super_admin', 'admin'],
        'organization.members.change_role' => ['super_admin', 'admin'],

        // Aircraft Management
        'aircraft.view' => ['super_admin', 'admin', 'instructor', 'member'],
        'aircraft.create' => ['super_admin', 'admin', 'instructor'],
        'aircraft.edit' => ['super_admin', 'admin', 'instructor'],
        'aircraft.delete' => ['super_admin', 'admin'],

        // Checklist Management
        'checklist.view' => ['super_admin', 'admin', 'instructor', 'member'],
        'checklist.create' => ['super_admin', 'admin', 'instructor'],
        'checklist.edit' => ['super_admin', 'admin', 'instructor'],
        'checklist.delete' => ['super_admin', 'admin', 'instructor'],
        'checklist.edit_own' => ['super_admin', 'admin', 'instructor', 'member'],
        'checklist.publish' => ['super_admin', 'admin', 'instructor'],

        // Flight Logs
        'flight.view' => ['super_admin', 'admin', 'instructor', 'member'],
        'flight.create' => ['super_admin', 'admin', 'instructor', 'member'],
        'flight.edit_own' => ['super_admin', 'admin', 'instructor', 'member'],
        'flight.edit_any' => ['super_admin', 'admin', 'instructor'],

        // Reports & Analytics
        'reports.view_own' => ['super_admin', 'admin', 'instructor', 'member'],
        'reports.view_organization' => ['super_admin', 'admin', 'instructor'],
        'reports.view_all' => ['super_admin'],
    ];

    private static function getDb(): PDO
    {
        if (self::$db === null) {
            self::$db = Connection::getInstance();
        }
        return self::$db;
    }

    /**
     * Check if user has specific permission
     *
     * @param string $userId User ID
     * @param string $permission Permission key (e.g., 'aircraft.create')
     * @param string|null $orgId Organization ID (required for org permissions)
     * @return bool True if user has permission
     */
    public static function can(string $userId, string $permission, ?string $orgId = null): bool
    {
        // Check if user is super admin (has all permissions)
        if (self::isSuperAdmin($userId)) {
            return true;
        }

        // Get allowed roles for this permission
        $allowedRoles = self::PERMISSIONS[$permission] ?? [];

        if (empty($allowedRoles)) {
            return false;
        }

        // System-wide permissions require super admin
        if (str_starts_with($permission, 'system.')) {
            return in_array('super_admin', $allowedRoles);
        }

        // Organization permissions require org context
        if ($orgId && str_starts_with($permission, 'organization.')) {
            $role = self::getOrganizationRole($userId, $orgId);
            return $role && in_array($role, $allowedRoles);
        }

        // Aircraft, checklist, flight permissions
        if ($orgId && (
            str_starts_with($permission, 'aircraft.') ||
            str_starts_with($permission, 'checklist.') ||
            str_starts_with($permission, 'flight.')
        )) {
            $role = self::getOrganizationRole($userId, $orgId);
            return $role && in_array($role, $allowedRoles);
        }

        return false;
    }

    /**
     * Require permission or throw exception
     *
     * @param string $userId User ID
     * @param string $permission Permission key
     * @param string|null $orgId Organization ID
     * @throws \Exception If permission denied
     */
    public static function require(string $userId, string $permission, ?string $orgId = null): void
    {
        if (!self::can($userId, $permission, $orgId)) {
            http_response_code(403);
            throw new \Exception("Permission denied: {$permission}");
        }
    }

    /**
     * Check if user is super admin
     *
     * @param string $userId User ID
     * @return bool True if super admin
     */
    public static function isSuperAdmin(string $userId): bool
    {
        $stmt = self::getDb()->prepare("
            SELECT is_super_admin FROM users WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        return $user && $user['is_super_admin'];
    }

    /**
     * Get user's role in organization
     *
     * @param string $userId User ID
     * @param string $orgId Organization ID
     * @return string|null Role (admin, instructor, member) or null
     */
    public static function getOrganizationRole(string $userId, string $orgId): ?string
    {
        $stmt = self::getDb()->prepare("
            SELECT role FROM organization_memberships
            WHERE user_id = ? AND organization_id = ?
        ");
        $stmt->execute([$userId, $orgId]);
        $membership = $stmt->fetch();

        return $membership ? $membership['role'] : null;
    }

    /**
     * Check if user is member of organization
     *
     * @param string $userId User ID
     * @param string $orgId Organization ID
     * @return bool True if member
     */
    public static function isMember(string $userId, string $orgId): bool
    {
        return self::getOrganizationRole($userId, $orgId) !== null;
    }

    /**
     * Check if user is organization admin
     *
     * @param string $userId User ID
     * @param string $orgId Organization ID
     * @return bool True if admin
     */
    public static function isOrganizationAdmin(string $userId, string $orgId): bool
    {
        $role = self::getOrganizationRole($userId, $orgId);
        return $role === 'admin';
    }

    /**
     * Get all user's permissions for an organization
     *
     * @param string $userId User ID
     * @param string $orgId Organization ID
     * @return array List of permission keys
     */
    public static function getUserPermissions(string $userId, string $orgId): array
    {
        if (self::isSuperAdmin($userId)) {
            return array_keys(self::PERMISSIONS);
        }

        $role = self::getOrganizationRole($userId, $orgId);
        if (!$role) {
            return [];
        }

        $permissions = [];
        foreach (self::PERMISSIONS as $permission => $allowedRoles) {
            if (in_array($role, $allowedRoles)) {
                $permissions[] = $permission;
            }
        }

        return $permissions;
    }

    /**
     * Get user's organizations with roles
     *
     * @param string $userId User ID
     * @return array List of organizations with user's role
     */
    public static function getUserOrganizations(string $userId): array
    {
        $stmt = self::getDb()->prepare("
            SELECT
                o.*,
                om.role,
                om.joined_at
            FROM organizations o
            JOIN organization_memberships om ON om.organization_id = o.id
            WHERE om.user_id = ?
            ORDER BY om.joined_at DESC
        ");
        $stmt->execute([$userId]);

        return $stmt->fetchAll();
    }

    /**
     * Check if user can access resource (ownership check)
     *
     * @param string $userId User ID
     * @param string $resourceType Resource type (aircraft, checklist, flight)
     * @param string $resourceId Resource ID
     * @return bool True if user owns or has access to resource
     */
    public static function canAccessResource(string $userId, string $resourceType, string $resourceId): bool
    {
        if (self::isSuperAdmin($userId)) {
            return true;
        }

        $table = match($resourceType) {
            'aircraft' => 'aircraft',
            'checklist' => 'checklists',
            'flight' => 'flights',
            default => null
        };

        if (!$table) {
            return false;
        }

        // Check if resource belongs to user's organization
        $stmt = self::getDb()->prepare("
            SELECT r.organization_id
            FROM {$table} r
            JOIN organization_memberships om ON om.organization_id = r.organization_id
            WHERE r.id = ? AND om.user_id = ?
        ");
        $stmt->execute([$resourceId, $userId]);

        return $stmt->fetch() !== false;
    }
}
