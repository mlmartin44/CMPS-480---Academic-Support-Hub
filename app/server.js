const express = require("express");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());


const DISPLAY_DIR = path.join(__dirname, "display");
app.use(express.static(DISPLAY_DIR));

app.get("/", (_req, res) => res.sendFile(path.join(DISPLAY_DIR, "home.html")));
app.get("/home.html", (_req, res) => res.sendFile(path.join(DISPLAY_DIR, "home.html")));
app.get("/qa.html",   (_req, res) => res.sendFile(path.join(DISPLAY_DIR, "qa.html")));


app.get("/api/home", (_req, res) => {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "homeapi.json"), "utf8")
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ---------- database (MySQL) ---------- */
const pool = mysql.createPool({
  host: process.env.ASH_DB_HOST || "db.it.pointpark.edu",
  user: process.env.ASH_DB_USER || "ash",
  password: process.env.ASH_DB_PASSWORD || "P9fhABtRJlBvD74Z",
  database: process.env.ASH_DB_NAME || "ash",
  port: Number(process.env.ASH_DB_PORT || 3306),
  connectionLimit: 10,
  waitForConnections: true,
  namedPlaceholders: true,
  connectTimeout: 8000
});

async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}


async function resolveAuthorId({ authorId, author }) {
  
  if (Number.isFinite(Number(authorId))) return Number(authorId);

  
  if (author && author.trim()) {
    const [first, ...rest] = author.trim().split(/\s+/);
    const last = rest.join(" ");

    if (first && last) {
      const r = await query(
        `SELECT UserID FROM User WHERE FirstName = :first AND LastName = :last LIMIT 1`,
        { first, last }
      );
      if (r.length) return r[0].UserID;
    }

    const r2 = await query(
      `SELECT UserID FROM User WHERE Email = :email LIMIT 1`,
      { email: author }
    );
    if (r2.length) return r2[0].UserID;
  }

  throw new Error(
    "authorId required (PostedBy is a UserID). Provide numeric authorId or a known name/email."
  );
}

async function resolveCourseIdFromString(course) {
  if (!course) return null;

  const byName = await query(
    `SELECT CourseID FROM Course WHERE CourseName = :course LIMIT 1`,
    { course }
  );
  if (byName.length) return byName[0].CourseID;

  if (/^\d+$/.test(String(course))) return Number(course);

  return null;
}


app.get("/api/courses", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    const rows = q
      ? await query(
          `SELECT CourseID, CourseName, Major
             FROM Course
            WHERE CourseName LIKE :like OR Major LIKE :like
            ORDER BY CourseName`,
          { like: `%${q}%` }
        )
      : await query(
          `SELECT CourseID, CourseName, Major
             FROM Course
            ORDER BY CourseName`
        );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


app.get("/api/study-groups", async (req, res) => {
  const courseId = Number(req.query.courseId || 0);
  try {
    const rows = courseId
      ? await query(
          `SELECT GroupID, GroupName, CourseID
             FROM StudyGroup
            WHERE CourseID = :courseId
            ORDER BY GroupName`,
          { courseId }
        )
      : await query(
          `SELECT GroupID, GroupName, CourseID
             FROM StudyGroup
            ORDER BY GroupName`
        );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get("/api/questions", async (req, res) => {
  const courseIdQ = req.query.courseId ? Number(req.query.courseId) : null;
  const courseStr = (req.query.course || "").trim();

  try {
    const courseId =
      Number.isFinite(courseIdQ) ? courseIdQ : await resolveCourseIdFromString(courseStr);

    const rows = await query(
      `SELECT
         q.QuestionID AS id,
         q.CourseID   AS courseId,
         q.Content    AS content,
         q.PostedBy   AS authorId,
         COALESCE(CONCAT(u.FirstName, ' ', u.LastName), u.Email, CONCAT('User#', u.UserID)) AS authorName
       FROM Question q
       LEFT JOIN User u ON q.PostedBy = u.UserID
       ${courseId ? "WHERE q.CourseID = :courseId" : ""}
       ORDER BY q.QuestionID DESC`,
      courseId ? { courseId } : {}
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


app.post("/api/questions", async (req, res) => {
  const { course, courseId: rawCourseId, author, authorId: rawAuthorId, content } = req.body || {};
  if (!content) return res.status(400).json({ message: "content is required" });

  try {
    const courseId =
      Number.isFinite(Number(rawCourseId))
        ? Number(rawCourseId)
        : await resolveCourseIdFromString(course);

    const postedBy = await resolveAuthorId({ authorId: rawAuthorId, author });

    const [{ maxId }] = await query(
      `SELECT COALESCE(MAX(QuestionID), 0) + 1 AS maxId FROM Question`
    );
    const nextId = maxId;

    await query(
      `INSERT INTO Question (QuestionID, Content, PostedBy, CourseID)
       VALUES (:id, :content, :postedBy, :courseId)`,
      { id: nextId, content, postedBy, courseId: courseId ?? null }
    );

    const [item] = await query(
      `SELECT
         q.QuestionID AS id,
         q.CourseID   AS courseId,
         q.Content    AS content,
         q.PostedBy   AS authorId,
         COALESCE(CONCAT(u.FirstName, ' ', u.LastName), u.Email, CONCAT('User#', u.UserID)) AS authorName
       FROM Question q
       LEFT JOIN User u ON q.PostedBy = u.UserID
       WHERE q.QuestionID = :id`,
      { id: nextId }
    );

    res.status(201).json({ message: "Question created", id: nextId, item });
  } catch (e) {
    const code = /required/.test(String(e.message)) ? 400 : 500;
    res.status(code).json({ message: e.message });
  }
});


app.get("/api/users", async (_req, res) => {
  try {
    const rows = await query(
      `SELECT UserID AS id, FirstName, LastName, Email FROM User ORDER BY UserID ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


app.get("/api/debug/db", async (_req, res) => {
  try {
    const [db] = await query("SELECT DATABASE() AS db");
    const tables = await query("SHOW TABLES");
    const tnames = tables.map(t => Object.values(t)[0]);
    const counts = {};
    for (const t of tnames) {
      try {
        const r = await query(`SELECT COUNT(*) AS n FROM ${t}`);
        counts[t] = r[0].n;
      } catch {
        counts[t] = "n/a";
      }
    }
    res.json({ database: db.db, tables: tnames, counts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


app.post("/api/seed-minimal", async (_req, res) => {
  try {
    await query(
      `INSERT INTO Course (CourseID, CourseName, Major) VALUES
       (201,'CMPS 201','CS'),
       (361,'CMPS 361','CS'),
       (480,'CMPS 480','CS')
       ON DUPLICATE KEY UPDATE CourseName=VALUES(CourseName), Major=VALUES(Major)`
    );
    await query(
      `INSERT INTO User (UserID, FirstName, LastName, Email, Role)
       VALUES (1,'Ethan','Vanscoy','ethan@example.com','Student')
       ON DUPLICATE KEY UPDATE FirstName=VALUES(FirstName), LastName=VALUES(LastName), Email=VALUES(Email), Role=VALUES(Role)`
    );
    res.json({ ok: true, message: "Seeded Courses (201,361,480) and User(UserID=1)" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});


const PORT = Number(process.env.PORT || 5005);
const HOST = process.env.HOST || "0.0.0.0"; 

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
