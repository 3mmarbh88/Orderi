import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA installability and background push notifications
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[Ordari PWA] New content available.');
  },
  onOfflineReady() {
    console.log('[Ordari PWA] App ready to work offline.');
  },
  onRegisterError(error) {
    console.warn('[Ordari PWA] Service worker registration notice:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="تطبيق أورداري - منصة رادار الطلبات">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
