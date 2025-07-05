import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { EmailLog, WarmupEmail, InboxSync, Lead, Campaign } from '../models/ColdEmailSystem.js';

// Create SMTP transporter
export const createTransporter = (account) => {
  return nodemailer.createTransporter({
    host: account.smtpSettings.host,
    port: account.smtpSettings.port,
    secure: account.smtpSettings.secure,
    auth: {
      user: account.smtpSettings.username,
      pass: account.smtpSettings.password
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });
};

// Send email function
export const sendEmail = async (account, emailData) => {
  try {
    const transporter = createTransporter(account);
    
    const mailOptions = {
      from: `${account.name} <${account.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.content,
      text: emailData.content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      headers: {
        'X-Mailer': 'ProductivePro Cold Email System',
        'List-Unsubscribe': `<mailto:unsubscribe@${account.email.split('@')[1]}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    };

    // Add tracking pixel if enabled
    if (emailData.trackingEnabled) {
      const trackingPixelId = generateTrackingPixelId();
      const trackingPixel = `<img src="https://track.productivepro.com/pixel/${trackingPixelId}" width="1" height="1" style="display:none;" />`;
      mailOptions.html += trackingPixel;
      emailData.trackingPixelId = trackingPixelId;
    }

    const info = await transporter.sendMail(mailOptions);
    
    // Log the email
    const emailLog = new EmailLog({
      userId: account.userId,
      campaignId: emailData.campaignId,
      leadId: emailData.leadId,
      emailAccountId: account._id,
      type: emailData.type || 'campaign',
      stepNumber: emailData.stepNumber,
      subject: emailData.subject,
      content: emailData.content,
      status: 'sent',
      sentAt: new Date(),
      trackingPixelId: emailData.trackingPixelId,
      messageId: info.messageId
    });
    await emailLog.save();

    // Update account daily count
    await updateDailyEmailCount(account._id);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log the failed email
    const emailLog = new EmailLog({
      userId: account.userId,
      campaignId: emailData.campaignId,
      leadId: emailData.leadId,
      emailAccountId: account._id,
      type: emailData.type || 'campaign',
      subject: emailData.subject,
      content: emailData.content,
      status: 'failed',
      errorMessage: error.message
    });
    await emailLog.save();

    return { success: false, error: error.message };
  }
};

// Sync inbox for replies and bounces
export const syncInbox = async (account) => {
  try {
    const client = new ImapFlow({
      host: account.imapSettings.host,
      port: account.imapSettings.port,
      secure: account.imapSettings.secure,
      auth: {
        user: account.smtpSettings.username,
        pass: account.smtpSettings.password
      }
    });

    await client.connect();

    // Get inbox sync record
    let inboxSync = await InboxSync.findOne({ emailAccountId: account._id });
    if (!inboxSync) {
      inboxSync = new InboxSync({
        userId: account.userId,
        emailAccountId: account._id
      });
    }

    inboxSync.syncStatus = 'syncing';
    await inboxSync.save();

    let emailsProcessed = 0;
    let repliesFound = 0;
    let bouncesFound = 0;

    try {
      // Select INBOX
      await client.mailboxOpen('INBOX');

      // Get messages since last sync
      const searchCriteria = inboxSync.lastUid 
        ? { uid: `${inboxSync.lastUid + 1}:*` }
        : { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // Last 7 days

      for await (let message of client.fetch(searchCriteria, { 
        envelope: true, 
        bodyStructure: true,
        source: true 
      })) {
        emailsProcessed++;
        
        // Check if this is a reply to our campaign emails
        const isReply = await checkIfReply(message, account);
        if (isReply) {
          repliesFound++;
          await processReply(message, account);
        }

        // Check if this is a bounce
        const isBounce = await checkIfBounce(message, account);
        if (isBounce) {
          bouncesFound++;
          await processBounce(message, account);
        }

        inboxSync.lastUid = message.uid;
      }

      inboxSync.syncStatus = 'idle';
      inboxSync.lastSyncAt = new Date();
      inboxSync.emailsProcessed += emailsProcessed;
      inboxSync.repliesFound += repliesFound;
      inboxSync.bouncesFound += bouncesFound;
      inboxSync.errorMessage = null;

    } catch (error) {
      inboxSync.syncStatus = 'error';
      inboxSync.errorMessage = error.message;
      throw error;
    } finally {
      await inboxSync.save();
      await client.logout();
    }

    return {
      emailsProcessed,
      repliesFound,
      bouncesFound
    };

  } catch (error) {
    console.error('Error syncing inbox:', error);
    throw error;
  }
};

// Check if email is a reply to our campaigns
const checkIfReply = async (message, account) => {
  try {
    // Check if the In-Reply-To or References headers match our sent emails
    const inReplyTo = message.envelope.inReplyTo;
    const references = message.envelope.references;

    if (inReplyTo) {
      const originalEmail = await EmailLog.findOne({
        emailAccountId: account._id,
        messageId: inReplyTo[0]
      });
      return !!originalEmail;
    }

    if (references && references.length > 0) {
      const originalEmail = await EmailLog.findOne({
        emailAccountId: account._id,
        messageId: { $in: references }
      });
      return !!originalEmail;
    }

    return false;
  } catch (error) {
    console.error('Error checking if reply:', error);
    return false;
  }
};

// Process reply
const processReply = async (message, account) => {
  try {
    const fromEmail = message.envelope.from[0].address;
    
    // Find the lead
    const lead = await Lead.findOne({
      userId: account.userId,
      email: fromEmail
    });

    if (lead) {
      // Update lead status
      lead.status = 'replied';
      lead.lastContactedAt = new Date();
      await lead.save();

      // Find and update the original email log
      const originalEmail = await EmailLog.findOne({
        emailAccountId: account._id,
        leadId: lead._id,
        status: { $in: ['sent', 'delivered', 'opened'] }
      }).sort({ sentAt: -1 });

      if (originalEmail) {
        originalEmail.status = 'replied';
        originalEmail.repliedAt = new Date();
        await originalEmail.save();

        // Update campaign stats
        if (originalEmail.campaignId) {
          await Campaign.findByIdAndUpdate(originalEmail.campaignId, {
            $inc: { 'stats.replied': 1 }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing reply:', error);
  }
};

// Check if email is a bounce
const checkIfBounce = async (message, account) => {
  try {
    const subject = message.envelope.subject || '';
    const from = message.envelope.from[0].address || '';

    // Common bounce indicators
    const bounceIndicators = [
      'delivery status notification',
      'undelivered mail returned',
      'mail delivery failed',
      'message not delivered',
      'bounce',
      'mailer-daemon',
      'postmaster'
    ];

    return bounceIndicators.some(indicator => 
      subject.toLowerCase().includes(indicator) || 
      from.toLowerCase().includes(indicator)
    );
  } catch (error) {
    console.error('Error checking if bounce:', error);
    return false;
  }
};

// Process bounce
const processBounce = async (message, account) => {
  try {
    // Extract the original recipient from bounce message
    // This is a simplified implementation - in production, you'd parse the bounce message more thoroughly
    const subject = message.envelope.subject || '';
    const emailMatch = subject.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    
    if (emailMatch) {
      const bouncedEmail = emailMatch[0];
      
      // Find the lead
      const lead = await Lead.findOne({
        userId: account.userId,
        email: bouncedEmail
      });

      if (lead) {
        // Update lead status
        lead.status = 'bounced';
        lead.bounceCount = (lead.bounceCount || 0) + 1;
        await lead.save();

        // Find and update the original email log
        const originalEmail = await EmailLog.findOne({
          emailAccountId: account._id,
          leadId: lead._id,
          status: { $in: ['sent', 'delivered'] }
        }).sort({ sentAt: -1 });

        if (originalEmail) {
          originalEmail.status = 'bounced';
          originalEmail.bouncedAt = new Date();
          await originalEmail.save();

          // Update campaign stats
          if (originalEmail.campaignId) {
            await Campaign.findByIdAndUpdate(originalEmail.campaignId, {
              $inc: { 'stats.bounced': 1 }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing bounce:', error);
  }
};

// Generate warmup email content
export const generateWarmupContent = () => {
  const subjects = [
    'Quick check-in',
    'Hope you\'re doing well',
    'Thought you might find this interesting',
    'Following up on our conversation',
    'Quick question for you',
    'Hope your week is going great',
    'Checking in',
    'How are things going?'
  ];

  const contents = [
    'Hi there,\n\nJust wanted to check in and see how things are going on your end. Hope you\'re having a great week!\n\nBest regards',
    'Hello,\n\nI hope this email finds you well. Just wanted to reach out and say hello.\n\nTake care',
    'Hi,\n\nI was thinking about our last conversation and wanted to follow up. How have things been?\n\nBest',
    'Hello there,\n\nI hope you\'re having a wonderful day. Just wanted to drop a quick note to say hi.\n\nWarm regards',
    'Hi,\n\nI hope everything is going well with you. Just wanted to check in and see how you\'re doing.\n\nBest wishes'
  ];

  return {
    subject: subjects[Math.floor(Math.random() * subjects.length)],
    content: contents[Math.floor(Math.random() * contents.length)]
  };
};

// Update daily email count
const updateDailyEmailCount = async (accountId) => {
  try {
    const account = await EmailAccount.findById(accountId);
    if (!account) return;

    const today = new Date();
    const lastReset = new Date(account.lastResetDate);

    // Reset count if it's a new day
    if (today.toDateString() !== lastReset.toDateString()) {
      account.emailsSentToday = 1;
      account.lastResetDate = today;
    } else {
      account.emailsSentToday += 1;
    }

    await account.save();
  } catch (error) {
    console.error('Error updating daily email count:', error);
  }
};

// Generate tracking pixel ID
const generateTrackingPixelId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Handle tracking pixel opens
export const handleTrackingPixelOpen = async (pixelId) => {
  try {
    const emailLog = await EmailLog.findOne({ trackingPixelId: pixelId });
    if (emailLog && emailLog.status !== 'opened') {
      emailLog.status = 'opened';
      emailLog.openedAt = new Date();
      await emailLog.save();

      // Update campaign stats
      if (emailLog.campaignId) {
        await Campaign.findByIdAndUpdate(emailLog.campaignId, {
          $inc: { 'stats.opened': 1 }
        });
      }

      // Update lead status
      if (emailLog.leadId) {
        await Lead.findByIdAndUpdate(emailLog.leadId, {
          status: 'opened'
        });
      }
    }
  } catch (error) {
    console.error('Error handling tracking pixel open:', error);
  }
};