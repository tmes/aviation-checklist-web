-- ============================================
-- MIGRATION: Add Language Preference & Dark Mode to Users
-- Date: 2025-10-26
-- Description: Add language_preference and dark_mode columns to users table
-- ============================================

-- Add language_preference column
ALTER TABLE users
ADD COLUMN language_preference VARCHAR(5) DEFAULT 'en' AFTER last_name,
ADD CONSTRAINT fk_user_language
    FOREIGN KEY (language_preference) REFERENCES supported_languages(language_code) ON DELETE SET NULL;

-- Add dark_mode preference column
ALTER TABLE users
ADD COLUMN dark_mode BOOLEAN DEFAULT FALSE AFTER language_preference;

-- Set existing users to 'en' (English) as default
UPDATE users SET language_preference = 'en' WHERE language_preference IS NULL;

-- Set existing users to light mode as default
UPDATE users SET dark_mode = FALSE WHERE dark_mode IS NULL;

-- Add index for performance
ALTER TABLE users
ADD INDEX idx_language_preference (language_preference);

-- ============================================
-- END OF MIGRATION
-- ============================================
