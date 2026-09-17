import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline capabilities
if ('serviceWorker' in navigator) {
  registerSW({
    onOfflineReady() {
      console.log('ZYRQUEN Ω∞ is ready to work offline. Sovereign operations are cached.');
    },
    onRegisteredSW(swUrl, r) {
      console.log('ZYRQUEN Ω∞ Service Worker registered:', swUrl);
    },
    onRegisterError(error) {
      console.error('ZYRQUEN Ω∞ Service Worker registration failed:', error);
    }
  });
}

// Guard against unhandled clipboard rejection errors and benign ResizeObserver notifications
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorMsg = event.message || event.error?.message || String(event);
    if (
      errorMsg.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMsg.includes('ResizeObserver loop limit exceeded') ||
      errorMsg.includes('[vite]') ||
      errorMsg.includes('WebSocket')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('Document is not focused') ||
      reasonMsg.includes('writeText') ||
      event.reason?.name === 'NotAllowedError' ||
      reasonMsg.includes('ResizeObserver') ||
      reasonMsg.includes('[vite]') ||
      reasonMsg.includes('WebSocket')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

