-- ============================================
-- MIGRATION: Add Individual Checklist Ownership
-- Date: 2025-10-26
-- Description: Allow checklists to be owned by either an organization OR an individual user
-- ============================================

-- Add owner_user_id column
ALTER TABLE checklists
ADD COLUMN owner_user_id CHAR(36) NULL AFTER organization_id,
ADD CONSTRAINT fk_checklist_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Make organization_id nullable (no longer required)
ALTER TABLE checklists
MODIFY COLUMN organization_id CHAR(36) NULL;

-- Add check constraint: must have either organization_id OR owner_user_id (not both, not neither)
-- Note: MySQL check constraints are available from 8.0.16+
ALTER TABLE checklists
ADD CONSTRAINT chk_checklist_ownership
    CHECK (
        (organization_id IS NOT NULL AND owner_user_id IS NULL) OR
        (organization_id IS NULL AND owner_user_id IS NOT NULL)
    );

-- Add index for individual ownership lookups
ALTER TABLE checklists
ADD INDEX idx_owner_user (owner_user_id, is_active);

-- ============================================
-- END OF MIGRATION
-- ============================================
