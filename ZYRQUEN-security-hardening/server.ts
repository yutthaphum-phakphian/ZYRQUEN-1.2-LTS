import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { saveMission, loadMission, listMissions, statusFor, defaultMissionDir } from './src/server/missionStore';
import { parseTokens, makeAuthMiddlewareAsync, loginAsync, FailLimiter, USER_ID_RE } from './src/server/auth';
import { SessionStore } from './src/server/sessions';
import { tryCreateRedisBackend, asAsync, type SessionBackend } from './src/server/redisSessions';
import { UserRegistry } from './src/server/userRegistry';
import { InviteStore } from './src/server/invites';
import { configureAuditLog, audit, listAudit, auditCount } from './src/server/auditLog';
import { securityHeaders, authAuditLog, forceHttps, metricsGuard, adminGuard } from './src/server/security';
import { metricsMiddleware, toPrometheus, inc } from './src/server/metrics';
import nodePath from 'path';
import { registerAgentRunRoutes } from './src/server/agentRunRoutes';
import { registerSelfHealingReadOnlyRoutes } from './src/server/selfHealingRoutes';
import * as agentRuns from './server/agentRunController.ts';
import { listDurableRecordIds } from './server/durableStore.ts';
import { SelfHealingCoordinator } from './server/selfHealingLoop.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
export const selfHealingCoordinator = new SelfHealingCoordinator({
  repeatThreshold: Number(process.env.SELF_HEALING_REPEAT_THRESHOLD || 3),
  windowMs: Number(process.env.SELF_HEALING_WINDOW_MS || 15 * 60_000),
});

// HTTPS redirect (when FORCE_HTTPS=1 and behind TLS proxy), security headers, metrics, body parser
app.use(forceHttps);
app.use(securityHeaders);
app.use(metricsMiddleware);
app.use(express.json({ limit: '10mb' }));

// Access control: set AUTH_TOKENS="token:user,token2:user2" (tokens >= 16 chars). Unset = open dev mode.
const authTable = parseTokens(process.env.AUTH_TOKENS);
const explicitOpenMode = /^(1|true|yes)$/i.test(String(process.env.AUTH_ALLOW_OPEN || ''));
const productionAuthRequired = process.env.NODE_ENV === 'production' && !explicitOpenMode;
if (authTable.length === 0 && productionAuthRequired && !process.env.ADMIN_TOKEN) {
  console.warn('[auth] Production authentication is not configured; protected API will fail closed.');
} else if (authTable.length === 0) {
  console.warn('[auth] AUTH_TOKENS not set: API is OPEN only when AUTH_ALLOW_OPEN=1 or non-production.');
}
const failLimiter = new FailLimiter();
const sessionTtlMs = Number(process.env.SESSION_TTL_HOURS || 12) * 3600_000;

// Session backend priority: Redis (REDIS_URL) → file-persisted memory (SESSION_PERSIST_PATH) → pure memory.
const sessionPersist = process.env.SESSION_PERSIST_PATH || null;
const memoryStore = new SessionStore(sessionTtlMs, 1000, Date.now, sessionPersist);
if (sessionPersist) {
  process.on('beforeExit', () => memoryStore.flush());
  process.on('SIGINT', () => { memoryStore.flush(); process.exit(0); });
  process.on('SIGTERM', () => { memoryStore.flush(); process.exit(0); });
}

// Resolved before listen so Redis can connect asynchronously.
let sessionBackend: SessionBackend = asAsync(memoryStore);
const userRegistryPath = process.env.USER_REGISTRY_PATH || (process.env.AUTH_TOKENS || process.env.ADMIN_TOKEN ? '.data/users.json' : null);
const userRegistry = new UserRegistry(userRegistryPath);
const inviteStorePath = process.env.INVITE_STORE_PATH || (userRegistryPath ? '.data/invites.json' : null);
const inviteStore = new InviteStore(inviteStorePath);
configureAuditLog(process.env.AUDIT_LOG_PATH || (userRegistryPath ? '.data/audit.ndjson' : null));
if (inviteStorePath) {
  process.on('beforeExit', () => inviteStore.flush());
}

if (userRegistryPath) {
  process.on('beforeExit', () => userRegistry.flush());
  process.on('SIGINT', () => { userRegistry.flush(); });
  process.on('SIGTERM', () => { userRegistry.flush(); });
}


const ipOf = (req: any) => String(req.ip || req.socket?.remoteAddress || 'unknown');
const bearerOf = (req: any) => /^Bearer (.{1,512})$/.exec(req.headers?.authorization || '')?.[1];

app.post('/api/login', async (req, res) => {
  const r = await loginAsync(req.body?.key, ipOf(req), authTable, sessionBackend, failLimiter, userRegistry);
  if (r.status === 429 && typeof r.body.retryAfterSec === 'number') {
    res.setHeader('Retry-After', String(r.body.retryAfterSec));
  }
  if (r.status === 200) { inc('auth_login_total', { result: 'ok' }); audit('auth.login', { actor: String(r.body.userId||''), result: 'ok', detail: ipOf(req) }); }
  else if (r.status === 401) { inc('auth_login_total', { result: 'unauthorized' }); audit('auth.login', { actor: ipOf(req), result: 'unauthorized', level: 'warn' }); }
  else if (r.status === 429) { inc('auth_login_total', { result: 'rate_limited' }); audit('auth.login', { actor: ipOf(req), result: 'rate_limited', level: 'warn' }); }
  else inc('auth_login_total', { result: 'other' });
  return res.status(r.status).json(r.body);
});
app.use('/api', authAuditLog, (req, res, next) => {
  if (req.path === '/health' || req.path === '/metrics' || req.path.startsWith('/admin') || req.path.startsWith('/invite')) return next();
  const authOn = authTable.length > 0 || userRegistry.size() > 0;
  if (productionAuthRequired && !authOn) return res.status(503).json({ error: 'AUTH_NOT_CONFIGURED', reason: 'Production API requires AUTH_TOKENS or a registered user' });
  return makeAuthMiddlewareAsync(authTable, failLimiter, authOn ? sessionBackend : undefined, userRegistry)(req, res, next);
});
app.post('/api/logout', async (req, res) => res.json({ ok: await sessionBackend.revoke(bearerOf(req)) }));
app.post('/api/session/refresh', async (req, res) => {
  if (!authTable.length && userRegistry.size() === 0) return res.json({ authRequired: false, token: '', expiresAt: null });
  const r = await sessionBackend.refresh(bearerOf(req));
  return r ? res.json({ authRequired: true, ...r }) : res.status(401).json({ error: 'UNAUTHORIZED' });
});

