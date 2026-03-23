const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.post('/login', (req, res) => {
  const Email = req.body.Email ?? req.body.email;
  const Password = req.body.Password ?? req.body.password;

  if (!Email || !Password) {
    return res.status(400).json({
      message: 'Email y contraseña son obligatorios'
    });
  }

  const sql = 'SELECT * FROM Usuarios WHERE email = ?';

  db.query(sql, [Email], async (err, results) => {
    if (err) {
      console.error('Error buscando usuario:', err);
      return res.status(500).json({ message: 'Error al iniciar sesión' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const usuario = results[0];
    const passwordOk = await bcrypt.compare(Password, usuario.password);

    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    return res.json({
      message: 'Login exitoso',
      usuario: {
        IdUsuario: usuario.IdUsuario,
        Nombre: usuario.Nombre,
        Apellido: usuario.Apellido,
        Email: usuario.email
      }
    });
  });
});

module.exports = router;