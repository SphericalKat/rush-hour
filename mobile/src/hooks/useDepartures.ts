import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getDepartures } from '../db/queries';
import type { Departure } from '../api/types';

interface State {
  data: Departure[];
  loading: boolean;
  error: string | null;
}

export function useDepartures(
  stationId: number | null,
  destinationId?: number | null,
) {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({
    data: [],
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!stationId) return;
    setState((s) => ({ ...s, loading: s.data.length === 0, error: null }));
    try {
      const data = await getDepartures(db, stationId, destinationId ?? undefined);
      setState({ data: data ?? [], loading: false, error: null });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load',
      }));
    }
  }, [db, stationId, destinationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
