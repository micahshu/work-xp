const axios = require('axios');
const db = require('../db');

async function refreshAsanaToken(asana_gid) {
  const user = db.prepare('SELECT * FROM users WHERE asana_gid = ?').get(asana_gid);
  if (!user || !user.refresh_token) {
    throw new Error('User or refresh token not found');
  }

  try {
    const response = await axios.post(
      'https://app.asana.com/-/oauth_token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ASANA_CLIENT_ID,
        client_secret: process.env.ASANA_CLIENT_SECRET,
        redirect_uri: process.env.ASANA_REDIRECT_URI,
        refresh_token: user.refresh_token,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

    db.prepare(`
    UPDATE users 
    SET access_token = ?, token_expiry = ?
    WHERE asana_gid = ?
    `).run(access_token, Date.now() + expires_in * 1000, asana_gid);

    if (new_refresh_token) {
    db.prepare(`
        UPDATE users 
        SET refresh_token = ?
        WHERE asana_gid = ?
    `).run(new_refresh_token, asana_gid);
    }


    console.log(`Refreshed token for user ${asana_gid}`);
    return {
    access_token,
    refresh_token: new_refresh_token || user.refresh_token,
    expires_in,
};
  } catch (err) {
    console.error(`Token refresh failed for user ${asana_gid}:`, err.response?.data || err.message);
    throw new Error('Token refresh failed');
  }
}

module.exports = refreshAsanaToken;
