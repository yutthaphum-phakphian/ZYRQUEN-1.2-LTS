import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { unlockAudioContext } from './components/AudioSynthesizer';

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

  // ปลดล็อก Web Audio Context เมื่อผู้ใช้มีปฏิสัมพันธ์กับหน้าจอครั้งแรก
  const unlockAudioOnInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('pointerdown', unlockAudioOnInteraction);
    window.removeEventListener('keydown', unlockAudioOnInteraction);
    window.removeEventListener('touchstart', unlockAudioOnInteraction);
  };
  window.addEventListener('pointerdown', unlockAudioOnInteraction, { passive: true });
  window.addEventListener('keydown', unlockAudioOnInteraction, { passive: true });
  window.addEventListener('touchstart', unlockAudioOnInteraction, { passive: true });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
