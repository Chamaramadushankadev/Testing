import express from 'express';
import mongoose from 'mongoose';
import { EmailAccount, Lead, Campaign, EmailLog, WarmupEmail, InboxSync } from '../models/ColdEmailSystem.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmail, syncInbox, generateWarmupContent } from '../services/emailService.js';
import { scheduleWarmupEmails, scheduleCampaignEmails } from '../services/emailScheduler.js';

const router = express.Router();

// Helper function to transform data
const transformEmailAccount = (account) => {
  const accountObj = account.toObject();
  return {
    ...accountObj,
    id: accountObj._id.toString(),
    userId: accountObj.userId.toString()
  };
};

const transformLead = (lead) => {
  const leadObj = lead.toObject();
  return {
    ...leadObj,
    id: leadObj._id.toString(),
    userId: leadObj.userId.toString()
  };
};

const transformCampaign = (campaign) => {
  const campaignObj = campaign.toObject();
  return {
    ...campaignObj,
    id: campaignObj._id.toString(),
    userId: campaignObj.userId.toString(),
    emailAccountIds: campaignObj.emailAccountIds.map(id => id.toString()),
    leadIds: campaignObj.leadIds.map(id => id.toString())
  };
};

// ==================== EMAIL ACCOUNTS ====================

// Get all email accounts
router.get('/accounts', authenticate, async (req, res) => {
  try {
    const accounts = await EmailAccount.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const transformedAccounts = accounts.map(transformEmailAccount);
    res.json(transformedAccounts);
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create email account
router.post('/accounts', authenticate, async (req, res) => {
  try {
    const {
      name,
      email,
      provider,
      smtpSettings,
      imapSettings,
      dailyLimit,
      warmupSettings
    } = req.body;

    const accountData = {
      name,
      email,
      provider: provider || 'namecheap',
      smtpSettings: {
        host: smtpSettings?.host || 'mail.privateemail.com',
        port: smtpSettings?.port || 587,
        username: smtpSettings?.username || email,
        password: smtpSettings?.password,
        secure: smtpSettings?.secure !== false
      },
      imapSettings: {
        host: imapSettings?.host || 'mail.privateemail.com',
        port: imapSettings?.port || 993,
        secure: imapSettings?.secure !== false
      },
      dailyLimit: dailyLimit || 50,
      warmupSettings: {
        enabled: warmupSettings?.enabled !== false,
        dailyWarmupEmails: warmupSettings?.dailyWarmupEmails || 5,
        rampUpDays: warmupSettings?.rampUpDays || 30
      },
      userId: req.user._id
    };

    const account = new EmailAccount(accountData);
    await account.save();

    // Initialize inbox sync record
    const inboxSync = new InboxSync({
      userId: req.user._id,
      emailAccountId: account._id
    });
    await inboxSync.save();

    res.status(201).json(transformEmailAccount(account));
  } catch (error) {
    console.error('Error creating email account:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update email account
router.put('/accounts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }

    const account = await EmailAccount.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    res.json(transformEmailAccount(account));
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete email account
router.delete('/accounts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }

    const account = await EmailAccount.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    // Clean up related data
    await InboxSync.deleteMany({ emailAccountId: id });
    await WarmupEmail.deleteMany({ 
      $or: [{ fromAccountId: id }, { toAccountId: id }] 
    });

    res.json({ message: 'Email account deleted successfully' });
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test email account connection
router.post('/accounts/:id/test', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }

    const account = await EmailAccount.findOne({ _id: id, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    // Test SMTP connection
    const testResult = await sendEmail(account, {
      to: account.email,
      subject: 'Test Connection - ProductivePro',
      content: 'This is a test email to verify your email account connection.'
    });

    if (testResult.success) {
      res.json({ success: true, message: 'Email account connection successful' });
    } else {
      res.status(400).json({ success: false, message: testResult.error });
    }
  } catch (error) {
    console.error('Error testing email account:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== LEADS ====================

// Get all leads
router.get('/leads', authenticate, async (req, res) => {
  try {
    const { status, tags, search, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'all') filter.status = status;
    if (tags && tags !== 'all') filter.tags = { $in: tags.split(',') };

    let query = Lead.find(filter);

    if (search) {
      query = query.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const leads = await query
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Lead.countDocuments(filter);
    const transformedLeads = leads.map(transformLead);

    res.json({
      leads: transformedLeads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create lead
router.post('/leads', authenticate, async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      userId: req.user._id
    };

    const lead = new Lead(leadData);
    await lead.save();
    
    res.status(201).json(transformLead(lead));
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(400).json({ message: error.message });
  }
});

// Bulk import leads
router.post('/leads/bulk-import', authenticate, async (req, res) => {
  try {
    const { leads } = req.body;
    
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: 'Invalid leads data' });
    }

    const leadsWithUserId = leads.map(lead => ({
      ...lead,
      userId: req.user._id
    }));

    const result = await Lead.insertMany(leadsWithUserId, { ordered: false });
    
    res.status(201).json({
      message: `Successfully imported ${result.length} leads`,
      imported: result.length
    });
  } catch (error) {
    console.error('Error bulk importing leads:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update lead
router.put('/leads/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lead ID format' });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(transformLead(lead));
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete lead
router.delete('/leads/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lead ID format' });
    }

    const lead = await Lead.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== CAMPAIGNS ====================

// Get all campaigns
router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'all') filter.status = status;

    const campaigns = await Campaign.find(filter)
      .populate('emailAccountIds', 'name email')
      .sort({ createdAt: -1 });

    const transformedCampaigns = campaigns.map(transformCampaign);
    res.json(transformedCampaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create campaign
router.post('/campaigns', authenticate, async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      userId: req.user._id
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();
    await campaign.populate('emailAccountIds', 'name email');
    
    res.status(201).json(transformCampaign(campaign));
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update campaign
router.put('/campaigns/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('emailAccountIds', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(transformCampaign(campaign));
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(400).json({ message: error.message });
  }
});

// Start/Stop campaign
router.patch('/campaigns/:id/toggle', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOne({ _id: id, userId: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status === 'active') {
      campaign.status = 'paused';
    } else if (campaign.status === 'paused' || campaign.status === 'draft') {
      campaign.status = 'active';
      if (!campaign.startedAt) {
        campaign.startedAt = new Date();
      }
      
      // Schedule campaign emails
      await scheduleCampaignEmails(campaign);
    }

    await campaign.save();
    await campaign.populate('emailAccountIds', 'name email');
    
    res.json(transformCampaign(campaign));
  } catch (error) {
    console.error('Error toggling campaign:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get campaign analytics
router.get('/campaigns/:id/analytics', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOne({ _id: id, userId: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get detailed email logs for this campaign
    const emailLogs = await EmailLog.find({ campaignId: id })
      .populate('leadId', 'firstName lastName email company')
      .populate('emailAccountId', 'name email')
      .sort({ sentAt: -1 });

    const analytics = {
      ...campaign.stats,
      openRate: campaign.stats.emailsSent > 0 ? (campaign.stats.opened / campaign.stats.emailsSent) * 100 : 0,
      clickRate: campaign.stats.emailsSent > 0 ? (campaign.stats.clicked / campaign.stats.emailsSent) * 100 : 0,
      replyRate: campaign.stats.emailsSent > 0 ? (campaign.stats.replied / campaign.stats.emailsSent) * 100 : 0,
      bounceRate: campaign.stats.emailsSent > 0 ? (campaign.stats.bounced / campaign.stats.emailsSent) * 100 : 0,
      conversionRate: campaign.stats.emailsSent > 0 ? (campaign.stats.interested / campaign.stats.emailsSent) * 100 : 0,
      emailLogs: emailLogs.map(log => ({
        id: log._id.toString(),
        lead: log.leadId,
        emailAccount: log.emailAccountId,
        subject: log.subject,
        status: log.status,
        sentAt: log.sentAt,
        openedAt: log.openedAt,
        clickedAt: log.clickedAt,
        repliedAt: log.repliedAt
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== WARMUP SYSTEM ====================

// Get warmup status
router.get('/warmup/status', authenticate, async (req, res) => {
  try {
    const accounts = await EmailAccount.find({ userId: req.user._id });
    const warmupStats = await Promise.all(
      accounts.map(async (account) => {
        const sentToday = await WarmupEmail.countDocuments({
          fromAccountId: account._id,
          sentAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        });

        const totalSent = await WarmupEmail.countDocuments({
          fromAccountId: account._id
        });

        const repliesReceived = await WarmupEmail.countDocuments({
          toAccountId: account._id,
          status: 'replied'
        });

        return {
          accountId: account._id.toString(),
          accountName: account.name,
          accountEmail: account.email,
          warmupStatus: account.warmupStatus,
          reputation: account.reputation,
          sentToday,
          totalSent,
          repliesReceived,
          dailyTarget: account.warmupSettings.dailyWarmupEmails
        };
      })
    );

    res.json(warmupStats);
  } catch (error) {
    console.error('Error fetching warmup status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start warmup for account
router.post('/warmup/:accountId/start', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }

    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    account.warmupStatus = 'in-progress';
    await account.save();

    // Schedule warmup emails
    await scheduleWarmupEmails(account);

    res.json({ message: 'Warmup started successfully', account: transformEmailAccount(account) });
  } catch (error) {
    console.error('Error starting warmup:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== INBOX SYNC ====================

// Get inbox sync status
router.get('/inbox/sync-status', authenticate, async (req, res) => {
  try {
    const syncStatuses = await InboxSync.find({ userId: req.user._id })
      .populate('emailAccountId', 'name email')
      .sort({ lastSyncAt: -1 });

    res.json(syncStatuses.map(sync => ({
      id: sync._id.toString(),
      emailAccount: sync.emailAccountId,
      lastSyncAt: sync.lastSyncAt,
      syncStatus: sync.syncStatus,
      emailsProcessed: sync.emailsProcessed,
      repliesFound: sync.repliesFound,
      bouncesFound: sync.bouncesFound,
      errorMessage: sync.errorMessage
    })));
  } catch (error) {
    console.error('Error fetching inbox sync status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Trigger manual inbox sync
router.post('/inbox/sync/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }

    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    // Trigger inbox sync
    const syncResult = await syncInbox(account);

    res.json({
      message: 'Inbox sync completed',
      result: syncResult
    });
  } catch (error) {
    console.error('Error syncing inbox:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== EMAIL LOGS ====================

// Get email logs
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { campaignId, accountId, status, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      filter.campaignId = campaignId;
    }
    if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      filter.emailAccountId = accountId;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const logs = await EmailLog.find(filter)
      .populate('campaignId', 'name')
      .populate('leadId', 'firstName lastName email company')
      .populate('emailAccountId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await EmailLog.countDocuments(filter);

    res.json({
      logs: logs.map(log => ({
        id: log._id.toString(),
        campaign: log.campaignId,
        lead: log.leadId,
        emailAccount: log.emailAccountId,
        type: log.type,
        subject: log.subject,
        status: log.status,
        sentAt: log.sentAt,
        openedAt: log.openedAt,
        clickedAt: log.clickedAt,
        repliedAt: log.repliedAt,
        bouncedAt: log.bouncedAt,
        errorMessage: log.errorMessage
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== DASHBOARD ANALYTICS ====================

// Get dashboard analytics
router.get('/analytics/dashboard', authenticate, async (req, res) => {
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

    // Get counts
    const [
      totalAccounts,
      activeAccounts,
      totalLeads,
      totalCampaigns,
      activeCampaigns,
      emailsSentInRange,
      repliesInRange
    ] = await Promise.all([
      EmailAccount.countDocuments({ userId: req.user._id }),
      EmailAccount.countDocuments({ userId: req.user._id, isActive: true }),
      Lead.countDocuments({ userId: req.user._id }),
      Campaign.countDocuments({ userId: req.user._id }),
      Campaign.countDocuments({ userId: req.user._id, status: 'active' }),
      EmailLog.countDocuments({ 
        userId: req.user._id, 
        sentAt: { $gte: startDate },
        status: { $in: ['sent', 'delivered', 'opened', 'clicked', 'replied'] }
      }),
      EmailLog.countDocuments({ 
        userId: req.user._id, 
        repliedAt: { $gte: startDate }
      })
    ]);

    // Calculate overall stats from all campaigns
    const campaigns = await Campaign.find({ userId: req.user._id });
    const overallStats = campaigns.reduce((acc, campaign) => ({
      emailsSent: acc.emailsSent + campaign.stats.emailsSent,
      opened: acc.opened + campaign.stats.opened,
      clicked: acc.clicked + campaign.stats.clicked,
      replied: acc.replied + campaign.stats.replied,
      bounced: acc.bounced + campaign.stats.bounced
    }), { emailsSent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 });

    const analytics = {
      timeRange,
      period: { start: startDate, end: now },
      accounts: {
        total: totalAccounts,
        active: activeAccounts,
        warmingUp: await EmailAccount.countDocuments({ 
          userId: req.user._id, 
          warmupStatus: 'in-progress' 
        })
      },
      leads: {
        total: totalLeads,
        new: await Lead.countDocuments({ userId: req.user._id, status: 'new' }),
        contacted: await Lead.countDocuments({ userId: req.user._id, status: 'contacted' }),
        replied: await Lead.countDocuments({ userId: req.user._id, status: 'replied' }),
        interested: await Lead.countDocuments({ userId: req.user._id, status: 'interested' })
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        paused: await Campaign.countDocuments({ userId: req.user._id, status: 'paused' }),
        completed: await Campaign.countDocuments({ userId: req.user._id, status: 'completed' })
      },
      emails: {
        sentInRange: emailsSentInRange,
        repliesInRange: repliesInRange,
        totalSent: overallStats.emailsSent,
        totalOpened: overallStats.opened,
        totalClicked: overallStats.clicked,
        totalReplied: overallStats.replied,
        totalBounced: overallStats.bounced,
        openRate: overallStats.emailsSent > 0 ? (overallStats.opened / overallStats.emailsSent) * 100 : 0,
        clickRate: overallStats.emailsSent > 0 ? (overallStats.clicked / overallStats.emailsSent) * 100 : 0,
        replyRate: overallStats.emailsSent > 0 ? (overallStats.replied / overallStats.emailsSent) * 100 : 0,
        bounceRate: overallStats.emailsSent > 0 ? (overallStats.bounced / overallStats.emailsSent) * 100 : 0
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;