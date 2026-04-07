module.exports = (req, res, next) => {
  // Previene MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Evita embedding en iframes de otros orígenes
  res.setHeader('X-Frame-Options', 'DENY');

  // No enviar Referer completo a orígenes externos
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Deshabilita APIs sensibles del navegador
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // XSS Protection deshabilitado en favor de CSP (valor 0 es el estándar moderno)
  res.setHeader('X-XSS-Protection', '0');

  // Content-Security-Policy: solo permite recursos del mismo origen + las fuentes necesarias
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",   // inline styles necesarios por CSS Modules
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // HSTS: forzar HTTPS durante 1 año en producción
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Datos médicos no deben cachearse en proxies ni navegador
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
  }

  // Aislar el documento de contextos de navegación cross-origin
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
};
