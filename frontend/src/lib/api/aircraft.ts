// Aircraft API endpoints

import { api } from './client';
import type {
  Aircraft,
  CreateAircraftData,
  UpdateAircraftData,
} from '../../types';

export interface AircraftListResponse {
  data: Aircraft[];
}

export interface AircraftResponse {
  data: Aircraft;
}

export interface CreateAircraftResponse {
  message: string;
  aircraft: Aircraft;
}

export interface UpdateAircraftResponse {
  message: string;
  aircraft: Aircraft;
}

export interface DeleteAircraftResponse {
  message: string;
}

/**
 * Get all aircraft for current user's organizations
 */
export const getAircraft = async (token: string): Promise<Aircraft[]> => {
  const response = await api.get<AircraftListResponse>('/api/aircraft', token);
  return response.data;
};

/**
 * Get single aircraft by ID
 */
export const getAircraftById = async (
  id: string,
  token: string
): Promise<Aircraft> => {
  const response = await api.get<AircraftResponse>(
    `/api/aircraft/${id}`,
    token
  );
  return response.data;
};

/**
 * Create new aircraft
 */
export const createAircraft = async (
  data: CreateAircraftData,
  token: string
): Promise<Aircraft> => {
  const response = await api.post<CreateAircraftResponse>(
    '/api/aircraft',
    data,
    token
  );
  return response.aircraft;
};

/**
 * Update aircraft
 */
export const updateAircraft = async (
  id: string,
  data: UpdateAircraftData,
  token: string
): Promise<Aircraft> => {
  const response = await api.put<UpdateAircraftResponse>(
    `/api/aircraft/${id}`,
    data,
    token
  );
  return response.aircraft;
};

/**
 * Delete aircraft
 */
export const deleteAircraft = async (
  id: string,
  token: string
): Promise<void> => {
  await api.delete<DeleteAircraftResponse>(`/api/aircraft/${id}`, token);
};
