import express from 'express';
import mongoose from 'mongoose';
import Reminder from '../models/Reminder.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform reminder data
const transformReminder = (reminder) => {
  const reminderObj = reminder.toObject();
  return {
    ...reminderObj,
    id: reminderObj._id.toString(),
    userId: reminderObj.userId.toString(),
    entityId: reminderObj.entityId ? reminderObj.entityId.toString() : undefined,
    parentReminderId: reminderObj.parentReminderId ? reminderObj.parentReminderId.toString() : undefined
  };
};

// Get all reminders for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, status, includeCompleted = 'false' } = req.query;
    const filter = { userId: req.user._id };

    if (type && type !== 'all') filter.type = type;
    if (status === 'completed') filter.isCompleted = true;
    if (status === 'pending') filter.isCompleted = false;
    if (includeCompleted === 'false') filter.isCompleted = false;

    const reminders = await Reminder.find(filter)
      .populate('entityId')
      .sort({ scheduledAt: 1 });
    
    const transformedReminders = reminders.map(transformReminder);
    res.json(transformedReminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single reminder
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }

    const reminder = await Reminder.findOne({ _id: id, userId: req.user._id })
      .populate('entityId');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(transformReminder(reminder));
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new reminder
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      title, 
      message, 
      type, 
      scheduledAt, 
      entityId, 
      entityType,
      isRecurring = false,
      recurringPattern 
    } = req.body;

    const reminderData = {
      title,
      message,
      type,
      scheduledAt: new Date(scheduledAt),
      userId: req.user._id,
      isRecurring
    };

    // Add entity reference if provided
    if (entityId && entityType) {
      if (!mongoose.Types.ObjectId.isValid(entityId)) {
        return res.status(400).json({ message: 'Invalid entity ID format' });
      }
      reminderData.entityId = entityId;
      reminderData.entityType = entityType;
    }

    // Add recurring pattern if recurring
    if (isRecurring && recurringPattern) {
      reminderData.recurringPattern = {
        frequency: recurringPattern.frequency,
        interval: recurringPattern.interval || 1,
        endDate: recurringPattern.endDate ? new Date(recurringPattern.endDate) : undefined,
        daysOfWeek: recurringPattern.daysOfWeek || [],
        dayOfMonth: recurringPattern.dayOfMonth,
        maxOccurrences: recurringPattern.maxOccurrences
      };
    }

    const reminder = new Reminder(reminderData);
    await reminder.save();
    await reminder.populate('entityId');
    
    res.status(201).json(transformReminder(reminder));
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update reminder
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      message, 
      type, 
      scheduledAt, 
      entityId, 
      entityType,
      isRecurring = false,
      recurringPattern 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }

    const updateData = {
      title,
      message,
      type,
      scheduledAt: new Date(scheduledAt),
      isRecurring
    };

    // Handle entity reference
    if (entityId && entityType) {
      if (!mongoose.Types.ObjectId.isValid(entityId)) {
        return res.status(400).json({ message: 'Invalid entity ID format' });
      }
      updateData.entityId = entityId;
      updateData.entityType = entityType;
    } else {
      updateData.$unset = { entityId: 1, entityType: 1 };
    }

    // Handle recurring pattern
    if (isRecurring && recurringPattern) {
      updateData.recurringPattern = {
        frequency: recurringPattern.frequency,
        interval: recurringPattern.interval || 1,
        endDate: recurringPattern.endDate ? new Date(recurringPattern.endDate) : undefined,
        daysOfWeek: recurringPattern.daysOfWeek || [],
        dayOfMonth: recurringPattern.dayOfMonth,
        maxOccurrences: recurringPattern.maxOccurrences
      };
    } else {
      updateData.$unset = { ...updateData.$unset, recurringPattern: 1 };
    }

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('entityId');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(transformReminder(reminder));
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete reminder
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteAll = false } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }

    const reminder = await Reminder.findOne({ _id: id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (deleteAll && reminder.isRecurring) {
      // Delete all occurrences of this recurring reminder
      const parentId = reminder.parentReminderId || reminder._id;
      await Reminder.deleteMany({
        userId: req.user._id,
        $or: [
          { _id: parentId },
          { parentReminderId: parentId }
        ]
      });
    } else {
      // Delete only this specific reminder
      await Reminder.findByIdAndDelete(id);
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: error.message });
  }
});

// Toggle reminder completion
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }

    const reminder = await Reminder.findOne({ _id: id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    const wasCompleted = reminder.isCompleted;
    reminder.isCompleted = !reminder.isCompleted;
    reminder.completedAt = reminder.isCompleted ? new Date() : null;

    // If marking as complete and it's recurring, create next occurrence
    if (!wasCompleted && reminder.isCompleted && reminder.isRecurring) {
      await reminder.createNextOccurrence();
    }

    await reminder.save();
    await reminder.populate('entityId');

    res.json(transformReminder(reminder));
  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get upcoming reminders
router.get('/upcoming/list', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reminders = await Reminder.find({
      userId: req.user._id,
      isCompleted: false,
      scheduledAt: { $gte: now, $lte: nextWeek }
    })
    .populate('entityId')
    .sort({ scheduledAt: 1 })
    .limit(parseInt(limit));

    const transformedReminders = reminders.map(transformReminder);
    res.json(transformedReminders);
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get overdue reminders
router.get('/overdue/list', authenticate, async (req, res) => {
  try {
    const now = new Date();

    const reminders = await Reminder.find({
      userId: req.user._id,
      isCompleted: false,
      scheduledAt: { $lt: now }
    })
    .populate('entityId')
    .sort({ scheduledAt: 1 });

    const transformedReminders = reminders.map(transformReminder);
    res.json(transformedReminders);
  } catch (error) {
    console.error('Error fetching overdue reminders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Snooze reminder
router.patch('/:id/snooze', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes = 15 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }

    const reminder = await Reminder.findOne({ _id: id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    const newScheduledAt = new Date(Date.now() + minutes * 60 * 1000);
    reminder.scheduledAt = newScheduledAt;
    reminder.notificationSent = false;

    await reminder.save();
    await reminder.populate('entityId');

    res.json(transformReminder(reminder));
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;