import express from 'express';
const router = express.Router();

let resources = [
  {
    _id: 'res_001',
    title: 'Graph Theory Notes',
    course: 'CMPS262',
    tags: ['graphs', 'exam prep'],
    uploadedBy: 'student1',
    createdAt: new Date().toISOString()
  }
];

router.get('/', (req, res) => {
  const { course, tag } = req.query;
  let results = resources;

  if (course) {
    results = results.filter(r => r.course.toLowerCase() === course.toLowerCase());
  }
  if (tag) {
    results = results.filter(r => (r.tags || []).map(t => t.toLowerCase()).includes(tag.toLowerCase()));
  }

  res.json(results);
});

router.post('/', (req, res) => {
  const { title, course, tags, uploadedBy } = req.body;
  if (!title || !course || !uploadedBy) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newResource = {
    _id: `res_${resources.length + 1}`.padStart(3, '0'),
    title,
    course,
    tags: tags || [],
    uploadedBy,
    createdAt: new Date().toISOString()
  };

  resources.push(newResource);
  res.status(201).json(newResource);
});

export default router;
