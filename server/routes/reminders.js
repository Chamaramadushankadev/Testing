import express from 'express';
import Reminder from '../models/Reminder.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all reminders for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (status === 'completed') filter.isCompleted = true;
    if (status === 'pending') filter.isCompleted = false;

    const reminders = await Reminder.find(filter)
      .populate('entityId')
      .sort({ scheduledAt: 1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single reminder
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('entityId');
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new reminder
router.post('/', authenticate, async (req, res) => {
  try {
    const reminder = new Reminder({
      ...req.body,
      userId: req.user._id
    });
    await reminder.save();
    await reminder.populate('entityId');
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update reminder
router.put('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('entityId');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete reminder
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle reminder completion
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    reminder.isCompleted = !reminder.isCompleted;
    reminder.completedAt = reminder.isCompleted ? new Date() : null;
    await reminder.save();
    await reminder.populate('entityId');

    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get upcoming reminders
router.get('/upcoming/list', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reminders = await Reminder.find({
      userId: req.user._id,
      isCompleted: false,
      scheduledAt: { $gte: now, $lte: nextWeek }
    })
    .populate('entityId')
    .sort({ scheduledAt: 1 })
    .limit(10);

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;