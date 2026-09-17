import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  ShieldAlert,
  Radio,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Lock,
  Layers,
  Check,
  Copy,
  Sliders,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { playTone, playAuditChime } from '../AudioSynthesizer';
import {
  fcmClientService,
  FcmClientTokenData,
  FcmLifecycleState,
} from '../../services/fcmClientService';
import {
  ANDROID_16_NOTIFICATION_CHANNELS,
  FcmDispatchResult,
} from '../../services/fcmNotificationService';

export const FcmPushNotificationManager: React.FC = () => {
  const [tokenData, setTokenData] = useState<FcmClientTokenData>(fcmClientService.getData());
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [recentDispatches, setRecentDispatches] = useState<FcmDispatchResult[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<'SECURITY' | 'TELEMETRY' | 'COMPLIANCE'>('SECURITY');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = fcmClientService.subscribe((data) => {
      setTokenData(data);
    });
    fetchDispatchHistory();
    return () => unsubscribe();
  }, []);

  const fetchDispatchHistory = async () => {
    try {
      const res = await fetch('/api/v1/fcm/history');
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setRecentDispatches(data.history);
        }
      }
    } catch {
      // offline fallback
    }
  };

  const handleCopyToken = () => {
    if (!tokenData.token) return;
    navigator.clipboard?.writeText(tokenData.token);
    setCopied(true);
    playTone(680, 0.04);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnablePermission = async () => {
    playTone(720, 0.05);
    const perm = await fcmClientService.requestNotificationPermission();
    if (perm === 'granted') {
      playAuditChime();
      setStatusMessage('Android 16.0+ Notification Permission Granted & Token Bound');
    } else {
      setStatusMessage('Notification Permission Denied by User');
    }
    setTimeout(() => setStatusMessage(null), 5000);
    fetchDispatchHistory();
  };

  const handleRotateToken = async () => {
    setIsRotating(true);
    playTone(580, 0.04);
    try {
      await fcmClientService.refreshTokenLifecycle();
      playAuditChime();
      setStatusMessage('FCM Registration Token rotated successfully (New 24h cycle)');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRotating(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleRevokeToken = async () => {
    playTone(420, 0.06);
    await fcmClientService.revokeToken();
    setStatusMessage('Push Token Revoked. Device unregistered from Sovereign Alert Layer.');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    playTone(800, 0.04);
    try {
      const res = await fetch('/api/v1/fcm/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedChannel,
        }),
      });
      const data = await res.json();
      playAuditChime();
      setStatusMessage(`Android 16+ Push Dispatched (${selectedChannel} Alert - SLA ~12ms)`);
      fetchDispatchHistory();
    } catch (err) {
      console.error('Test push error:', err);
      setStatusMessage('Failed to dispatch test push');
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const getStatusBadge = (state: FcmLifecycleState) => {
    switch (state) {
      case 'REGISTERED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            TOKEN ACTIVE (LOCKED)
          </span>
        );
      case 'TOKEN_REFRESHING':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
            ROTATING TOKEN
          </span>
        );
      case 'REVOKED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            REVOKED (PDPA §37)
          </span>
        );
      case 'PERMISSION_DENIED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            DENIED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-mono font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            UNREGISTERED
          </span>
        );
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#080d1a] border border-cyan-500/30 space-y-4 text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-zinc-100 font-bold flex items-center gap-2">
              <span>Firebase Cloud Messaging (FCM)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                Android 16.0+ (Baklava / API 36)
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              System Alerts Push Layer • Thai ETDA Sec 28 & PDPA Sec 37
            </div>
          </div>
        </div>
        <div>{getStatusBadge(tokenData.state)}</div>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-[11px] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Token Lifecycle & Device Card */}
      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Client Registration Token Lifecycle</span>
          <span className="text-emerald-400">24-Hour Rotation SLA</span>
        </div>

        {tokenData.token ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
            <div className="truncate flex-1 text-[11px] text-zinc-300 select-all font-mono">
              {tokenData.token}
            </div>
            <button
              onClick={handleCopyToken}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 text-[10px] flex items-center gap-1 transition-all"
              title="Copy FCM Registration Token"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-zinc-500 italic p-2 rounded bg-white/[0.02] border border-white/5">
            No active FCM token registered. Click "Enable Push" to initialize token lifecycle.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-1">
          <div>
            <span className="text-zinc-500">Device ID: </span>
            <span className="text-zinc-300 truncate">{tokenData.deviceId}</span>
          </div>
          <div>
            <span className="text-zinc-500">Platform: </span>
            <span className="text-cyan-300">Android 16.0+ (API 36)</span>
          </div>
          <div>
            <span className="text-zinc-500">Last Refreshed: </span>
            <span className="text-zinc-300">
              {tokenData.lastRefreshedAt ? new Date(tokenData.lastRefreshedAt).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Permission: </span>
            <span className={tokenData.permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>
              {tokenData.permission.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Android 16.0+ Notification Channels */}
      <div className="space-y-2">
        <div className="text-[11px] text-zinc-400 font-bold flex items-center justify-between">
          <span>Android 16.0+ Notification Channels</span>
          <span className="text-[10px] text-cyan-400">IMPORTANCE / PRIORITY</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.values(ANDROID_16_NOTIFICATION_CHANNELS).map((ch) => (
            <div
              key={ch.id}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]"
            >
              <div>
                <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                  <span className="text-cyan-400">#</span>
                  <span>{ch.name}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{ch.description}</div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    ch.importance === 'URGENT'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : ch.importance === 'HIGH'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {ch.importance}
                </span>
                {ch.bypassDnd && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold">
                    BYPASS DND
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <button
          onClick={handleEnablePermission}
          className="px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center gap-1.5 transition-all text-[11px]"
        >
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          <span>Enable Push</span>
        </button>

        <button
          onClick={handleRotateToken}
          disabled={isRotating || !tokenData.token}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 text-[11px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRotating ? 'animate-spin' : ''}`} />
          <span>Rotate Token</span>
        </button>

        <button
          onClick={handleSendTestPush}
          disabled={isSendingTest}
          className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 text-[11px]"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>Test Alert</span>
        </button>

        <button
          onClick={handleRevokeToken}
          disabled={!tokenData.token || tokenData.state === 'REVOKED'}
          className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 text-[11px]"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Revoke</span>
        </button>
      </div>

      {/* Realtime Push Delivery Stream */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Live Push Dispatch Delivery Stream
          </span>
          <button
            onClick={fetchDispatchHistory}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
          {recentDispatches.length === 0 ? (
            <div className="text-[10px] text-zinc-500 italic p-2 text-center">
              No recent push dispatches recorded. Click "Test Alert" to trigger simulated push delivery.
            </div>
          ) : (
            recentDispatches.slice(0, 5).map((disp) => (
              <div
                key={disp.dispatchId}
                className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[10px]"
              >
                <div>
                  <div className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <span className="text-emerald-400">HTTP/1.1 200 OK</span>
                    <span className="text-zinc-500">•</span>
                    <span>{disp.channelId}</span>
                  </div>
                  <div className="text-zinc-500 mt-0.5 truncate max-w-[200px]">
                    {disp.payload.message.notification.title}: {disp.payload.message.notification.body}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold">~{disp.latencyMs}ms</div>
                  <div className="text-zinc-600 text-[9px]">
                    {new Date(disp.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
