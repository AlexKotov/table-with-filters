import { useMemo, useState, createContext, useContext } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
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
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { fetchIncidents, updateIncidentStatus } from './data/mockData';
import {
  Incident,
  IncidentPriority,
  IncidentStatus,
  SortOption,
} from './types';
import './App.css';

interface DashboardState {
  search: string;
  status: IncidentStatus | 'all';
  sort: SortOption;
  selectedId: string | null;
  setSearch: (value: string) => void;
  setStatus: (value: IncidentStatus | 'all') => void;
  setSort: (value: SortOption) => void;
  setSelectedId: (value: string | null) => void;
}

const DashboardContext = createContext<DashboardState | null>(null);
const useDashboard = (): DashboardState => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error('useDashboard must be used inside DashboardContext');
  return context;
};

const priorityLabel: Record<IncidentPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критичный',
};
const statusLabel: Record<IncidentStatus, string> = {
  new: 'Новый',
  investigating: 'В работе',
  resolved: 'Решен',
};
const priorityColor: Record<
  IncidentPriority,
  'info' | 'warning' | 'error' | 'success'
> = {
  low: 'info',
  medium: 'warning',
  high: 'warning',
  critical: 'error',
};

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const columnHelper = createColumnHelper<Incident>();

function Dashboard() {
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
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: IncidentStatus;
    }) => updateIncidentStatus(id, nextStatus, shouldFail),
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

  const columns = [
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

function DetailPanel({
  incident,
  onClose,
  onStatusChange,
  isPending,
}: {
  incident: Incident;
  onClose: () => void;
  onStatusChange: (status: IncidentStatus) => void;
  isPending: boolean;
}) {
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

function App() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<IncidentStatus | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('updatedAt');
  const [selectedId, setSelectedId] = useState<string | null>('INC-1002');
  const state = {
    search,
    status,
    sort,
    selectedId,
    setSearch,
    setStatus,
    setSort,
    setSelectedId,
  };
  return (
    <DashboardContext.Provider value={state}>
      <Dashboard />
    </DashboardContext.Provider>
  );
}

const theme = createTheme({
  palette: {
    primary: { main: '#5667d8' },
    background: { default: '#f3f6fc' },
  },
  typography: { fontFamily: '"Inter", "Segoe UI", sans-serif' },
  shape: { borderRadius: 12 },
});
const queryClient = new QueryClient();
export default function AppWithProviders() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