// Current session info (requires valid session token via auth middleware)
app.get('/api/session/me', async (req, res) => {
  if (!authTable.length && userRegistry.size() === 0) {
    return res.json({ authRequired: false, userId: 'local', expiresAt: null });
  }
  const v = await sessionBackend.verify(bearerOf(req));
  if (!v) return res.status(401).json({ error: 'UNAUTHORIZED' });
  return res.json({
    authRequired: true,
    userId: v.userId,
    expiresAt: v.expiresAt,
    remainingMs: Math.max(0, v.expiresAt - Date.now()),
  });
});

// ── Admin (requires ADMIN_TOKEN, min 16 chars) ──────────────────────────────
// These routes sit behind the normal auth middleware AND adminGuard, so callers
// need a valid session *or* we exempt /admin from session auth and only use admin token.
// Practical choice: admin routes use ONLY adminGuard (no user session required).
app.post('/api/admin/revoke-user', adminGuard, async (req, res) => {
  const userId = String(req.body?.userId || '').trim();
  if (!USER_ID_RE.test(userId)) {
    return res.status(400).json({ error: 'BAD_USER_ID' });
  }
  const n = await sessionBackend.revokeUser(userId);
  inc('admin_revoke_user_total', { result: 'ok' });
  audit('session.revoke_user', { actor: 'admin', target: userId, result: 'ok', detail: `revoked=${n}` });
  return res.json({ ok: true, userId, revokedSessions: n });
});

app.get('/api/admin/status', adminGuard, async (req, res) => {
  let sessionsApprox = -1;
  try { sessionsApprox = await sessionBackend.size(); } catch { /* */ }
  const envUsers = authTable.map((e) => e.userId);
  return res.json({
    authRequired: authTable.length > 0 || userRegistry.size() > 0,
    envUsers,
    registryUsers: userRegistry.list(),
    sessionBackend: process.env.REDIS_URL ? 'redis' : (process.env.SESSION_PERSIST_PATH ? 'file' : 'memory'),
    sessionsApprox,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
  });
});

app.get('/api/admin/users', adminGuard, (req, res) => {
  res.json({ users: userRegistry.list(), envUsers: authTable.map((e) => e.userId) });
});

app.post('/api/admin/users', adminGuard, (req, res) => {
  try {
    const userId = String(req.body?.userId || '').trim();
    const note = req.body?.note != null ? String(req.body.note) : undefined;
    const issued = userRegistry.create(userId, note);
    // accessKey is returned once — store it securely
    inc('admin_user_create_total', { result: 'ok' });
    audit('user.create', { actor: 'admin', target: issued.userId, result: 'ok' });
    return res.status(201).json({ ok: true, ...issued, warning: 'Store accessKey now; it cannot be retrieved again' });
  } catch (e: any) {
    const code = e?.code || 'ERROR';
    const status = code === 'USER_EXISTS' ? 409 : code === 'BAD_USER_ID' ? 400 : 500;
    inc('admin_user_create_total', { result: 'error' });
    return res.status(status).json({ error: code });
  }
});

app.post('/api/admin/users/:userId/rotate', adminGuard, async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim();
    const issued = userRegistry.rotate(userId);
    // Invalidate all existing sessions for this user
    const revoked = await sessionBackend.revokeUser(userId);
    inc('admin_user_rotate_total', { result: 'ok' });
    audit('user.rotate', { actor: 'admin', target: userId, result: 'ok', detail: `revoked=${revoked}` });
    return res.json({ ok: true, ...issued, revokedSessions: revoked, warning: 'Store accessKey now; old key is dead' });
  } catch (e: any) {
    const code = e?.code || 'ERROR';
    return res.status(code === 'NOT_FOUND' ? 404 : 500).json({ error: code });
  }
});

app.post('/api/admin/users/:userId/enable', adminGuard, async (req, res) => {
  const userId = String(req.params.userId || '').trim();
  const enabled = req.body?.enabled !== false;
  const ok = userRegistry.setEnabled(userId, enabled);
  if (!ok) return res.status(404).json({ error: 'NOT_FOUND' });
  if (!enabled) await sessionBackend.revokeUser(userId);
  return res.json({ ok: true, userId, enabled });
});

app.delete('/api/admin/users/:userId', adminGuard, async (req, res) => {
  const userId = String(req.params.userId || '').trim();
  const ok = userRegistry.remove(userId);
  if (!ok) return res.status(404).json({ error: 'NOT_FOUND' });
  const revoked = await sessionBackend.revokeUser(userId);
  return res.json({ ok: true, userId, revokedSessions: revoked });
});


// ── Invites (one-time access key delivery) ───────────────────────────────────
app.get('/api/admin/audit', adminGuard, (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query?.limit) || 100));
  res.json({ events: listAudit(limit), total: auditCount() });
});

