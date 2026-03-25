const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./server');
const connectDB = require('./config/db');
const { iniciarChat } = require('./socket/chat');
const { iniciarRecordatorios } = require('./jobs/recordatorios');
const { setIO } = require('./utils/socketManager');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

async function start() {
  try {
    await connectDB();
    iniciarRecordatorios();

    const server = http.createServer(app);
    const io = new Server(server, { cors: corsOptions });
    setIO(io); // Inicializar socket manager
    iniciarChat(io);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Servidor iniciado en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

start();
