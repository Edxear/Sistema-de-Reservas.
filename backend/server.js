const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { registerApiRoutes } = require('./routes');
const securityHeaders = require('./middleware/securityHeaders');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(securityHeaders);

app.use(cookieParser());
app.use(express.json());

registerApiRoutes(app);

app.get('/', (req, res) => res.send('IntegraSalud backend funcionando'));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'integrasalud-backend', timestamp: new Date().toISOString() }));

app.use(errorHandler);

module.exports = app;
