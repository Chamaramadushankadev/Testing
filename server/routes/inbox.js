import express from 'express';
import mongoose from 'mongoose';
import { InboxMessage, EmailAccount } from '../models/ColdEmailSystemIndex.js';
import { authenticate } from '../middleware/auth.js';
import { syncInbox, sendEmail } from '../services/emailService.js';

const router = express.Router();

// Helper function to transform data
const transformMessage = (message) => {
  const messageObj = message.toObject();
  return {
    ...messageObj,
    id: messageObj._id.toString(),
    userId: messageObj.userId.toString(),
    emailAccountId: messageObj.emailAccountId.toString(),
    campaignId: messageObj.campaignId?.toString(),
    leadId: messageObj.leadId?.toString()
  };
};

// Get inbox messages
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📬 Fetching inbox messages for user:', req.user.email || req.user._id);
    const { accountId, isRead, search, page = 1, limit = 50, excludeWarmup = true, threadId, includeThread = false } = req.query;
    const filter = { userId: req.user._id };

    if (accountId && accountId !== 'all') filter.emailAccountId = accountId;
    if (isRead === 'true') filter.isRead = true;
    if (isRead === 'false') filter.isRead = false;
    if (threadId) filter.threadId = threadId;
    
    // Exclude warmup emails if requested
    if (excludeWarmup === 'true' || excludeWarmup === true) {
      filter.isWarmup = { $ne: true };
      // Also exclude emails with warmup-related subjects
      filter.subject = { $not: /warmup|check-in|quick question|following up/i };
    }

    console.log('📬 Inbox filter:', JSON.stringify(filter));
    let query = InboxMessage.find(filter);

    if (search) {
      query = query.find({
        $or: [
          { 'from.email': { $regex: search, $options: 'i' } },
          { 'from.name': { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { 'content.text': { $regex: search, $options: 'i' } }
        ]
      });
    }

    const messages = await query
      .sort({ receivedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('emailAccountId', 'name email');

    console.log(`📬 Found ${messages.length} inbox messages`);
    const total = await InboxMessage.countDocuments(filter);
    
    // Transform messages and add thread information if requested
    const transformedMessages = await Promise.all(messages.map(async (message) => {
      const transformed = transformMessage(message);
      
      // If includeThread is true, fetch thread messages
      if (includeThread && message.threadId) {
        const threadMessages = await InboxMessage.find({
          userId: req.user._id,
          threadId: message.threadId,
          _id: { $ne: message._id } // Exclude the current message
        }).sort({ receivedAt: 1 });
        
        transformed.thread = threadMessages.map(transformMessage);
      }
      
      return transformed;
    }));

    // Get email accounts for filtering
    const accounts = await EmailAccount.find({ userId: req.user._id, isActive: true })
      .select('name email');

    res.json({
      messages: transformedMessages,
      accounts: accounts.map(acc => ({
        id: acc._id.toString(),
        name: acc.name,
        email: acc.email
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read/unread
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message ID format' });
    }

    const message = await InboxMessage.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(transformMessage(message));
  } catch (error) {
    console.error('Error updating message read status:', error);
    res.status(400).json({ message: error.message });
  }
});

// Star/unstar message
router.patch('/:id/star', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isStarred = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message ID format' });
    }

    const message = await InboxMessage.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isStarred },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(transformMessage(message));
  } catch (error) {
    console.error('Error updating message star status:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update message labels
router.patch('/:id/labels', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { labels, action = 'set' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message ID format' });
    }

    if (!Array.isArray(labels)) {
      return res.status(400).json({ message: 'Labels must be an array' });
    }

    const message = await InboxMessage.findOne({ _id: id, userId: req.user._id });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    let updatedLabels;
    switch (action) {
      case 'add':
        updatedLabels = [...new Set([...message.labels, ...labels])];
        break;
      case 'remove':
        updatedLabels = message.labels.filter(label => !labels.includes(label));
        break;
      case 'set':
      default:
        updatedLabels = labels;
        break;
    }

    message.labels = updatedLabels;
    await message.save();

    res.json(transformMessage(message));
  } catch (error) {
    console.error('Error updating message labels:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete message
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message ID format' });
    }

    console.log(`🗑️ Deleting message ${id} for user ${req.user._id}`);
    const message = await InboxMessage.findOne({ _id: id, userId: req.user._id });

    if (!message) {
      console.log(`❌ Message not found or access denied`);
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Delete the message
    await InboxMessage.deleteOne({ _id: id });
    console.log(`✅ Message deleted successfully`);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: error.message });
  }
});

// Manually sync inbox
router.post('/sync/:accountId', authenticate, async (req, res) => {
  try {
    console.log('🔄 Manual inbox sync requested');
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }

    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    console.log('🔄 Manual inbox sync requested for account:', account.email, account._id);
    
    // Run inbox sync
    try {
      const result = await syncInbox(account);
      console.log('✅ Inbox sync completed:', result);
      
      res.json({
        message: 'Inbox sync completed successfully',
        result
      });
    } catch (syncError) {
      console.error('❌ Error during inbox sync:', syncError);
      res.status(500).json({ 
        message: 'Error syncing inbox', 
        error: syncError.message,
        stack: process.env.NODE_ENV !== 'production' ? syncError.stack : undefined
      });
    }
    
  } catch (error) {
    console.error('Error syncing inbox:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send reply to a message
router.post('/reply', authenticate, async (req, res) => {
  try {
    let { to, subject, content, inReplyTo, threadId: messageThreadId, accountId } = req.body;
    
    if (!to || !subject || !content || !accountId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Ensure accountId is a string
    accountId = String(accountId);
    
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ 
        message: 'Invalid account ID format', 
        details: `ID: ${accountId}, Type: ${typeof accountId}` 
      });
    }
    
    // Get the email account
    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Use a consistent threadId
    const threadId = messageThreadId || inReplyTo || `thread-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Send the reply
    const emailData = {
      to,
      subject,
      content: content.trim(),
      type: 'reply', 
      inReplyTo,
      threadId,
      isReply: true
    };
    
    const result = await sendEmail(account, emailData);
    
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to send reply: ' + result.error });
    }
    
    // Create an inbox message for the sent reply
    try {
      const inboxMessage = new InboxMessage({
        userId: req.user._id,
        emailAccountId: account._id,
        messageId: result.messageId || `reply-${Date.now()}`,
        threadId: threadId,
        from: {
          name: account.name,
          email: account.email
        },
        to: [{ email: to }],
        subject: subject,
        content: {
          text: content,
          html: emailData.html
        },
        isRead: true,
        isReply: true,
        receivedAt: new Date(),
        sentByMe: true
      });
      
      await inboxMessage.save();
      console.log('✅ Reply saved to inbox');
      
      // Update the original message to ensure it has the same threadId
      if (inReplyTo) {
        console.log('🔄 Updating all related messages to use the same threadId:', threadId);
        
        // Update all messages that might be related to this conversation
        await InboxMessage.updateMany(
          { 
            userId: req.user._id,
            $or: [
              { messageId: inReplyTo },
              { 'content.text': { $regex: inReplyTo, $options: 'i' } },
              { subject: { $regex: subject.replace(/^Re:\s*/i, ''), $options: 'i' } }
            ]
          },
          { $set: { threadId: threadId } }
        );
        
        console.log('✅ Updated related messages with threadId:', threadId);
      }
    } catch (saveError) {
      console.error('Error saving reply to inbox:', saveError);
      // Continue even if saving to inbox fails
    }
    
    res.json({ 
      message: 'Reply sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get inbox stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = {
      total: await InboxMessage.countDocuments({ userId: req.user._id }),
      unread: await InboxMessage.countDocuments({ userId: req.user._id, isRead: false }),
      starred: await InboxMessage.countDocuments({ userId: req.user._id, isStarred: true }),
      byAccount: []
    };

    // Get stats by account
    const accounts = await EmailAccount.find({ userId: req.user._id });
    for (const account of accounts) {
      const accountStats = {
        id: account._id.toString(),
        name: account.name,
        email: account.email,
        total: await InboxMessage.countDocuments({ userId: req.user._id, emailAccountId: account._id }),
        unread: await InboxMessage.countDocuments({ userId: req.user._id, emailAccountId: account._id, isRead: false })
      };
      stats.byAccount.push(accountStats);
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching inbox stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;