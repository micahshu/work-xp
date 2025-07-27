// webhook.js
const handleSectionEvent = require('../eventHandlers/handleSectionEvent');
const handleTaskEvent = require('../eventHandlers/handleTaskEvents');
const express = require('express');
const router = express.Router();
const axios = require('axios');


router.post('/asana', (req, res) => {
  const asanaSignature = req.headers['x-hook-secret'];
  if (asanaSignature) {
    res.set('X-Hook-Secret', asanaSignature);
    return res.status(200).end();
  }

  const events = req.body.events;
  if (!events) {
    return res.status(400).json({ error: 'No events received' });
  }
  console.log('Received webhook events:');
  events.forEach(event => {
    console.log('Event:', event);
    if (event.resource && event.resource.name) {
      console.log('Section name:', event.resource.name);
    }
    if (event.resource.resource_type === 'section' && event.user && event.user.gid) {
      handleSectionEvent(event);
    }
    if (event.resource.resource_type === 'task' && event.user && event.user.gid) {
      handleTaskEvent(event);
    }
  });
  res.status(200).end();
});

module.exports = router;
