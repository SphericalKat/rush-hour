import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAllLiveTrains } from '../api/live';
import type { LiveTrainMap } from '../api/types';

const POLL_INTERVAL = 15_000; // 15 seconds, same as m-indicator

function mapsEqual(a: LiveTrainMap, b: LiveTrainMap): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function useLiveTrains() {
  const [liveTrains, setLiveTrains] = useState<LiveTrainMap>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllLiveTrains();
      setLiveTrains(prev => mapsEqual(prev, data) ? prev : data);
    } catch {
      // silently fail, live tracking is best-effort
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
