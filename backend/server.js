// backend/server.js
// Academic Support Hub API — MySQL + static JSON for Home & Q&A

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import homeData from './homeapi.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ----- Load Q&A data from qaapi.json -----
const qaFile = path.join(__dirname, 'qaapi.json');
let qaData = [];
try {
  const raw = fs.readFileSync(qaFile, 'utf8');
  qaData = JSON.parse(raw);
} catch (err) {
  console.error('❌ Failed to load qaapi.json:', err);
  qaData = [];
}

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

// ----- Home Dashboard API (/api/home) -----
// Used by home.html via API.Home.get()
app.get('/api/home', (_req, res) => {
  res.json(homeData);
});

// ----- UC-1: Study Groups (Mariah) -----
// Table columns: GroupID (PK), GroupName (title), CourseName (text)

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

// POST /api/study-groups { course, title }
// store title -> GroupName and course -> CourseName (text)
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

// ----- UC-2: Q&A (Ethan) -----
// Courses + Questions APIs used by qa.html

// GET /api/courses
// For now, build courses from distinct CourseName values in StudyGroup
app.get('/api/courses', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT CourseName FROM StudyGroup');
    const courses = rows.map((r, idx) => {
      const name = r.CourseName;
      const match = String(name).match(/\d+/); // grab digits like 480, 361
      const id = match ? Number(match[0]) : idx + 1;
      return { CourseID: id, CourseName: name };
    });
    res.json(courses);
  } catch (err) {
    console.error('❌ Error fetching courses:', err);
    res.status(500).json({ message: 'Failed to fetch courses.' });
  }
});

// GET /api/questions[?courseId=480]
app.get('/api/questions', (req, res) => {
  const { courseId } = req.query;

  let items = qaData.map((q) => {
    // try to normalize courseId
    let cid = null;
    if (q.courseId != null) {
      cid = Number(q.courseId);
    } else if (q.course) {
      const m = String(q.course).match(/\d+/);
      cid = m ? Number(m[0]) : null;
    }

    return {
      id: q.id,
      courseId: cid,
      author: q.author,
      content: q.body ?? q.content ?? '',
      createdAt: q.createdAt
    };
  });

  if (courseId) {
    items = items.filter((q) => q.courseId === Number(courseId));
  }

  res.json(items);
});

// POST /api/questions { courseId, author, content }
app.post('/api/questions', (req, res) => {
  const { courseId, author, content } = req.body || {};

  if (!author || !content) {
    return res.status(400).json({ message: 'Author and content required.' });
  }

  const newId = qaData.length ? Math.max(...qaData.map((q) => q.id)) + 1 : 1;

  const newItem = {
    id: newId,
    course: courseId ? `CMPS ${courseId}` : null,
    title: '',
    body: content,
    author,
    createdAt: new Date().toISOString().split('T')[0]
  };

  qaData.push(newItem);

  try {
    fs.writeFileSync(qaFile, JSON.stringify(qaData, null, 2));
  } catch (err) {
    console.error('❌ Failed to persist qaapi.json:', err);
  }

  res.status(201).json({ success: true, id: newId });
});

// ----- Placeholders for Other Use Cases -----
// TODO (UC-3: Resources)
// TODO (UC-4: Planner)

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
