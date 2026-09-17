import { useState, useEffect, useRef } from 'react';
import { SYSTEM_METADATA } from '../data/canonicalData';

export interface TelemetryData {
  cryoTemp: number;
  qOps: number;
  coherence: number;
  drift: number;
  seals: number;
  block: number;
  merkleRoot: string;
}

const DEFAULT_TELEMETRY: TelemetryData = {
  cryoTemp: 14.98,
  qOps: 851.9,
  coherence: 99.992,
  drift: 0.0,
  seals: SYSTEM_METADATA.canonicalSeals || 14902,
  block: SYSTEM_METADATA.genesisBlock || 849202,
  merkleRoot: SYSTEM_METADATA.merkleRoot || '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
};

export function useLiveTelemetry(): TelemetryData {
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    function connect() {
      if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

      try {
        const source = new EventSource('/api/v1/telemetry/stream');
        sourceRef.current = source;

        source.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            setTelemetry({
              cryoTemp: Number(data.cryoTemp ?? DEFAULT_TELEMETRY.cryoTemp),
              qOps: Number(data.qOps ?? DEFAULT_TELEMETRY.qOps),
              coherence: Number(data.coherence ?? DEFAULT_TELEMETRY.coherence),
              drift: Number(data.drift ?? DEFAULT_TELEMETRY.drift),
              seals: Number(data.seals ?? DEFAULT_TELEMETRY.seals),
              block: Number(data.block ?? DEFAULT_TELEMETRY.block),
              merkleRoot: String(data.merkleRoot || DEFAULT_TELEMETRY.merkleRoot),
            });
          } catch (err) {
            console.error('Telemetry parse error:', err);
          }
        };

        source.onerror = () => {
          if (!isMountedRef.current) return;
          console.warn('Telemetry stream disconnected, scheduling reconnect...');
          source.close();
          sourceRef.current = null;
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, 3000);
        };
      } catch (err) {
        console.warn('Failed to initialize EventSource telemetry stream:', err);
      }
    }

    connect();

    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, []);

  return telemetry;
}
