import express from 'express';
import mongoose from 'mongoose';
import TimeEntry from '../models/TimeEntry.js';
import SharedTimeSheet from '../models/SharedTimeSheet.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to transform data
const transformTimeEntry = (entry) => {
  const entryObj = entry.toObject();
  return {
    ...entryObj,
    id: entryObj._id.toString(),
    userId: entryObj.userId.toString(),
    projectId: entryObj.projectId?.toString(),
    taskId: entryObj.taskId?.toString()
  };
};

// Get all time entries for user
router.get('/entries', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, projectId, taskId, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (projectId && projectId !== 'all') filter.projectId = projectId;
    if (taskId && taskId !== 'all') filter.taskId = taskId;

    const entries = await TimeEntry.find(filter)
      .sort({ date: -1, startTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await TimeEntry.countDocuments(filter);

    res.json({
      entries: entries.map(transformTimeEntry),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current running timer
router.get('/current', authenticate, async (req, res) => {
  try {
    const runningEntry = await TimeEntry.findOne({
      userId: req.user._id,
      isRunning: true
    });

    if (runningEntry) {
      res.json(transformTimeEntry(runningEntry));
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching current timer:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start timer
router.post('/start', authenticate, async (req, res) => {
  try {
    const { projectId, taskId, projectName, taskName, description } = req.body;

    // Stop any running timer first
    await TimeEntry.updateMany(
      { userId: req.user._id, isRunning: true },
      { 
        isRunning: false,
        endTime: new Date(),
        $unset: { duration: 1 }
      }
    );

    // Recalculate duration for stopped timers
    const stoppedEntries = await TimeEntry.find({
      userId: req.user._id,
      isRunning: false,
      endTime: { $exists: true },
      duration: { $exists: false }
    });

    for (const entry of stoppedEntries) {
      if (entry.startTime && entry.endTime) {
        entry.duration = Math.floor((entry.endTime - entry.startTime) / 1000);
        await entry.save();
      }
    }

    const now = new Date();
    const timeEntry = new TimeEntry({
      userId: req.user._id,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      projectName: projectName || 'Untitled Project',
      taskName: taskName || undefined,
      description: description || '',
      startTime: now,
      date: new Date(now.toDateString()),
      isRunning: true
    });

    await timeEntry.save();
    res.status(201).json(transformTimeEntry(timeEntry));
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(400).json({ message: error.message });
  }
});

// Stop timer
router.post('/stop', authenticate, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const runningEntry = await TimeEntry.findOne({
      userId: req.user._id,
      isRunning: true
    });

    if (!runningEntry) {
      return res.status(404).json({ message: 'No running timer found' });
    }

    runningEntry.endTime = new Date();
    runningEntry.isRunning = false;
    runningEntry.notes = notes || runningEntry.notes;
    
    await runningEntry.save();
    res.json(transformTimeEntry(runningEntry));
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update time entry
router.put('/entries/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid entry ID format' });
    }

    const entry = await TimeEntry.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    res.json(transformTimeEntry(entry));
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete time entry
router.delete('/entries/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid entry ID format' });
    }

    const entry = await TimeEntry.findOneAndDelete({ _id: id, userId: req.user._id });
    
    if (!entry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get time tracking analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.toDateString());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const entries = await TimeEntry.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now },
      isRunning: false
    });

    const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalEntries = entries.length;

    // Group by project
    const projectStats = {};
    entries.forEach(entry => {
      const projectName = entry.projectName || 'Untitled Project';
      if (!projectStats[projectName]) {
        projectStats[projectName] = {
          name: projectName,
          duration: 0,
          entries: 0
        };
      }
      projectStats[projectName].duration += entry.duration || 0;
      projectStats[projectName].entries += 1;
    });

    // Group by date
    const dailyStats = {};
    entries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = {
          date: dateStr,
          duration: 0,
          entries: 0
        };
      }
      dailyStats[dateStr].duration += entry.duration || 0;
      dailyStats[dateStr].entries += 1;
    });

    res.json({
      totalDuration,
      totalEntries,
      averagePerDay: totalEntries > 0 ? totalDuration / Object.keys(dailyStats).length : 0,
      projectBreakdown: Object.values(projectStats),
      dailyBreakdown: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create shared time sheet
router.post('/share', authenticate, async (req, res) => {
  try {
    const { title, description, startDate, endDate, projectIds, taskIds, expiresAt } = req.body;

    const shareId = uuidv4();
    
    const sharedSheet = new SharedTimeSheet({
      userId: req.user._id,
      title,
      description,
      shareId,
      filters: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        projectIds: projectIds || [],
        taskIds: taskIds || []
      },
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await sharedSheet.save();
    
    res.status(201).json({
      ...sharedSheet.toObject(),
      shareUrl: `${req.protocol}://${req.get('host')}/shared-timesheet/${shareId}`
    });
  } catch (error) {
    console.error('Error creating shared time sheet:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get shared time sheets for user
router.get('/shared', authenticate, async (req, res) => {
  try {
    const sharedSheets = await SharedTimeSheet.find({
      userId: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    const sheetsWithUrls = sharedSheets.map(sheet => ({
      ...sheet.toObject(),
      shareUrl: `${req.protocol}://${req.get('host')}/shared-timesheet/${sheet.shareId}`
    }));

    res.json(sheetsWithUrls);
  } catch (error) {
    console.error('Error fetching shared sheets:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get shared time sheet by shareId (public route with auth required)
router.get('/shared/:shareId', authenticate, async (req, res) => {
  try {
    const { shareId } = req.params;

    const sharedSheet = await SharedTimeSheet.findOne({
      shareId,
      isActive: true
    }).populate('userId', 'name email');

    if (!sharedSheet) {
      return res.status(404).json({ message: 'Shared time sheet not found or expired' });
    }

    // Check if expired
    if (sharedSheet.expiresAt && new Date() > sharedSheet.expiresAt) {
      return res.status(410).json({ message: 'Shared time sheet has expired' });
    }

    // Update access count
    sharedSheet.accessCount += 1;
    sharedSheet.lastAccessedAt = new Date();
    await sharedSheet.save();

    // Get time entries based on filters
    const filter = { userId: sharedSheet.userId._id };
    
    if (sharedSheet.filters.startDate && sharedSheet.filters.endDate) {
      filter.date = {
        $gte: sharedSheet.filters.startDate,
        $lte: sharedSheet.filters.endDate
      };
    }

    if (sharedSheet.filters.projectIds && sharedSheet.filters.projectIds.length > 0) {
      filter.projectId = { $in: sharedSheet.filters.projectIds };
    }

    if (sharedSheet.filters.taskIds && sharedSheet.filters.taskIds.length > 0) {
      filter.taskId = { $in: sharedSheet.filters.taskIds };
    }

    const entries = await TimeEntry.find({
      ...filter,
      isRunning: false
    }).sort({ date: -1, startTime: -1 });

    // Calculate totals and breakdowns
    const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    const projectBreakdown = {};
    const dailyBreakdown = {};

    entries.forEach(entry => {
      // Project breakdown
      const projectName = entry.projectName || 'Untitled Project';
      if (!projectBreakdown[projectName]) {
        projectBreakdown[projectName] = {
          name: projectName,
          duration: 0,
          entries: 0
        };
      }
      projectBreakdown[projectName].duration += entry.duration || 0;
      projectBreakdown[projectName].entries += 1;

      // Daily breakdown
      const dateStr = entry.date.toISOString().split('T')[0];
      if (!dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr] = {
          date: dateStr,
          duration: 0,
          entries: 0
        };
      }
      dailyBreakdown[dateStr].duration += entry.duration || 0;
      dailyBreakdown[dateStr].entries += 1;
    });

    res.json({
      sharedSheet: {
        title: sharedSheet.title,
        description: sharedSheet.description,
        createdBy: sharedSheet.userId.name,
        createdAt: sharedSheet.createdAt,
        filters: sharedSheet.filters
      },
      summary: {
        totalDuration,
        totalEntries: entries.length,
        dateRange: {
          start: sharedSheet.filters.startDate,
          end: sharedSheet.filters.endDate
        }
      },
      entries: entries.map(transformTimeEntry),
      projectBreakdown: Object.values(projectBreakdown),
      dailyBreakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date))
    });
  } catch (error) {
    console.error('Error fetching shared time sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete shared time sheet
router.delete('/shared/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid shared sheet ID format' });
    }

    const sharedSheet = await SharedTimeSheet.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!sharedSheet) {
      return res.status(404).json({ message: 'Shared time sheet not found' });
    }

    res.json({ message: 'Shared time sheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting shared sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;