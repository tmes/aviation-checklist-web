<?php

namespace App\Services;

use App\Database\Connection;
use PDO;

class SubscriptionService
{
    private static ?PDO $db = null;

    private static function getDb(): PDO
    {
        if (self::$db === null) {
            self::$db = Connection::getInstance();
        }
        return self::$db;
    }

    /**
     * Get user's current subscription plan
     *
     * @param string $userId User ID
     * @return array|null Plan details or null if no active subscription
     */
    public static function getUserPlan(string $userId): ?array
    {
        $stmt = self::getDb()->prepare("
            SELECT
                sp.*,
                us.status as subscription_status,
                us.current_period_end
            FROM subscription_plans sp
            JOIN user_subscriptions us ON us.plan_id = sp.id
            WHERE us.user_id = ? AND us.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $plan = $stmt->fetch();

        // If no active subscription, return free plan
        if (!$plan) {
            return self::getFreePlan();
        }

        // Parse features JSON
        if (isset($plan['features'])) {
            $plan['features'] = json_decode($plan['features'], true);
        }

        return $plan;
    }

    /**
     * Get organization's subscription plan
     *
     * @param string $orgId Organization ID
     * @return array|null Plan details
     */
    public static function getOrganizationPlan(string $orgId): ?array
    {
        $stmt = self::getDb()->prepare("
            SELECT
                sp.*,
                os.status as subscription_status,
                os.current_period_end
            FROM subscription_plans sp
            JOIN organization_subscriptions os ON os.plan_id = sp.id
            WHERE os.organization_id = ? AND os.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([$orgId]);
        $plan = $stmt->fetch();

        if (!$plan) {
            return self::getFreePlan();
        }

        if (isset($plan['features'])) {
            $plan['features'] = json_decode($plan['features'], true);
        }

        return $plan;
    }

    /**
     * Get free plan (default)
     *
     * @return array Free plan details
     */
    public static function getFreePlan(): array
    {
        $stmt = self::getDb()->prepare("
            SELECT * FROM subscription_plans WHERE id = 'free'
        ");
        $stmt->execute();
        $plan = $stmt->fetch();

        if ($plan && isset($plan['features'])) {
            $plan['features'] = json_decode($plan['features'], true);
        }

        return $plan ?: [
            'id' => 'free',
            'name' => 'Free',
            'max_aircraft_per_org' => 5,
            'features' => ['offline_mode' => true]
        ];
    }

    /**
     * Check if user can create aircraft
     *
     * @param string $userId User ID
     * @param string $orgId Organization ID
     * @return bool True if within limits
     */
    public static function canCreateAircraft(string $userId, string $orgId): bool
    {
        $plan = self::getOrganizationPlan($orgId);
        $maxAllowed = $plan['max_aircraft_per_org'];

        // -1 means unlimited
        if ($maxAllowed === -1 || $maxAllowed === '-1') {
            return true;
        }

        // Count current aircraft
        $stmt = self::getDb()->prepare("
            SELECT COUNT(*) as count
            FROM aircraft
            WHERE organization_id = ?
        ");
        $stmt->execute([$orgId]);
        $result = $stmt->fetch();
        $currentCount = $result['count'];

        return $currentCount < $maxAllowed;
    }

    /**
     * Check if organization can add more members
     *
     * @param string $orgId Organization ID
     * @return bool True if within limits
     */
    public static function canAddMember(string $orgId): bool
    {
        $plan = self::getOrganizationPlan($orgId);
        $maxAllowed = $plan['max_members_per_org'];

        if ($maxAllowed === -1 || $maxAllowed === '-1') {
            return true;
        }

        // Count current members
        $stmt = self::getDb()->prepare("
            SELECT COUNT(*) as count
            FROM organization_memberships
            WHERE organization_id = ?
        ");
        $stmt->execute([$orgId]);
        $result = $stmt->fetch();
        $currentCount = $result['count'];

        return $currentCount < $maxAllowed;
    }

    /**
     * Check if user has specific feature
     *
     * @param string $userId User ID
     * @param string $feature Feature key (e.g., 'premium_checklists')
     * @return bool True if feature is available
     */
    public static function hasFeature(string $userId, string $feature): bool
    {
        $plan = self::getUserPlan($userId);
        $features = $plan['features'] ?? [];

        return $features[$feature] ?? false;
    }

    /**
     * Get upgrade message when limit reached
     *
     * @param string $limitType Type of limit (aircraft, members, etc.)
     * @return array Error response with upgrade info
     */
    public static function getUpgradeMessage(string $limitType): array
    {
        $messages = [
            'aircraft' => [
                'message' => 'You have reached your aircraft limit.',
                'suggestion' => 'Upgrade to Pro for unlimited aircraft.',
                'upgrade_url' => '/pricing'
            ],
            'members' => [
                'message' => 'You have reached your member limit.',
                'suggestion' => 'Upgrade to Club Pro for more members.',
                'upgrade_url' => '/pricing'
            ],
            'premium_checklists' => [
                'message' => 'Premium checklists are not available on your plan.',
                'suggestion' => 'Upgrade to Pro to access premium checklists.',
                'upgrade_url' => '/pricing'
            ]
        ];

        return $messages[$limitType] ?? [
            'message' => 'This feature is not available on your current plan.',
            'suggestion' => 'Please upgrade your subscription.',
            'upgrade_url' => '/pricing'
        ];
    }

    /**
     * Get all available subscription plans
     *
     * @return array List of all active public plans
     */
    public static function getAvailablePlans(): array
    {
        $stmt = self::getDb()->query("
            SELECT * FROM subscription_plans
            WHERE is_active = TRUE AND is_public = TRUE
            ORDER BY price_monthly_cents ASC
        ");

        $plans = $stmt->fetchAll();

        // Parse features JSON for each plan
        foreach ($plans as &$plan) {
            if (isset($plan['features'])) {
                $plan['features'] = json_decode($plan['features'], true);
            }
        }

        return $plans;
    }

    /**
     * Get subscription limits for display
     *
     * @param string $userId User ID
     * @param string|null $orgId Organization ID (optional)
     * @return array Current usage and limits
     */
    public static function getLimits(string $userId, ?string $orgId = null): array
    {
        $plan = $orgId ? self::getOrganizationPlan($orgId) : self::getUserPlan($userId);

        $limits = [
            'plan_name' => $plan['name'],
            'plan_id' => $plan['id'],
            'aircraft' => [
                'max' => $plan['max_aircraft_per_org'],
                'current' => 0,
                'unlimited' => $plan['max_aircraft_per_org'] === -1
            ],
            'members' => [
                'max' => $plan['max_members_per_org'],
                'current' => 0,
                'unlimited' => $plan['max_members_per_org'] === -1
            ],
            'features' => $plan['features'] ?? []
        ];

        if ($orgId) {
            // Get current usage
            $stmt = self::getDb()->prepare("
                SELECT COUNT(*) as count FROM aircraft WHERE organization_id = ?
            ");
            $stmt->execute([$orgId]);
            $limits['aircraft']['current'] = $stmt->fetch()['count'];

            $stmt = self::getDb()->prepare("
                SELECT COUNT(*) as count FROM organization_memberships WHERE organization_id = ?
            ");
            $stmt->execute([$orgId]);
            $limits['members']['current'] = $stmt->fetch()['count'];
        }

        return $limits;
    }
}
