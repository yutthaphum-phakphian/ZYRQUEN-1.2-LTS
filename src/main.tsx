import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// ป้องกันปัญหา ResizeObserver Loop Error ในเบราว์เซอร์
if (typeof window !== 'undefined') {
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
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
