
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

const groups = [
  { _id: 'sg_001', course: 'CMPS262', title: 'Algorithms Exam Prep', tags: ['graphs','sorting'], schedule: { day: 'Tue', time: '18:00', tz: 'America/New_York' }, maxSize: 8, membersCount: 5, isOpen: true },
  { _id: 'sg_002', course: 'CMPS162', title: 'Intro to Programming Study Hall', tags: ['loops','arrays'], schedule: { day: 'Thu', time: '19:00', tz: 'America/New_York' }, maxSize: 10, membersCount: 10, isOpen: false }
];

app.get('/', (_req, res) => res.json({ status: 'ok', service: 'ASH API Week 2' }));

app.get('/api/study-groups', (req, res) => {
  const { course, tag } = req.query;
  let results = groups;
  if (course) results = results.filter(g => g.course.toLowerCase() == String(course).toLowerCase());
  if (tag) results = results.filter(g => (g.tags||[]).map(t => t.toLowerCase()).includes(String(tag).toLowerCase()));
  res.json(results);
});

app.post('/api/study-groups/:id/join', (req, res) => {
  const { id } = req.params;
  const group = groups.find(g => g._id === id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.isOpen || group.membersCount >= group.maxSize) return res.status(409).json({ status: 'waitlisted', groupId: id });
  group.membersCount += 1;
  if (group.membersCount >= group.maxSize) group.isOpen = false;
  res.json({ status: 'joined', groupId: id });
});

app.listen(PORT, () => console.log(`✅ ASH API running on port ${PORT}`));