app.get('/api/admin/invites', adminGuard, (req, res) => {
  res.json({ invites: inviteStore.list() });
});

/** Create invite for existing or new user. If createUser=true and user missing, create them. */
app.post('/api/admin/invites', adminGuard, (req, res) => {
  try {
    const userId = String(req.body?.userId || '').trim();
    const note = req.body?.note != null ? String(req.body.note) : undefined;
    const ttlHours = Number(req.body?.ttlHours);
    const ttlMs = Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours * 3600_000 : undefined;
    const createUser = req.body?.createUser === true;
    if (createUser && !userRegistry.get(userId)) {
      // create user now; access key will be rotated again on redeem for freshness
      try { userRegistry.create(userId, note); } catch (e: any) {
        if (e?.code !== 'USER_EXISTS') throw e;
      }
    } else if (!userRegistry.get(userId) && !authTable.some((e) => e.userId === userId)) {
      // Allow invite for env-only users too (redeem will rotate registry key or create)
      if (createUser) userRegistry.create(userId, note);
      else return res.status(404).json({ error: 'USER_NOT_FOUND', hint: 'Pass createUser:true or create the user first' });
    }
    const configuredBase = String(process.env.APP_URL || '').trim();
    if (process.env.NODE_ENV === 'production' && !configuredBase) return res.status(500).json({ error: 'APP_URL_REQUIRED_FOR_INVITES' });
    let base: URL;
    try { base = new URL(configuredBase || `${req.protocol}://${req.get('host')}`); } catch { return res.status(500).json({ error: 'INVALID_APP_URL' }); }
    if (base.protocol !== 'https:' && process.env.NODE_ENV === 'production') return res.status(500).json({ error: 'APP_URL_MUST_BE_HTTPS' });
    const inv = inviteStore.create(userId, { ttlMs, note, createdBy: 'admin' });
    const redeemUrl = new URL('/?invite=' + encodeURIComponent(inv.token), base).toString();
    inc('admin_invite_create_total', { result: 'ok' });
    audit('invite.create', { actor: 'admin', target: inv.userId, result: 'ok' });
    return res.status(201).json({
      ok: true,
      userId: inv.userId,
      token: inv.token,
      expiresAt: inv.expiresAt,
      redeemUrl,
      warning: 'Share redeemUrl or token once; it is single-use',
    });
  } catch (e: any) {
    const code = e?.code || 'ERROR';
    return res.status(code === 'BAD_USER_ID' ? 400 : 500).json({ error: code });
  }
});

/** Public: burn invite and return a fresh access key for the user (create/rotate in registry). */
app.post('/api/invite/redeem', async (req, res) => {
  const token = String(req.body?.token || req.query?.token || '').trim();
  const burned = inviteStore.redeem(token);
  if (!burned) {
    inc('invite_redeem_total', { result: 'invalid' });
    return res.status(400).json({ error: 'INVALID_OR_EXPIRED_INVITE' });
  }
  try {
    let accessKey: string;
    if (userRegistry.get(burned.userId)) {
      accessKey = userRegistry.rotate(burned.userId).accessKey;
    } else {
      accessKey = userRegistry.create(burned.userId, burned.note).accessKey;
    }
    // Also kill any existing sessions — new key means re-login
    await sessionBackend.revokeUser(burned.userId);
    inc('invite_redeem_total', { result: 'ok' });
    audit('invite.redeem', { actor: 'invitee', target: burned.userId, result: 'ok' });
    return res.json({
      ok: true,
      userId: burned.userId,
      accessKey,
      warning: 'Store accessKey now; invite is burned and cannot be reused',
    });
  } catch (e: any) {
    inc('invite_redeem_total', { result: 'error' });
    return res.status(500).json({ error: e?.code || 'REDEEM_FAILED' });
  }
});

/** Convenience GET redeem for link-click (returns JSON; SPA can also post). */
app.get('/api/invite/redeem', async (req, res) => {
  const token = String(req.query?.token || '').trim();
  const burned = inviteStore.redeem(token);
  if (!burned) return res.status(400).json({ error: 'INVALID_OR_EXPIRED_INVITE' });
  try {
    let accessKey: string;
    if (userRegistry.get(burned.userId)) accessKey = userRegistry.rotate(burned.userId).accessKey;
    else accessKey = userRegistry.create(burned.userId, burned.note).accessKey;
    await sessionBackend.revokeUser(burned.userId);
    return res.json({ ok: true, userId: burned.userId, accessKey, warning: 'Store accessKey now; invite is burned' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.code || 'REDEEM_FAILED' });
  }
});

const userMissionDir = (req: any) => { if (!USER_ID_RE.test(req.userId || '')) throw Object.assign(new Error('UNAUTHORIZED'), { code: 'UNAUTHORIZED' }); return nodePath.join(defaultMissionDir(), req.userId); };

// Helper to get GoogleGenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the environment');
  }
  return new GoogleGenAI({ apiKey });
}

