import { IncidentPriority, IncidentStatus } from '../types';

export const priorityLabel: Record<IncidentPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критичный',
};

export const statusLabel: Record<IncidentStatus, string> = {
  new: 'Новый',
  investigating: 'В работе',
  resolved: 'Решен',
};

export const priorityColor: Record<
  IncidentPriority,
  'info' | 'warning' | 'error' | 'success'
> = {
  low: 'info',
  medium: 'warning',
  high: 'warning',
  critical: 'error',
};

export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
