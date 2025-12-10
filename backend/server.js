// backend/server.js
// Academic Support Hub API — MySQL

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from './db.js';
import homeData from './homeapi.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;


app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (_req, res) =>
  res.json({ status: 'ok', service: 'ASH API (MySQL)' })
);

app.get('/health', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({ status: "ok", db: true, ts: rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", db: false, message: err.message });
  }
});


app.get('/api/home', (_req, res) => {
  res.json(homeData);
});


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
      WHERE 1=1
    `;

    const params = [];
    if (course) {
      sql += " AND sg.CourseName LIKE ?";
      params.push(`%${course}%`);
    }

    sql += " GROUP BY sg.GroupID ORDER BY sg.CourseName, sg.GroupName";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch study groups", message: err.message });
  }
});

app.post('/api/study-groups', async (req, res) => {
  const { course, title } = req.body;

  if (!course || !title) {
    return res.status(400).json({ error: "Course and title are required." });
  }

  try {
    const [cRows] = await pool.query(
      "SELECT CourseID FROM Course WHERE CourseName = ? LIMIT 1",
      [course]
    );

    const courseId = cRows.length ? cRows[0].CourseID : null;

    const [insert] = await pool.query(
      "INSERT INTO StudyGroup (GroupName, CourseID, CourseName) VALUES (?, ?, ?)",
      [title, courseId, course]
    );

    const [rows] = await pool.query(
      "SELECT GroupID, GroupName, CourseName FROM StudyGroup WHERE GroupID = ?",
      [insert.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group", message: err.message });
  }
});

app.post('/api/study-groups/:id/join', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name required." });

  try {
    const [gRows] = await pool.query(
      "SELECT GroupID FROM StudyGroup WHERE GroupID = ?",
      [id]
    );
    if (!gRows.length) return res.status(404).json({ error: "Group not found" });

    const first = name.split(" ")[0];

    let [uRows] = await pool.query(
      "SELECT UserID FROM User WHERE FirstName = ? LIMIT 1",
      [first]
    );

    let userId;
    if (!uRows.length) {
      const email = `${first.toLowerCase()}@pointpark.edu`;
      const [newUser] = await pool.query(
        "INSERT INTO User (FirstName, LastName, Email, Role) VALUES (?, ?, ?, ?)",
        [first, "", email, "Student"]
      );
      userId = newUser.insertId;
    } else {
      userId = uRows[0].UserID;
    }

    const [check] = await pool.query(
      "SELECT * FROM UserGroup WHERE UserID = ? AND GroupID = ?",
      [userId, id]
    );
    if (check.length) return res.status(400).json({ error: "Already joined" });

    await pool.query(
      "INSERT INTO UserGroup (UserID, GroupID) VALUES (?, ?)",
      [userId, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Join failed", message: err.message });
  }
});


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
        u.LastName AS UploadedLastName
      FROM StudyMaterial sm
      LEFT JOIN Course c ON sm.CourseID = c.CourseID
      LEFT JOIN User u ON sm.UploadedBy = u.UserID
      WHERE 1=1
    `;
    const params = [];

    if (course) {
      sql += " AND c.CourseName = ?";
      params.push(course);
    }

    if (search) {
      sql += " AND (sm.Title LIKE ? OR sm.Tags LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY c.CourseName, sm.Title";

    const [rows] = await pool.query(sql, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load resources", message: err.message });
  }
});

