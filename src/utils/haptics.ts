/**
 * Sovereign Engine Tactile Haptic Feedback Utility
 * Leverages the standard Vibration API to provide physical confirmation
 * on mobile devices for hardware snapshotting, sidebar toggling, and modal dismissals.
 */

export const isVibrationSupported = (): boolean => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

export const triggerHaptic = (pattern: number | number[]): boolean => {
  if (!isVibrationSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch (err) {
    console.debug('Haptic feedback unavailable or blocked by user agent policy:', err);
    return false;
  }
};

/**
 * Double physical click confirming hardware shutter / telemetry snapshot capture
 */
export const hapticSnapshot = (): boolean => {
  return triggerHaptic([35, 45, 35]);
};

/**
 * Crisp tactile toggle confirming sidebar drawer state change
 */
export const hapticSidebarToggle = (isOpen?: boolean): boolean => {
  if (isOpen === true) {
    return triggerHaptic([25, 35, 20]);
  } else if (isOpen === false) {
    return triggerHaptic(18);
  }
  return triggerHaptic([20, 30, 20]);
};

/**
 * Soft haptic release pulse confirming modal or drawer dismissal
 */
export const hapticModalDismiss = (): boolean => {
  return triggerHaptic(16);
};

/**
 * Upbeat pulse confirming modal dialog opening
 */
export const hapticModalOpen = (): boolean => {
  return triggerHaptic(28);
};

/**
 * Solid physical thud confirming global lock / freeze state alteration
 */
export const hapticLockToggle = (isLocked?: boolean): boolean => {
  return triggerHaptic(isLocked ? [50, 60, 50] : [30, 40, 30]);
};

/**
 * Warning pulse pattern for invariant alerts and blocked operations
 */
export const hapticWarning = (): boolean => {
  return triggerHaptic([60, 40, 60]);
};

/**
 * Success verification pulse
 */
export const hapticSuccess = (): boolean => {
  return triggerHaptic([25, 30, 50]);
};

/**
 * Error / alert pulse pattern
 */
export const hapticError = (): boolean => {
  return triggerHaptic([80, 50, 80, 50, 100]);
};

/**
 * Subtle lightweight touch tap
 */
export const hapticTap = (): boolean => {
  return triggerHaptic(10);
};
