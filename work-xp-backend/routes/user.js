const express = require('express');
const router = express.Router();
const db = require('../db');

// Route to mark onboarding as complete for a user
router.post('/complete-onboarding', async (req, res) => {
  const { asana_gid } = req.body;
  if (!asana_gid) {
    return res.status(400).json({ error: 'asana_gid is required' });
  }
  try {
    const result = db.prepare('UPDATE users SET onboarding_complete = 1 WHERE asana_gid = ?').run(asana_gid);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Onboarding marked as complete' });
  } catch (err) {
    console.error('Error updating onboarding status:', err);
    res.status(500).json({ error: 'Failed to update onboarding status' });
  }
});

module.exports = router;
