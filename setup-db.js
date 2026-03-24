import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  const dbName = process.env.DB_NAME || 'cuidotech';
  
  // Connection without database specified to allow DROP/CREATE DATABASE
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log('--- REINICIO TOTAL DE BASE DE DATOS ---');
    
    console.log(`Eliminando base de datos '${dbName}' si existe...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    
    console.log(`Creando base de datos '${dbName}' desde cero...`);
    await connection.query(`CREATE DATABASE \`${dbName}\`;`);
    
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`Cambiado a base de datos '${dbName}'.`);

    const sqlPath = path.join(__dirname, 'database.sql');
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`No se encontró el archivo ${sqlPath}`);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Remove comments and split by semicolon
    const statements = sql
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove multi-line comments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE'));

    console.log(`Aplicando ${statements.length} sentencias SQL...`);
    
    // We must ensure FOREIGN_KEY_CHECKS are handled if they are in the SQL, 
    // but since we just created the DB, it's mostly for drop statements if any remain.
    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.query(statements[i]);
        if (i < 10 || i % 5 === 0) console.log(`Ejecutado (${i+1}/${statements.length}): ${statements[i].substring(0, 50)}...`);
      } catch (stmtErr) {
        console.error(`Error en sentencia ${i+1}:`, statements[i]);
        console.error(stmtErr.message);
      }
    }

    console.log('--- BASE DE DATOS RE-IMPLEMENTADA EXITOSAMENTE ---');
  } catch (error) {
    console.error('CRITICAL ERROR en la configuración:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();
