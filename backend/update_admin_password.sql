-- Update admin user password hash
-- Password: Admin123!
UPDATE users
SET password_hash = '$2y$12$z61NepIlhefL7JNC5cNN2.aCi1Gbq3Ys3Lf.7G9xrCIaVBDWGZ6VO',
    email_verified = 1
WHERE email = 'admin@aerocheck.com';

-- Verify the update
SELECT id, email, email_verified, is_super_admin, created_at
FROM users
WHERE email = 'admin@aerocheck.com';
