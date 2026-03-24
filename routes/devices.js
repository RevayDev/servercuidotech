import express from 'express';
import db from '../db.js';

const router = express.Router();

// Registrar un dispositivo manualmente
router.post('/', (req, res) => {
  const { serial, id_adulto, modelo } = req.body;

  if (!serial) {
    return res.status(400).json({
      message: 'El serial es obligatorio'
    });
  }

  const sql = `
    INSERT INTO devices (serial, id_adulto, modelo)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [serial, id_adulto || null, modelo || 'ESP32'], (err, result) => {
    if (err) {
      console.error('Error registrando dispositivo:', err);
      return res.status(500).json({
        message: 'Error al registrar dispositivo'
      });
    }

    return res.status(201).json({
      message: 'Dispositivo registrado correctamente',
      id_device: result.insertId
    });
  });
});

// Obtener dispositivos por adulto
router.get('/adulto/:id_adulto', (req, res) => {
  const { id_adulto } = req.params;

  const sql = 'SELECT * FROM devices WHERE id_adulto = ?';

  db.query(sql, [id_adulto], (err, results) => {
    if (err) {
      console.error('Error obteniendo dispositivos:', err);
      return res.status(500).json({
        message: 'Error al consultar dispositivos'
      });
    }

    return res.json(results);
  });
});

// Obtener un dispositivo por ID
router.get('/:id_device', (req, res) => {
  const { id_device } = req.params;

  const sql = 'SELECT * FROM devices WHERE id_device = ?';

  db.query(sql, [id_device], (err, results) => {
    if (err) {
      console.error('Error obteniendo dispositivo:', err);
      return res.status(500).json({
        message: 'Error al consultar dispositivo'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Dispositivo no encontrado'
      });
    }

    return res.json(results[0]);
  });
});

export default router;