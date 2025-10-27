-- Add notes field to checklist_items table
-- This is for permanent notes that are part of the checklist item definition
-- (not to be confused with execution notes which are added during execution)

ALTER TABLE checklist_items
ADD COLUMN notes TEXT NULL AFTER expected_value;