// System Instruction for V8 Long-Term Project Brain & Multi-Task Agent
const SYSTEM_INSTRUCTION = `
คุณคือ “CodeVoice AI (V8 Long-Term Project Brain & Multi-Task Autonomous Coding Agent)”

เป้าหมายหลัก:
ทำงานเป็นศูนย์กลางปัญญาของโปรเจกต์ (Project Brain) ที่เข้าใจบริบททั้งโปรเจกต์ในระยะยาว บริหารจัดการ Multi-Task Queue, รองรับ Task Dependencies, บันทึก Architecture Decisions, ประเมินผลกระทบ (Change Impact Analysis), และสามารถทำงานต่อเนื่อง ("ทำต่อ", "resume") ข้าม session ได้อย่างแม่นยำ

หลักสำคัญ: **ฉลาดและคิดเร็ว** — วิเคราะห์คม ลงมือตรงจุด ไม่ยืดเยื้อเกินงาน

---

0. โหมดคิดแบบ Adaptive (เร็วเมื่อง่าย ลึกเมื่อยาก):

**จำแนกว่าที่ทันที (1 วินาทีแรก):**
- FAST: ทักทาย, คำถามสั้น, แก้ข้อความเล็กน้อย, อธิบายจุดเดียว → ตอบตรง ๆ 2–8 ประโยค ไม่ต้องย่อยแผนยาว
- STANDARD: เขียน/แก้โค้ดปานกลาง, debug ชัดเจน → แผนสั้น 2–5 ขั้น แล้วลงมือ
- DEEP: สถาปัตยกรรม, งานหลายไฟล์, security, migration, กำกวม → วิเคราะห์สมมติฐาน ความเสี่ยง dependencies ก่อนลงมือ

**หลักคิดเร็วแต่ไม่ตื้น:**
1. จับเป้าหมายและข้อจำกัดจากบริบทที่มี — อย่าถามซ้ำสิ่งที่ข้อมูลมีอยู่แล้ว
2. เลือกแนวทางที่ดีที่สุดใน 1–2 ตัวเลือก (ไม่ต้องไล่ทุกทางถ้าไม่คุ้ม)
3. ลงมือทีเดียวให้ครบในขอบเขตที่ขอ — โค้ดเต็ม ไม่ใช่โครงเปล่า
4. ตรวจด่วน: ขัดกฎโปรเจกต์ไหม? เคสว่าง/error พื้นฐานพังไหม?
5. ตอบกระชับ: สรุปผล → โค้ด/ขั้นตอน → ความเสี่ยงเฉพาะเมื่อมีจริง

**เร่งความเร็วการตอบ:**
- อย่าเขียน reasoning ยาวในงาน FAST
- อย่าทวนคำถามผู้ใช้ซ้ำทั้งก้อน
- อย่าสร้าง task roadmap ยาวเมื่องานทำได้ในครั้งเดียว
- displayResponse ใช้หัวข้อสั้น ตาราง/bullet แทนย่อหน้ายาว
- voiceResponse ยังสั้น 1–2 ประโยคเสมอ

**ยังห้าม:**
- เดา API/path ที่ไม่มีในบริบทโดยไม่บอก
- โค้ดครึ่ง ๆ หรือ placeholder ในส่วนสำคัญ
- ละเลย error ที่เห็นชัดในบริบท
- ตอบคลุมเครือแทนการตัดสินใจเมื่อมีข้อมูลพอ

เมื่อไม่แน่ใจจริง ๆ: ถามคำถามชี้ชัด 1 ข้อ หรือเลือกทางที่ปลอดภัยที่สุดแล้วบอกสมมติฐานสั้น ๆ

---

1. สถาปัตยกรรม Project Brain & Dynamic Context Hierarchy:
ลำดับความสำคัญของ Context:
- [CRITICAL]: Project Rules, Architecture Decisions, Current Task State, Security Rules (ห้ามทำลาย)
- [HIGH]: Task Dependencies, Known Issues, Relevant Knowledge Base items
- [MEDIUM]: Recent Changes, File Structure
- [LOW]: บทสนทนาเก่าที่ไม่เกี่ยวข้อง

---

2. การจัดการ Task Queue & Dependencies:
- งานใหญ่ → แตก Multi-Task Roadmap พร้อม dependencies ที่ชัดเจน
- Task ที่พึ่งพาสิ่งที่ยังไม่เสร็จ → สถานะ BLOCKED
- "ทำต่อ" / "resume" → ดึง task ที่ค้างจาก memory ทันที

---

3. Architecture Decisions & Conflict Resolution:
- บันทึกการตัดสินใจสถาปัตยกรรมสำคัญ
- หากเปลี่ยนแนวทาง ให้อธิบายเหตุผลและผลกระทบ

---

4. Change Impact Analysis:
- ก่อนแก้ไฟล์หลัก ประเมิน LOW / MEDIUM / HIGH
- HIGH → แผนรัดกุม ระบุส่วนที่อาจพัง และวิธีทดสอบ

---

5. กฎเหล็กสำหรับ Voice Output:
- ห้ามอ่านโค้ดยาวหรือ Prompt ยาวออกเสียง
- voiceResponse: ภาษาไทย 1-2 ประโยค สั้น กระชับ อบอุ่น
- displayResponse: Markdown เต็ม — รวมเหตุผล/แผน/checklist/code/ความเสี่ยง ตามความเหมาะสม

---

6. ฟิลด์ reasoning (ถ้ามีใน schema):
- summary: สรุปการคิดสั้น ๆ
- assumptions: สมมติฐานสำคัญ
- risks: ความเสี่ยงหรือจุดที่ต้องระวัง
- openQuestions: สิ่งที่ยังไม่ชัด (ถ้าว่างแสดงว่าพร้อมลงมือ)

---

7. ตอบกลับในรูปแบบ JSON ตาม Schema ที่กำหนดเสมอ
`;

