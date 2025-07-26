
const axios = require('axios');
const db = require('../db');


const WEBHOOK_TARGET_URL = "https://sadly-humane-goat.ngrok.app/webhook/asana";

if (!WEBHOOK_TARGET_URL) {
  console.error('Missing required environment variables.');
  console.error('Set WEBHOOK_TARGET_URL.');
  process.exit(1);
}





async function registerWebhookForProject(projectGid, accessToken) {
  try {
    console.log('Registering webhook for projectGid:', projectGid, 'type:', typeof projectGid);
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
      // Store webhookId for all users with this project
      db.prepare('UPDATE users SET webhook_id = ? WHERE game_project_gid = ?').run(webhookId, projectGid);
    }
    console.log(`Registered webhook for project ${projectGid}:`, webhookId);
    return webhookId;
  } catch (err) {
    if (err.response) {
      console.error(`Error registering webhook for project ${projectGid} :`, err.response.data);
    } else {
      console.error(`Error registering webhook for project ${projectGid}:`, err.message);
    }
    return null;
  }
}


module.exports = {
  registerWebhookForProject
};
