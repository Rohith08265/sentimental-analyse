const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'sentimental.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        email       TEXT    UNIQUE NOT NULL,
        password    TEXT    NOT NULL,
        role        TEXT    NOT NULL DEFAULT 'student',
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT,
        event_name   TEXT,
        event_type   TEXT,
        rating       INTEGER,
        description  TEXT,
        sentiment    TEXT,
        score        REAL,
        batch_id     TEXT    DEFAULT 'manual',
        timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log('SQLite database initialized at:', DB_PATH);

module.exports = db;
