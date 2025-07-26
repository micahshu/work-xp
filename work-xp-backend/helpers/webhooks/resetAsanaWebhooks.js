const axios = require('axios');
const db = require('../../db');

const WEBHOOK_TARGET_URL = "https://sadly-humane-goat.ngrok.app/webhook/asana"; // <-- Update this each time ngrok restarts

// Get all users with access tokens, project gids, and workspace gids
const users = db.prepare('SELECT DISTINCT asana_gid, access_token, game_project_gid, workspace_gid FROM users WHERE access_token IS NOT NULL AND game_project_gid IS NOT NULL AND workspace_gid IS NOT NULL').all();

async function getWebhooks(accessToken, workspaceGid) {
  try {
    const response = await axios.get(`https://app.asana.com/api/1.0/webhooks?workspace=${workspaceGid}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    return response.data.data || [];
  } catch (err) {
    console.error('Error fetching webhooks:', err.response ? err.response.data : err.message);
    return [];
  }
}

async function deleteWebhook(webhookId, accessToken) {
  try {
    await axios.delete(`https://app.asana.com/api/1.0/webhooks/${webhookId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Deleted webhook ${webhookId}`);
  } catch (err) {
    console.error(`Error deleting webhook ${webhookId}:`, err.response ? err.response.data : err.message);
  }
}

async function registerWebhook(projectGid, accessToken) {
  try {
    const response = await axios.post(
      'https://app.asana.com/api/1.0/webhooks',
      {
        data: {
          resource: String(projectGid),
          target: WEBHOOK_TARGET_URL
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const webhookId = response.data.data && response.data.data.gid;
    if (webhookId) {
      db.prepare('UPDATE users SET webhook_id = ? WHERE game_project_gid = ?').run(webhookId, projectGid);
    }
    console.log(`Registered webhook for project ${projectGid}:`, webhookId);
  } catch (err) {
    console.error(`Error registering webhook for project ${projectGid}:`, err.response ? err.response.data : err.message);
  }
}


(async () => {
  for (const user of users) {
    if (!user.access_token || !user.workspace_gid) continue;
    // 1. Delete all webhooks for this user in this workspace
    const webhooks = await getWebhooks(user.access_token, user.workspace_gid);
    for (const wh of webhooks) {
      await deleteWebhook(wh.gid, user.access_token);
    }
    // 2. Register new webhook for this user's project
    if (user.game_project_gid) {
      await registerWebhook(user.game_project_gid, user.access_token);
    }
  }
  db.close();
})();
