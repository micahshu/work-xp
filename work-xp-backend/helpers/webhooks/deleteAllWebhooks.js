const axios = require('axios');
const db = require('../../db');


// Get a valid Asana access token and workspace_gid from any user (ideally an admin)
const user = db.prepare('SELECT access_token, workspace_gid FROM users WHERE access_token IS NOT NULL AND workspace_gid IS NOT NULL LIMIT 1').get();
if (!user || !user.access_token || !user.workspace_gid) {
  console.error('No valid Asana access token or workspace_gid found in DB.');
  process.exit(1);
}
const accessToken = user.access_token;
const workspaceGid = user.workspace_gid;

async function getAllWebhooks() {
  try {
    const response = await axios.get('https://app.asana.com/api/1.0/webhooks', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { workspace: workspaceGid }
    });
    return response.data.data || [];
  } catch (err) {
    console.error('Error fetching webhooks:', err.response?.data || err.message);
    return [];
  }
}

async function deleteWebhook(webhookId) {
  try {
    await axios.delete(`https://app.asana.com/api/1.0/webhooks/${webhookId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Deleted webhook:', webhookId);
  } catch (err) {
    console.error(`Error deleting webhook ${webhookId}:`, err.response?.data || err.message);
  }
}

async function deleteAllWebhooks() {
  const webhooks = await getAllWebhooks();
  if (!webhooks.length) {
    console.log('No webhooks found.');
    return;
  }
  for (const webhook of webhooks) {
    await deleteWebhook(webhook.gid);
  }
  console.log('All webhooks deleted.');
}

deleteAllWebhooks().then(() => db.close());
