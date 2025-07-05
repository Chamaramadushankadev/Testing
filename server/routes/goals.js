import express from 'express';
import Goal from '../models/Goal.js';
import { authenticate } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Check if database is available
const isDatabaseAvailable = () => {
  return mongoose.connection.readyState === 1 && mongoose.connection.db;
};

// Get all goals for user
router.get('/', authenticate, async (req, res) => {
  try {
    // Check database connection
    if (!isDatabaseAvailable()) {
      console.log('❌ Database not available for goals');
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch goals without database connection'
      });
    }

    console.log('📊 Fetching goals for user:', req.user.email, '(ID:', req.user._id, ')');
    const { status, priority, category } = req.query;
    const filter = { userId: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    console.log(`✅ Found ${goals.length} goals for user ${req.user.email}`);
    res.json(goals || []);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ 
      message: 'Error fetching goals',
      error: error.message 
    });
  }
});

// Get single goal
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    console.log('📊 Fetching goal', req.params.id, 'for user:', req.user.email);
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      console.log('❌ Goal not found or access denied');
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.log('✅ Goal found for user');
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

    console.log('📊 Creating goal for user:', req.user.email, '(ID:', req.user._id, ')');
    const goalData = {
      ...req.body,
      userId: req.user._id, // Ensure user ID is set
      progress: req.body.progress || 0,
      status: req.body.status || 'active'
    };

    const goal = new Goal(goalData);
    await goal.save();
    console.log('✅ Goal created successfully for user:', req.user.email);
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

    console.log('📊 Updating goal', req.params.id, 'for user:', req.user.email);
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // Ensure user owns the goal
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) {
      console.log('❌ Goal not found or access denied');
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.log('✅ Goal updated successfully');
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

    console.log('📊 Deleting goal', req.params.id, 'for user:', req.user.email);
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      console.log('❌ Goal not found or access denied');
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.log('✅ Goal deleted successfully');
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

    console.log('📊 Updating goal progress', req.params.id, 'for user:', req.user.email);
    const { progress } = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // Ensure user owns the goal
      { progress },
      { new: true }
    );
    if (!goal) {
      console.log('❌ Goal not found or access denied');
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.log('✅ Goal progress updated successfully');
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