import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAllLiveTrains } from '../api/live';
import type { LiveTrainMap } from '../api/types';

const POLL_INTERVAL = 15_000; // 15 seconds, same as m-indicator

export function useLiveTrains() {
  const [liveTrains, setLiveTrains] = useState<LiveTrainMap>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllLiveTrains();
      setLiveTrains(data);
    } catch {
      // silently fail — live tracking is best-effort
    }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return liveTrains;
}
