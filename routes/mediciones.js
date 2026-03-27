import express from 'express';
import db from '../db.js';

const router = express.Router();

// 1. POST /api/mediciones
// Recibe datos del ESP32 / Emulador, valida device_id + api_key, inserta y emite
router.post('/', async (req, res) => {
  const io = req.app.get('socketio');
  let { device_id, api_key, heartRate, fallDetected, signalStrength, lat, lng, mode } = req.body;

  // Si envían serial o id_device (compatibilidad con emulador antíguo), lo mapeamos
  let serial = req.body.serial || req.body.id_device || req.body.device_id;
  
  if (!serial) {
    return res.status(400).json({ error: 'Falta serial o device_id en la petición' });
  }

  try {
    // Validar serial (llamado device_id en la tabla devices)
    const [devices] = await db.query('SELECT * FROM devices WHERE device_id = ?', [serial]);
    
    if (devices.length === 0) {
       // Auto-registro
       const apiKey = 'auto-' + serial;
       await db.query('INSERT INTO devices (device_id, api_key, estado) VALUES (?, ?, ?)', [serial, apiKey, 'activo']);
    }
    
    let deviceIdToInsert = serial; // La FK es sobre el string device_id

    // Insertar en mediciones
    const sql = `
      INSERT INTO mediciones (
        device_id, heartRate, fallDetected, signalStrength, lat, lng, mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      deviceIdToInsert,
      heartRate || req.body.Ritmo_Cardiaco || null,
      fallDetected !== undefined ? fallDetected : (req.body.Caida_Detectada || false),
      signalStrength || 100,
      lat || req.body.gps?.lat || req.body.Latitud || null,
      lng || req.body.gps?.lng || req.body.Longitud || null,
      mode || req.body.alertType || 'NORMAL'
    ];

    const [result] = await db.query(sql, values);
    
    const [inserted] = await db.query('SELECT * FROM mediciones WHERE id = ?', [result.insertId]);
    const nuevaMedicion = inserted[0];

    // Emitir evento en tiempo real
    io.emit('nueva_medicion', nuevaMedicion);

    return res.status(201).json({
      message: 'Medición registrada',
      data: nuevaMedicion
    });

  } catch (error) {
    console.error('Error insertando medición:', error);
    return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

// 2. GET /api/mediciones/:device_id
// Retorna las últimas 20 mediciones
router.get('/:device_id', async (req, res) => {
  const { device_id } = req.params;

  try {
    const [results] = await db.query(
      'SELECT * FROM mediciones WHERE device_id = ? ORDER BY timestamp DESC LIMIT 20',
      [device_id]
    );
    return res.json(results);
  } catch (error) {
    console.error('Error obteniendo mediciones:', error);
    return res.status(500).json({ error: 'Error interno conectando a BD' });
  }
});

// Mantener compatibilidad con requests antiguos si alguien llama a /api/mediciones/adulto/:idAdulto
router.get('/adulto/:idAdulto', async (req, res) => {
  const { idAdulto } = req.params;

  const sql = `
    SELECT m.*
    FROM mediciones m
    INNER JOIN devices d ON m.device_id = d.device_id
    WHERE d.adulto_id = ?
    ORDER BY m.timestamp DESC
  `;

  try {
    const [results] = await db.query(sql, [idAdulto]);
    return res.json(results);
  } catch (err) {
    console.error('Error obteniendo mediciones:', err);
    return res.status(500).json({
      message: 'Error al consultar mediciones'
    });
  }
});

export default router;