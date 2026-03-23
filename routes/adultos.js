const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
  const {
    Nombre,
    Apellido,
    Fecha_Nacimiento,
    Genero,
    Peso,
    Altura,
    Grupo_Sanguineo,
    Condicion_Medica,
    Telefono_Emergencia,
    IdUsuario
  } = req.body;

  if (!Nombre || !Apellido || !Fecha_Nacimiento || !IdUsuario) {
    return res.status(400).json({
      message: 'Faltan campos obligatorios'
    });
  }

  const sql = `
    INSERT INTO Adultos
    (Nombre, Apellido, Fecha_Nacimiento, Genero, Peso, Altura, Grupo_Sanguineo, Condicion_Medica, Telefono_Emergencia, IdUsuario)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      Nombre,
      Apellido,
      Fecha_Nacimiento,
      Genero || null,
      Peso || null,
      Altura || null,
      Grupo_Sanguineo || null,
      Condicion_Medica || null,
      Telefono_Emergencia || null,
      IdUsuario
    ],
    (err, result) => {
      if (err) {
        console.error('Error insertando adulto:', err);
        return res.status(500).json({ message: 'Error al registrar adulto' });
      }

      return res.status(201).json({
        message: 'Adulto registrado correctamente',
        IdAdulto: result.insertId
      });
    }
  );
});

router.get('/usuario/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;

  const sql = 'SELECT * FROM Adultos WHERE IdUsuario = ?';

  db.query(sql, [idUsuario], (err, results) => {
    if (err) {
      console.error('Error obteniendo adultos:', err);
      return res.status(500).json({ message: 'Error al consultar adultos' });
    }

    return res.json(results);
  });
});

router.get('/:idAdulto', (req, res) => {
  const { idAdulto } = req.params;

  const sql = 'SELECT * FROM Adultos WHERE IdAdulto = ?';

  db.query(sql, [idAdulto], (err, results) => {
    if (err) {
      console.error('Error obteniendo adulto:', err);
      return res.status(500).json({ message: 'Error al consultar adulto' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Adulto no encontrado' });
    }

    return res.json(results[0]);
  });
});

module.exports = router;