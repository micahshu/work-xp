const axios = require('axios');
const db = require('../../db');

// List all webhooks for a user in a workspace
async function listWebhooks(accessToken, workspaceGid) {
  try {
    const response = await axios.get(`https://app.asana.com/api/1.0/webhooks?workspace=${workspaceGid}`,
      { headers: { Authorization: `Bearer ${accessToken}` } });
    return response.data.data || [];
  } catch (err) {
    console.error('Error listing webhooks:', err.response ? err.response.data : err.message);
    return [];
  }
}

// Delete a webhook by its GID
async function deleteWebhook(webhookId, accessToken) {
  try {
    await axios.delete(`https://app.asana.com/api/1.0/webhooks/${webhookId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`Deleted webhook ${webhookId}`);
  } catch (err) {
    console.error(`Error deleting webhook ${webhookId}:`, err.response ? err.response.data : err.message);
  }
}

// Clean up old webhooks not tracked in DB
async function cleanupOrphanedWebhooks() {
  const users = db.prepare('SELECT asana_gid, access_token, workspace_gid FROM users WHERE access_token IS NOT NULL AND workspace_gid IS NOT NULL').all();
  for (const user of users) {
    const accessToken = user.access_token;
    const workspaceGid = user.workspace_gid;
    const trackedWebhookIds = db.prepare('SELECT webhook_id FROM users WHERE asana_gid = ? AND webhook_id IS NOT NULL').all(user.asana_gid).map(row => row.webhook_id);
    const webhooks = await listWebhooks(accessToken, workspaceGid);
    for (const wh of webhooks) {
      if (!trackedWebhookIds.includes(wh.gid)) {
        await deleteWebhook(wh.gid, accessToken);
      }
    }
  }
  db.close();
}

cleanupOrphanedWebhooks();
