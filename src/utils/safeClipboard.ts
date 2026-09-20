/**
 * Safely writes text to the clipboard across all environments,
 * handling missing navigator.clipboard, permission denials, and iframe sandboxes.
 */
export async function safeWriteText(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Try modern navigator.clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy textarea approach
    }
  }

  // 2. Fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Safe clipboard write failed:', err);
    return false;
  }
}
