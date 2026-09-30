import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { fetchIncidents, updateIncidentStatus } from './../data/mockData';
import {
  Incident,
  IncidentStatus,
  SortOption,
  UpdateIncidentStatusInput,
} from './../types';
import { useDashboard } from './DashboardContext';
import { DetailPanel } from './DetailPanel';
import { columns } from './dashboardColumns';
import { statusLabel } from './../utils/incidentDisplay';

export function Dashboard() {
  const {
    search,
    status,
    sort,
    selectedId,
    setSearch,
    setStatus,
    setSort,
    setSelectedId,
  } = useDashboard();
  const queryClient = useQueryClient();
  const [shouldFail, setShouldFail] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const incidentsQuery = useQuery({
    queryKey: ['incidents', shouldFail],
    queryFn: () => fetchIncidents(shouldFail),
  });

  const filteredIncidents = useMemo(() => {
    const items = (incidentsQuery.data ?? []).filter((incident) => {
      const matchesSearch = `${incident.title} ${incident.service}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesSearch && (status === 'all' || incident.status === status);
    });
    return [...items].sort((a, b) =>
      sort === 'priority'
        ? ['critical', 'high', 'medium', 'low'].indexOf(a.priority) -
          ['critical', 'high', 'medium', 'low'].indexOf(b.priority)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [incidentsQuery.data, search, status, sort]);

  const mutation = useMutation({
    mutationFn: ({ id, nextStatus }: UpdateIncidentStatusInput) =>
      updateIncidentStatus(id, nextStatus, shouldFail),
    onMutate: async ({ id, nextStatus }) => {
      setMutationError(null);
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      const previous = queryClient.getQueryData<Incident[]>([
        'incidents',
        shouldFail,
      ]);
      queryClient.setQueryData<Incident[]>(
        ['incidents', shouldFail],
        (items: Incident[] = []) =>
          items.map((item) =>
            item.id === id ? { ...item, status: nextStatus } : item
          )
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(['incidents', shouldFail], context.previous);
      setMutationError(
        error instanceof Error ? error.message : 'Ошибка обновления'
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const table = useReactTable({
    data: filteredIncidents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const selected =
    incidentsQuery.data?.find((incident) => incident.id === selectedId) ?? null;

  return (
    <Container maxWidth="lg" className="dashboard">
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Дашборд инцидентов
          </Typography>
          <Typography color="text.secondary">
            Очередь инцидентов с поиском, фильтрами и панелью деталей.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => incidentsQuery.refetch()}
        >
          Обновить
        </Button>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={status}
            label="Статус"
            onChange={(event: SelectChangeEvent) =>
              setStatus(event.target.value as IncidentStatus | 'all')
            }
          >
            <MenuItem value="all">Все статусы</MenuItem>
            {Object.entries(statusLabel).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по заголовку или сервису"
          InputProps={{
            startAdornment: <SearchRoundedIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Сортировка</InputLabel>
          <Select
            value={sort}
            label="Сортировка"
            onChange={(event: SelectChangeEvent) =>
              setSort(event.target.value as SortOption)
            }
          >
            <MenuItem value="updatedAt">По обновлению</MenuItem>
            <MenuItem value="priority">По приоритету</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Stack direction="row" spacing={1} mb={2}>
        <Typography variant="caption">Демо:</Typography>
        <Button size="small" onClick={() => setShouldFail((value) => !value)}>
          {shouldFail ? 'Выключить ошибку' : 'Включить ошибку'}
        </Button>
      </Stack>
      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutationError}
        </Alert>
      )}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: 'stretch' }}
      >
        <Paper className="table-paper" sx={{ flex: 1 }}>
          {incidentsQuery.isLoading ? (
            <Box className="state-box">
              <CircularProgress />
              <Typography>Загрузка инцидентов...</Typography>
            </Box>
          ) : incidentsQuery.isError ? (
            <Box className="state-box">
              <Alert severity="error">Не удалось загрузить данные.</Alert>
              <Button onClick={() => incidentsQuery.refetch()}>
                Повторить
              </Button>
            </Box>
          ) : filteredIncidents.length === 0 ? (
            <Box className="state-box">
              <Typography variant="h6">Ничего не найдено</Typography>
              <Typography color="text.secondary">
                Измените фильтры или поисковый запрос.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {table.getHeaderGroups()[0].headers.map((header) => (
                      <TableCell key={header.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      hover
                      selected={row.original.id === selectedId}
                      key={row.id}
                      onClick={() => setSelectedId(row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        {selected && (
          <DetailPanel
            incident={selected}
            onClose={() => setSelectedId(null)}
            onStatusChange={(nextStatus) =>
              mutation.mutate({ id: selected.id, nextStatus })
            }
            isPending={mutation.isPending}
          />
        )}
      </Stack>
    </Container>
  );
}
