-- Create test organization and membership for aircraft management testing

-- Create test organization
INSERT INTO organizations (
    id,
    name,
    type,
    description,
    email,
    allow_public_join
) VALUES (
    UUID(),
    'Test Flying Club',
    'flying_club',
    'A test organization for aircraft management',
    'info@testflyingclub.com',
    FALSE
);

-- Get the organization ID (for reference)
SET @org_id = (SELECT id FROM organizations WHERE name = 'Test Flying Club' LIMIT 1);

-- Create membership for admin user
INSERT INTO organization_memberships (
    id,
    organization_id,
    user_id,
    role,
    joined_at
) VALUES (
    UUID(),
    @org_id,
    (SELECT id FROM users WHERE email = 'admin@aerocheck.com' LIMIT 1),
    'admin',
    NOW()
);

-- Verify
SELECT
    o.id as org_id,
    o.name as org_name,
    om.role,
    u.email
FROM organizations o
LEFT JOIN organization_memberships om ON om.organization_id = o.id
LEFT JOIN users u ON u.id = om.user_id
WHERE o.name = 'Test Flying Club';
