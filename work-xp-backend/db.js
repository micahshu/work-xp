const Database = require('better-sqlite3');
const db = new Database('workxp.db');

// Create the users table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    asana_gid TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry INTEGER,
    created_at TEXT
  )
`).run();

module.exports = db;
