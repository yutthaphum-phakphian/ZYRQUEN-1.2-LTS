/**
 * ZYRQUEN Ω∞ Vibration & Haptic Feedback Utility
 * Provides tactile physical confirmation on supported devices
 * for hardware snapshotting, sidebar toggles, modal dismissals, and audit operations.
 */

export type VibrationPatternType =
  | 'snapshot'
  | 'sidebarToggle'
  | 'modalDismiss'
  | 'auditReport'
  | 'warning'
  | 'click'
  | 'sealSelect';

const PATTERNS: Record<VibrationPatternType, number | number[]> = {
  // Double crisp pulse confirming immutable hardware snapshot capture
  snapshot: [45, 30, 60],
  // Crisp single tick for sidebar toggles
  sidebarToggle: 25,
  // Gentle soft tap for modal close / dismissals
  modalDismiss: 18,
  // Rhythmic five-beat pulse for legal audit report download & signing
  auditReport: [35, 40, 50, 40, 35],
  // Warning buzz for critical anomaly or quarantine alert
  warning: [70, 45, 70],
  // Micro haptic click for buttons / tabs
  click: 12,
  // Crisp selection pulse for 14,902 seal inspector
  sealSelect: [25, 20, 30],
};

/**
 * Triggers tactile vibration using the Web Vibration API
 * Safely guards against unsupported environments (desktop, disabled permissions)
 */
export function triggerVibration(pattern: VibrationPatternType | number | number[]): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    const vibrationData = typeof pattern === 'string' ? PATTERNS[pattern] ?? 20 : pattern;
    return navigator.vibrate(vibrationData);
  } catch (err) {
    // Graceful silent fallback if device denies vibration
    return false;
  }
}
