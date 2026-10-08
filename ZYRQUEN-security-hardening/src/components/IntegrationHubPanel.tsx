import React, { useMemo, useState } from 'react';
import {
  Activity, CloudCog, KeyRound, Link2, PlugZap, RefreshCw, Search,
  ShieldCheck, Webhook, Database, ChevronRight, CircleDot,
} from 'lucide-react';
import { IntegrationHubState } from '../types';

interface Props {
  state: IntegrationHubState;
  onRefresh: () => void;
  onDiscover: (query: string) => void;
  discovery: string;
  onSeedSamples?: () => void;
  onTestConnection?: (integrationId: string) => void;
}

type Tab = 'overview' | 'connectors' | 'events' | 'audit';

const healthTone: Record<string, string> = {
  HEALTHY: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  DEGRADED: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  UNAVAILABLE: 'text-stone-400 bg-stone-800/50 border-stone-700',
  AUTH_REQUIRED: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  CONFIG_REQUIRED: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  ERROR: 'text-rose-300 bg-rose-500/10 border-rose-500/25',
  UNKNOWN: 'text-stone-400 bg-stone-800/50 border-stone-700',
};

const Badge: React.FC<{ label: string; tone?: string }> = ({ label, tone }) => (
  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tone || 'text-stone-400 bg-stone-800/50 border-stone-700'}`}>
    {label}
  </span>
);

const Empty: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="px-4 py-10 rounded-2xl border border-dashed border-stone-700 text-center text-xs text-stone-500">
    <div className="flex justify-center mb-2 text-stone-600">{icon}</div>
    {text}
  </div>
);

export const IntegrationHubPanel: React.FC<Props> = ({ state, onRefresh, onDiscover, discovery, onSeedSamples, onTestConnection }) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [query, setQuery] = useState(discovery || '');

  const connected = state.integrations.filter((x) => x.status === 'CONNECTED').length;
  const needsAuth = state.integrations.filter((x) => x.health === 'AUTH_REQUIRED').length;
  const unavailable = state.integrations.filter((x) => x.health === 'UNAVAILABLE').length;

  const cards = useMemo(
    () => [
      { label: 'Connected', value: connected, icon: <Link2 className="w-4 h-4 text-teal-300" />, accent: 'border-teal-500/20' },
      { label: 'Needs Auth', value: needsAuth, icon: <KeyRound className="w-4 h-4 text-amber-300" />, accent: 'border-amber-500/20' },
      { label: 'Unavailable', value: unavailable, icon: <CloudCog className="w-4 h-4 text-stone-400" />, accent: 'border-stone-700' },
      { label: 'Connectors', value: state.connectors.length, icon: <PlugZap className="w-4 h-4 text-cyan-300" />, accent: 'border-cyan-500/20' },
    ],
    [connected, needsAuth, unavailable, state.connectors.length],
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'connectors', label: 'Connectors' },
    { id: 'events', label: 'Events' },
    { id: 'audit', label: 'Audit' },
  ];

  const runDiscover = () => onDiscover(query.trim());

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-stone-950 text-stone-100">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3.5 border-b border-stone-800/80 bg-stone-900/90 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0">
              <PlugZap className="w-5 h-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base tracking-tight">Integration Hub</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Connectors
                </span>
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                ตัวเชื่อมต่อแบบ typed — ไม่สร้าง connection ปลอม
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onSeedSamples && (
              <button
                type="button"
                onClick={onSeedSamples}
                className="px-2.5 py-1.5 rounded-xl text-[11px] text-teal-200 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 transition-colors"
                title="ลงทะเบียน GitHub + Slack ตัวอย่าง"
              >
                Seed samples
              </button>
            )}
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-transparent hover:border-stone-700 transition-colors"
              title="รีเฟรช metadata"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-5xl mx-auto w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runDiscover()}
              placeholder="ค้นหา REST, Webhook, DB, MCP…"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500/40"
            />
          </div>
          <button
            type="button"
            onClick={runDiscover}
            className="px-3 py-2 rounded-xl bg-teal-500/15 text-teal-200 border border-teal-500/30 text-xs font-medium hover:bg-teal-500/25 transition-colors"
          >
            ค้นหา
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto w-full flex gap-1 p-1 rounded-xl bg-stone-950/80 border border-stone-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'bg-teal-500/20 text-teal-100 border border-teal-500/30'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-4 pb-10">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className={`rounded-2xl border bg-stone-900/50 p-3 space-y-2 ${c.accent}`}
                >
                  <div className="flex items-center justify-between">
                    {c.icon}
                    <span className="text-lg font-bold tabular-nums text-stone-100">{c.value}</span>
                  </div>
                  <div className="text-[11px] text-stone-500">{c.label}</div>
                </div>
              ))}
            </div>

            <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-stone-800/80 flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wide">Integrations</h3>
              </div>
              {state.integrations.length === 0 ? (
                <div className="p-4">
                  <Empty
                    icon={<CloudCog className="w-6 h-6" />}
                    text="ยังไม่มี integration ที่ลงทะเบียน — ระบบจะไม่แสดงตัวเชื่อมต่อปลอม"
                  />
                </div>
              ) : (
                <ul className="divide-y divide-stone-800/80">
                  {state.integrations.map((integ) => (
                    <li key={integ.id} className="px-4 py-3 hover:bg-stone-900/40 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <CircleDot className="w-3.5 h-3.5 text-teal-400/80" />
                            <b className="text-xs text-stone-100">{integ.name}</b>
                          </div>
                          <div className="mt-1 text-[11px] text-stone-500 pl-5 font-mono">
                            {integ.provider || '—'} · {integ.category || 'general'}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge label={integ.status || 'UNKNOWN'} />
                          <Badge
                            label={integ.health || 'UNKNOWN'}
                            tone={healthTone[integ.health || 'UNKNOWN']}
                          />
                          {onTestConnection && (
                            <button
                              type="button"
                              onClick={() => onTestConnection(integ.id)}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-800 text-stone-300 border border-stone-600 hover:bg-stone-700 hover:text-teal-200 transition-colors"
                            >
                              ทดสอบ connection
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {(state.health || []).length > 0 && (
              <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-stone-800/80 text-xs font-semibold text-stone-300 uppercase tracking-wide">
                  ผลการทดสอบล่าสุด
                </div>
                <ul className="divide-y divide-stone-800/80">
                  {(state.health || []).slice(0, 8).map((h) => (
                    <li key={h.integrationId + h.checkedAt} className="px-4 py-2.5 text-[11px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-stone-300">{h.integrationId}</span>
                        <Badge label={h.status} tone={healthTone[h.status] || healthTone.UNKNOWN} />
                        {typeof h.latencyMs === 'number' && (
                          <span className="text-stone-500">{h.latencyMs} ms</span>
                        )}
                      </div>
                      <ul className="mt-1 text-stone-500 list-disc pl-4">
                        {(h.evidence || []).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <ShieldCheck className="w-4 h-4 text-teal-300" />
                <span className="font-semibold text-stone-300">นโยบายความปลอดภัย</span>
              </div>
              <ul className="text-[11px] text-stone-500 space-y-1 leading-relaxed list-disc pl-5">
                <li>ไม่เก็บ secret / token แบบ plaintext ใน localStorage</li>
                <li>metadata ถูก sanitize ก่อนบันทึก audit / events</li>
                <li>แสดงเฉพาะ connector ที่มีสถานะจริง (AVAILABLE / UNAVAILABLE)</li>
              </ul>
            </section>
          </>
        )}

        {tab === 'connectors' && (
          <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stone-800/80">
              <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wide">
                Connectors {discovery ? `· filter: ${discovery}` : ''}
              </h3>
            </div>
            {state.connectors.length === 0 ? (
              <div className="p-4">
                <Empty
                  icon={<PlugZap className="w-6 h-6" />}
                  text="ยังไม่มี connector — ลงทะเบียนผ่าน IntegrationHub.registerConnector()"
                />
              </div>
            ) : (
              <ul className="divide-y divide-stone-800/80">
                {state.connectors.map((c) => (
                  <li key={c.id} className="px-4 py-3 hover:bg-stone-900/40 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {c.type === 'WEBHOOK' ? (
                            <Webhook className="w-3.5 h-3.5 text-violet-300" />
                          ) : c.type === 'DATABASE' ? (
                            <Database className="w-3.5 h-3.5 text-sky-300" />
                          ) : (
                            <PlugZap className="w-3.5 h-3.5 text-teal-300" />
                          )}
                          <b className="text-xs text-stone-100">{c.name}</b>
                        </div>
                        <p className="mt-1 text-[11px] text-stone-500 pl-5 leading-relaxed">
                          {c.description || 'ไม่มีคำอธิบาย'}
                        </p>
                        <div className="mt-1 text-[10px] text-stone-600 font-mono pl-5">
                          integration: {c.integrationId}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge label={c.type || 'UNKNOWN'} />
                        <Badge
                          label={c.availability || 'UNKNOWN'}
                          tone={
                            c.availability === 'AVAILABLE'
                              ? healthTone.HEALTHY
                              : healthTone.UNAVAILABLE
                          }
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'events' && (
          <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stone-800/80 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-sky-300" />
              <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wide">Recent Events</h3>
            </div>
            {(state.events || []).length === 0 ? (
              <div className="p-4">
                <Empty icon={<Activity className="w-6 h-6" />} text="ยังไม่มี event จาก integration hub" />
              </div>
            ) : (
              <ul className="divide-y divide-stone-800/60 max-h-96 overflow-y-auto">
                {(state.events || []).slice(0, 50).map((e) => (
                  <li key={e.eventId} className="px-4 py-2 text-[11px] font-mono hover:bg-stone-900/50">
                    <span className="text-stone-600">{e.timestamp}</span>
                    <span className="ml-2 text-sky-300/90">{e.type}</span>
                    {e.integrationId && (
                      <span className="ml-2 text-stone-500">→ {e.integrationId}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'audit' && (
          <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stone-800/80 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wide">Audit Trail</h3>
            </div>
            {(state.audit || []).length === 0 ? (
              <div className="p-4">
                <Empty icon={<ShieldCheck className="w-6 h-6" />} text="ยังไม่มี audit entry" />
              </div>
            ) : (
              <ul className="divide-y divide-stone-800/60 max-h-96 overflow-y-auto">
                {(state.audit || []).slice(0, 50).map((a) => (
                  <li key={a.id} className="px-4 py-2 text-[11px] font-mono hover:bg-stone-900/50">
                    <span className="text-stone-600">{a.timestamp}</span>
                    <span className="ml-2 text-amber-300/90">{(a as any).action || (a as any).type || 'audit'}</span>
                    {(a as any).integrationId && (
                      <span className="ml-2 text-stone-500">→ {(a as any).integrationId}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
