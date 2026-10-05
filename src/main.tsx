import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
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
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
