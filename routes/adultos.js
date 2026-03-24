import express from 'express';
import db from '../db.js';

const router = express.Router();

// Crear un adulto
router.post('/', (req, res) => {
  const { nombre, apellido, fecha_nacimiento, genero, condiciones_medicas, contacto_emergencia } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ message: 'Nombre y apellido son obligatorios' });
  }

  const sql = `
    INSERT INTO adultos (nombre, apellido, fecha_nacimiento, genero, condiciones_medicas, contacto_emergencia)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, apellido, fecha_nacimiento, genero, condiciones_medicas, contacto_emergencia], (err, result) => {
    if (err) {
      console.error('Error creando adulto:', err);
      return res.status(500).json({ message: 'Error al crear adulto' });
    }

    res.status(201).json({
      message: 'Adulto creado correctamente',
      id_adulto: result.insertId
    });
  });
});

// Obtener todos los adultos
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM adultos';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error DB' });
    res.json(results);
  });
});

// Obtener un adulto por ID
router.get('/:id_adulto', (req, res) => {
  const { id_adulto } = req.params;
  const sql = 'SELECT * FROM adultos WHERE id_adulto = ?';
  db.query(sql, [id_adulto], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error DB' });
    if (results.length === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json(results[0]);
  });
});

export default router;