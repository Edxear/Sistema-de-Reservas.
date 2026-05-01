import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './i18n';
import { unregister as unregisterServiceWorker } from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Disable the service worker so public deploys always load the latest bundle.
unregisterServiceWorker();

