import express from 'express';
import Goal from '../models/Goal.js';
import { authenticate } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Check if database is available
const isDatabaseAvailable = () => {
  return mongoose.connection.readyState === 1;
};

// Get all goals for user
router.get('/', authenticate, async (req, res) => {
  try {
    // Check database connection
    if (!isDatabaseAvailable()) {
      console.log('Database not available, returning empty array for goals');
      return res.json([]);
    }

    const { status, priority, category } = req.query;
    const filter = { userId: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json(goals || []);
  } catch (error) {
    console.error('Error fetching goals:', error);
    // Return empty array on any error to prevent frontend crashes
    res.json([]);
  }
});

// Get single goal
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ message: 'Error fetching goal' });
  }
});

// Create new goal
router.post('/', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot create goals without database connection'
      });
    }

    const goalData = {
      ...req.body,
      userId: req.user._id,
      progress: req.body.progress || 0,
      status: req.body.status || 'active'
    };

    const goal = new Goal(goalData);
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(400).json({ 
      message: 'Error creating goal',
      error: error.message 
    });
  }
});

// Update goal
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot update goals without database connection'
      });
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(400).json({ 
      message: 'Error updating goal',
      error: error.message 
    });
  }
});

// Delete goal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot delete goals without database connection'
      });
    }

    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ 
      message: 'Error deleting goal',
      error: error.message 
    });
  }
});

// Update goal progress
router.patch('/:id/progress', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available - running in demo mode',
        error: 'Cannot update goal progress without database connection'
      });
    }

    const { progress } = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { progress },
      { new: true }
    );
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(400).json({ 
      message: 'Error updating goal progress',
      error: error.message 
    });
  }
});

export default router;