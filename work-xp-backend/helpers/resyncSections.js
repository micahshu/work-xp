const db = require('../db');
const axios = require('axios');
const getUserAccessToken = require('./getToken');

// Sync sections for a single user and update the skills table
async function resyncSectionsForUser(asana_gid) {
  const user = db.prepare('SELECT asana_gid, game_project_gid FROM users WHERE asana_gid = ? AND access_token IS NOT NULL AND game_project_gid IS NOT NULL').get(asana_gid);
  if (!user) {
    throw new Error(`User not found or missing project/access token for asana_gid: ${asana_gid}`);
  }
  const access_token = getUserAccessToken(user.asana_gid);
  if (!access_token) {
    throw new Error(`No access token for user ${user.asana_gid}`);
  }
  try {
    // Fetch all sections for the user's project
    const response = await axios.get(`https://app.asana.com/api/1.0/projects/${user.game_project_gid}/sections`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const sections = response.data.data;
    // Mark all user's skills inactive before resync
    db.prepare('UPDATE skills SET active = 0 WHERE user_gid = ?').run(user.asana_gid);
    // Upsert each section as an active skill, skipping the default section at index 0
    sections.slice(1).forEach(section => {
      db.prepare('INSERT INTO skills (user_gid, section_gid, section_name, active) VALUES (?, ?, ?, 1) ON CONFLICT(user_gid, section_gid) DO UPDATE SET section_name = excluded.section_name, active = 1')
        .run(user.asana_gid, section.gid, section.name);
    });
    // Delete any skills for this user that are still inactive (not present in Asana)
    db.prepare('DELETE FROM skills WHERE user_gid = ? AND active = 0').run(user.asana_gid);
    console.log(`Resynced ${sections.length - 1} sections for user ${user.asana_gid}`);
  } catch (error) {
    console.error(`Error resyncing sections for user ${user.asana_gid}:`, error);
    throw error;
  }
}

module.exports = {
  resyncSectionsForUser
};
