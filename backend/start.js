const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = require('./server');
const connectDB = require('./config/db');
const { iniciarChat } = require('./socket/chat');
const { iniciarRecordatorios } = require('./jobs/recordatorios');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

connectDB();
iniciarRecordatorios();

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
iniciarChat(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
