/**
 * ZYRQUEN Ω∞ Audit Service Worker
 * Critical Asset Caching & Offline Background Sync for Audit Logging
 * 
 * Compliant with:
 * - W3C Service Workers & Cache API
 * - W3C Web Background Synchronization API
 * - Electronic Transactions Act B.E. 2544 (Section 28 & 26 Forensic Continuity)
 */

const CACHE_NAME = 'zyrquen-audit-cache-v1.3-lts';
const OFFLINE_DB_NAME = 'zyrquen_offline_audit_db';
const OFFLINE_STORE_NAME = 'pending_audit_logs';
const SYNC_TAG = 'sync-audit-logs';

// 1. CRITICAL ASSETS TO PRECACHE
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/icon.svg'
];

// Broadcast channel for notifying frontend UI of sync events
let syncBroadcastChannel = null;
if (typeof BroadcastChannel !== 'undefined') {
  try {
    syncBroadcastChannel = new BroadcastChannel('zyrquen_audit_sync_bus');
  } catch (e) {
    // Graceful fallback to client.postMessage
  }
}

// ============================================================================
// INDEXEDDB PROMISE HELPERS (OFFLINE AUDIT STORAGE)
// ============================================================================

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAuditLogToIndexedDB(logEntry) {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const record = {
        payload: logEntry,
        timestamp: Date.now(),
        attempts: 0
      };
      const addReq = store.add(record);
      addReq.onsuccess = () => resolve(addReq.result);
      addReq.onerror = () => reject(addReq.error);
    });
  } catch (err) {
    console.error('[SW] Failed to save audit log to IndexedDB:', err);
    throw err;
  }
}

async function getAllPendingAuditLogs() {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[SW] Failed to read pending audit logs:', err);
    return [];
  }
}

async function removePendingAuditLogs(keys) {
  if (!keys || keys.length === 0) return;
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      for (const key of keys) {
        store.delete(key);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[SW] Failed to clear synced logs:', err);
  }
}

// Broadcast notification to all active browser tabs
async function broadcastSyncStatus(data) {
  if (syncBroadcastChannel) {
    try {
      syncBroadcastChannel.postMessage(data);
    } catch (err) {
      // Channel post failed, fallback to postMessage
    }
  }

  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of clients) {
    client.postMessage(data);
  }
}

// ============================================================================
// BACKGROUND SYNC ENGINE (DRAIN PENDING LOGS TO SERVER)
// ============================================================================

async function syncPendingAuditLogs() {
  console.log('[SW] 🔄 Background Sync Triggered: Processing offline audit logs...');
  const pending = await getAllPendingAuditLogs();
  if (pending.length === 0) {
    console.log('[SW] ✨ No pending audit logs to sync.');
    return;
  }

  console.log(`[SW] Found ${pending.length} pending audit log(s). Transmitting to backend...`);
  const payloads = pending.map(item => item.payload);
  const keysToRemove = pending.map(item => item.id);

  try {
    const response = await fetch('/api/v1/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zyrquen-Sync-Source': 'ServiceWorker-BackgroundSync'
      },
      body: JSON.stringify(payloads)
    });

    if (response.ok) {
      await removePendingAuditLogs(keysToRemove);
      console.log(`[SW] ✅ Successfully synced ${pending.length} audit log(s) to server.`);
      
      await broadcastSyncStatus({
        type: 'AUDIT_LOGS_SYNCED',
        count: pending.length,
        timestamp: Date.now(),
        status: 'SUCCESS'
      });
    } else {
      console.warn('[SW] ⚠️ Server returned non-200 for audit sync. Retrying on next cycle.', response.status);
    }
  } catch (fetchErr) {
    console.warn('[SW] 📡 Network still unavailable during background sync attempt. Will retry when connected.', fetchErr);
  }
}

// ============================================================================
// SERVICE WORKER LIFECYCLE EVENTS
// ============================================================================

