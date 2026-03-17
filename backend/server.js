const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config({ path: '../.env' });
connectDB();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const medicoRoutes = require('./routes/medicos');
const historiaClinicaRoutes = require('./routes/historiaClinica');
const recetaRoutes = require('./routes/recetas');
const authMiddleware = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/historia-clinica', historiaClinicaRoutes);
app.use('/api/recetas', recetaRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/appointments', authMiddleware, appointmentRoutes);

app.get('/', (req, res) => res.send('Sistema de reservas backend funcionando'));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
  });
}

module.exports = app;
