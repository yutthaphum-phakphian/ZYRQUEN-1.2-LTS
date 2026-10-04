import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installAuthFetch } from './utils/authFetch';
import { InviteRedeemModal } from './components/InviteRedeemModal';
import { ErrorBoundary } from './components/ErrorBoundary';

installAuthFetch();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
    <InviteRedeemModal />
  </ErrorBoundary>
);

