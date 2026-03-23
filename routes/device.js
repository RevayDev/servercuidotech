const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /device/data
router.post('/data', (req, res) => {
  const {
    serial,
    FechaHora,
    Caida_Detectada,
    Latitud,
    Longitud,
    Ritmo_Cardiaco,
    Presion_Sistolica,
    Presion_Diastolica
  } = req.body;

  if (!serial) {
    return res.status(400).json({ message: 'El serial es obligatorio' });
  }

  const sqlBuscarReloj = 'SELECT IdReloj FROM Relojes WHERE Serial = ?';

  db.query(sqlBuscarReloj, [serial], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error buscando el reloj' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No existe un reloj con ese serial' });
    }

    const idReloj = results[0].IdReloj;

    const sqlInsertar = `
      INSERT INTO Mediciones
      (IdReloj, FechaHora, Caida_Detectada, Latitud, Longitud, Ritmo_Cardiaco, Presion_Sistolica, Presion_Diastolica)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const fechaHora = FechaHora || new Date();

    db.query(sqlInsertar, [
      idReloj,
      fechaHora,
      Caida_Detectada ?? null,
      Latitud ?? null,
      Longitud ?? null,
      Ritmo_Cardiaco ?? null,
      Presion_Sistolica ?? null,
      Presion_Diastolica ?? null
    ], (err2, result) => {
      if (err2) {
        return res.status(500).json({ message: 'Error guardando medición' });
      }

      res.status(201).json({
        message: 'Medición guardada',
        IdMedicion: result.insertId
      });
    });
  });
});

// GET /device/data
router.get('/data', (req, res) => {
  const { serial } = req.query;

  const sql = `
    SELECT m.*
    FROM Mediciones m
    INNER JOIN Relojes r ON m.IdReloj = r.IdReloj
    WHERE r.Serial = ?
    ORDER BY m.FechaHora DESC
    LIMIT 1
  `;

  db.query(sql, [serial], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error' });
    if (results.length === 0) return res.status(404).json({ message: 'Sin datos' });

    res.json(results[0]);
  });
});

// GET /device/history
router.get('/history', (req, res) => {
  const { serial } = req.query;

  const sql = `
    SELECT m.*
    FROM Mediciones m
    INNER JOIN Relojes r ON m.IdReloj = r.IdReloj
    WHERE r.Serial = ?
    ORDER BY m.FechaHora DESC
  `;

  db.query(sql, [serial], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error' });

    res.json(results);
  });
});

console.log("entro al endpoint /device/data");

module.exports = router;