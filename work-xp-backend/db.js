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
    game_project_gid TEXT,
    webhook_id TEXT
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
  active INTEGER DEFAULT 1,
  FOREIGN KEY (user_gid) REFERENCES users(asana_gid),
  UNIQUE(user_gid, section_gid)  
)
`).run();


// Create the tasks table to track Asana tasks and link them to skills (sections)
db.prepare(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_gid TEXT NOT NULL,
  user_gid TEXT NOT NULL,
  section_gid TEXT,
  skill_id INTEGER,
  task_name TEXT,
  assignee_gid TEXT,
  completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  due_on TEXT,
  FOREIGN KEY (user_gid) REFERENCES users(asana_gid),
  FOREIGN KEY (skill_id) REFERENCES skills(id),
  UNIQUE(task_gid)
)
`).run();

module.exports = db;
