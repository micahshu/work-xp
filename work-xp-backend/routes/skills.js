
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
    // Check for duplicate section names in the incoming sections array
    const nameCounts = {};
    for (const s of sections) {
      if (!s.name) continue;
      nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;
      if (nameCounts[s.name] > 1) {
        return res.status(400).json({ error: `Duplicate section name detected: '${s.name}'. Please ensure all section names are unique in Asana.` });
      }
    }

    // Get all skills for this user
    const allSkills = db.prepare('SELECT * FROM skills WHERE user_gid = ?').all(asana_gid);
    const currentActiveSkills = allSkills.filter(s => s.active === 1);
    const newSectionNames = sections.map(s => s.name);
    const newSectionGids = sections.map(s => s.gid);

    // 1. Deactivate skills whose section_name is not in the new list
    const toDeactivate = currentActiveSkills.filter(skill => !newSectionNames.includes(skill.section_name));
    if (toDeactivate.length > 0) {
      db.prepare(`UPDATE skills SET active = 0 WHERE user_gid = ? AND section_name IN (${toDeactivate.map(() => '?').join(',')})`).run(asana_gid, ...toDeactivate.map(s => s.section_name));
    }

    let added = 0, reactivated = 0, updated = 0;
    for (const section of sections) {
      if (!section.gid || !section.name) continue;
      // Try to find an existing skill by section_name
      const existing = allSkills.find(s => s.section_name === section.name);
      if (existing) {
        // If deactivated, reactivate and update GID
        if (existing.active === 0 || existing.section_gid !== section.gid) {
          db.prepare('UPDATE skills SET section_gid = ?, active = 1 WHERE id = ?').run(section.gid, existing.id);
          reactivated++;
        }
        // If already active and GID matches, do nothing
      } else {
        // Check if a skill exists for this user with the same section_gid (but different name, e.g. renamed section)
        const gidConflict = allSkills.find(s => s.section_gid === section.gid);
        if (gidConflict) {
          // Update the name and activate
          db.prepare('UPDATE skills SET section_name = ?, active = 1 WHERE id = ?').run(section.name, gidConflict.id);
          reactivated++;
        } else {
          // Insert new skill
          db.prepare('INSERT INTO skills (user_gid, section_gid, section_name, active) VALUES (?, ?, ?, 1)').run(asana_gid, section.gid, section.name);
          added++;
        }
      }
    }
    res.json({ message: `Processed: added ${added}, reactivated/updated ${reactivated}, deactivated ${toDeactivate.length} for user ${asana_gid}` });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'A skill with this section already exists. Please ensure all section names are unique in Asana.' });
    } else {
      console.error('Error saving skills:', err);
      res.status(500).json({ error: 'Failed to save skills' });
    }
  }
});

// Route to permanently delete a skill (only if deactivated)
router.delete('/delete-skill', async (req, res) => {
  const { asana_gid, section_gid } = req.body;
  if (!asana_gid || !section_gid) {
    return res.status(400).json({ error: 'asana_gid and section_gid are required' });
  }
  try {
    // Check if the skill is deactivated
    const skill = db.prepare('SELECT * FROM skills WHERE user_gid = ? AND section_gid = ?').get(asana_gid, section_gid);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    if (skill.active !== 0) {
      return res.status(400).json({ error: 'Skill must be deactivated before it can be deleted' });
    }
    db.prepare('DELETE FROM skills WHERE user_gid = ? AND section_gid = ?').run(asana_gid, section_gid);
    res.json({ message: 'Skill permanently deleted' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

module.exports = router;