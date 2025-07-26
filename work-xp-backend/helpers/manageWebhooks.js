const { execSync } = require('child_process');

console.log('Cleaning up orphaned webhooks...');
execSync('node helpers/webhooks/cleanupWebhooks.js', { stdio: 'inherit' });

console.log('Resetting all webhooks for users/projects...');
execSync('node helpers/webhooks/resetAsanaWebhooks.js', { stdio: 'inherit' });

console.log('Webhook management complete!');
