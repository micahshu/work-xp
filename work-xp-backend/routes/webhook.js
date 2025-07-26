// webhook.js
const express = require('express');
const router = express.Router();


const db = require('../db');

function handleSectionEvent(event) {
  const { action, resource, user } = event;
  if (resource.resource_type !== 'section' || !user || !user.gid) return;
  const user_gid = user.gid;
  const section_gid = resource.gid;
  const section_name = resource.name;

  if (action === 'added') {
    // Add skill for new section
    db.prepare('INSERT OR IGNORE INTO skills (user_gid, section_gid, section_name, active) VALUES (?, ?, ?, 1)')
      .run(user_gid, section_gid, section_name);
    console.log('Skill added for section:', section_name, 'user:', user_gid);
  } else if (action === 'changed' && section_name) {
    // Update skill name if section name changed
    db.prepare('UPDATE skills SET section_name = ? WHERE user_gid = ? AND section_gid = ?')
      .run(section_name, user_gid, section_gid);
    console.log('Skill name updated for section:', section_gid, '->', section_name, 'user:', user_gid);
  } else if (action === 'deleted') {
    // Delete skill for removed section
    db.prepare('DELETE FROM skills WHERE user_gid = ? AND section_gid = ?')
      .run(user_gid, section_gid);
    console.log('Skill deleted for section:', section_gid, 'user:', user_gid);
  }
}

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
    handleSectionEvent(event);
  });
  res.status(200).end();
});

module.exports = router;
