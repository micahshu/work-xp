const axios = require('axios');
const db = require('../db');
const getUserAccessToken = require('../helpers/getToken');

async function handleSectionEvent(event) {
  const { action, resource, user } = event;
  const user_gid = user.gid;
  const section_gid = resource.gid;

  if (action === 'added') {
    const access_token = getUserAccessToken(user_gid);
    if (!access_token) {
      console.error(`No access token found for user ${user_gid}`);
      return;
    }
    try {
      const response = await axios.get(`https://app.asana.com/api/1.0/sections/${section_gid}`,
        { headers: { Authorization: `Bearer ${access_token}` } });
      const section_name = response.data.data.name;
      db.prepare('INSERT OR IGNORE INTO skills (user_gid, section_gid, section_name, active) VALUES (?, ?, ?, 1)')
        .run(user_gid, section_gid, section_name);
      console.log(`Skill added for section: ${section_name}, user: ${user_gid}`);
    } catch (error) {
      console.error(`Error fetching section ${section_gid}:`, error);
    }
  } else if (action === 'changed') {
    const access_token = getUserAccessToken(user_gid);
    if (!access_token) {
      console.error(`No access token found for user ${user_gid}`);
      return;
    }
    try {
      const response = await axios.get(`https://app.asana.com/api/1.0/sections/${section_gid}`,
        { headers: { Authorization: `Bearer ${access_token}` } });
      const section_name = response.data.data.name;
      db.prepare('UPDATE skills SET section_name = ? WHERE user_gid = ? AND section_gid = ?')
        .run(section_name, user_gid, section_gid);
      console.log(`Skill name updated for section: ${section_gid} -> ${section_name}, user: ${user_gid}`);
    } catch (error) {
      console.error(`Error fetching section ${section_gid}:`, error);
    }
  } else if (action === 'deleted') {
    db.prepare('DELETE FROM skills WHERE user_gid = ? AND section_gid = ?')
      .run(user_gid, section_gid);
    console.log(`Skill deleted for section: ${section_gid}, user: ${user_gid}`);
  }
}

module.exports = handleSectionEvent;
