import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, rol } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios (nombre, apellido, email, password)' });
    }

    // 1. Check if email already exists
    const sqlCheck = 'SELECT id_usuario FROM usuarios WHERE email = ?';
    db.query(sqlCheck, [email], async (err, results) => {
      if (err) {
        console.error('Error verificando email:', err);
        return res.status(500).json({ message: 'Error al verificar usuario' });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: 'Ese email ya está registrado' });
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Insert new user
      const sqlInsert = `
        INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sqlInsert,
        [nombre, apellido, email, hashedPassword, telefono || null, rol || 'familiar'],
        (err2, result) => {
          if (err2) {
            console.error('Error insertando usuario:', err2);
            return res.status(500).json({ message: 'Error al registrar usuario' });
          }

          return res.status(201).json({
            message: 'Usuario registrado correctamente',
            id_usuario: result.insertId
          });
        }
      );
    });
  } catch (error) {
    console.error('Error general en register:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;