// Helper to normalize and ensure strictly alternating user/model turns for Gemini multi-turn API
type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
function buildGeminiContents(
  history: any[],
  currentContextPrompt: string,
  images?: Array<{ mimeType?: string; data?: string; name?: string }>,
) {
  const normalized: Array<{ role: 'user' | 'model'; parts: GeminiPart[] }> = [];

  if (Array.isArray(history) && history.length > 0) {
    for (const turn of history) {
      const role: 'user' | 'model' = (turn.role === 'model' || turn.role === 'assistant') ? 'model' : 'user';
      const textContent = typeof turn.content === 'string' 
        ? turn.content 
        : (turn.displayResponse || turn.summaryText || JSON.stringify(turn.content || ''));

      if (!textContent || !textContent.trim()) continue;

      const last = normalized[normalized.length - 1];
      if (last && last.role === role) {
        last.parts.push({ text: textContent });
      } else {
        normalized.push({
          role,
          parts: [{ text: textContent }],
        });
      }
    }
  }

  const imageParts: GeminiPart[] = [];
  if (Array.isArray(images)) {
    for (const img of images.slice(0, 5)) {
      const data = typeof img?.data === 'string' ? img.data.replace(/^data:[^;]+;base64,/, '') : '';
      const mimeType = typeof img?.mimeType === 'string' && img.mimeType.startsWith('image/')
        ? img.mimeType
        : 'image/jpeg';
      // ~1MB raw → ~1.4M base64 chars
      if (!data || data.length > 1_400_000) continue;
      imageParts.push({ inlineData: { mimeType, data } });
    }
  }

  const currentParts: GeminiPart[] = [{ text: currentContextPrompt }, ...imageParts];

  // Ensure current context prompt is attached as user role, preserving alternating order
  const last = normalized[normalized.length - 1];
  if (last && last.role === 'user') {
    last.parts.push(...currentParts);
  } else {
    normalized.push({
      role: 'user',
      parts: currentParts,
    });
  }

  return normalized;
}

// Helper to safely parse JSON returned by Gemini
function safeParseGeminiJson(rawText: string, fallbackPrompt: string) {
  let clean = (rawText || '').trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.warn('Failed to parse model JSON directly, attempting fallback extraction:', err);
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // ignore
      }
    }

    return {
      intent: 'AGENT',
      status: 'success',
      voiceResponse: 'เรียบร้อยครับ วางแผนและดำเนินการตามคำสั่งให้แล้วครับ',
      displayResponse: rawText || 'ดำเนินการเสร็จสิ้นเรียบร้อยครับ',
      files: [],
      nextAction: 'สั่งงานหรือตรวจสอบโค้ดต่อได้ทันทีครับ',
    };
  }
}

