export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'new' | 'investigating' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  service: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  updatedAt: string;
  description: string;
  assignee: string;
}

export type SortOption = 'updatedAt' | 'priority';
