'use client';

import { useEffect, useRef, useState } from 'react';

export function useMatchWs(matchId: string | null) {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const base = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';
    const ws = new WebSocket(`${base}/ws/match/${matchId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents((prev) => [data, ...prev].slice(0, 200));
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  }, [matchId]);

  return { events, connected };
}