// Health / readiness — open (no auth). Used by load balancers & Docker HEALTHCHECK.
const startedAt = Date.now();
app.get('/api/health', async (req, res) => {
  let sessionsApprox = -1;
  try {
    sessionsApprox = await sessionBackend.size();
  } catch { /* ignore */ }
  const body = {
    status: 'ok',
    version: 'V18',
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    authRequired: authTable.length > 0 || userRegistry.size() > 0,
    sessionBackend: process.env.REDIS_URL ? 'redis' : (process.env.SESSION_PERSIST_PATH ? 'file' : 'memory'),
    sessionsApprox,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});

// Prometheus-compatible metrics. Optionally protected by METRICS_TOKEN / METRICS_ALLOW_IPS.
app.get('/api/metrics', metricsGuard, (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(toPrometheus({ service: 'codevoice-ai', version: 'V18' }));
});

// Main Assistant & Autonomous Agent Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { 
      message, 
      history = [], 
      projectContext = {}, 
      isVoiceMode = false,
      activeAgentMode = 'AGENT',
      settings = {},
      images = [],
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured on the server. Please ensure the secret is attached.' 
      });
    }

    const ai = getGenAI();

    // V8 Smart Context Builder: Filter & prioritize context to avoid token bloat
    const filesList = (projectContext.files || []).slice(0, 12).map((f: any) => 
      `--- ไฟล์: ${f.name} (${f.language || 'text'}) ---\n${typeof f.content === 'string' ? f.content.slice(0, 600) : ''}`
    ).join('\n\n');

    const rulesList = (projectContext.rules || [])
      .filter((r: any) => r.active !== false)
      .map((r: any) => `- ${r.text}`)
      .join('\n');

    const decisionsList = (projectContext.decisions || [])
      .filter((d: any) => d.status !== 'superseded')
      .map((d: any) => `- [${d.category || 'Architecture'}] ${d.decision} (เหตุผล: ${d.reason})`)
      .join('\n');

    const tasksList = (projectContext.tasks || [])
      .map((t: any) => `- [${t.status}] #${t.id || t.taskId}: ${t.title}${t.dependencies && t.dependencies.length > 0 ? ` (รอ: ${t.dependencies.join(', ')})` : ''}`)
      .join('\n');

    const knowledgeList = (projectContext.knowledgeBase || [])
      .map((k: any) => `[Source: ${k.source || 'Knowledge'}] ${k.title}: ${k.content.slice(0, 200)}`)
      .join('\n\n');

    const contextPrompt = `
=== ข้อมูล PROJECT BRAIN & สถาปัตยกรรม (V8 Long-Term Context) ===
ชื่อโปรเจกต์: ${projectContext.projectName || projectContext.name || 'Web App'}
หมวดหมู่: ${projectContext.category || 'Web App'}
Framework & Stack: ${projectContext.framework || projectContext.language || 'HTML5/Tailwind/JS'}
คำอธิบาย: ${projectContext.description || 'ไม่มี'}
เป้าหมายปัจจุบัน: ${projectContext.currentGoal || projectContext.currentTask || 'สแตนด์บาย'}
ฟีเจอร์ที่มีอยู่แล้ว: ${(projectContext.features || projectContext.completedFeatures || []).join(', ') || 'ไม่มี'}
ปัญหาคงค้าง: ${projectContext.activeIssues || 'ไม่มี'}
โหมดการทำงาน: ${activeAgentMode}

[CRITICAL] กฎเหล็กประจำโปรเจกต์ (Project Rules):
${rulesList || '- เขียนโค้ดที่สมบูรณ์ ปลอดภัย และรันได้จริง ห้ามเขียน placeholder'}

[CRITICAL] การตัดสินใจสถาปัตยกรรม (Architecture Decisions):
${decisionsList || '- ใช้ Tailwind CSS และ Modular Layout'}

[HIGH] รายการงานในโปรเจกต์ (Task Memory & Queue):
${tasksList || '- ยังไม่มี Task ในคิว'}

[HIGH] คลังความรู้ที่เกี่ยวข้อง (Knowledge Base):
${knowledgeList || 'ไม่มีเอกสารเพิ่มเติม'}

[MEDIUM] ไฟล์ในโปรเจกต์ (${(projectContext.files || []).length} ไฟล์):
${filesList}
=====================================================

คำสั่งล่าสุดจากผู้ใช้: "${message}"
ใช้โหมดคิด Adaptive (FAST/STANDARD/DEEP) ตามความยาก — ตอบฉลาด กระชับ ลงมือเร็ว
${isVoiceMode ? '(หมายเหตุ: สั่งงานผ่านเสียง กรุณาทำให้ voiceResponse สั้น กระชับ อบอุ่น และฟังง่ายเป็นพิเศษ 1-2 ประโยค)' : ''}
${Array.isArray(images) && images.length ? `(ผู้ใช้อัปโหลดรูปภาพประกอบ ${images.length} ไฟล์ — วิเคราะห์จากรูปที่แนบมาด้วย)` : ''}
`;

    const contents = buildGeminiContents(history, contextPrompt, images);
    const modelName = settings.model || 'gemini-3.8-flash';
    const temperature = typeof settings.temperature === 'number' ? settings.temperature : 0.5;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: temperature,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: 'เจตนา: CHAT, PROMPT, CODE, DEBUG, EXPLAIN, MODIFY, PROJECT, or AGENT',
            },
            taskType: {
              type: Type.STRING,
              description: 'CHAT, PROMPT, CODE, DEBUG, REFACTOR, PROJECT, RESEARCH, EXPLAIN, or AGENT',
            },
            status: {
              type: Type.STRING,
              description: 'success or error',
            },
            voiceResponse: {
              type: Type.STRING,
              description: 'ข้อความสั้น 1-2 ประโยคสำหรับอ่านออกเสียง (Voice TTS) ห้ามอ่านโค้ดยาวเด็ดขาด',
            },
            displayResponse: {
              type: Type.STRING,
              description: 'เนื้อหา Markdown ฉบับเต็มสำหรับแสดงบนหน้าจอของผู้ใช้',
            },
            citations: {
              type: Type.ARRAY,
              description: 'แหล่งอ้างอิงจาก Knowledge Base เช่น README.md, docs/api.md',
              items: { type: Type.STRING },
            },
            tasks: {
              type: Type.ARRAY,
              description: 'รายการ Task Roadmap ที่สร้างหรืออัปเดตสำหรับ Multi-Task Queue',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'TODO, IN_PROGRESS, BLOCKED, COMPLETED' },
                  dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  order: { type: Type.INTEGER },
                },
                required: ['id', 'title', 'status'],
              },
            },
            decision: {
              type: Type.OBJECT,
              description: 'การตัดสินใจทางสถาปัตยกรรมใหม่ (ถ้ามี)',
              properties: {
                decision: { type: Type.STRING },
                reason: { type: Type.STRING },
                category: { type: Type.STRING },
              },
            },
            impact: {
              type: Type.OBJECT,
              description: 'การประเมินผลกระทบของการเปลี่ยนแปลง (Change Impact)',
              properties: {
                level: { type: Type.STRING, description: 'LOW, MEDIUM, or HIGH' },
                reason: { type: Type.STRING },
              },
            },
            plan: {
              type: Type.OBJECT,
              description: 'แผนการทำงานของ Agent',
              properties: {
                goal: { type: Type.STRING, description: 'เป้าหมายหลัก' },
                affectedFiles: { type: Type.ARRAY, items: { type: Type.STRING } },
                permissionLevel: { type: Type.STRING, description: 'SAFE, REVIEW, or DANGEROUS' },
                requiresConfirmation: { type: Type.BOOLEAN },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      status: { type: Type.STRING, description: 'completed, running, or pending' },
                      detail: { type: Type.STRING },
                    },
                    required: ['id', 'label', 'status'],
                  },
                },
              },
            },
            files: {
              type: Type.ARRAY,
              description: 'รายการไฟล์โค้ดที่สร้าง หรือ แก้ไขที่สมบูรณ์',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'ชื่อไฟล์และ path เช่น index.html, style.css, script.js' },
                  language: { type: Type.STRING, description: 'ภาษา เช่น html, css, javascript, typescript, python' },
                  content: { type: Type.STRING, description: 'โค้ดที่สมบูรณ์และใช้งานได้จริง' },
                  action: { type: Type.STRING, description: 'create or update' },
                  description: { type: Type.STRING, description: 'คำอธิบายสั้น ๆ ของไฟล์' },
                },
                required: ['name', 'language', 'content'],
              },
            },
            diffs: {
              type: Type.ARRAY,
              description: 'รายการการเปลี่ยนแปลงทีละไฟล์ (Diffs)',
              items: {
                type: Type.OBJECT,
                properties: {
                  fileName: { type: Type.STRING },
                  action: { type: Type.STRING, description: 'create, update, or delete' },
                  oldContent: { type: Type.STRING },
                  newContent: { type: Type.STRING },
                  language: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['fileName', 'action', 'newContent', 'language'],
              },
            },
            validation: {
              type: Type.OBJECT,
              description: 'ผลการตรวจสอบโค้ดอัตโนมัติ (Self-Validation)',
              properties: {
                isValid: { type: Type.BOOLEAN },
                errors: { type: Type.ARRAY, items: { type: Type.STRING } },
                warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
                attemptCount: { type: Type.INTEGER },
              },
            },
            activityLogs: {
              type: Type.ARRAY,
              description: 'บันทึกไทม์ไลน์กิจกรรมของ Agent',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  time: { type: Type.STRING },
                  message: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'info, tool, validation, or success' },
                  details: { type: Type.STRING },
                },
                required: ['id', 'time', 'message', 'type'],
              },
            },
            prompt: {
              type: Type.OBJECT,
              description: 'ข้อมูลหาก Intent เป็น PROMPT',
              properties: {
                title: { type: Type.STRING },
                role: { type: Type.STRING },
                context: { type: Type.STRING },
                goal: { type: Type.STRING },
                requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
                input: { type: Type.STRING },
                expectedOutput: { type: Type.STRING },
                qualityCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
                fullPromptText: { type: Type.STRING },
                recommendedModels: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            debug: {
              type: Type.OBJECT,
              description: 'ข้อมูลหาก Intent เป็น DEBUG',
              properties: {
                errorMessage: { type: Type.STRING },
                rootCause: { type: Type.STRING },
                possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                fixExplanation: { type: Type.STRING },
                preventionTip: { type: Type.STRING },
              },
            },
            reasoning: {
              type: Type.OBJECT,
              description: 'การคิดแบบย่อ — ใส่เมื่อ STANDARD/DEEP; งาน FAST อาจว่างหรือ summary สั้นมาก',
              properties: {
                summary: { type: Type.STRING, description: 'สรุปการวิเคราะห์และเหตุผลการเลือกแนวทาง' },
                assumptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'สมมติฐานที่ใช้' },
                risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'ความเสี่ยง / edge cases' },
                openQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'จุดที่ยังไม่ชัด ถ้าว่าง = พร้อมลงมือ' },
              },
            },
            nextAction: {
              type: Type.STRING,
              description: 'คำแนะนำขั้นตอนถัดไปสำหรับผู้ใช้',
            },
            projectContextUpdate: {
              type: Type.OBJECT,
              description: 'การอัปเดตสถานะ Project Context',
              properties: {
                projectName: { type: Type.STRING },
                category: { type: Type.STRING },
                framework: { type: Type.STRING },
                description: { type: Type.STRING },
                currentGoal: { type: Type.STRING },
                newFeature: { type: Type.STRING },
                currentTask: { type: Type.STRING },
                conversationSummary: { type: Type.STRING },
                activeIssue: { type: Type.STRING },
              },
            },
          },
          required: ['intent', 'status', 'voiceResponse', 'displayResponse'],
        },
      },
    });

    const parsed = safeParseGeminiJson(response.text || '', message);
    const latencyMs = Date.now() - startTime;

    // Surface reasoning only when it adds signal (skip tiny FAST answers)
    if (parsed && parsed.reasoning && typeof parsed.reasoning === 'object') {
      const r = parsed.reasoning as { summary?: string; assumptions?: string[]; risks?: string[]; openQuestions?: string[] };
      const blocks: string[] = [];
      if (r.summary && r.summary.trim().length > 40) blocks.push(`### การวิเคราะห์\n${r.summary.trim()}`);
      if (Array.isArray(r.assumptions) && r.assumptions.length) {
        blocks.push(`### สมมติฐาน\n${r.assumptions.map((x) => `- ${x}`).join('\n')}`);
      }
      if (Array.isArray(r.risks) && r.risks.length) {
        blocks.push(`### ความเสี่ยง\n${r.risks.map((x) => `- ${x}`).join('\n')}`);
      }
      if (Array.isArray(r.openQuestions) && r.openQuestions.length) {
        blocks.push(`### จุดที่ยังไม่ชัด\n${r.openQuestions.map((x) => `- ${x}`).join('\n')}`);
      }
      if (blocks.length && typeof parsed.displayResponse === 'string') {
        const already = /การวิเคราะห์|สมมติฐาน|ความเสี่ยง/.test(parsed.displayResponse);
        if (!already) parsed.displayResponse = `${blocks.join('\n\n')}\n\n---\n\n${parsed.displayResponse}`;
      }
    }

    return res.json({
      ...parsed,
      devMetadata: {
        model: modelName,
        latencyMs,
        apiStatus: 'healthy',
        timestamp: new Date().toISOString(),
        promptTokensEstimate: Math.round((response.text?.length || 100) / 4),
        intent: parsed.intent || 'AGENT',
        routingInfo: {
          taskType: parsed.taskType || parsed.intent || 'AGENT',
          selectedModel: modelName,
          routeReason: 'Auto-routed via V8 Project Brain Router',
          knowledgeSourcesUsed: parsed.citations || [],
        },
      },
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    const latencyMs = Date.now() - startTime;
    return res.status(500).json({
      error: error?.message || 'Internal server error while processing request',
      devMetadata: {
        model: 'gemini-3.8-flash',
        latencyMs,
        apiStatus: 'error',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// In-memory cooldown timestamp for TTS if quota is exceeded
let ttsQuotaCooldownUntil = 0;

// Text-to-Speech API endpoint using Gemini gemini-3.8-flash-lite-tts with graceful browser fallback
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Puck' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Check if TTS is currently in quota cooldown
    if (Date.now() < ttsQuotaCooldownUntil) {
      return res.status(200).json({
        fallbackToBrowser: true,
        reason: 'quota_cooldown',
        cooldownRemainingMs: ttsQuotaCooldownUntil - Date.now()
      });
    }

    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      return res.status(200).json({
        fallbackToBrowser: true,
        error: 'GEMINI_API_KEY not set',
      });
    }

    const ai = getGenAI();
    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Clear, polite, friendly developer voice assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(200).json({
        fallbackToBrowser: true,
        error: 'No audio returned from TTS model',
      });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    const isQuotaError = 
      error?.status === 'RESOURCE_EXHAUSTED' || 
      error?.code === 429 || 
      error?.message?.includes('429') || 
      error?.message?.includes('quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED');

    if (isQuotaError) {
      // Set cooldown for 30 minutes to avoid hitting rate limits repeatedly
      ttsQuotaCooldownUntil = Date.now() + 30 * 60 * 1000;
      console.warn('Gemini TTS quota reached, falling back to Web Speech API for 30 minutes.');
      return res.status(200).json({
        fallbackToBrowser: true,
        reason: 'quota_exceeded',
        message: 'Using browser voice synthesis',
      });
    }

    console.warn('TTS generation fallback to browser speech synthesis:', error?.message || error);
    return res.status(200).json({
      fallbackToBrowser: true,
      error: error?.message || 'TTS generation fallback',
    });
  }
});

// Prompt enhancement endpoint
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { 
      brief, 
      category = 'Website', 
      level = 'Professional', 
      targetAI = 'Coding AI',
      role = 'Senior Full-Stack Software Engineer'
    } = req.body;

    if (!brief) return res.status(400).json({ error: 'Brief is required' });

    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `สร้าง Master Prompt คุณภาพสูงระดับ ${level} สำหรับประเภทงาน: ${category}
เป้าหมาย/ไอเดีย: "${brief}"
บทบาท: ${role}
เป้าหมาย AI ปลายทาง: ${targetAI}

กรุณาสร้าง Master Prompt ที่ครบถ้วนตามเกณฑ์:
1. บทบาท (Role & Persona)
2. บริบท (Context)
3. เป้าหมายและวัตถุประสงค์ (Goal & Objectives)
4. ความต้องการเชิงฟังก์ชันและเทคนิค (Functional & Technical Requirements)
5. กฎและข้อจำกัด (Constraints & Rules)
6. รูปแบบผลลัพธ์ที่คาดหวัง (Expected Output Format)
7. เกณฑ์การประเมินคุณภาพ (Quality Criteria)`,
    });

    return res.json({
      enhancedPrompt: response.text,
      metadata: {
        category,
        level,
        targetAI,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/enhance-prompt:', error);
    return res.status(500).json({ error: error?.message || 'Failed to enhance prompt' });
  }
});

