/**
 * ZYRQUEN FCM Client-Side Registration Token Lifecycle Manager
 * Android 16.0+ (API 36 / Baklava) Push Notification Lifecycle
 * Statutory Safe Harbor: Thai ETDA Sec 28 & PDPA Sec 37
 */

import { ANDROID_16_NOTIFICATION_CHANNELS, FcmDeviceRegistration } from './fcmNotificationService';

export type FcmLifecycleState =
  | 'UNREGISTERED'
  | 'PERMISSION_REQUESTED'
  | 'REGISTERED'
  | 'TOKEN_REFRESHING'
  | 'REVOKED'
  | 'PERMISSION_DENIED';

export interface FcmClientTokenData {
  token: string;
  deviceId: string;
  platform: string;
  state: FcmLifecycleState;
  permission: NotificationPermission;
  registeredAt: string;
  lastRefreshedAt: string;
  expiresAt: string;
}

const STORAGE_KEY = 'zyrquen_fcm_token_lifecycle_v12';

export class FcmClientService {
  private static instance: FcmClientService;
  private currentData: FcmClientTokenData;
  private listeners: Array<(data: FcmClientTokenData) => void> = [];

  private constructor() {
    this.currentData = this.loadFromStorage();
    // Auto-check expiry on boot
    this.verifyTokenLifecycle();
  }

  public static getInstance(): FcmClientService {
    if (!FcmClientService.instance) {
      FcmClientService.instance = new FcmClientService();
    }
    return FcmClientService.instance;
  }

  private generateDeviceId(): string {
    const nav = typeof navigator !== 'undefined' ? navigator.userAgent : 'generic';
    const isAndroid = /Android/i.test(nav);
    return `zyrquen-${isAndroid ? 'android16' : 'browser'}-${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateMockFcmToken(): string {
    let rand = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      rand = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      rand = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Date.now().toString(16);
    }
    return `fcm_bk36_${rand.substring(0, 48)}`;
  }

  private loadFromStorage(): FcmClientTokenData {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ...parsed,
            permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
          };
        }
      }
    } catch {
      // ignore
    }

    const deviceId = this.generateDeviceId();
    return {
      token: '',
      deviceId,
      platform: 'Android 16.0+ (API 36 / Baklava Compatible)',
      state: 'UNREGISTERED',
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      registeredAt: '',
      lastRefreshedAt: '',
      expiresAt: '',
    };
  }

  private saveToStorage(data: FcmClientTokenData) {
    this.currentData = data;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  public subscribe(cb: (data: FcmClientTokenData) => void): () => void {
    this.listeners.push(cb);
    cb(this.currentData);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.currentData);
      } catch (err) {
        console.error('Error in FCM listener:', err);
      }
    }
  }

  public getData(): FcmClientTokenData {
    return this.currentData;
  }

  /**
   * Android 16.0+ Notification Permission Request
   * Follows Android 13+ / 16.0+ runtime POST_NOTIFICATIONS requirements
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') {
      return 'denied';
    }

    this.saveToStorage({
      ...this.currentData,
      state: 'PERMISSION_REQUESTED',
    });

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.registerTokenLifecycle();
      } else {
        this.saveToStorage({
          ...this.currentData,
          permission,
          state: 'PERMISSION_DENIED',
        });
      }
      return permission;
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Token Acquisition & Registration Lifecycle (24-hour rotation SLA)
   */
  public async registerTokenLifecycle(): Promise<FcmClientTokenData> {
    const token = this.currentData.token || this.generateMockFcmToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const updated: FcmClientTokenData = {
      ...this.currentData,
      token,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'granted',
      state: 'REGISTERED',
      registeredAt: this.currentData.registeredAt || now.toISOString(),
      lastRefreshedAt: now.toISOString(),
      expiresAt,
    };

    this.saveToStorage(updated);

    // Synchronize token with backend
    await this.syncWithBackend(updated);

    return updated;
  }

  /**
   * Token Refresh & Rotation (Mandatory Android 16.0+ token maintenance)
   */
  public async refreshTokenLifecycle(): Promise<FcmClientTokenData> {
    this.saveToStorage({
      ...this.currentData,
      state: 'TOKEN_REFRESHING',
    });

    const oldToken = this.currentData.token;
    const newToken = this.generateMockFcmToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const refreshed: FcmClientTokenData = {
      ...this.currentData,
      token: newToken,
      state: 'REGISTERED',
      lastRefreshedAt: now.toISOString(),
      expiresAt,
    };

    this.saveToStorage(refreshed);

    // Inform backend of rotation
    try {
      await fetch('/api/v1/fcm/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldToken, newToken, deviceId: refreshed.deviceId }),
      });
    } catch {
      // ignore
    }

    return refreshed;
  }

  /**
   * Revoke Push Notification Token (PDPA Section 37 right to revoke)
   */
  public async revokeToken(): Promise<FcmClientTokenData> {
    const oldToken = this.currentData.token;
    const revoked: FcmClientTokenData = {
      ...this.currentData,
      state: 'REVOKED',
    };

    this.saveToStorage(revoked);

    try {
      if (oldToken) {
        await fetch('/api/v1/fcm/unregister-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: oldToken }),
        });
      }
    } catch {
      // ignore
    }

    return revoked;
  }

  /**
   * Check if token has expired and requires refresh
   */
  public verifyTokenLifecycle() {
    if (!this.currentData.token || this.currentData.state !== 'REGISTERED') {
      return;
    }
    const exp = Date.parse(this.currentData.expiresAt);
    if (!isNaN(exp) && Date.now() > exp) {
      console.log('FCM Registration Token expired. Refreshing lifecycle...');
      this.refreshTokenLifecycle().catch(console.error);
    }
  }

  private async syncWithBackend(data: FcmClientTokenData) {
    try {
      const payload: Partial<FcmDeviceRegistration> = {
        token: data.token,
        deviceId: data.deviceId,
        platform: data.platform,
        clientVersion: '1.2.0-LTS',
        registeredAt: data.registeredAt,
        tokenStatus: 'ACTIVE',
        subscribedChannels: [
          ANDROID_16_NOTIFICATION_CHANNELS.SECURITY_ALERTS.id,
          ANDROID_16_NOTIFICATION_CHANNELS.TELEMETRY_DRIFT.id,
          ANDROID_16_NOTIFICATION_CHANNELS.COMPLIANCE_AUDIT.id,
        ],
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        expiresAt: data.expiresAt,
      };

      await fetch('/api/v1/fcm/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // local offline handling
    }
  }
}

export const fcmClientService = FcmClientService.getInstance();
