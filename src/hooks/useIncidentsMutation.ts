import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Incident, UpdateIncidentStatusInput } from '../types';
import { updateIncidentStatus } from '../api/incidents';

export function useIncidentsMutation(shouldFail: boolean) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

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

  return {
    mutation,
    mutationError,
  };
}
