const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

// Route to save project sections as skills for a user
router.post('/set-skills', async (req, res) => {
  const { asana_gid, sections } = req.body;
  if (!asana_gid || !Array.isArray(sections)) {
    return res.status(400).json({ error: 'asana_gid and sections array are required' });
  }
  try {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO skills (user_gid, section_gid, section_name)
      VALUES (?, ?, ?)
    `);
    let added = 0;
    for (const section of sections) {
      if (section.gid && section.name) {
        insert.run(asana_gid, section.gid, section.name);
        added++;
      }
    }
    res.json({ message: `Added ${added} skills for user ${asana_gid}` });
  } catch (err) {
    console.error('Error saving skills:', err);
    res.status(500).json({ error: 'Failed to save skills' });
  }
});

module.exports = router;