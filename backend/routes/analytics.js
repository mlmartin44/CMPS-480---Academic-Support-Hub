const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Total Study Groups
router.get('/groups/count', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT COUNT(*) AS total FROM StudyGroup");
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Active users = users who posted in a group
router.get('/users/activity', async (req, res) => {
    try {
        const [active] = await db.query(`
            SELECT COUNT(DISTINCT userId) AS active
            FROM GroupPost
        `);

        const [total] = await db.query(`
            SELECT COUNT(*) AS total
            FROM User
        `);

        const activeUsers = active[0].active;
        const totalUsers = total[0].total;

        res.json({
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            activePercent: ((activeUsers / totalUsers) * 100).toFixed(1)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Posts per study group
router.get('/groups/posts', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT groupId, COUNT(*) AS postCount
            FROM GroupPost
            GROUP BY groupId
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
