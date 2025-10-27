// Utility functions to map between backend snake_case and frontend camelCase

import type { ChecklistItem as BackendChecklistItem } from '../api/execution';
import type { ChecklistItem } from '../../types';

export interface FrontendChecklistItem {
  id: string;
  checklistId: string;
  phase: string;
  itemText: string;
  expectedValue?: string | null;
  notes?: string | null; // Permanent notes that are part of the item
  sortOrder: number;
  isCritical: boolean;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FrontendExecutionItem extends FrontendChecklistItem {
  executionStatus?: 'completed' | 'skipped' | 'failed' | null;
  executionAction?: string;
  executionNotes?: string; // Runtime notes added during execution
  executionActualValue?: string;
  executionCompletedAt?: string;
}

/**
 * Maps backend snake_case checklist item to frontend camelCase
 */
export function mapChecklistItem(item: ChecklistItem): FrontendChecklistItem {
  return {
    id: item.id,
    checklistId: item.checklist_id,
    phase: item.phase,
    itemText: item.item_text,
    expectedValue: item.expected_value,
    notes: (item as any).notes || null,
    sortOrder: item.sort_order,
    isCritical: item.is_critical,
    requiresConfirmation: item.requires_confirmation,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

/**
 * Maps backend execution item to frontend format
 */
export function mapExecutionItem(item: BackendChecklistItem): FrontendExecutionItem {
  return {
    id: item.id,
    checklistId: item.checklist_id,
    phase: item.phase,
    itemText: item.item_text,
    expectedValue: item.expected_value,
    notes: (item as any).notes || null,
    sortOrder: item.sort_order,
    isCritical: item.is_critical,
    requiresConfirmation: item.requires_confirmation,
    createdAt: '', // Not provided in execution items
    updatedAt: '',
    executionStatus: item.execution_status,
    executionAction: item.execution_action,
    executionNotes: item.execution_notes,
    executionActualValue: item.execution_actual_value,
    executionCompletedAt: item.execution_completed_at,
  };
}
