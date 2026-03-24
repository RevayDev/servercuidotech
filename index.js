import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import deviceRoutes from './routes/device.js';
import usersRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import adultosRoutes from './routes/adultos.js';
import devicesRoutes from './routes/devices.js';
import medicionesRoutes from './routes/mediciones.js';

const app = express();
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado (Dashboard):', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

app.use('/device', deviceRoutes);
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);
app.use('/adultos', adultosRoutes);
app.use('/devices', devicesRoutes);
app.use('/api/mediciones', medicionesRoutes);

app.get('/', (req, res) => {
  res.send('Servidor CuidoTech con WebSockets funcionando 🔥 <br><a href="/dash">Ver Dashboard</a>');
});

app.get('/dash', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dash/data', async (req, res) => {
  try {
    const sql = `
      SELECT d.device_id, d.estado, d.bateria, 
             m.heartRate, m.fallDetected, m.lat, m.lng, m.mode, m.timestamp
      FROM devices d
      LEFT JOIN mediciones m ON d.device_id = m.device_id
      WHERE m.id = (
          SELECT MAX(id) FROM mediciones WHERE device_id = d.device_id
      ) OR m.id IS NULL
    `;
    const [devices] = await db.query(sql);
    res.json(devices);
  } catch (err) {
    console.error('Error en /dash/data:', err);
    res.status(500).json({ message: 'Error interno de DB' });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});