app.post('/api/resources', async (req, res) => {
  const { title, fileUrl, tags, course, uploaderName } = req.body;

  if (!title || !fileUrl || !course || !uploaderName) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const [cRows] = await pool.query(
      "SELECT CourseID FROM Course WHERE CourseName = ? LIMIT 1",
      [course]
    );

    const courseId = cRows.length ? cRows[0].CourseID : null;

    const first = uploaderName.split(" ")[0];

    let [uRows] = await pool.query(
      "SELECT UserID FROM User WHERE FirstName = ? LIMIT 1",
      [first]
    );

    let uploaderId;
    if (!uRows.length) {
      const email = `${first.toLowerCase()}@pointpark.edu`;
      const [newUser] = await pool.query(
        "INSERT INTO User (FirstName, LastName, Email, Role) VALUES (?, ?, ?, ?)",
        [first, "", email, "Student"]
      );
      uploaderId = newUser.insertId;
    } else {
      uploaderId = uRows[0].UserID;
    }

    const [insert] = await pool.query(
      `INSERT INTO StudyMaterial (Title, Tags, FilePath, UploadedBy, ApprovedBy, CourseID)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [title, tags || null, fileUrl, uploaderId, courseId]
    );

    const [rows] = await pool.query(
      "SELECT MaterialID, Title, Tags, FilePath FROM StudyMaterial WHERE MaterialID = ?",
      [insert.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed upload", message: err.message });
  }
});


app.get('/api/courses', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT CourseName FROM StudyGroup");
    const out = rows.map((r, idx) => {
      const match = String(r.CourseName).match(/\d+/);
      return {
        CourseID: match ? Number(match[0]) : idx + 1,
        CourseName: r.CourseName
      };
    });
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.get('/api/questions', async (req, res) => {
  const { courseId } = req.query;

  try {
    let sql = `
      SELECT
        q.QuestionID AS id,
        q.Content AS content,
        q.PostedBy AS postedBy,
        q.CourseID AS courseId,
        u.FirstName AS author,
        NULL AS createdAt
      FROM Question q
      LEFT JOIN User u ON q.PostedBy = u.UserID
      WHERE 1=1
    `;
    const params = [];

    if (courseId) {
      sql += " AND q.CourseID = ?";
      params.push(Number(courseId));
    }

    sql += " ORDER BY q.QuestionID DESC";

    const [rows] = await pool.query(sql, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/questions', async (req, res) => {
  const { courseId, author, content } = req.body;

  if (!author || !content) {
    return res.status(400).json({ message: "Author and content required." });
  }

  try {
    const first = author.split(" ")[0];

    let [uRows] = await pool.query(
      "SELECT UserID FROM User WHERE FirstName = ? LIMIT 1",
      [first]
    );

    let userId;
    if (!uRows.length) {
      const email = `${first.toLowerCase()}@pointpark.edu`;
      const [newUser] = await pool.query(
        "INSERT INTO User (FirstName, LastName, Email, Role) VALUES (?, ?, ?, ?)",
        [first, "", email, "Student"]
      );
      userId = newUser.insertId;
    } else {
      userId = uRows[0].UserID;
    }

    
    let courseIdDb = null;
    if (courseId) {
      const cid = Number(courseId);
      const [cRows] = await pool.query(
        "SELECT CourseID FROM Course WHERE CourseID = ? LIMIT 1",
        [cid]
      );
      if (cRows.length) courseIdDb = cid;
    }

    const [insert] = await pool.query(
      "INSERT INTO Question (Content, PostedBy, CourseID) VALUES (?, ?, ?)",
      [content, userId, courseIdDb]
    );

    const [rows] = await pool.query(
      `SELECT 
         q.QuestionID AS id,
         q.Content AS content,
         q.PostedBy AS postedBy,
         q.CourseID AS courseId,
         u.FirstName AS author,
         NULL AS createdAt
       FROM Question q
       LEFT JOIN User u ON q.PostedBy = u.UserID
       WHERE q.QuestionID = ?`,
      [insert.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.get('/api/assignments', async (req, res) => {
  const { email } = req.query;

  if (!email) return res.status(400).json({ error: "Email required." });

  try {
    const [uRows] = await pool.query(
      "SELECT UserID FROM User WHERE Email = ? LIMIT 1",
      [email]
    );

    if (!uRows.length) {
      return res.status(404).json({ error: "User not found." });
    }

    const userId = uRows[0].UserID;

    const sql = `
      SELECT 
        AssignmentID AS id,
        Title,
        Notes,
        DueDate AS Due,
        Priority
      FROM Assignment
      WHERE UserID = ?
      ORDER BY DueDate ASC, Priority ASC
    `;

    const [rows] = await pool.query(sql, [userId]);

    const formatted = rows.map(r => ({
      ...r,
      Due: r.Due instanceof Date ? r.Due.toISOString().split("T")[0] : r.Due
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments', async (req, res) => {
  const { email, title, notes, due, priority } = req.body;

  if (!email || !title) {
    return res.status(400).json({ error: "Email and title required." });
  }

  try {
    const [uRows] = await pool.query(
      "SELECT UserID FROM User WHERE Email = ? LIMIT 1",
      [email]
    );

    if (!uRows.length) {
      return res.status(404).json({ error: "User not found." });
    }

    const userId = uRows[0].UserID;

    const [insert] = await pool.query(
      "INSERT INTO Assignment (UserID, Title, Notes, DueDate, Priority) VALUES (?, ?, ?, ?, ?)",
      [userId, title, notes || null, due || null, priority || null]
    );

    const [rows] = await pool.query(
      "SELECT AssignmentID AS id, Title, Notes, DueDate AS Due, Priority FROM Assignment WHERE AssignmentID = ?",
      [insert.insertId]
    );

    const result = {
      ...rows[0],
      Due: rows[0].Due instanceof Date ? rows[0].Due.toISOString().split("T")[0] : rows[0].Due
    };

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((_req, res) => res.status(404).json({ error: "Not Found" }));


app.listen(PORT, () => {
  console.log(`✅ ASH API running on port ${PORT}`);
});
