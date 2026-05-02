const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Carga variables de entorno priorizando backend/.env para desarrollo local,
 * y usa la raiz del workspace como fallback para compatibilidad.
 */
function loadEnv() {
  const candidatePaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  for (const envPath of candidatePaths) {
    if (!fs.existsSync(envPath)) continue;
    dotenv.config({ path: envPath, override: false });
  }
}

module.exports = loadEnv;
