/**
 * Universal Clipboard Utility with Iframe & Focus-Safe Fallback
 * 
 * In iframe environments (like AI Studio previews), calling `navigator.clipboard.writeText`
 * frequently rejects with `DOMException: Document is not focused.`
 * 
 * This utility:
 * 1. Focuses window if permitted.
 * 2. Attempts `navigator.clipboard.writeText` inside a try/catch block.
 * 3. Falls back to a temporary textarea with `document.execCommand('copy')`.
 * 4. Never throws unhandled promise rejections.
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Try focusing window first
  try {
    if (window.focus) {
      window.focus();
    }
  } catch {
    // Ignore focus permission errors
  }

  // 1. Try modern navigator.clipboard if available and document is focused
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Common error: "Document is not focused." or "NotAllowedError"
      // Fall through to fallback without throwing
    }
  }

  // 2. Legacy fallback: temporary textarea + document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Position out of viewport & invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    
    // Select the text
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackError) {
    console.warn('Fallback copy failed:', fallbackError);
    return false;
  }
}

export const safeCopyToClipboard = copyToClipboard;
