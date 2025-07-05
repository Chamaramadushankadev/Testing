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
    if (!isDatabaseAvailable()) return res.json([]);

    const { status, priority } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    res.json(tasks.map(normalizeTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.json([]);
  }
});

// Get single task
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable())
      return res.status(503).json({ message: 'Database not available' });

    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

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

    const taskData = {
      ...req.body,
      userId: req.user._id,
      status: req.body.status || 'pending',
      attachments: req.body.attachments || []
    };

    const task = new Task(taskData);
    await task.save();

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

    const updateData = { ...req.body };

    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: 'Task not found' });

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

    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

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

    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updateData = {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : null
    };

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(normalizeTask(updatedTask));
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(400).json({ message: 'Error toggling task', error: error.message });
  }
});

export default router;