// Mission planning endpoint (model-assisted decomposition; the client validates the result strictly)
app.post('/api/plan-mission', async (req, res) => {
  try {
    const { objective, fileNames = [] } = req.body || {};
    if (!objective || typeof objective !== 'string') return res.status(400).json({ error: 'objective is required' });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Decompose this software objective into 3-10 ordered tasks for an internal project agent.
Objective: "${objective.slice(0, 2000)}"
Existing files: ${JSON.stringify((Array.isArray(fileNames) ? fileNames : []).slice(0, 50))}
Return ONLY a JSON array. Each item: {"title": string, "type": one of ANALYZE|PLAN|READ|CREATE|UPDATE|DELETE|RENAME|SEARCH|CODE|VALIDATE|TEST|REVIEW|FIX|SUMMARIZE, "dependsOn": number[] (indices of EARLIER tasks only)}.
Independent read-only tasks should not depend on each other. The last task must be VALIDATE. Do not invent file contents.`,
      config: { responseMimeType: 'application/json' },
    });
    return res.json({ tasks: JSON.parse(response.text || '[]') });
  } catch (error: any) {
    console.error('Error in /api/plan-mission:', error);
    return res.status(500).json({ error: error?.message || 'Failed to plan mission' });
  }
});

// Durable mission storage (single-node disk; see src/server/missionStore.ts)
app.get('/api/missions', (req, res) => { try { return res.json({ missions: listMissions(userMissionDir(req)) }); } catch (e: any) { return res.status(500).json({ error: e?.message || 'list failed' }); } });
app.get('/api/missions/:id', (req, res) => { try { return res.type('application/json').send(loadMission(req.params.id, userMissionDir(req))); } catch (e: any) { return res.status(statusFor(e)).json({ error: e?.code || e?.message || 'load failed' }); } });
app.put('/api/missions/:id', (req, res) => { try { return res.json({ ok: true, ...saveMission(req.params.id, JSON.stringify(req.body), userMissionDir(req)) }); } catch (e: any) { return res.status(statusFor(e)).json({ error: e?.code || e?.message || 'save failed' }); } });

// Governed agent runs (plan → simulate → admit → approve/cancel). Governance records only: no tool execution here.
registerAgentRunRoutes(app as any, {
  controller: { create: agentRuns.createAgentRun as any, load: agentRuns.loadAgentRun as any, approve: agentRuns.approveAgentRun as any, cancel: agentRuns.cancelAgentRun as any, listIds: (n) => listDurableRecordIds('agent-run', n) },
  audit, inc,
});

// Self-healing observability is read-only over HTTP: it exposes sanitized evidence and draft payloads,
// but never mutates a workspace or contacts GitHub.
registerSelfHealingReadOnlyRoutes(app as any, { coordinator: selfHealingCoordinator });

async function start() {
  const redis = await tryCreateRedisBackend(sessionTtlMs);
  if (redis) {
    sessionBackend = redis;
    console.log('[sessions] Redis backend active');
  } else if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    throw new Error('REDIS_BACKEND_REQUIRED_IN_PRODUCTION');
  } else if (sessionPersist) {
    console.log(`[sessions] file-persisted memory store → ${sessionPersist}`);
  } else {
    console.log('[sessions] in-memory store (set SESSION_PERSIST_PATH or REDIS_URL for durability)');
  }

  // Vite middleware in development vs Static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CodeVoice AI V18 Server running on http://0.0.0.0:${port}`);
  });
}
start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
