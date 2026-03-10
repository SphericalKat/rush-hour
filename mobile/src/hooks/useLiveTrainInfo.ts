import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLiveTrainInfo } from '../api/live';
import type { LiveTrainPosition } from '../api/types';
import { useSettings } from './useSettings';

const POLL_INTERVAL = 15_000;

export function useLiveTrainInfo(trainNumber: string, enabled = true) {
  const { settings } = useSettings();
  enabled = enabled && settings.liveDataEnabled;
  const [position, setPosition] = useState<LiveTrainPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const data = await fetchLiveTrainInfo(trainNumber);
      setPosition(data);
    } catch {
      // best-effort, keep previous data
    } finally {
      setLoading(false);
      lastFetchRef.current = Date.now();
    }
  }, [trainNumber]);

  useEffect(() => {
    if (!enabled) return;
    load();
    const id = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [load, enabled]);

  return { position, loading, lastFetchAt: lastFetchRef.current };
}
