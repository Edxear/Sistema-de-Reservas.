import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { register as registerServiceWorker } from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Register Service Worker for PWA functionality
registerServiceWorker({
  onSuccess: () => {
    console.log('✓ PWA: App cached for offline use');
  },
  onUpdate: () => {
    console.log('✓ PWA: New version available. Please refresh.');
  },
});

