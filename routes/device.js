import express from 'express';
const router = express.Router();
import db from '../db.js';

/**
 * Normalizes incoming data from the emulator/device to match the refined schema.
 */
function normalizePayload(body) {
  return {
    serial: body.serial || body.Serial,
    heartRate: body.heartRate ?? body.Ritmo_Cardiaco ?? null,
    fallDetected: body.fallDetected ?? body.Caida_Detectada ?? false,
    alertType: body.alertType || body.Tipo_Alerta || 'NORMAL',
    signalStrength: body.signalStrength ?? 100,
    lat: body.lat ?? body.gps?.lat ?? body.Latitud ?? null,
    lng: body.lng ?? body.gps?.lng ?? body.Longitud ?? null,
    mode: body.mode || 'NORMAL',
    timestamp: body.timestamp || body.FechaHora || new Date()
  };
}

/**
 * Helper to log a critical alert in the 'alertas' table.
 */
async function logAlert(medicionId, data) {
  const { alertType } = data;
  const sql = `
    INSERT INTO alertas (medicion_id, tipo, nivel, mensaje)
    VALUES (?, ?, ?, ?)
  `;
  const desc = `Alerta de tipo ${alertType} detectada.`;
  try {
    await db.query(sql, [medicionId, alertType, 'CRITICO', desc]);
  } catch (err) {
    console.error('Error logueando alerta crítica:', err);
  }
}

/**
 * Core logic to process telemetry and alerts.
 */
async function handleTelemetry(req, res, forceType = null) {
  const data = normalizePayload(req.body);
  if (forceType) data.alertType = forceType;

  if (!data.serial) {
    return res.status(400).json({ message: 'El serial es obligatorio' });
  }

  try {
    // 1. Get or register device
    // Use INSERT IGNORE to prevent race conditions causing duplicate entry errors
    const apiKey = 'auto-' + data.serial;
    await db.query('INSERT IGNORE INTO devices (device_id, api_key) VALUES (?, ?)', [data.serial, apiKey]);
    let deviceId = data.serial;

    // 3. Save measurement
    const sqlMedicion = `
      INSERT INTO mediciones 
      (device_id, heartRate, fallDetected, signalStrength, lat, lng, mode, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [results3] = await db.query(sqlMedicion, [
      deviceId, data.heartRate, data.fallDetected,
      data.signalStrength, data.lat, data.lng, data.mode, new Date(data.timestamp)
    ]);

    // 4. Log Alert if critical
    const criticalTypes = ['SOS', 'CAIDA', 'RITMO_CRITICO'];
    if (criticalTypes.includes(data.alertType) || data.fallDetected) {
      await logAlert(results3.insertId, data);
    }

    // Emitir evento en tiempo real (si socket.io está en req.app)
    const io = req.app.get('socketio');
    if (io) {
      const [inserted] = await db.query('SELECT * FROM mediciones WHERE id = ?', [results3.insertId]);
      if (inserted.length > 0) {
        io.emit('nueva_medicion', inserted[0]);
      }
    }

    return res.status(201).json({ message: 'Telemetría procesada' });
  } catch (error) {
    console.error('Error en handleTelemetry:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

// POST /device/data
router.post('/data', async (req, res) => {
  await handleTelemetry(req, res);
});

// POST /device/sos
router.post('/sos', async (req, res) => {
  await handleTelemetry(req, res, 'SOS');
});

// GET /device/data (Último estado)
router.get('/data', async (req, res) => {
    const { serial } = req.query;
    if (!serial) return res.status(400).json({ message: 'El serial es obligatorio' });

    const sql = `
      SELECT m.*, d.device_id, d.estado
      FROM mediciones m
      JOIN devices d ON m.device_id = d.device_id
      WHERE d.device_id = ?
      ORDER BY m.timestamp DESC
      LIMIT 1
    `;
    try {
      const [results] = await db.query(sql, [serial]);
      if (results.length === 0) return res.status(404).json({ message: 'No hay datos' });
      res.json(results[0]);
    } catch (err) {
      console.error('Error GET /device/data:', err);
      return res.status(500).json({ message: 'Error DB' });
    }
});

// GET /device/history
router.get('/history', async (req, res) => {
    const { serial } = req.query;
    if (!serial) return res.status(400).json({ message: 'El serial es obligatorio' });

    const sql = `
      SELECT m.* 
      FROM mediciones m
      JOIN devices d ON m.device_id = d.device_id
      WHERE d.device_id = ?
      ORDER BY m.timestamp DESC
      LIMIT 100
    `;
    try {
      const [results] = await db.query(sql, [serial]);
      res.json(results);
    } catch (err) {
      console.error('Error GET /device/history:', err);
      return res.status(500).json({ message: 'Error DB' });
    }
});

export default router;