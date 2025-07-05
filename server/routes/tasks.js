import express from 'express';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

const isDatabaseAvailable = () => mongoose.connection.readyState === 1;

// Normalize task to include `.id` instead of `._id`
const normalizeTask = (task) => {
  const obj = task.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Get all tasks
router.get('/', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      console.log('❌ Database not available for tasks');
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch tasks without database connection'
      });
    }

    console.log('📋 Fetching tasks for user:', req.user.email, '(ID:', req.user._id, ')');
    const { status, priority } = req.query;
    const filter = { userId: req.user._id }; // Ensure user-specific filtering
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    console.log(`✅ Found ${tasks.length} tasks for user ${req.user.email}`);
    res.json(tasks.map(normalizeTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      message: 'Error fetching tasks',
      error: error.message 
    });
  }
});

// Get single task
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable())
      return res.status(503).json({ message: 'Database not available' });

    console.log('📋 Fetching task', req.params.id, 'for user:', req.user.email);
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      console.log('❌ Task not found or access denied');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('✅ Task found for user');
    res.json(normalizeTask(task));
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Error fetching task' });
  }
});

// Create new task
router.post('/', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        message: 'Database not available - running in demo mode',
        error: 'Cannot create tasks without database connection'
      });
    }

    console.log('📋 Creating task for user:', req.user.email, '(ID:', req.user._id, ')');
    const taskData = {
      ...req.body,
      userId: req.user._id, // Ensure user ID is set
      status: req.body.status || 'pending',
      attachments: req.body.attachments || []
    };

    const task = new Task(taskData);
    await task.save();
    console.log('✅ Task created successfully for user:', req.user.email);

    res.status(201).json(normalizeTask(task));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        message: 'Database not available - running in demo mode',
        error: 'Cannot update tasks without database connection'
      });
    }

    console.log('📋 Updating task', req.params.id, 'for user:', req.user.email);
    const updateData = { ...req.body };

    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // Ensure user owns the task
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      console.log('❌ Task not found or access denied');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('✅ Task updated successfully');
    res.json(normalizeTask(task));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        message: 'Database not available - running in demo mode',
        error: 'Cannot delete tasks without database connection'
      });
    }

    console.log('📋 Deleting task', req.params.id, 'for user:', req.user.email);
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      console.log('❌ Task not found or access denied');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('✅ Task deleted successfully');
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

// Toggle task status
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        message: 'Database not available - running in demo mode',
        error: 'Cannot toggle task status without database connection'
      });
    }

    console.log('📋 Toggling task', req.params.id, 'for user:', req.user.email);
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      console.log('❌ Task not found or access denied');
      return res.status(404).json({ message: 'Task not found' });
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updateData = {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : null
    };

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
    console.log('✅ Task status toggled successfully');
    res.json(normalizeTask(updatedTask));
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(400).json({ message: 'Error toggling task', error: error.message });
  }
});

export default router;