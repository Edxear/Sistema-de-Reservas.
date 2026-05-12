import React, { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        background: '#d97706',
        color: '#fff',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: 600,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      }}
    >
      Sin conexion. La aplicacion sigue disponible con los recursos en cache.
    </div>
  );
}
