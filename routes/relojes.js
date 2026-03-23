const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
  const { Serial, IdAdulto } = req.body;

  if (!Serial || !IdAdulto) {
    return res.status(400).json({
      message: 'Serial e IdAdulto son obligatorios'
    });
  }

  const sql = `
    INSERT INTO Relojes (Serial, IdAdulto)
    VALUES (?, ?)
  `;

  db.query(sql, [Serial, IdAdulto], (err, result) => {
    if (err) {
      console.error('Error registrando reloj:', err);
      return res.status(500).json({
        message: 'Error al registrar reloj'
      });
    }

    return res.status(201).json({
      message: 'Reloj registrado correctamente',
      IdReloj: result.insertId
    });
  });
});

router.get('/adulto/:idAdulto', (req, res) => {
  const { idAdulto } = req.params;

  const sql = 'SELECT * FROM Relojes WHERE IdAdulto = ?';

  db.query(sql, [idAdulto], (err, results) => {
    if (err) {
      console.error('Error obteniendo relojes:', err);
      return res.status(500).json({
        message: 'Error al consultar relojes'
      });
    }

    return res.json(results);
  });
});

router.get('/:idReloj', (req, res) => {
  const { idReloj } = req.params;

  const sql = 'SELECT * FROM Relojes WHERE IdReloj = ?';

  db.query(sql, [idReloj], (err, results) => {
    if (err) {
      console.error('Error obteniendo reloj:', err);
      return res.status(500).json({
        message: 'Error al consultar reloj'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Reloj no encontrado'
      });
    }

    return res.json(results[0]);
  });
});

module.exports = router;