// webhook.js
const express = require('express');
const router = express.Router();

// Handle incoming webhook verification & events
router.post('/asana', (req, res) => {
  const asanaSignature = req.headers['x-hook-secret'];

  // Step 1: If Asana sends a handshake header, respond with it
  if (asanaSignature) {
    res.set('X-Hook-Secret', asanaSignature);
    return res.status(200).end();
  }

  // Step 2: Otherwise, handle the actual events
  const events = req.body.events;
  if (!events) {
    return res.status(400).json({ error: 'No events received' });
  }

  console.log('Asana Webhook Events:', JSON.stringify(events, null, 2));
  res.status(200).end(); // Respond quickly!
});

module.exports = router;
