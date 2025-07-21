const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

router.get('/asana', (req, res) => {
  const url = `https://app.asana.com/-/oauth_authorize?client_id=${process.env.ASANA_CLIENT_ID}&redirect_uri=${process.env.ASANA_REDIRECT_URI}&response_type=code`;
  console.log("Redirecting to:", url);
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
    const code = req.query.code;
  
    try {
      const response = await axios.post('https://app.asana.com/-/oauth_token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.ASANA_CLIENT_ID,
          client_secret: process.env.ASANA_CLIENT_SECRET,
          redirect_uri: process.env.ASANA_REDIRECT_URI,
          code,
        },
      });
  
      const { access_token, refresh_token, expires_in } = response.data;
  
      const userRes = await axios.get('https://app.asana.com/api/1.0/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
  
      const user = userRes.data.data;
  
      const stmt = db.prepare(`
        INSERT INTO users (asana_gid, name, email, access_token, refresh_token, token_expiry, created_at)
        VALUES (@asana_gid, @name, @email, @access_token, @refresh_token, @token_expiry, @created_at)
        ON CONFLICT(asana_gid) DO UPDATE SET
          name=excluded.name,
          email=excluded.email,
          access_token=excluded.access_token,
          refresh_token=excluded.refresh_token,
          token_expiry=excluded.token_expiry
      `);
  
      stmt.run({
        asana_gid: user.gid,
        name: user.name,
        email: user.email,
        access_token,
        refresh_token,
        token_expiry: Date.now() + expires_in * 1000, // Expiry time in ms
        created_at: new Date().toISOString(),
      });
  
      res.send('Authentication successful! You can close this tab.');
    } catch (err) {
      console.error(err.response?.data || err.message);
      res.status(500).send('OAuth failed.');
    }
  });
  

module.exports = router;
