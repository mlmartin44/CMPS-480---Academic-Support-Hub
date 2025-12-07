// backend/server.js
// Academic Support Hub API — DB-connected (stores CourseName text)

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ----- Middleware (order matters) -----
app.use(helmet());
app.use(cors()); // open while developing; tighten later if needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- Health / Root -----
app.get('/', (_req, res) =>
  res.json({ status: 'ok', service: 'ASH API (DB Connected, CourseName text)' })
);

app.get('/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', db: true, ts: rows[0].now });
  } catch (err) {
    console.error('❌ Database error:', err);
    res.status(500).json({ status: 'error', db: false, message: err.message });
  }
});


// UC-1: Study Groups (Mariah)
// Table columns used here: GroupID (PK), GroupName (title), CourseName (text)


// GET /api/study-groups?course=CMPS%20101
app.get('/api/study-groups', async (req, res) => {
  const { course } = req.query;
  try {
    let sql = 'SELECT GroupID, GroupName, CourseName FROM StudyGroup';
    const params = [];
    if (course) {
      sql += ' WHERE CourseName LIKE ?';
      params.push(`%${course}%`);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching study groups:', err);
    res.status(500).json({ error: 'Failed to fetch study groups.', message: err.message });
  }
});

// POST /api/study-groups { course, title, when, where, maxSize }
//store title -> GroupName and course -> CourseName (text)
app.post('/api/study-groups', async (req, res) => {
  const { course, title } = req.body || {};
  console.log('DEBUG /api/study-groups body:', req.body);

  if (!course || !title) {
    return res.status(400).json({ error: 'Course and title are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO StudyGroup (GroupName, CourseName)
       VALUES (?, ?)`,
      [title, course]
    );

    const [rows] = await pool.query(
      'SELECT GroupID, GroupName, CourseName FROM StudyGroup WHERE GroupID = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error creating study group:', err);
    res.status(500).json({ error: 'Failed to create study group.', message: err.message });
  }
});

// POST /api/study-groups/:id/join  (no-op for now; schema has no MemberCount)
// add a MemberCount column and update it here
app.post('/api/study-groups/:id/join', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT GroupID, GroupName, CourseName FROM StudyGroup WHERE GroupID = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Group not found' });

    // placeholder success
    res.json({ status: 'joined', groupId: Number(id) });
  } catch (err) {
    console.error('❌ Error joining study group:', err);
    res.status(500).json({ error: 'Failed to join study group.', message: err.message });
  }
});


// Placeholders for Other Use Cases (team)

// TODO (UC-2: Q&A)       
// TODO (UC-3: Resources) 
// TODO (UC-4: Planner)  

// ----- Business Analytics Endpoints -----

// 1. Total number of study groups
app.get('/analytics/groups/count', async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) AS totalGroups FROM StudyGroup`);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch group count" });
  }
});

// 2. Posts per study group (requires GroupPost table)
app.get('/analytics/groups/posts', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT groupId, COUNT(*) AS postCount
      FROM GroupPost
      GROUP BY groupId
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch post data" });
  }
});

// 3. Active vs inactive users (active = posted at least once)
app.get('/analytics/users/activity', async (_req, res) => {
  try {
    const [[totalUsers]] = await pool.query(`SELECT COUNT(*) AS total FROM User`);
    const [[activeUsers]] = await pool.query(`
      SELECT COUNT(DISTINCT userId) AS active
      FROM GroupPost
    `);

    res.json({
      totalUsers: totalUsers.total,
      activeUsers: activeUsers.active,
      inactiveUsers: totalUsers.total - activeUsers.active,
      activePercent: ((activeUsers.active / totalUsers.total) * 100).toFixed(1)
    });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Failed to calculate user activity" });
  }
});


// ----- Error handling -----
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled server error:', err);
  res.status(500).json({ error: 'Server error' });
});

// ----- Start -----
app.listen(PORT, () =>
  console.log(`✅ ASH API (MySQL Connected) running on port ${PORT}`)
);
