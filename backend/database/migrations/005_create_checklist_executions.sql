-- ============================================
-- MIGRATION: Create Checklist Executions
-- Date: 2025-10-27
-- Description: Simple checklist execution tracking (independent from flights)
-- ============================================

-- Checklist Executions (simplified - not tied to flights)
CREATE TABLE IF NOT EXISTS checklist_executions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  checklist_id CHAR(36) NOT NULL,

  -- Execution details
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  status ENUM('in_progress', 'completed', 'aborted') DEFAULT 'in_progress',

  -- Optional metadata
  notes TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,

  INDEX idx_user_executions (user_id, status),
  INDEX idx_checklist_executions (checklist_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Checklist Execution Items (track individual item completion)
CREATE TABLE IF NOT EXISTS checklist_execution_items (
  id CHAR(36) PRIMARY KEY,
  execution_id CHAR(36) NOT NULL,
  checklist_item_id CHAR(36) NOT NULL,

  -- Action tracking
  action ENUM('completed', 'skipped', 'failed') DEFAULT 'completed',
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Optional details
  notes TEXT NULL,
  actual_value VARCHAR(255) NULL,

  FOREIGN KEY (execution_id) REFERENCES checklist_executions(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,

  UNIQUE KEY unique_execution_item (execution_id, checklist_item_id),
  INDEX idx_execution_items (execution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- END OF MIGRATION
-- ============================================
