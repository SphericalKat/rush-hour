import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDepartures } from '../api/departures';
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
  const [state, setState] = useState<State>({
    data: [],
    loading: false,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!stationId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchDepartures(stationId, destinationId ?? undefined);
      setState({ data: data ?? [], loading: false, error: null });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load',
      }));
    }
  }, [stationId, destinationId]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return { ...state, refresh: load };
}