// INSTALL: Pre-cache critical application assets
self.addEventListener('install', (event) => {
  console.log('[SW] 📥 Installing Zyrquen Audit Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache assets gracefully (allow partial pass if an asset is missing in dev)
      for (const asset of CRITICAL_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Note: Could not precache ${asset}:`, err.message);
        }
      }
      console.log('[SW] 📦 Critical assets pre-cached successfully.');
    })
  );
  self.skipWaiting();
});

// ACTIVATE: Purge stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] 🚀 Activating Zyrquen Audit Service Worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] 🧹 Removing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ============================================================================
// FETCH STRATEGY: OFFLINE-FIRST CACHING & AUDIT LOG INTERCEPTION
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. INTERCEPT AUDIT LOG POST REQUESTS FOR OFFLINE RESILIENCE
  if (
    request.method === 'POST' && 
    (url.pathname === '/api/v1/audit/log' || url.pathname === '/api/audit-logs' || url.pathname === '/api/v1/audit/sync')
  ) {
    event.respondWith(
      (async () => {
        try {
          // Clone request to read body if needed
          const clonedReq = request.clone();
          const response = await fetch(request);
          return response;
        } catch (err) {
          console.warn('[SW] 🔌 Network request failed for audit log. Queuing to IndexedDB for Background Sync...', err);
          
          try {
            const body = await request.clone().json();
            await saveAuditLogToIndexedDB(body);

            // Register Background Sync if supported
            if ('sync' in self.registration) {
              try {
                await self.registration.sync.register(SYNC_TAG);
                console.log('[SW] 📋 Registered background sync task: ' + SYNC_TAG);
              } catch (syncErr) {
                console.warn('[SW] Could not register background sync tag:', syncErr);
              }
            }

            await broadcastSyncStatus({
              type: 'AUDIT_LOG_QUEUED_OFFLINE',
              timestamp: Date.now()
            });

            // Return accepted response to prevent client-side uncaught error
            return new Response(
              JSON.stringify({
                success: true,
                status: 'QUEUED_OFFLINE',
                message: 'Audit log captured offline and queued for background sync.',
                queuedAt: new Date().toISOString()
              }),
              {
                status: 202,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          } catch (storageErr) {
            console.error('[SW] Critical: Failed to queue audit log offline:', storageErr);
            throw storageErr;
          }
        }
      })()
    );
    return;
  }

  // 2. ONLY HANDLE GET REQUESTS FOR CACHING
  if (request.method !== 'GET') return;

  // 3. NAVIGATION REQUESTS: Network-first, fallback to /index.html (Single Page App)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 4. STATIC ASSETS & DATA: Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse && 
            networkResponse.status === 200 &&
            (url.origin === self.location.origin || request.destination === 'image' || request.destination === 'font')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails and no cached response, check fallback assets
          if (!cachedResponse && request.destination === 'image') {
            return caches.match('/logo192.png');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// ============================================================================
// BACKGROUND SYNC EVENT LISTENER (W3C SYNC API)
// ============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[SW] ⚡ Background sync event received with tag:', event.tag);
    event.waitUntil(syncPendingAuditLogs());
  }
});

// PERIODIC BACKGROUND SYNC (IF SUPPORTED)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-audit-sync') {
    event.waitUntil(syncPendingAuditLogs());
  }
});

// ============================================================================
// MESSAGE EVENT: CLIENT TO SERVICE WORKER RPC
// ============================================================================

self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'TRIGGER_SYNC':
      console.log('[SW] Manual sync triggered from client UI.');
      await syncPendingAuditLogs();
      break;

    case 'QUEUE_AUDIT_LOG':
      if (data.payload) {
        await saveAuditLogToIndexedDB(data.payload);
        if ('sync' in self.registration) {
          try {
            await self.registration.sync.register(SYNC_TAG);
          } catch (e) {
            // sync register error ignored
          }
        }
        await broadcastSyncStatus({
          type: 'AUDIT_LOG_QUEUED_OFFLINE',
          timestamp: Date.now()
        });
      }
      break;

    case 'GET_PENDING_LOGS_COUNT': {
      const logs = await getAllPendingAuditLogs();
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ count: logs.length });
      }
      break;
    }

    case 'GET_CACHE_STATUS': {
      try {
        const logs = await getAllPendingAuditLogs();
        const cache = await caches.open(CACHE_NAME);
        const cachedRequests = await cache.keys();
        const responseData = {
          cacheName: CACHE_NAME,
          cachedAssetsCount: cachedRequests.length,
          pendingLogsCount: logs.length,
          syncTag: SYNC_TAG,
          isSyncSupported: 'sync' in self.registration,
          timestamp: Date.now()
        };

        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(responseData);
        } else if (event.source) {
          event.source.postMessage({
            type: 'CACHE_STATUS_RESULT',
            ...responseData
          });
        }
      } catch (err) {
        console.error('[SW] Failed to retrieve cache status:', err);
      }
      break;
    }

    default:
      break;
  }
});
