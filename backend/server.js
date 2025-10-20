// backend/server.js
// Notes for teammates: see "TODO" blocks below for UC-2/3/4 endpoints.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: '*' })); 
app.use(express.json());


// Health / Root

app.get('/', (_req, res) => res.json({ status: 'ok', service: 'ASH API Week 3' }));
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', project: 'Academic Support Hub', ts: new Date().toISOString() })
);


// UC-1: Study Groups (Mariah)
// Endpoints:
//   GET    /api/study-groups        (optional filters: course, tag)
//   POST   /api/study-groups        (create)
//   POST   /api/study-groups/:id/join

const groups = [
  {
    _id: 'sg_001',
    course: 'CMPS262',
    title: 'Algorithms Exam Prep',
    tags: ['graphs', 'sorting'],
    schedule: { day: 'Tue', time: '18:00', tz: 'America/New_York' },
    where: 'Library 201',
    maxSize: 8,
    membersCount: 5,
    isOpen: true
  },
  {
    _id: 'sg_002',
    course: 'CMPS162',
    title: 'Intro to Programming Study Hall',
    tags: ['loops', 'arrays'],
    schedule: { day: 'Thu', time: '19:00', tz: 'America/New_York' },
    where: 'Zoom',
    maxSize: 10,
    membersCount: 10,
    isOpen: false
  }
];

// GET /api/study-groups?course=&tag=
app.get('/api/study-groups', (req, res) => {
  const { course, tag } = req.query;
  let results = groups;

  if (course) {
    const c = String(course).toLowerCase();
    results = results.filter(g => (g.course || '').toLowerCase() === c);
  }
  if (tag) {
    const t = String(tag).toLowerCase();
    results = results.filter(g => (g.tags || []).map(x => String(x).toLowerCase()).includes(t));
  }

  res.json(results);
});

// POST /api/study-groups { course, title, when, where, maxSize }
app.post('/api/study-groups', (req, res) => {
  const { course, title, when, where, maxSize } = req.body || {};
  if (!course || !title) {
    return res.status(400).json({ error: 'Course and title are required.' });
  }

  const newGroup = {
    _id: `sg_${Date.now()}`,
    course,
    title,
          // A simple string "when" or a structured schedule object can be used later.
    schedule: typeof when === 'object' ? when : (when ? { text: String(when) } : null),
    where: where || null,
    maxSize: Number(maxSize) > 0 ? Number(maxSize) : 5,
    membersCount: 0,
    isOpen: true,
    tags: []
  };

  groups.push(newGroup);
  res.status(201).json(newGroup);
});

// POST /api/study-groups/:id/join { name }
app.post('/api/study-groups/:id/join', (req, res) => {
  const { id } = req.params;
  const group = groups.find(g => g._id === id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  if (!group.isOpen || group.membersCount >= group.maxSize) {
    return res.status(409).json({ status: 'waitlisted', groupId: id });
  }

  group.membersCount += 1;
  if (group.membersCount >= group.maxSize) group.isOpen = false;

  res.json({ status: 'joined', groupId: id });
});



// Placeholders for other use cases 


// TODO (UC-2: Q&A - Post a Question & Accept an Answer)


// TODO (UC-3: Resources - Upload & Tag a Resource)


// TODO (UC-4: Planner - Assignment Planner with Calendar Sync)



// 404 + Error handling

app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => console.log(`✅ ASH API (Week 3) running on port ${PORT}`));
