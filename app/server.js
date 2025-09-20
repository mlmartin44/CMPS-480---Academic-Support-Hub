const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());


const DISPLAY_DIR = path.join(__dirname, "display");
app.use(express.static(DISPLAY_DIR));


app.get("/", (_req, res) => res.sendFile(path.join(DISPLAY_DIR, "home.html")));
app.get("/home.html", (_req, res) => res.sendFile(path.join(DISPLAY_DIR, "home.html")));
app.get("/qa.html",   (_req, res) => res.sendFile(path.join(DISPLAY_DIR, "qa.html")));

// --- APIs ---
const homeData = JSON.parse(fs.readFileSync(path.join(__dirname, "homeapi.json"), "utf8"));
let qaData     = JSON.parse(fs.readFileSync(path.join(__dirname, "qaapi.json"), "utf8"));
const qaFile   = path.join(__dirname, "qaapi.json");

app.get("/api/home", (_req, res) => res.json(homeData));

app.get("/api/questions", (req, res) => {
  const { course } = req.query;
  res.json(course ? qaData.filter(q => q.course === course) : qaData);
});

app.post("/api/questions", (req, res) => {
  const { course, title, body, author } = req.body || {};
  if (!course || !title || !body || !author)
    return res.status(400).json({ message: "course, title, body, author are required" });

  const newId = Math.max(0, ...qaData.map(q => Number(q.id) || 0)) + 1;
  const item = { id: newId, course, title, body, author, createdAt: new Date().toISOString().slice(0,10) };
  qaData.unshift(item);
  try { fs.writeFileSync(qaFile, JSON.stringify(qaData, null, 2)); } catch {}
  res.status(201).json({ message: "Question created", id: newId, item });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
