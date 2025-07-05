import express from 'express';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import { ColdEmailCampaign } from '../models/ColdEmail.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Goals analytics
    const goals = await Goal.find({ userId: req.user._id });
    const goalsInRange = goals.filter(g => g.createdAt >= startDate);
    
    const goalStats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      avgProgress: goals.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0,
      createdInRange: goalsInRange.length
    };

    // Tasks analytics
    const tasks = await Task.find({ userId: req.user._id });
    const tasksInRange = tasks.filter(t => t.createdAt >= startDate);
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && new Date(t.dueDate) < now
    );

    const taskStats = {
      total: tasks.length,
      completed: completedTasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      overdue: overdueTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      createdInRange: tasksInRange.length
    };

    // Cold email analytics
    const campaigns = await ColdEmailCampaign.find({ userId: req.user._id });
    const campaignsInRange = campaigns.filter(c => c.createdAt >= startDate);
    
    const emailStats = campaigns.reduce((acc, campaign) => ({
      totalCampaigns: acc.totalCampaigns + 1,
      emailsSent: acc.emailsSent + campaign.stats.emailsSent,
      opened: acc.opened + campaign.stats.opened,
      replied: acc.replied + campaign.stats.replied,
      interested: acc.interested + campaign.stats.interested
    }), { totalCampaigns: 0, emailsSent: 0, opened: 0, replied: 0, interested: 0 });

    emailStats.openRate = emailStats.emailsSent > 0 ? (emailStats.opened / emailStats.emailsSent) * 100 : 0;
    emailStats.replyRate = emailStats.emailsSent > 0 ? (emailStats.replied / emailStats.emailsSent) * 100 : 0;
    emailStats.campaignsInRange = campaignsInRange.length;

    // Activity timeline
    const activityStats = {
      goalsCreated: goalsInRange.length,
      tasksAdded: tasksInRange.length,
      campaignsStarted: campaignsInRange.filter(c => c.status === 'active').length
    };

    res.json({
      timeRange,
      period: {
        start: startDate,
        end: now
      },
      goals: goalStats,
      tasks: taskStats,
      email: emailStats,
      activity: activityStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/goals', authenticate, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });
    
    const analytics = {
      totalGoals: goals.length,
      byStatus: {
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        paused: goals.filter(g => g.status === 'paused').length
      },
      byPriority: {
        high: goals.filter(g => g.priority === 'high').length,
        medium: goals.filter(g => g.priority === 'medium').length,
        low: goals.filter(g => g.priority === 'low').length
      },
      avgProgress: goals.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0,
      progressDistribution: {
        notStarted: goals.filter(g => g.progress === 0).length,
        inProgress: goals.filter(g => g.progress > 0 && g.progress < 100).length,
        completed: goals.filter(g => g.progress === 100).length
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    const now = new Date();
    
    const analytics = {
      totalTasks: tasks.length,
      byStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      },
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
      overdueTasks: tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < now).length,
      dueSoon: tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        return t.status !== 'completed' && dueDate >= now && dueDate <= threeDaysFromNow;
      }).length
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;