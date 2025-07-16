import express from 'express';
import mongoose from 'mongoose';
import PomodoroSession from '../models/Pomodoro.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Check if database is available
const isDatabaseAvailable = () => {
  return mongoose.connection.readyState === 1 && mongoose.connection.db;
};

// Get pomodoro stats for a specific date
router.get('/stats', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot fetch pomodoro stats without database connection'
      });
    }

    const { date } = req.query;
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const sessions = await PomodoroSession.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
      completed: true
    });

    const stats = {
      userId: req.user._id,
      date: startDate.toISOString().split('T')[0],
      completedSessions: sessions.length,
      totalFocusTime: sessions.reduce((total, session) => total + session.focusTime, 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching pomodoro stats:', error);
    res.status(500).json({ 
      message: 'Error fetching pomodoro stats',
      error: error.message 
    });
  }
});

// Get all pomodoro sessions for a user
router.get('/sessions', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot fetch pomodoro sessions without database connection'
      });
    }

    const { startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sessions = await PomodoroSession.find(filter).sort({ date: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    res.status(500).json({ 
      message: 'Error fetching pomodoro sessions',
      error: error.message 
    });
  }
});

// Create a new pomodoro session
router.post('/sessions', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot create pomodoro session without database connection'
      });
    }

    const { date, focusTime, notes } = req.body;
    
    const sessionData = {
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      focusTime: focusTime || 25,
      notes: notes || '',
      endTime: new Date()
    };

    const session = new PomodoroSession(sessionData);
    await session.save();
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating pomodoro session:', error);
    res.status(400).json({ 
      message: 'Error creating pomodoro session',
      error: error.message 
    });
  }
});

router.post('/clients', authenticate, async (req, res) => {
  const client = new ClientModel({ ...req.body, userId: req.user._id });
  await client.save();
  res.status(201).json(client);
});

// GET /clients
router.get('/clients', authenticate, async (req, res) => {
  const clients = await ClientModel.find({ userId: req.user._id });
  res.json(clients);
});

// Get pomodoro analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot fetch pomodoro analytics without database connection'
      });
    }

    const { period } = req.query;
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    const sessions = await PomodoroSession.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now },
      completed: true
    }).sort({ date: 1 });

    // Group sessions by date
    const sessionsByDate = {};
    sessions.forEach(session => {
      const dateStr = session.date.toISOString().split('T')[0];
      if (!sessionsByDate[dateStr]) {
        sessionsByDate[dateStr] = {
          date: dateStr,
          count: 0,
          totalFocusTime: 0
        };
      }
      sessionsByDate[dateStr].count += 1;
      sessionsByDate[dateStr].totalFocusTime += session.focusTime;
    });

    // Calculate overall stats
    const totalSessions = sessions.length;
    const totalFocusTime = sessions.reduce((total, session) => total + session.focusTime, 0);
    const dailyAverage = totalSessions / (Object.keys(sessionsByDate).length || 1);

    res.json({
      totalSessions,
      totalFocusTime,
      dailyAverage,
      dailyData: Object.values(sessionsByDate)
    });
  } catch (error) {
    console.error('Error fetching pomodoro analytics:', error);
    res.status(500).json({ 
      message: 'Error fetching pomodoro analytics',
      error: error.message 
    });
  }
});

export default router;