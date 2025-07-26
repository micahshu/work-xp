const db = require('../db');

function getUserAccessToken(user_gid) {
  const row = db.prepare('SELECT access_token FROM users WHERE asana_gid = ?').get(user_gid);
  return row ? row.access_token : null;
}

module.exports = getUserAccessToken;