const express = require('express');
const app = express();

console.log('Booting Academic Support Hub v0.1…');

// Root route
app.get('/', (_req, res) => {
  res.send('📘 Academic Support Hub — v0.1 (Module 1)');
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', project: 'Academic Support Hub', ts: new Date().toISOString() });
});

// Placeholder study groups
app.get('/study-groups', (_req, res) => {
  res.json([
    { id: 1, course: "CMPS 262", name: "Study Group A (placeholder)" },
    { id: 2, course: "Econ 101", name: "Study Group B (placeholder)" }
  ]);
});

// Placeholder resources
app.get('/resources', (_req, res) => {
  res.json([{ id: 1, title: "Sample Study Guide", uploadedBy: "Professor X" }]);
});

// Placeholder planner tasks
app.get('/planner', (_req, res) => {
  res.json([
    { id: 1, task: "Finish Module 1 submission", due: "2025-08-31" },
    { id: 2, task: "Add BMC details", due: "2025-09-05" }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
