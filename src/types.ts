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

export interface DashboardState {
  search: string;
  status: IncidentStatus | 'all';
  sort: SortOption;
  selectedId: string | null;
  setSearch: (value: string) => void;
  setStatus: (value: IncidentStatus | 'all') => void;
  setSort: (value: SortOption) => void;
  setSelectedId: (value: string | null) => void;
}

export interface UpdateIncidentStatusInput {
  id: string;
  nextStatus: IncidentStatus;
}
