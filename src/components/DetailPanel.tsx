import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Incident, IncidentStatus } from '../types';
import {
  formatDate,
  priorityLabel,
  statusLabel,
} from '../utils/incidentDisplay';

export interface DetailPanelProps {
  incident: Incident;
  onClose: () => void;
  onStatusChange: (status: IncidentStatus) => void;
  isPending: boolean;
}

export function DetailPanel({
  incident,
  onClose,
  onStatusChange,
  isPending,
}: DetailPanelProps) {
  return (
    <Paper className="detail-panel">
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Typography variant="overline" color="primary">
            Детали инцидента
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {incident.title}
          </Typography>
        </Box>
        <Button size="small" onClick={onClose} startIcon={<CloseRoundedIcon />}>
          Закрыть
        </Button>
      </Stack>
      <Box className="detail-grid">
        {[
          ['ID', incident.id],
          ['Сервис', incident.service],
          ['Приоритет', priorityLabel[incident.priority]],
          ['Ответственный', incident.assignee],
          ['Последнее обновление', formatDate(incident.updatedAt)],
        ].map(([label, value]) => (
          <Box key={label} className="detail-item">
            <Typography variant="caption">{label}</Typography>
            <Typography fontWeight={700}>{value}</Typography>
          </Box>
        ))}
      </Box>
      <Typography color="text.secondary" mt={2} mb={2}>
        {incident.description}
      </Typography>
      <FormControl fullWidth size="small" disabled={isPending}>
        <InputLabel>Статус</InputLabel>
        <Select
          value={incident.status}
          label="Статус"
          onChange={(event: SelectChangeEvent) =>
            onStatusChange(event.target.value as IncidentStatus)
          }
        >
          {Object.entries(statusLabel).map(([key, label]) => (
            <MenuItem value={key} key={key}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {isPending && (
        <Typography variant="caption" color="text.secondary">
          Сохраняем...
        </Typography>
      )}
    </Paper>
  );
}
