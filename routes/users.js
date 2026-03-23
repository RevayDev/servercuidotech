const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const Nombre = req.body.Nombre ?? req.body.nombre;
    const Apellido = req.body.Apellido ?? req.body.apellido;
    const Email = req.body.Email ?? req.body.email;
    const Password = req.body.Password ?? req.body.password;
    const Numero_telefono = req.body.Numero_telefono ?? req.body.numero_telefono ?? req.body.Telefono ?? req.body.telefono;
    const Fecha_Nacimiento = req.body.Fecha_Nacimiento ?? req.body.fecha_nacimiento;
    const Direccion_Residencia = req.body.Direccion_Residencia ?? req.body.direccion_residencia ?? null;

    if (!Nombre || !Apellido || !Email || !Password || !Numero_telefono || !Fecha_Nacimiento) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const sqlCheck = 'SELECT IdUsuario FROM Usuarios WHERE email = ?';

    db.query(sqlCheck, [Email], async (err, results) => {
      if (err) {
        console.error('Error verificando email:', err);
        return res.status(500).json({ message: 'Error al verificar usuario' });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: 'Ese email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(Password, 10);

      const sqlInsert = `
        INSERT INTO Usuarios
        (Nombre, Apellido, email, password, Fecha_Nacimiento, Direccion_Residencia, Numero_telefono)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sqlInsert,
        [
          Nombre,
          Apellido,
          Email,
          hashedPassword,
          Fecha_Nacimiento,
          Direccion_Residencia,
          Numero_telefono
        ],
        (err2, result) => {
          if (err2) {
            console.error('Error insertando usuario:', err2);
            return res.status(500).json({ message: 'Error al registrar usuario' });
          }

          return res.status(201).json({
            message: 'Usuario registrado correctamente',
            IdUsuario: result.insertId
          });
        }
      );
    });
  } catch (error) {
    console.error('Error general en register:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;