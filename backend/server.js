const express = require('express');
const cors = require('cors');
const { registerApiRoutes } = require('./routes');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json());

registerApiRoutes(app);

app.get('/', (req, res) => res.send('Sistema de reservas backend funcionando'));

module.exports = app;
