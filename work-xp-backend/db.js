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
    created_at TEXT,
    workspace_gid TEXT,
    onboarding_complete INTEGER DEFAULT 0,
    game_project_gid TEXT
  )
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_gid TEXT NOT NULL,
  section_gid TEXT,  
  section_name TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_gid) REFERENCES users(asana_gid),
  UNIQUE(user_gid, section_gid)  
)
`).run();

module.exports = db;
