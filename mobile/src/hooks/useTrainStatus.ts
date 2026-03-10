import { useEffect, useRef, useState } from 'react';
import { fetchTrainStatus } from '../api/reports';
import type { CrowdLevel, TrainStatus, WSMessage } from '../api/types';
import { getWsUrl } from '../api/client';
import { useSettings } from './useSettings';

interface State {
  status: TrainStatus | null;
  loading: boolean;
  error: string | null;
  liveLevel: CrowdLevel | null;
}

export function useTrainStatus(trainNumber: string, enabled = true) {
  const { settings } = useSettings();
  const liveEnabled = enabled && settings.liveDataEnabled;

  const [state, setState] = useState<State>({
    status: null,
    loading: true,
    error: null,
    liveLevel: null,
  });
  const wsRef = useRef<WebSocket | null>(null);

  // Initial REST fetch
  useEffect(() => {
    if (!liveEnabled) {
      setState({ status: null, loading: false, error: null, liveLevel: null });
      return;
    }
    setState({ status: null, loading: true, error: null, liveLevel: null });
    fetchTrainStatus(trainNumber)
      .then((status) =>
        setState((s) => ({ ...s, status, loading: false })),
      )
      .catch((e) =>
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load',
        })),
      );
  }, [trainNumber, liveEnabled]);

  // WebSocket for live updates
  useEffect(() => {
    if (!liveEnabled) return;
    const wsUrl = getWsUrl(settings.serverUrl);
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', train: trainNumber }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WSMessage;
        if (msg.type === 'delay' && msg.delay_minutes !== undefined) {
          setState((s) => ({
            ...s,
            status: s.status
              ? { ...s.status, delay_minutes: msg.delay_minutes! }
              : null,
          }));
        } else if (msg.type === 'count' && msg.level) {
          setState((s) => ({ ...s, liveLevel: msg.level! }));
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, [trainNumber, liveEnabled, settings.serverUrl]);

  return state;
}
