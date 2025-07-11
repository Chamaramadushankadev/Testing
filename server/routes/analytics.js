import express from 'express';
import mongoose from 'mongoose';
import { Campaign, Lead, EmailAccount, EmailLog } from '../models/ColdEmailSystemIndex.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard analytics
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

    // Campaign analytics
    const campaigns = await Campaign.find({ userId: req.user._id });
    const campaignsInRange = campaigns.filter(c => c.createdAt >= startDate);
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    
    // Lead analytics
    const leads = await Lead.find({ userId: req.user._id });
    const leadsInRange = leads.filter(l => l.createdAt >= startDate);
    
    // Email analytics
    const emailLogs = await EmailLog.find({ 
      userId: req.user._id,
      sentAt: { $gte: startDate }
    });
    
    // Account performance
    const accounts = await EmailAccount.find({ userId: req.user._id });
    const accountPerformance = [];
    
    for (const account of accounts) {
      const accountLogs = emailLogs.filter(log => log.emailAccountId.toString() === account._id.toString());
      const sent = accountLogs.length;
      const opened = accountLogs.filter(log => log.status === 'opened').length;
      const replied = accountLogs.filter(log => log.status === 'replied').length;
      
      accountPerformance.push({
        accountId: account._id.toString(),
        name: account.name,
        email: account.email,
        sent,
        opened,
        replied,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        replyRate: sent > 0 ? (replied / sent) * 100 : 0
      });
    }

    // Compile analytics
    const analytics = {
      timeRange,
      period: {
        start: startDate,
        end: now
      },
      campaigns: {
        total: campaigns.length,
        active: activeCampaigns.length,
        createdInRange: campaignsInRange.length
      },
      leads: {
        total: leads.length,
        new: leadsInRange.length,
        byStatus: {
          new: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          replied: leads.filter(l => l.status === 'replied').length,
          interested: leads.filter(l => l.status === 'interested').length
        }
      },
      emails: {
        totalSent: emailLogs.filter(log => log.status !== 'failed').length,
        totalOpened: emailLogs.filter(log => log.status === 'opened' || log.status === 'clicked' || log.status === 'replied').length,
        totalClicked: emailLogs.filter(log => log.status === 'clicked' || log.status === 'replied').length,
        totalReplied: emailLogs.filter(log => log.status === 'replied').length,
        totalBounced: emailLogs.filter(log => log.status === 'bounced').length,
        openRate: emailLogs.length > 0 ? (emailLogs.filter(log => log.status === 'opened' || log.status === 'clicked' || log.status === 'replied').length / emailLogs.length) * 100 : 0,
        replyRate: emailLogs.length > 0 ? (emailLogs.filter(log => log.status === 'replied').length / emailLogs.length) * 100 : 0,
        bounceRate: emailLogs.length > 0 ? (emailLogs.filter(log => log.status === 'bounced').length / emailLogs.length) * 100 : 0
      },
      accountPerformance
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get advanced analytics
router.get('/advanced', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get email logs for the period
    const emailLogs = await EmailLog.find({
      userId: req.user._id,
      sentAt: { $gte: start, $lte: end }
    }).sort({ sentAt: 1 });
    
    // Group by day
    const dailyStats = {};
    emailLogs.forEach(log => {
      const day = log.sentAt.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = {
          date: day,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          bounced: 0
        };
      }
      
      dailyStats[day].sent++;
      
      if (log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked' || log.status === 'replied') {
        dailyStats[day].delivered++;
      }
      
      if (log.status === 'opened' || log.status === 'clicked' || log.status === 'replied') {
        dailyStats[day].opened++;
      }
      
      if (log.status === 'clicked' || log.status === 'replied') {
        dailyStats[day].clicked++;
      }
      
      if (log.status === 'replied') {
        dailyStats[day].replied++;
      }
      
      if (log.status === 'bounced') {
        dailyStats[day].bounced++;
      }
    });
    
    // Convert to array and sort by date
    const dailyData = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
    
    // Campaign performance comparison
    const campaignPerformance = await Campaign.find({
      userId: req.user._id,
      status: { $in: ['active', 'completed'] }
    }).sort({ startedAt: -1 }).limit(5);
    
    const campaignComparison = campaignPerformance.map(campaign => ({
      id: campaign._id.toString(),
      name: campaign.name,
      status: campaign.status,
      emailsSent: campaign.stats.emailsSent,
      openRate: campaign.stats.openRate,
      clickRate: campaign.stats.clickRate,
      replyRate: campaign.stats.replyRate,
      bounceRate: campaign.stats.bounceRate
    }));
    
    // Response time analysis
    const responseTimeData = [];
    const repliedLogs = emailLogs.filter(log => log.status === 'replied' && log.sentAt && log.repliedAt);
    
    repliedLogs.forEach(log => {
      const responseTimeHours = (log.repliedAt - log.sentAt) / (1000 * 60 * 60);
      responseTimeData.push({
        emailId: log._id.toString(),
        responseTimeHours,
        sentAt: log.sentAt,
        repliedAt: log.repliedAt
      });
    });
    
    // Average response time
    const avgResponseTime = responseTimeData.length > 0 
      ? responseTimeData.reduce((sum, item) => sum + item.responseTimeHours, 0) / responseTimeData.length
      : 0;
    
    res.json({
      period: {
        start,
        end
      },
      summary: {
        totalSent: emailLogs.length,
        totalOpened: emailLogs.filter(log => log.status === 'opened' || log.status === 'clicked' || log.status === 'replied').length,
        totalReplied: emailLogs.filter(log => log.status === 'replied').length,
        openRate: emailLogs.length > 0 ? (emailLogs.filter(log => log.status === 'opened' || log.status === 'clicked' || log.status === 'replied').length / emailLogs.length) * 100 : 0,
        replyRate: emailLogs.length > 0 ? (emailLogs.filter(log => log.status === 'replied').length / emailLogs.length) * 100 : 0,
        averageResponseTimeHours: avgResponseTime
      },
      dailyData,
      campaignComparison,
      responseTimeData: responseTimeData.sort((a, b) => a.responseTimeHours - b.responseTimeHours).slice(0, 20)
    });
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;