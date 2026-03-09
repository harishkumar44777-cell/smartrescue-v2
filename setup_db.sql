-- SmartRescue v2 — MySQL Setup Script
-- Run: mysql -u root -proot123 < setup_db.sql

CREATE DATABASE IF NOT EXISTS smartrescue
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartrescue;

CREATE TABLE IF NOT EXISTS users (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS ambulances (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id VARCHAR(20) UNIQUE NOT NULL,
  driver     VARCHAR(100) NOT NULL,
  status     VARCHAR(20) DEFAULT 'AVAILABLE',
  lat        DOUBLE DEFAULT 11.1271,
  lng        DOUBLE DEFAULT 78.6569,
  area       VARCHAR(100) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospitals (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  name   VARCHAR(200) NOT NULL,
  city   VARCHAR(100) NOT NULL,
  beds   INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'OPERATIONAL',
  lat    DOUBLE DEFAULT 11.1271,
  lng    DOUBLE DEFAULT 78.6569
);

CREATE TABLE IF NOT EXISTS incidents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        VARCHAR(100) NOT NULL,
  location    VARCHAR(300) NOT NULL,
  priority    VARCHAR(20) DEFAULT 'HIGH',
  patients    INT DEFAULT 1,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'OPEN',
  lat         DOUBLE,
  lng         DOUBLE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispatch_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  incident_id   INT,
  ambulance_id  INT,
  hospital_id   INT,
  status        VARCHAR(20) DEFAULT 'DISPATCHED',
  dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  response_time INT,
  distance_km   DOUBLE,
  FOREIGN KEY (incident_id)  REFERENCES incidents(id)  ON DELETE SET NULL,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE SET NULL,
  FOREIGN KEY (hospital_id)  REFERENCES hospitals(id)  ON DELETE SET NULL
);

SELECT 'SmartRescue v2 database tables created ✅' AS result;
