import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getTransferRoutes } from '../db/queries';
import type { TransferRoute } from '../api/types';

interface State {
  data: TransferRoute[];
  loading: boolean;
  error: string | null;
}

export function useTransferRoutes(
  sourceId: number | null,
  destId: number | null,
) {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({
    data: [],
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!sourceId || !destId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState(s => ({ ...s, loading: s.data.length === 0, error: null }));
    try {
      const data = await getTransferRoutes(db, sourceId, destId);
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load transfers',
      }));
    }
  }, [db, sourceId, destId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
