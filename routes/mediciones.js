const express = require('express');
const db = require('../db');

const router = express.Router();

// GET mediciones por adulto
router.get('/adulto/:idAdulto', (req, res) => {
  const { idAdulto } = req.params;

  const sql = `
    SELECT m.*
    FROM Mediciones m
    INNER JOIN Relojes r ON m.IdReloj = r.IdReloj
    WHERE r.IdAdulto = ?
    ORDER BY m.FechaHora DESC
  `;

  db.query(sql, [idAdulto], (err, results) => {
    if (err) {
      console.error('Error obteniendo mediciones:', err);
      return res.status(500).json({
        message: 'Error al consultar mediciones'
      });
    }

    return res.json(results);
  });
});

module.exports = router;