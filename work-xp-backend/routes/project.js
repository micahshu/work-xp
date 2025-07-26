
const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

router.get('/project-sections/:asana_gid', async (req, res) => {
  const { asana_gid } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE asana_gid = ?').get(asana_gid);
  if (!user || !user.access_token || !user.game_project_gid) {
    return res.status(404).json({ error: 'User, access token, or project GID not found' });
  }
  if (user.token_expiry && Date.now() > user.token_expiry) {
    const refreshAsanaToken = require('../helpers/refreshToken');
    try {
      await refreshAsanaToken(asana_gid);
      user = db.prepare('SELECT * FROM users WHERE asana_gid = ?').get(asana_gid);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to refresh token' });
    }
  }
  try {
    const response = await axios.get(`https://app.asana.com/api/1.0/projects/${user.game_project_gid}/sections`, {
      headers: { Authorization: `Bearer ${user.access_token}` }
    });
    res.json({ sections: response.data.data });
  } catch (err) {
    console.log('Error fetching project sections:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch project sections' });
  }
});

router.post('/set-project', async (req, res) => {
  const { asana_gid, project_name } = req.body;
  if (!asana_gid || !project_name) {
    console.log('Missing asana_gid or project_name');
    return res.status(400).json({ error: 'asana_gid and project_name are required' });
  }
  let user = db.prepare('SELECT * FROM users WHERE asana_gid = ?').get(asana_gid);
  if (!user || !user.access_token) {
    console.log('User or access token not found:', asana_gid);
    return res.status(404).json({ error: 'User or access token not found' });
  }
  if (user.game_project_gid) {
    console.log('Project GID already exists for user:', user.game_project_gid);
    return res.json({ message: 'Project GID already exists', game_project_gid: user.game_project_gid });
  }
  if (user.token_expiry && Date.now() > user.token_expiry) {
    const refreshAsanaToken = require('../helpers/refreshToken');
    try {
      const refreshed = await refreshAsanaToken(asana_gid);
      user = db.prepare('SELECT * FROM users WHERE asana_gid = ?').get(asana_gid);
      console.log('Token refreshed for user:', asana_gid);
    } catch (err) {
      console.log('Failed to refresh token:', err);
      return res.status(500).json({ error: 'Failed to refresh token' });
    }
  }
  try {
    let offset = undefined;
    let foundProject = null;
    let pageCount = 0;
    do {
      console.log(`Requesting projects page ${pageCount + 1} for workspace ${user.workspace_gid} with offset ${offset}`);
      const response = await axios.get('https://app.asana.com/api/1.0/projects', {
        headers: { Authorization: `Bearer ${user.access_token}` },
        params: {
          workspace: user.workspace_gid,
          offset,
          limit: 50,
        }
      });
      if (response.data.errors) {
        console.log('Asana API error:', response.data.errors);
        return res.status(500).json({ error: response.data.errors });
      }
      const projects = response.data.data;
      console.log(`Fetched ${projects.length} projects on page ${pageCount + 1}`);
      foundProject = projects.find(p => p.name === project_name);
      offset = response.data.next_page ? response.data.next_page.offset : undefined;
      pageCount++;
    } while (!foundProject && offset);

    if (!foundProject) {
      console.log('Project not found:', project_name);
      return res.status(404).json({ error: 'Project not found' });
    }
    // Save project GID
    db.prepare(`UPDATE users SET game_project_gid = ? WHERE asana_gid = ?`).run(foundProject.gid, asana_gid);
    console.log('Project GID saved:', foundProject.gid);

    // Register webhook for this user's project
    const registerWebhook = require('../helpers/registerAsanaWebhook');
    await registerWebhook.registerWebhookForProject(foundProject.gid, user.access_token);
    console.log('Webhook registered for project:', foundProject.gid);

    // Sync Asana sections to skills
    const resyncSections = require('../helpers/resyncSections');
    await resyncSections.resyncSectionsForUser(asana_gid);
    console.log('Skills synced for user:', asana_gid);

    res.json({ message: 'Project onboarding complete', game_project_gid: foundProject.gid });
  } catch (err) {
    console.log('Error during onboarding:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

module.exports = router;
