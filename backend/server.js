const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
connectDB();

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const { iniciarChat } = require('./socket/chat');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
iniciarChat(io);

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
const pagoRoutes = require('./routes/pagos');

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/historia-clinica', historiaClinicaRoutes);
app.use('/api/recetas', recetaRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/appointments', authMiddleware, appointmentRoutes);
app.use('/api/pagos', pagoRoutes);

app.get('/', (req, res) => res.send('Sistema de reservas backend funcionando'));

const { iniciarRecordatorios } = require('./jobs/recordatorios');
if (require.main === module) {
  iniciarRecordatorios();
}

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
  });
}

module.exports = app;
