const express = require('express');
const cors = require('cors');

const deviceRoutes = require('./routes/device');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const adultosRoutes = require('./routes/adultos');
const relojesRoutes = require('./routes/relojes');
const medicionesRoutes = require('./routes/mediciones');

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

//usar rutas
app.use('/device', deviceRoutes);
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);
app.use('/adultos', adultosRoutes);
app.use('/relojes', relojesRoutes);
app.use('/mediciones', medicionesRoutes);

// ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando 🔥');
});



// levantar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});