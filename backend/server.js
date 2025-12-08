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

// ----- Middleware -----
app.use(helmet());
app.use(cors()); // open for dev; can be restricted later
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- Health / Root -----
app.get('/', (_req, res) =>
  res.json({ status: 'ok', service: 'ASH API (MySQL)' })
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
app.get('/api/home', (_req, res) => {
  res.json(homeData);
});

//
// ===== UC-1: Study Groups (Mariah) =====
//
// Tables used:
//   StudyGroup(GroupID, GroupName, CourseID, CourseName)
//   UserGroup(UserID, GroupID)
//   User(UserID, FirstName, LastName, Email, Role)
//
// Frontend (api.js):
//   GET  /api/study-groups?course=CMPS480
//   POST /api/study-groups { course, title }
//   POST /api/study-groups/:id/join { name }
//

// GET /api/study-groups
app.get('/api/study-groups', async (req, res) => {
  const { course } = req.query;

  try {
    let sql = `
      SELECT
        sg.GroupID,
        sg.GroupName,
        sg.CourseName,
        COUNT(ug.UserID) AS MemberCount
      FROM StudyGroup sg
      LEFT JOIN UserGroup ug ON sg.GroupID = ug.GroupID
      WHERE 1 = 1
    `;
    const params = [];

    if (course) {
      sql += ' AND sg.CourseName LIKE ?';
      params.push(`%${course}%`);
    }

    sql += ' GROUP BY sg.GroupID ORDER BY sg.CourseName, sg.GroupName';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching study groups:', err);
    res.status(500).json({ error: 'Failed to fetch study groups.' });
  }
});

// POST /api/study-groups  { course, title }
app.post('/api/study-groups', async (req, res) => {
  const { course, title } = req.body || {};

  if (!course || !title) {
    return res.status(400).json({ error: 'Course and title are required.' });
  }

  try {
    // Look up CourseID from CourseName
    const [courseRows] = await pool.query(
      'SELECT CourseID FROM Course WHERE CourseName = ? LIMIT 1',
      [course]
    );

    let courseId = null;
    if (courseRows.length > 0) {
      courseId = courseRows[0].CourseID;
    }

    const [result] = await pool.query(
      `INSERT INTO StudyGroup (GroupName, CourseID, CourseName)
       VALUES (?, ?, ?)`,
      [title, courseId, course]
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

// POST /api/study-groups/:id/join  { name }
app.post('/api/study-groups/:id/join', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body || {};

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  try {
    // 1) Ensure group exists
    const [groupRows] = await pool.query(
      'SELECT GroupID FROM StudyGroup WHERE GroupID = ?',
      [id]
    );
    if (groupRows.length === 0) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    // 2) Find or create user by first name (Point Park email)
    const firstName = name.split(' ')[0];
    let [users] = await pool.query(
      'SELECT UserID FROM User WHERE FirstName = ? LIMIT 1',
      [firstName]
    );

    let userId;
    if (users.length === 0) {
      const email = `${firstName.toLowerCase()}@pointpark.edu`;
      const [insertUser] = await pool.query(
        'INSERT INTO User (FirstName, LastName, Email, Role) VALUES (?, ?, ?, ?)',
        [firstName, '', email, 'Student']
      );
      userId = insertUser.insertId;
    } else {
      userId = users[0].UserID;
    }

    // 3) Check if already in this group
    const [existing] = await pool.query(
      'SELECT * FROM UserGroup WHERE UserID = ? AND GroupID = ?',
      [userId, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already in this group.' });
    }

    // 4) Insert into UserGroup
    await pool.query(
      'INSERT INTO UserGroup (UserID, GroupID) VALUES (?, ?)',
      [userId, id]
    );

    // (No Planner changes here – Planner use case belongs to someone else)
    res.json({ success: true, message: 'Joined group successfully.' });
  } catch (err) {
    console.error('❌ Error joining study group:', err);
    res.status(500).json({ error: 'Failed to join study group.', message: err.message });
  }
});

//
// ===== UC-3: Resources (Upload & Tag a Resource) =====
//
// Table: StudyMaterial(
//   MaterialID, Title, FilePath, UploadedBy, ApprovedBy, CourseID, Tags
// )
//
// Endpoints:
//   GET  /api/resources?course=CMPS480&search=video
//   POST /api/resources { title, fileUrl, tags, course, uploaderName }
//

// GET /api/resources
app.get('/api/resources', async (req, res) => {
  const { course, search } = req.query;

  try {
    let sql = `
      SELECT
        sm.MaterialID,
        sm.Title,
        sm.FilePath,
        sm.Tags,
        c.CourseName,
        u.FirstName AS UploadedFirstName,
        u.LastName  AS UploadedLastName
      FROM StudyMaterial sm
      LEFT JOIN Course c ON sm.CourseID = c.CourseID
      LEFT JOIN User u   ON sm.UploadedBy = u.UserID
      WHERE 1 = 1
    `;
    const params = [];

    if (course) {
      sql += ' AND c.CourseName = ?';
      params.push(course);
    }

    if (search) {
      sql += ' AND (sm.Title LIKE ? OR sm.Tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.CourseName, sm.Title';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching resources:', err);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
});

// POST /api/resources  { title, fileUrl, tags, course, uploaderName }
app.post('/api/resources', async (req, res) => {
  const { title, fileUrl, tags, course, uploaderName } = req.body || {};

  if (!title || !fileUrl || !course || !uploaderName) {
    return res.status(400).json({
      error: 'title, fileUrl, course, and uploaderName are required.'
    });
  }

  try {
    // 1) Find CourseID from CourseName
    const [courseRows] = await pool.query(
      'SELECT CourseID FROM Course WHERE CourseName = ? LIMIT 1',
      [course]
    );
    let courseId = null;
    if (courseRows.length > 0) {
      courseId = courseRows[0].CourseID;
    }

    // 2) Find or create uploader user (Point Park email)
    const uploaderFirst = uploaderName.split(' ')[0];
    let [users] = await pool.query(
      'SELECT UserID FROM User WHERE FirstName = ? LIMIT 1',
      [uploaderFirst]
    );

    let uploaderId;
    if (users.length === 0) {
      const email = `${uploaderFirst.toLowerCase()}@pointpark.edu`;
      const [insertUser] = await pool.query(
        'INSERT INTO User (FirstName, LastName, Email, Role) VALUES (?, ?, ?, ?)',
        [uploaderFirst, '', email, 'Student']
      );
      uploaderId = insertUser.insertId;
    } else {
      uploaderId = users[0].UserID;
    }

    // 3) Insert StudyMaterial row
    const [result] = await pool.query(
      `INSERT INTO StudyMaterial (Title, Tags, FilePath, UploadedBy, ApprovedBy, CourseID)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [title, tags || null, fileUrl, uploaderId, courseId]
    );

    const [rows] = await pool.query(
      `SELECT 
         MaterialID, Title, Tags, FilePath, CourseID
       FROM StudyMaterial
       WHERE MaterialID = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error uploading resource:', err);
    res.status(500).json({ error: 'Failed to upload resource.', message: err.message });
  }
});



//
// ===== UC-2: Q&A (Ethan) — JSON-backed prototype =====
//

// GET /api/courses  (built from StudyGroup.CourseName for now)
app.get('/api/courses', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT CourseName FROM StudyGroup');
    const courses = rows.map((r, idx) => {
      const name = r.CourseName;
      const match = String(name).match(/\d+/);
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


//
// ===== UC-4: Planner (Brandon) =====
//

// GET /api/planner
app.get('/api/assignments', async (req, res) => {
  
  const { email } = req.query;



  try {

    const [userRows] = await pool.query(
      'SELECT UserID FROM User WHERE Email = ? LIMIT 1',
      [email]
    );

    const sql = `
      SELECT
        AssignmentID AS id,
        Title,
        Notes,
        DueDate AS 'Due',
        Priority
      FROM Assignment
      WHERE UserID = ?  
      ORDER BY DueDate ASC, Priority ASC
    `;
    
    const [rows] = await pool.query(sql, [userId]);

    
    const assignments = rows.map(a => ({
      ...a,
      Due: a.Due instanceof Date ? a.Due.toISOString().split('T')[0] : (a.Due || null),
    }));

    res.json(assignments);
  } catch (err) {
    console.error('❌ Error fetching user assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments.', message: err.message });
  }
});

// POST /api/assignments  { email, title, notes, due, priority }
app.post('/api/assignments', async (req, res) => {
  
  const { email, title, notes, due, priority } = req.body || {};

    try {
  
    const [userRows] = await pool.query(
      'SELECT UserID FROM User WHERE Email = ? LIMIT 1',
      [email]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = userRows[0].UserID;

      const [result] = await pool.query(
      `INSERT INTO Assignment (UserID, Title, Notes, DueDate, Priority)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,        // Insert the looked-up UserID
        title,
        notes,
        due || null,   // Use null if 'due' is empty
        priority || null // Use null if 'priority' is empty
      ]
    );

    // 4. Select and format the new assignment for the response
    const [rows] = await pool.query(
      `SELECT
         AssignmentID AS id, Title, Notes, DueDate AS 'Due', Priority
       FROM Assignment
       WHERE AssignmentID = ?`,
      [result.insertId]
    );

    // Format the date for the response
    const newAssignment = {
      ...rows[0],
      // Correcting date formatting for the response
      Due: rows[0].Due instanceof Date ? rows[0].Due.toISOString().split('T')[0] : (rows[0].Due || null),
    };

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error('❌ Error creating assignment:', err);
    res.status(500).json({ error: 'Failed to create assignment.', message: err.message });
  }
});


// ----- Error handling -----
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled server error:', err);
  res.status(500).json({ error: 'Server error' });
});

// ----- Start -----
app.listen(PORT, () => {
  console.log(`✅ ASH API running on port ${PORT}`);
});
