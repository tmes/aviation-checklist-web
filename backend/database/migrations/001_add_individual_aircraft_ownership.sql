-- Migration: Add individual aircraft ownership support
-- Allows aircraft to be owned by either an organization OR an individual user

-- Add owner_user_id column
ALTER TABLE aircraft
ADD COLUMN owner_user_id CHAR(36) NULL AFTER organization_id,
ADD CONSTRAINT fk_aircraft_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Make organization_id nullable (no longer required)
ALTER TABLE aircraft
MODIFY COLUMN organization_id CHAR(36) NULL;

-- Add check constraint: must have either organization_id OR owner_user_id (not both, not neither)
-- Note: MySQL check constraints are available from 8.0.16+
ALTER TABLE aircraft
ADD CONSTRAINT chk_aircraft_ownership
    CHECK (
        (organization_id IS NOT NULL AND owner_user_id IS NULL) OR
        (organization_id IS NULL AND owner_user_id IS NOT NULL)
    );

-- Add index for individual ownership lookups
ALTER TABLE aircraft
ADD INDEX idx_owner_user (owner_user_id, is_active);

-- Verify the changes
DESCRIBE aircraft;
