import { useEffect, useRef, useState, useCallback } from 'react';
import { ToastType } from '../components/ToastNotification';
import { playTone } from '../components/AudioSynthesizer';

export interface WebSocketAlertNotification {
  type: string;
  message: string;
  payload?: unknown;
  timestamp: string;
  systemStatus?: string;
  merkleRoot?: string;
  block?: number;
  seals?: number;
  drift?: string;
}

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export interface UseNotificationWebSocketOptions {
  /**
   * Callback to dispatch toasts to the application toast notification system
   */
  showToast?: (message: string, type?: ToastType) => void;
  /**
   * Whether to play synthesizer sound tone on incoming alerts (default: true)
   */
  playSound?: boolean;
  /**
   * Optional custom callback on every notification received
   */
  onNotification?: (notification: WebSocketAlertNotification) => void;
  /**
   * Whether to automatically reconnect when connection drops (default: true)
   */
  autoReconnect?: boolean;
  /**
   * Base WebSocket URL (defaults to auto-detected /ws/notifications)
   */
  wsUrl?: string;
}

export interface UseNotificationWebSocketReturn {
  isConnected: boolean;
  status: ConnectionStatus;
  latencyMs: number;
  lastNotification: WebSocketAlertNotification | null;
  notificationHistory: WebSocketAlertNotification[];
  reconnect: () => void;
  sendMessage: (data: unknown) => boolean;
  sendPing: () => void;
  trigger12StageReplay: (sealId?: number) => void;
}

/**
 * useNotificationWebSocket Hook
 * 
 * Manages resilient WebSocket connection to the Node.js Sovereign Notification Service (/ws/notifications),
 * handles heartbeat pings, tracks connection status, and automatically dispatches incoming
 * security, telemetry, compliance, and audit events to the ToastNotification system.
 */
export function useNotificationWebSocket(
  optionsOrShowToast?: UseNotificationWebSocketOptions | ((message: string, type?: ToastType) => void)
): UseNotificationWebSocketReturn {
  // Normalize options if passed directly as showToast function
  const options: UseNotificationWebSocketOptions =
    typeof optionsOrShowToast === 'function'
      ? { showToast: optionsOrShowToast }
      : optionsOrShowToast || {};

  const {
    showToast,
    playSound = true,
    onNotification,
    autoReconnect = true,
    wsUrl: customWsUrl,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('CONNECTING');
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [lastNotification, setLastNotification] = useState<WebSocketAlertNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<WebSocketAlertNotification[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const showToastRef = useRef(showToast);
  const onNotificationRef = useRef(onNotification);
  const pingSentTimeRef = useRef<number>(0);

  // Keep refs up-to-date with latest callbacks without triggering reconnects
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  // Resolve dynamic WebSocket URL based on protocol & host
  const getWebSocketUrl = useCallback(() => {
    if (customWsUrl) return customWsUrl;
    if (typeof window === 'undefined') return 'ws://localhost:3000/ws/notifications';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/notifications`;
  }, [customWsUrl]);

  // Connect & configure WebSocket client
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setStatus('CONNECTING');
    const targetUrl = getWebSocketUrl();

    try {
      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus('CONNECTED');

        // Initial Ping
        pingSentTimeRef.current = performance.now();
        ws.send(JSON.stringify({ action: 'PING', timestamp: Date.now() }));

        // Start Periodic Heartbeat (every 15s)
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingSentTimeRef.current = performance.now();
            ws.send(JSON.stringify({ action: 'PING', timestamp: Date.now() }));
          }
        }, 15000);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;

        try {
          const data: WebSocketAlertNotification = JSON.parse(event.data);

          // Handle Heartbeat Pong
          if (data.type === 'PONG') {
            if (pingSentTimeRef.current > 0) {
              const rtt = Math.round(performance.now() - pingSentTimeRef.current);
              setLatencyMs(Math.max(2, Math.min(rtt, 999)));
            }
            return;
          }

          // Update hook state
          setLastNotification(data);
          setNotificationHistory((prev) => [data, ...prev.slice(0, 49)]);

          // Invoke custom notification listener
          if (onNotificationRef.current) {
            onNotificationRef.current(data);
          }

          // Dispatch to ToastNotification system
          if (showToastRef.current && data.message) {
            const typeLower = (data.type || '').toUpperCase();

            // 1. Critical Security Alerts
            if (
              typeLower.includes('SECURITY') ||
              typeLower.includes('BREACH') ||
              typeLower.includes('INTRUSION')
            ) {
              if (playSound) {
                playTone(880, 0.12, 'triangle', 0.09);
              }
              showToastRef.current(`🚨 ${data.message}`, 'error');
            }
            // 2. Telemetry Anomaly / Drift Alerts
            else if (
              typeLower.includes('TELEMETRY') ||
              typeLower.includes('DRIFT') ||
              typeLower.includes('WARNING')
            ) {
              if (playSound) {
                playTone(660, 0.08, 'sine', 0.06);
              }
              showToastRef.current(`⚡ ${data.message}`, 'warning');
            }
            // 3. Compliance / Legal Updates
            else if (
              typeLower.includes('COMPLIANCE') ||
              typeLower.includes('LEGAL') ||
              typeLower.includes('ETDA') ||
              typeLower.includes('PDPA')
            ) {
              if (playSound) {
                playTone(540, 0.08, 'sine', 0.05);
              }
              showToastRef.current(`⚖️ ${data.message}`, 'info');
            }
            // 4. Audit Replay Completed
            else if (typeLower.includes('AUDIT_REPLAY') || typeLower.includes('CLOSURE')) {
              if (playSound) {
                playTone(780, 0.12, 'sine', 0.07);
              }
              showToastRef.current(`✓ ${data.message}`, 'success');
            }
            // 5. Handshake Notification (Log without disruptive popups)
            else if (typeLower.includes('HANDSHAKE')) {
              // Silently recorded in state & history
            }
            // 6. Trace Stage Event (Only milestone stage-12 closure toasts)
            else if (typeLower.includes('TRACE_STAGE_EVENT')) {
              const payloadObj = data.payload as Record<string, unknown> | undefined;
              if (payloadObj?.stageId === 12) {
                showToastRef.current(`✓ ${data.message}`, 'success');
              }
            }
            // 7. General Broadcasts
            else {
              showToastRef.current(data.message, 'info');
            }
          }
        } catch {
          // Ignored non-JSON packets
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setStatus('DISCONNECTED');
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setStatus('DISCONNECTED');
        clearInterval(pingIntervalRef.current);

        if (autoReconnect) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, 4000);
        }
      };
    } catch {
      setStatus('DISCONNECTED');
    }
  }, [autoReconnect, getWebSocketUrl, playSound]);

  // Lifecycle initialization and teardown
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Send arbitrary JSON message to backend
  const sendMessage = useCallback((data: unknown): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        wsRef.current.send(payload);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Send heartbeat ping
  const sendPing = useCallback(() => {
    pingSentTimeRef.current = performance.now();
    sendMessage({ action: 'PING', timestamp: Date.now() });
  }, [sendMessage]);

  // Trigger 12-stage trace replay over WebSocket
  const trigger12StageReplay = useCallback(
    (sealId = 14903) => {
      sendMessage({ action: 'START_12_STAGE_TRACE', sealId });
    },
    [sendMessage]
  );

  return {
    isConnected: status === 'CONNECTED',
    status,
    latencyMs,
    lastNotification,
    notificationHistory,
    reconnect: connect,
    sendMessage,
    sendPing,
    trigger12StageReplay,
  };
}
