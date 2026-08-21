import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'goroga.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// WAL mode: allows concurrent reads while a write is in progress
// busy_timeout: auto-retries for up to 5s instead of throwing SQLITE_BUSY
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// Create table on first run
db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone_no TEXT NOT NULL DEFAULT '',
    pulse_before TEXT NOT NULL,
    pulse_after TEXT NOT NULL,
    feeling TEXT NOT NULL,
    noticed TEXT NOT NULL,
    would_use_again TEXT NOT NULL,
    one_word TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migrate existing DB: add columns if they don't exist yet
const existingCols = (db.pragma('table_info(responses)') as { name: string }[]).map(
  (c) => c.name
);
for (const col of ['name TEXT NOT NULL DEFAULT ""', 'email TEXT NOT NULL DEFAULT ""', 'phone_no TEXT NOT NULL DEFAULT ""']) {
  const colName = col.split(' ')[0];
  if (!existingCols.includes(colName)) {
    db.exec(`ALTER TABLE responses ADD COLUMN ${col}`);
  }
}

export default db;
