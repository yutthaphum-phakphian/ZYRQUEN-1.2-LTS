import { useState, useEffect } from 'react';

export interface TelemetryData {
  cryoTemp: number;
  qOps: number;
  coherence: number;
  drift: number;
  seals: number;
  block: number;
  merkleRoot: string;
}

export function useLiveTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  useEffect(() => {
    const source = new EventSource('/api/v1/telemetry/stream');

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry({
          cryoTemp: data.cryoTemp,
          qOps: data.qOps,
          coherence: data.coherence,
          drift: data.drift,
          seals: data.seals,
          block: data.block,
          merkleRoot: data.merkleRoot,
        });
      } catch (err) {
        console.error('Telemetry parse error:', err);
      }
    };

    source.onerror = () => {
      console.warn('Telemetry stream disconnected, retrying...');
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  return telemetry;
}
