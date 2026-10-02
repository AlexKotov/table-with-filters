import { INCIDENTS } from '../data/mockData';
import { Incident, IncidentStatus } from '../types';

let incidentStore = [...INCIDENTS];

export const fetchIncidents = async (
  shouldFail = false
): Promise<Incident[]> => {
  await new Promise((resolve) => setTimeout(resolve, 550));
  if (shouldFail) {
    throw new Error('Не удалось загрузить инциденты');
  }
  return incidentStore.map((incident) => ({ ...incident }));
};

export const updateIncidentStatus = async (
  id: string,
  status: IncidentStatus,
  shouldFail = false
): Promise<Incident> => {
  await new Promise((resolve) => setTimeout(resolve, 450));
  if (shouldFail) {
    throw new Error('Не удалось обновить статус');
  }
  incidentStore = incidentStore.map((incident) =>
    incident.id === id
      ? { ...incident, status, updatedAt: new Date().toISOString() }
      : incident
  );
  const updated = incidentStore.find((incident) => incident.id === id);
  if (!updated) {
    throw new Error('Инцидент не найден');
  }
  return { ...updated };
};
