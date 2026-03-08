import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLiveTrainInfo } from '../api/live';
import type { LiveTrainPosition } from '../api/types';

const POLL_INTERVAL = 15_000;
const TICK_INTERVAL = 1_000;

export function useLiveTrainInfo(trainNumber: string) {
  const [position, setPosition] = useState<LiveTrainPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(POLL_INTERVAL / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchLiveTrainInfo(trainNumber);
      setPosition(data);
    } catch {
      // best-effort, keep previous data
    } finally {
      setLoading(false);
      setSecondsUntilRefresh(POLL_INTERVAL / 1000);
    }
  }, [trainNumber]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    tickRef.current = setInterval(() => {
      setSecondsUntilRefresh(s => Math.max(0, s - 1));
    }, TICK_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [load]);

  return { position, loading, secondsUntilRefresh };
}
