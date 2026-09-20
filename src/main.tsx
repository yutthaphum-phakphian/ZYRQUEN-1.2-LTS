import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import './styles/print.css';

if (typeof window!== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
     .then(reg => console.log('ZYRQUEN Ω∞ SW:', reg.scope))
     .catch(err => console.warn('SW notice:', err?.message || err));
  });
}

// Guard เฉพาะ ResizeObserver - ไม่ซ่อน WebSocket เพื่อ Forensic
if (typeof window!== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorMsg = event.message || event.error?.message || String(event);
    if (
      errorMsg.includes('ResizeObserver loop completed') ||
      errorMsg.includes('ResizeObserver loop limit exceeded')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('Document is not focused') ||
      reasonMsg.includes('writeText') ||
      event.reason?.name === 'NotAllowedError' ||
      reasonMsg.includes('ResizeObserver')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
