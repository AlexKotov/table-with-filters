import { Box, Chip, Typography } from '@mui/material';
import { createColumnHelper } from '@tanstack/react-table';
import { Incident } from './../types';
import {
  formatDate,
  priorityLabel,
  priorityColor,
  statusLabel,
} from '../utils/incidentDisplay';

const columnHelper = createColumnHelper<Incident>();

export const columns = [
  columnHelper.accessor('title', {
    header: 'Инцидент',
    cell: (info) => (
      <Box>
        <Typography className="incident-title">{info.getValue()}</Typography>
        <Typography variant="caption">{info.row.original.id}</Typography>
      </Box>
    ),
  }),
  columnHelper.accessor('service', { header: 'Сервис' }),
  columnHelper.accessor('priority', {
    header: 'Приоритет',
    cell: (info) => (
      <Chip
        size="small"
        color={priorityColor[info.getValue()]}
        label={priorityLabel[info.getValue()]}
      />
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Статус',
    cell: (info) => (
      <Chip
        size="small"
        className={`status-${info.getValue()}`}
        label={statusLabel[info.getValue()]}
      />
    ),
  }),
  columnHelper.accessor('updatedAt', {
    header: 'Обновлен',
    cell: (info) => formatDate(info.getValue()),
  }),
];
