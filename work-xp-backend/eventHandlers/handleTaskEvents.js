// XP awarding logic separated for maintainability
function awardXpForSkill(skill_id, amount, reason = '') {
  if (!skill_id || !amount) return;
  db.prepare('UPDATE skills SET xp = xp + ? WHERE id = ?').run(amount, skill_id);
  console.log(`XP awarded (+${amount}) to skill ${skill_id}${reason ? ' for ' + reason : ''}`);
}
const axios = require('axios');
const db = require('../db');
const getUserAccessToken = require('../helpers/getToken');

// Helper to get skill_id from section_gid and user_gid
function getSkillId(user_gid, section_gid) {
  const skill = db.prepare('SELECT id FROM skills WHERE user_gid = ? AND section_gid = ?').get(user_gid, section_gid);
  return skill ? skill.id : null;
}

async function handleTaskEvent(event) {
  const { action, resource, user } = event;
  const user_gid = user.gid;
  const task_gid = resource.gid;

  // Only handle tasks assigned to a project/section
  if (resource.resource_type !== 'task') return;

  const access_token = getUserAccessToken(user_gid);
  if (!access_token) {
    console.error(`No access token found for user ${user_gid}`);
    return;
  }

  try {
    // Fetch full task details from Asana
    const response = await axios.get(`https://app.asana.com/api/1.0/tasks/${task_gid}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const task = response.data.data;
    const section_gid = (task.memberships && task.memberships[0] && task.memberships[0].section && task.memberships[0].section.gid) || null;
    const skill_id = section_gid ? getSkillId(user_gid, section_gid) : null;

    if (action === 'added') {
      db.prepare(`INSERT OR IGNORE INTO tasks (task_gid, user_gid, section_gid, skill_id, task_name, assignee_gid, completed, created_at, updated_at, due_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          task_gid,
          user_gid,
          section_gid,
          skill_id,
          task.name,
          task.assignee ? task.assignee.gid : null,
          task.completed ? 1 : 0,
          task.created_at,
          task.modified_at,
          task.due_on
        );
      console.log(`Task added: ${task.name} (${task_gid}) for user: ${user_gid}, skill: ${skill_id}`);
    } else if (action === 'changed') {
      // Get previous completion status
      const prevTask = db.prepare('SELECT completed FROM tasks WHERE task_gid = ? AND user_gid = ?').get(task_gid, user_gid);
      db.prepare(`UPDATE tasks SET
        section_gid = ?,
        skill_id = ?,
        task_name = ?,
        assignee_gid = ?,
        completed = ?,
        updated_at = ?,
        due_on = ?
        WHERE task_gid = ? AND user_gid = ?`)
        .run(
          section_gid,
          skill_id,
          task.name,
          task.assignee ? task.assignee.gid : null,
          task.completed ? 1 : 0,
          task.modified_at,
          task.due_on,
          task_gid,
          user_gid
        );
      // Award XP if task was just completed
      if (prevTask && !prevTask.completed && task.completed && skill_id) {
        awardXpForSkill(skill_id, 10, `completed task: ${task.name} (${task_gid})`);
      }
      console.log(`Task updated: ${task.name} (${task_gid}) for user: ${user_gid}, skill: ${skill_id}`);
    } else if (action === 'deleted') {
      db.prepare('DELETE FROM tasks WHERE task_gid = ? AND user_gid = ?').run(task_gid, user_gid);
      console.log(`Task deleted: ${task_gid} for user: ${user_gid}`);
    }
  } catch (error) {
    console.error(`Error handling task event for ${task_gid}:`, error);
  }
}

module.exports = handleTaskEvent;
