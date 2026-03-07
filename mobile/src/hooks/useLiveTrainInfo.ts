import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLiveTrainInfo } from '../api/live';
import type { LiveTrainPosition } from '../api/types';

const POLL_INTERVAL = 15_000;

export function useLiveTrainInfo(trainNumber: string) {
  const [position, setPosition] = useState<LiveTrainPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchLiveTrainInfo(trainNumber);
      setPosition(data);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, [trainNumber]);

  useEffect(() => {
    setLoading(true);
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return { position, loading };
}
