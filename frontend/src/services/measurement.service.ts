import { apiFetch } from './api';
import type { BodyMeasurement, CreateMeasurementDTO, MeasurementQueryDTO } from '@caloriesync/shared';
export type { BodyMeasurement, CreateMeasurementDTO, MeasurementQueryDTO };

export const getMeasurements = async (
  period?: '30d' | '90d' | 'all',
  signal?: AbortSignal
): Promise<BodyMeasurement[]> => {
  const query = period ? `?period=${period}` : '';
  return apiFetch<BodyMeasurement[]>(`/users/me/measurements${query}`, { signal });
};

export const addMeasurement = async (data: CreateMeasurementDTO): Promise<BodyMeasurement> => {
  return apiFetch<BodyMeasurement>('/users/me/measurements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
