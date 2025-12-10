const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();
const { pool } = require('./db');
const path = require('path');
const multer = require('multer');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File uploads folder
const uploadFolder = path.join(__dirname, 'public', 'uploads');
const storage = multer.diskStorage({
  destination: uploadFolder,
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve home.html at root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', db: true, ts: rows[0].now });
  } catch (err) {
    console.error('❌ Database error:', err);
    res.status(500).json({ status: 'error', db: false, message: err.message });
  }
});

/* ===============================
   🟩 Study Materials / Upload
   =============================== */

// Get all materials (with uploader name)
app.get('/api/material', async (req, res) => {
  const { tag, course } = req.query;

  let sql = `
    SELECT 
      m.MaterialID,
      m.Title,
      m.Tags,
      m.FilePath,
      m.CourseID,
      m.UploadedBy,
      CONCAT(u.FirstName, ' ', u.LastName) AS UploaderName
    FROM StudyMaterial m
    LEFT JOIN User u ON m.UploadedBy = u.UserID
    WHERE 1 = 1
  `;

  const params = [];

  if (tag) {
    sql += " AND m.Tags LIKE ?";
    params.push(`%${tag}%`);
  }

  if (course) {
    sql += " AND m.CourseID = ?";
    params.push(course);
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching materials:", err);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});
//Upload material with user auto-assignment (file OR link)
app.post('/api/material/upload', upload.single('file'), async (req, res) => {
  const { title, tags, firstName, lastName, email, courseID, linkUrl } = req.body;

  // Require file or link
  if (!req.file && !linkUrl) {
    return res.status(400).json({ error: "File or link is required." });
  }

  // CourseID is now a string, so do NOT convert it to a number.
  if (!courseID || typeof courseID !== "string" || courseID.trim() === "") {
    return res.status(400).json({ error: "CourseID must be a course code (e.g., CMPS480)." });
  }

  try {
    // Check if user exists
    let [users] = await pool.query("SELECT UserID FROM User WHERE Email = ?", [email]);
    let userId;

    if (users.length === 0) {
      const [result] = await pool.query(
        "INSERT INTO User (FirstName, LastName, Email, Role) VALUES (?, ?, ?, 'Student')",
        [firstName, lastName, email]
      );
      userId = result.insertId;
    } else {
      userId = users[0].UserID;
    }

    // File or link
    let filePath = req.file ? `/uploads/${req.file.filename}` : linkUrl;

    const [result] = await pool.query(
      `INSERT INTO StudyMaterial (Title, Tags, FilePath, UploadedBy, ApprovedBy, CourseID)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [title, tags, filePath, userId, courseID]
    );

    const [material] = await pool.query(
      "SELECT * FROM StudyMaterial WHERE MaterialID = ?",
      [result.insertId]
    );

    res.status(201).json(material[0]);
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Failed to upload material." });
  }
});

/* ============================
   🟦 Study Groups
   ============================ */

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
    res.status(500).json({ error: 'Failed to fetch study groups.' });
  }
});

// Create group
app.post('/api/study-groups', async (req, res) => {
  const { course, title } = req.body || {};
  if (!course || !title) return res.status(400).json({ error: 'Course and title are required.' });

  try {
    const [result] = await pool.query(
      'INSERT INTO StudyGroup (GroupName, CourseName) VALUES (?, ?)',
      [title, course]
    );

    const [rows] = await pool.query(
      'SELECT GroupID, GroupName, CourseName FROM StudyGroup WHERE GroupID = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error creating it:', err);
    res.status(500).json({ error: 'Failed to create study group.' });
  }
});

// Join group
app.post('/api/study-groups/:id/join', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT GroupID FROM StudyGroup WHERE GroupID = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Group not found' });
    res.json({ status: 'joined', groupId: Number(id) });
  } catch (err) {
    console.error('❌ Error joining:', err);
    res.status(500).json({ error: 'Failed to join study group.' });
  }
});

/* ============================
   SPA fallback
   ============================ */
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ASH API running on port ${PORT}`);
});

