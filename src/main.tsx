import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';
import './styles/print.css';

// Register PWA Service Worker for offline capabilities
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('ZYRQUEN Ω∞ Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('ZYRQUEN Ω∞ Service Worker notice:', err?.message || err);
      });
  });
}

// Guard against unhandled clipboard rejection errors and benign ResizeObserver notifications
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const errorMsg = event.message || event.error?.message || String(event);
      if (
        errorMsg.includes('ResizeObserver loop completed with undelivered notifications') ||
        errorMsg.includes('ResizeObserver loop limit exceeded') ||
        errorMsg.includes('[vite]') ||
        errorMsg.includes('WebSocket') ||
        errorMsg.includes('failed to connect')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reasonMsg = event.reason?.message || String(event.reason || '');
      if (
        reasonMsg.includes('Document is not focused') ||
        reasonMsg.includes('writeText') ||
        event.reason?.name === 'NotAllowedError' ||
        reasonMsg.includes('ResizeObserver') ||
        reasonMsg.includes('[vite]') ||
        reasonMsg.includes('WebSocket') ||
        reasonMsg.includes('failed to connect')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

