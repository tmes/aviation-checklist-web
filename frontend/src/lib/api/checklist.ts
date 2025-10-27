// Checklist API endpoints

import { api } from './client';
import type { Checklist, CreateChecklistData, UpdateChecklistData } from '../../types';

export interface ChecklistsResponse {
  data: Checklist[];
}

export interface ChecklistResponse {
  data: Checklist;
}

/**
 * Get all checklists for user
 */
export const getChecklists = async (token: string): Promise<Checklist[]> => {
  const response = await api.get<ChecklistsResponse>('/api/checklists', token);
  return response.data;
};

/**
 * Get single checklist with items
 */
export const getChecklist = async (token: string, id: string): Promise<Checklist> => {
  const response = await api.get<ChecklistResponse>(`/api/checklists/${id}`, token);
  return response.data;
};

/**
 * Create new checklist
 */
export const createChecklist = async (
  token: string,
  data: CreateChecklistData
): Promise<Checklist> => {
  const response = await api.post<ChecklistResponse>('/api/checklists', data, token);
  return response.data;
};

/**
 * Update checklist
 */
export const updateChecklist = async (
  token: string,
  id: string,
  data: UpdateChecklistData
): Promise<Checklist> => {
  const response = await api.put<ChecklistResponse>(`/api/checklists/${id}`, data, token);
  return response.data;
};

/**
 * Delete checklist
 */
export const deleteChecklist = async (token: string, id: string): Promise<void> => {
  await api.delete(`/api/checklists/${id}`, token);
};
