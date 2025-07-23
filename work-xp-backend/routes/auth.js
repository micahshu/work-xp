const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const db = require('../db');

router.get('/asana', (req, res) => {
  // Generate a random state and store in session
  const state = crypto.randomBytes(16).toString('hex');
  req.session = req.session || {};
  req.session.oauthState = state;
  const url = `https://app.asana.com/-/oauth_authorize?client_id=${process.env.ASANA_CLIENT_ID}&redirect_uri=${process.env.ASANA_REDIRECT_URI}&response_type=code&state=${state}`;
  console.log("Redirecting to:", url);
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  req.session = req.session || {};
  if (!state || state !== req.session.oauthState) {
    return res.status(400).send('Invalid state parameter. Possible CSRF attack.');
  }
  // Optionally clear the state after checking
  delete req.session.oauthState;

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
    // Get primary workspace GID
    const workspace_gid = user.workspaces && user.workspaces.length > 0 ? user.workspaces[0].gid : null;

    const stmt = db.prepare(`
      INSERT INTO users (asana_gid, name, email, access_token, refresh_token, token_expiry, created_at, workspace_gid, onboarding_complete)
      VALUES (@asana_gid, @name, @email, @access_token, @refresh_token, @token_expiry, @created_at, @workspace_gid, @onboarding_complete)
      ON CONFLICT(asana_gid) DO UPDATE SET
        name=excluded.name,
        email=excluded.email,
        access_token=excluded.access_token,
        refresh_token=excluded.refresh_token,
        token_expiry=excluded.token_expiry,
        workspace_gid=excluded.workspace_gid,
        onboarding_complete=users.onboarding_complete
    `);

    stmt.run({
      asana_gid: user.gid,
      name: user.name,
      email: user.email,
      access_token,
      refresh_token,
      token_expiry: Date.now() + expires_in * 1000, // Expiry time in ms
      created_at: new Date().toISOString(),
      workspace_gid,
      onboarding_complete: 0 // Always set to 0 for new users
    });

    req.session.user = {
    asana_gid: user.gid,
    name: user.name,
    email: user.email
  };
  res.redirect(process.env.FRONTEND_REDIRECT_URL || 'http://localhost:3000/login');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('OAuth failed.');
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  // Check if user has completed onboarding
  const stmt = db.prepare('SELECT * FROM users WHERE asana_gid = ?');
  const dbUser = stmt.get(req.session.user.asana_gid);
  // hasProfile is true only if onboarding_complete is 1
  const hasProfile = !!(dbUser && dbUser.onboarding_complete === 1);
  res.json({ user: req.session.user, hasProfile });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.sendStatus(200);
  });
});


  
module.exports = router;
