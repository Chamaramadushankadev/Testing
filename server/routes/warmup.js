import express from 'express';
import mongoose from 'mongoose';
import { 
  EmailAccount, 
  WarmupEmail, 
  InboxSync, 
  InboxMessage 
} from '../models/ColdEmailSystemIndex.js';
import { authenticate } from '../middleware/auth.js';
import { 
  startWarmupForAccount, 
  pauseWarmupForAccount, 
  resumeWarmupForAccount, 
  stopWarmupForAccount,
  sendWarmupEmail,
  checkDnsRecords
} from '../services/warmupService.js';

const router = express.Router();

// Get warmup status for all accounts
router.get('/status', authenticate, async (req, res) => {
  try {
    console.log('🔥 Fetching warmup status for user:', req.user._id);
    
    // Get all email accounts for the user
    const accounts = await EmailAccount.find({ userId: req.user._id });
    
    // Get warmup stats for each account
    const accountStats = [];
    
    for (const account of accounts) {
      // Get warmup emails sent by this account
      const sentEmails = await WarmupEmail.find({ 
        userId: req.user._id,
        fromAccountId: account._id
      });
      
      // Get warmup emails received by this account
      const receivedEmails = await WarmupEmail.find({
        userId: req.user._id,
        toAccountId: account._id
      });
      
      // Calculate stats
      const emailsSent = sentEmails.length;
      const emailsOpened = sentEmails.filter(email => email.openedAt).length;
      const repliesReceived = sentEmails.filter(email => email.repliedAt).length;
      
      // Check for spam placements
      const inboxSync = await InboxSync.findOne({ 
        userId: req.user._id,
        emailAccountId: account._id
      });
      
      const spamPlacements = inboxSync?.spamPlacements || 0;
      
      // Calculate days in warmup
      const firstWarmupEmail = sentEmails.length > 0 
        ? sentEmails.sort((a, b) => a.createdAt - b.createdAt)[0]
        : null;
      
      const daysInWarmup = firstWarmupEmail
        ? Math.floor((Date.now() - new Date(firstWarmupEmail.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Calculate current daily volume based on warmup settings
      const warmupSettings = account.warmupSettings || {
        dailyWarmupEmails: 5,
        rampUpDays: 30,
        maxDailyEmails: 40
      };
      
      const dailyIncrease = (warmupSettings.maxDailyEmails - warmupSettings.dailyWarmupEmails) / warmupSettings.rampUpDays;
      const currentDailyVolume = Math.min(
        warmupSettings.maxDailyEmails,
        Math.floor(warmupSettings.dailyWarmupEmails + (dailyIncrease * daysInWarmup))
      );
      
      accountStats.push({
        accountId: account._id.toString(),
        accountName: account.name,
        accountEmail: account.email,
        warmupStatus: account.warmupStatus,
        emailsSent,
        emailsOpened,
        repliesReceived,
        spamPlacements,
        daysInWarmup,
        currentDailyVolume,
        reputation: account.reputation || 100
      });
    }
    
    res.json({
      accounts: accountStats,
      totalAccounts: accounts.length,
      activeWarmups: accounts.filter(a => a.warmupStatus === 'in-progress').length
    });
  } catch (error) {
    console.error('Error fetching warmup status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start warmup for an account
router.post('/:accountId/start', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EmailAccount.findOne({ 
      _id: accountId, 
      userId: req.user._id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check if there are enough accounts for warmup
    const otherAccounts = await EmailAccount.find({
      userId: req.user._id,
      _id: { $ne: accountId },
      isActive: true
    });
    
    if (otherAccounts.length === 0) {
      return res.status(400).json({ 
        message: 'You need at least one other active email account to start warmup' 
      });
    }
    
    // Check DNS records before starting warmup
    const dnsCheck = await checkDnsRecords(account);
    
    if (!dnsCheck.mx) {
      return res.status(400).json({ 
        message: 'Invalid MX records. Please check your domain DNS configuration.',
        dnsCheck
      });
    }
    
    // Start warmup process
    await startWarmupForAccount(account);
    
    res.json({ 
      message: 'Warmup started successfully',
      account: {
        id: account._id,
        name: account.name,
        email: account.email,
        warmupStatus: 'in-progress'
      }
    });
  } catch (error) {
    console.error('Error starting warmup:', error);
    res.status(500).json({ message: error.message });
  }
});

// Pause warmup for an account
router.post('/:accountId/pause', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EmailAccount.findOne({ 
      _id: accountId, 
      userId: req.user._id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    if (account.warmupStatus !== 'in-progress') {
      return res.status(400).json({ message: 'Account is not in warmup process' });
    }
    
    // Pause warmup process
    await pauseWarmupForAccount(account);
    
    res.json({ 
      message: 'Warmup paused successfully',
      account: {
        id: account._id,
        name: account.name,
        email: account.email,
        warmupStatus: 'paused'
      }
    });
  } catch (error) {
    console.error('Error pausing warmup:', error);
    res.status(500).json({ message: error.message });
  }
});

// Resume warmup for an account
router.post('/:accountId/resume', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EmailAccount.findOne({ 
      _id: accountId, 
      userId: req.user._id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    if (account.warmupStatus !== 'paused') {
      return res.status(400).json({ message: 'Account is not paused' });
    }
    
    // Resume warmup process
    await resumeWarmupForAccount(account);
    
    res.json({ 
      message: 'Warmup resumed successfully',
      account: {
        id: account._id,
        name: account.name,
        email: account.email,
        warmupStatus: 'in-progress'
      }
    });
  } catch (error) {
    console.error('Error resuming warmup:', error);
    res.status(500).json({ message: error.message });
  }
});

// Stop warmup for an account
router.post('/:accountId/stop', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EmailAccount.findOne({ 
      _id: accountId, 
      userId: req.user._id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    if (account.warmupStatus === 'not-started') {
      return res.status(400).json({ message: 'Account is not in warmup process' });
    }
    
    // Stop warmup process
    await stopWarmupForAccount(account);
    
    res.json({ 
      message: 'Warmup stopped successfully',
      account: {
        id: account._id,
        name: account.name,
        email: account.email,
        warmupStatus: 'not-started'
      }
    });
  } catch (error) {
    console.error('Error stopping warmup:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update warmup settings
router.put('/:accountId/settings', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const settings = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EmailAccount.findOne({ 
      _id: accountId, 
      userId: req.user._id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Update warmup settings
    account.warmupSettings = {
      enabled: settings.enabled !== undefined ? settings.enabled : true,
      dailyWarmupEmails: settings.dailyWarmupEmails || 5,
      rampUpDays: settings.rampUpDays || 30,
      maxDailyEmails: settings.maxDailyEmails || 40,
      throttleRate: settings.throttleRate || 5,
      startDate: settings.startDate,
      endDate: settings.endDate,
      workingDays: settings.workingDays || [1, 2, 3, 4, 5],
      startTime: settings.startTime || '09:00',
      endTime: settings.endTime || '17:00',
      autoReply: settings.autoReply !== undefined ? settings.autoReply : true,
      autoArchive: settings.autoArchive !== undefined ? settings.autoArchive : true,
      replyDelay: settings.replyDelay || 30,
      maxThreadLength: settings.maxThreadLength || 3
    };
    
    await account.save();
    
    res.json({ 
      message: 'Warmup settings updated successfully',
      account: {
        id: account._id,
        name: account.name,
        email: account.email,
        warmupSettings: account.warmupSettings
      }
    });
  } catch (error) {
    console.error('Error updating warmup settings:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send warmup email now (manual trigger)
router.post('/:accountId/send-now', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EmailAccount.findOne({ 
      _id: accountId, 
      userId: req.user._id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Get other accounts for warmup
    const otherAccounts = await EmailAccount.find({
      userId: req.user._id,
      _id: { $ne: accountId },
      isActive: true
    });
    
    if (otherAccounts.length === 0) {
      return res.status(400).json({ 
        message: 'You need at least one other active email account to send warmup emails' 
      });
    }
    
    // Send warmup email
    const targetAccount = otherAccounts[Math.floor(Math.random() * otherAccounts.length)];
    const result = await sendWarmupEmail(account, targetAccount);
    
    res.json({ 
      message: 'Warmup email sent successfully',
      result
    });
  } catch (error) {
    console.error('Error sending warmup email:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get warmup logs
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, accountId } = req.query;
    
    const filter = { userId: req.user._id };
    
    if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      filter.fromAccountId = accountId;
    }
    
    // Get warmup emails
    const warmupEmails = await WarmupEmail.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string))
      .populate('fromAccountId', 'name email')
      .populate('toAccountId', 'name email');
    
    // Format logs
    const logs = warmupEmails.map(email => ({
      id: email._id.toString(),
      accountId: email.fromAccountId._id.toString(),
      accountName: email.fromAccountId.name,
      accountEmail: email.fromAccountId.email,
      toAccountId: email.toAccountId._id.toString(),
      toAccountName: email.toAccountId.name,
      toAccountEmail: email.toAccountId.email,
      subject: email.subject,
      type: email.isReply ? 'reply' : 'sent',
      status: email.status,
      sentAt: email.sentAt,
      openedAt: email.openedAt,
      repliedAt: email.repliedAt,
      createdAt: email.createdAt
    }));
    
    // Get total count
    const total = await WarmupEmail.countDocuments(filter);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching warmup logs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check DNS records
router.get('/:accountId/dns-check', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EmailAccount.findOne({ 
      _id: accountId, 
      userId: req.user._id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check DNS records
    const dnsCheck = await checkDnsRecords(account);
    
    res.json(dnsCheck);
  } catch (error) {
    console.error('Error checking DNS records:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;