// Execution API endpoints

import { api } from './client';

export interface ChecklistExecution {
  id: string;
  user_id: string;
  checklist_id: string;
  started_at: string;
  completed_at?: string;
  status: 'in_progress' | 'completed' | 'aborted';
  notes?: string;
  checklist_name?: string;
  checklist_description?: string;
  aircraft_registration?: string;
  aircraft_type?: string;
  items?: ChecklistExecutionItem[];
}

export interface ChecklistExecutionItem {
  id: string;
  checklist_id: string;
  phase: string;
  itemText: string;
  expected_value?: string;
  sort_order: number;
  is_critical: boolean;
  requires_confirmation: boolean;
  execution_status?: 'completed' | 'skipped' | 'failed' | null;
  execution_action?: string;
  execution_notes?: string;
  execution_actual_value?: string;
  execution_completed_at?: string;
}

export interface ExecutionResponse {
  data: ChecklistExecution;
}

export interface StartExecutionData {
  checklistId: string;
  notes?: string;
}

export interface UpdateItemData {
  action: 'completed' | 'skipped' | 'failed';
  notes?: string;
  actualValue?: string;
}

/**
 * Start a new execution
 */
export const startExecution = async (
  token: string,
  data: StartExecutionData
): Promise<ChecklistExecution> => {
  const response = await api.post<ExecutionResponse>('/api/executions', data, token);
  return response.data;
};

/**
 * Get execution details
 */
export const getExecution = async (
  token: string,
  executionId: string
): Promise<ChecklistExecution> => {
  const response = await api.get<ExecutionResponse>(`/api/executions/${executionId}`, token);
  return response.data;
};

/**
 * Update an execution item status
 */
export const updateExecutionItem = async (
  token: string,
  executionId: string,
  itemId: string,
  data: UpdateItemData
): Promise<void> => {
  await api.post(`/api/executions/${executionId}/items/${itemId}`, data, token);
};

/**
 * Complete the execution
 */
export const completeExecution = async (token: string, executionId: string): Promise<void> => {
  await api.post(`/api/executions/${executionId}/complete`, {}, token);
};

/**
 * Abort the execution
 */
export const abortExecution = async (token: string, executionId: string): Promise<void> => {
  await api.post(`/api/executions/${executionId}/abort`, {}, token);
};
