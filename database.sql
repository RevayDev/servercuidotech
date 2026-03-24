-- Cuido Platform: Database Architecture
-- Engine: InnoDB
-- Character Set: utf8mb4

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS alertas;
DROP TABLE IF EXISTS mediciones;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS usuario_adulto;
DROP TABLE IF EXISTS adultos;
DROP TABLE IF EXISTS usuarios;

-- 1. usuarios (familiares)
CREATE TABLE usuarios (
    IdUsuario INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    Fecha_Nacimiento DATE,
    Direccion_Residencia TEXT,
    Numero_telefono VARCHAR(20)
) ENGINE=InnoDB;

-- 2. adultos (personas monitoreadas)
CREATE TABLE adultos (
    IdAdulto INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Fecha_Nacimiento DATE,
    Genero ENUM('M', 'F', 'Otro'),
    Peso DECIMAL(5,2),
    Altura DECIMAL(5,2),
    Grupo_Sanguineo VARCHAR(5),
    Condicion_Medica TEXT,
    Telefono_Emergencia VARCHAR(20)
) ENGINE=InnoDB;

-- 3. usuario_adulto (relación muchos a muchos)
CREATE TABLE usuario_adulto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    adulto_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(IdUsuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (adulto_id) REFERENCES adultos(IdAdulto) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. devices (relojes)
CREATE TABLE devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL UNIQUE,
    api_key VARCHAR(255) NOT NULL,
    adulto_id INT DEFAULT NULL,
    estado ENUM('activo', 'inactivo', 'mantenimiento') DEFAULT 'activo',
    bateria INT DEFAULT 100,
    FOREIGN KEY (adulto_id) REFERENCES adultos(IdAdulto) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. mediciones (tabla principal)
CREATE TABLE mediciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    heartRate INT,
    fallDetected BOOLEAN DEFAULT FALSE,
    signalStrength INT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    mode VARCHAR(20),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_device_timestamp (device_id, timestamp)
) ENGINE=InnoDB;

-- 6. alertas (PREPARADA PARA FUTURO)
CREATE TABLE alertas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicion_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    nivel VARCHAR(20),
    mensaje TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicion_id) REFERENCES mediciones(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
