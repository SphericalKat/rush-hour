import { useEffect, useRef, useState } from 'react';
import { fetchTrainStatus } from '../api/reports';
import type { CrowdLevel, TrainStatus, WSMessage } from '../api/types';
import { WS_URL } from '../api/client';

interface State {
  status: TrainStatus | null;
  loading: boolean;
  error: string | null;
  liveLevel: CrowdLevel | null;
}

export function useTrainStatus(trainNumber: string) {
  const [state, setState] = useState<State>({
    status: null,
    loading: true,
    error: null,
    liveLevel: null,
  });
  const wsRef = useRef<WebSocket | null>(null);

  // Initial REST fetch
  useEffect(() => {
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
  }, [trainNumber]);

  // WebSocket for live updates
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL);
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
  }, [trainNumber]);

  return state;
}
