import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { EmailLog, WarmupEmail, InboxSync, Lead, Campaign } from '../models/ColdEmailSystem.js';

// Create SMTP transporter
export const createTransporter = (account) => {
  console.log('Creating SMTP transporter for:', account.email);
  console.log('SMTP Settings:', {
    host: account.smtpSettings.host,
    port: account.smtpSettings.port,
    secure: account.smtpSettings.port === 465,
    auth: {
      user: account.smtpSettings.username,
      pass: '********' // Password hidden for security
    }
  });

  return nodemailer.createTransport({
    host: account.smtpSettings.host,
    port: account.smtpSettings.port,
    secure: account.smtpSettings.port === 465,
    auth: {
      user: account.smtpSettings.username,
      pass: account.smtpSettings.password
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1'
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  });
};

// Send email function
export const sendEmail = async (account, emailData) => {
  try {
    console.log('📧 Attempting to send email with account:', account.email, 'to:', emailData.to);
    
    if (!account.smtpSettings || !account.smtpSettings.host || !account.smtpSettings.username || !account.smtpSettings.password) {
      throw new Error('Invalid SMTP settings. Please check your email account configuration.');
    }
    
    const transporter = createTransporter(account);
    
    let mailOptions = {
      from: `${account.name} <${account.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.subject}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    p {
      margin-bottom: 16px;
    }
    .signature {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  ${emailData.content}
  
  <div class="signature">
    ${account.name}<br>
    ${account.email}
  </div>
</body>
</html>`,
      text: emailData.content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      headers: {
        'X-Mailer': 'ProductivePro Cold Email System',
        'List-Unsubscribe': `<mailto:unsubscribe@${account.email.split('@')[1]}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    };

    // Add reply headers if this is a reply
    if (emailData.type === 'reply' && emailData.inReplyTo) {
      mailOptions.headers = {
        ...mailOptions.headers,
        'In-Reply-To': emailData.inReplyTo,
        'References': emailData.threadId || emailData.inReplyTo
      };
    }

    // Add tracking pixel if enabled
    if (emailData.trackingEnabled) {
      const trackingPixelId = generateTrackingPixelId();
      const trackingPixel = `<img src="https://track.productivepro.com/pixel/${trackingPixelId}" width="1" height="1" style="display:none;" />`;
      mailOptions.html += trackingPixel;
      emailData.trackingPixelId = trackingPixelId;
    }

    console.log('📧 Sending email:', {
      from: account.email,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    
    // Log the email
    try {
      const emailLog = new EmailLog({
        userId: account.userId,
        campaignId: emailData.campaignId,
        leadId: emailData.leadId,
        emailAccountId: account._id.toString(),
        type: emailData.type || 'campaign',
        stepNumber: emailData.stepNumber,
        subject: emailData.subject,
        content: emailData.content,
        status: 'sent',
        sentAt: new Date(),
        trackingPixelId: emailData.trackingPixelId,
        inReplyTo: emailData.inReplyTo,
        messageId: info.messageId
      });
      await emailLog.save();
      console.log('📝 Email log saved successfully');
    } catch (logError) {
      console.error('❌ Error saving email log:', logError);
      // Continue execution even if logging fails
    }

    // Update account daily count
    await updateDailyEmailCount(account._id);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
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
    console.log('🔄 Starting inbox sync for account:', account.email, account._id);
    
    // Use SMTP settings for IMAP if not explicitly provided
    const imapHost = account.imapSettings?.host || account.smtpSettings.host;
    const imapPort = account.imapSettings?.port || 993;
    const imapSecure = account.imapSettings?.secure !== false;
    
    if (!account || !imapHost || !account.smtpSettings.username || !account.smtpSettings.password) {
      throw new Error('Invalid account or missing IMAP/SMTP settings');
    }
    
    console.log('🔌 IMAP Settings:', {
      host: imapHost,
      port: imapPort,
      secure: imapSecure,
      auth: {
        user: account.smtpSettings.username,
        pass: '********' // Password hidden for security
      }
    });
    
    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: imapSecure,
      auth: {
        user: account.smtpSettings.username,
        pass: account.smtpSettings.password
      },
      logger: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('🔌 Connecting to IMAP server:', imapHost);
    await client.connect();
    console.log('✅ Connected to IMAP server');

    // Get inbox sync record
    let inboxSync;
    try {
      inboxSync = await InboxSync.findOne({ emailAccountId: account._id });
      console.log('📋 Found existing inbox sync record:', inboxSync ? 'yes' : 'no');
    } catch (findError) {
      console.error('❌ Error finding inbox sync record:', findError);
    }
    
    if (!inboxSync) {
      console.log('📝 Creating new inbox sync record for account:', account._id);
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
      console.log('📬 Opened INBOX mailbox');

      // Get messages since last sync
      const searchCriteria = inboxSync.lastUid 
        ? { uid: `${inboxSync.lastUid + 1}:*` }
        : { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // Last 7 days

      console.log('🔍 Searching for messages with criteria:', JSON.stringify(searchCriteria));
      
      for await (let message of client.fetch(searchCriteria, { 
        envelope: true, 
        bodyStructure: true,
        source: true 
      })) {
        emailsProcessed++;
        console.log(`📨 Processing message ${emailsProcessed}: ${message.envelope.subject}`);
        
        // Check if this is a reply to our campaign emails
        const isReply = await checkIfReply(message, account);
        if (isReply) {
          console.log('↩️ Found reply to campaign email');
          repliesFound++;
          await processReply(message, account);
        }

        // Check if this is a bounce
        const isBounce = await checkIfBounce(message, account);
        if (isBounce) {
          console.log('↩️ Found bounce notification');
          bouncesFound++;
          await processBounce(message, account);
        }

        // Store the message in the inbox
        await storeInboxMessage(message, account);
        
        inboxSync.lastUid = message.uid;
      }

      inboxSync.syncStatus = 'idle';
      inboxSync.lastSyncAt = new Date();
      inboxSync.emailsProcessed += emailsProcessed;
      inboxSync.repliesFound += repliesFound;
      inboxSync.bouncesFound += bouncesFound;
      inboxSync.errorMessage = null;

    } catch (error) {
      console.error('❌ Error during inbox sync:', error);
      inboxSync.syncStatus = 'error';
      inboxSync.errorMessage = error.message;
      throw error;
    } finally {
      await inboxSync.save();
      console.log('🔌 Closing IMAP connection');
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
    console.log('🔍 Checking if message is a reply:', message.envelope?.subject);
    // Check if the In-Reply-To or References headers match our sent emails
    const inReplyTo = message.envelope?.inReplyTo;
    const references = message.envelope?.references;
    
    // Also check subject line for Re: prefix
    const subject = message.envelope?.subject || '';
    const isReSubject = subject.toLowerCase().startsWith('re:');

    if (inReplyTo) {
      console.log('🔍 Checking In-Reply-To header:', inReplyTo);
      const originalEmail = await EmailLog.findOne({
        emailAccountId: account._id,
        messageId: inReplyTo[0]
      });
      if (originalEmail) {
        console.log('✅ Found matching original email by In-Reply-To');
      }
      return !!originalEmail;
    }

    if (references?.length > 0) {
      console.log('🔍 Checking References headers:', references);
      const originalEmail = await EmailLog.findOne({
        emailAccountId: account._id,
        messageId: { $in: references }
      });
      if (originalEmail) {
        console.log('✅ Found matching original email by References');
      }
      return !!originalEmail;
    }
    
    // If it has Re: in subject, try to find a matching sent email
    if (isReSubject) {
      console.log('🔍 Found Re: prefix in subject, checking for original email');
      const cleanSubject = subject.replace(/^re:\s*/i, '').trim();
      
      // Find sent emails with matching subject
      const originalEmail = await EmailLog.findOne({
        emailAccountId: account._id,
        subject: cleanSubject,
        status: { $in: ['sent', 'delivered', 'opened'] }
      });
      
      if (originalEmail) {
        console.log('✅ Found matching original email by subject');
        return true;
      }
    }

    console.log('❌ Not identified as a reply');
    return false;
  } catch (error) {
    console.error('Error checking if reply:', error);
    return false;
  }
};

// Process reply
const processReply = async (message, account) => {
  try {
    console.log('📝 Processing reply message:', message.envelope?.subject);
    const fromEmail = message.envelope?.from?.[0]?.address;
    
    if (!fromEmail) {
      console.log('❌ No from email address found in message');
      return;
    }
    
    // Find the lead
    const lead = await Lead.findOne({
      userId: account.userId,
      email: fromEmail
    });

    if (lead) {
      console.log('👤 Found lead:', lead.email);
      // Update lead status
      lead.status = 'replied';
      lead.lastContactedAt = new Date();
      await lead.save();
      console.log('✅ Updated lead status to replied');

      // Find and update the original email log
      const originalEmail = await EmailLog.findOne({
        emailAccountId: account._id,
        leadId: lead._id,
        status: { $in: ['sent', 'delivered', 'opened'] }
      }).sort({ sentAt: -1 });

      if (originalEmail) {
        console.log('✉️ Found original email log');
        originalEmail.status = 'replied';
        originalEmail.repliedAt = new Date();
        await originalEmail.save();
        console.log('✅ Updated email log status to replied');

        // Update campaign stats
        if (originalEmail.campaignId) {
          console.log('📊 Updating campaign stats');
          await Campaign.findByIdAndUpdate(originalEmail.campaignId, {
            $inc: { 'stats.replied': 1 }
          });
          console.log('✅ Campaign stats updated');
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
    console.log('🔍 Checking if message is a bounce:', message.envelope?.subject);
    const subject = message.envelope?.subject || '';
    const from = message.envelope?.from?.[0]?.address || '';

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

    const isBounce = bounceIndicators.some(indicator => 
      subject.toLowerCase().includes(indicator) || 
      from.toLowerCase().includes(indicator)
    );
    
    if (isBounce) {
      console.log('✅ Message identified as bounce notification');
    }
    
    return isBounce;
  } catch (error) {
    console.error('Error checking if bounce:', error);
    return false;
  }
};

// Process bounce
const processBounce = async (message, account) => {
  try {
    console.log('📝 Processing bounce message');
    // Extract the original recipient from bounce message
    // This is a simplified implementation - in production, you'd parse the bounce message more thoroughly
    const subject = message.envelope.subject || '';
    const emailMatch = subject.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    
    if (emailMatch) {
      console.log('📧 Found bounced email address:', emailMatch[0]);
      const bouncedEmail = emailMatch[0];
      
      // Find the lead
      const lead = await Lead.findOne({
        userId: account.userId,
        email: bouncedEmail
      });

      if (lead) {
        console.log('👤 Found lead:', lead.email);
        // Update lead status
        lead.status = 'bounced';
        lead.bounceCount = (lead.bounceCount || 0) + 1;
        await lead.save();
        console.log('✅ Updated lead status to bounced');

        // Find and update the original email log
        const originalEmail = await EmailLog.findOne({
          emailAccountId: account._id,
          leadId: lead._id,
          status: { $in: ['sent', 'delivered'] }
        }).sort({ sentAt: -1 });

        if (originalEmail) {
          console.log('✉️ Found original email log');
          originalEmail.status = 'bounced';
          originalEmail.bouncedAt = new Date();
          await originalEmail.save();
          console.log('✅ Updated email log status to bounced');

          // Update campaign stats
          if (originalEmail.campaignId) {
            console.log('📊 Updating campaign stats');
            await Campaign.findByIdAndUpdate(originalEmail.campaignId, {
              $inc: { 'stats.bounced': 1 }
            });
            console.log('✅ Campaign stats updated');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing bounce:', error);
  }
};

// Store message in inbox
const storeInboxMessage = async (message, account) => {
  try {
    console.log('💾 Storing message in inbox database:', message.envelope?.messageId);
    
    // Import InboxMessage model if not already available
    const { InboxMessage } = await import('../models/ColdEmailSystemIndex.js');
    
    // Check if message already exists
    let messageId = message.envelope?.messageId;
    if (!messageId && message.source) {
      // Try to extract message ID from source if not in envelope
      const messageIdMatch = message.source.toString().match(/Message-ID:\s*<([^>]+)>/i);
      if (messageIdMatch && messageIdMatch[1]) {
        messageId = messageIdMatch[1];
      }
    }
    
    if (!messageId) {
      console.log('⚠️ No message ID found, generating a random one');
      messageId = `generated-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    const existingMessage = await InboxMessage.findOne({ messageId });
    
    if (existingMessage) {
      console.log('⚠️ Message already exists in database');
      return;
    }
    
    // Parse message content
    let textContent = '';
    let htmlContent = '';
    let from = { name: '', email: '' };
    let to = [];
    let subject = '';
    let receivedDate = new Date();
    
    try {
      // Extract message details from envelope or source
      if (message.envelope) {
        from = {
          name: message.envelope.from?.[0]?.name || '',
          email: message.envelope.from?.[0]?.address || ''
        };
        to = message.envelope.to?.map(recipient => ({
          name: recipient.name || '',
          email: recipient.address
        })) || [];
        subject = message.envelope.subject || '(No Subject)';
        receivedDate = message.envelope.date || new Date();
      }
      
      // Extract content from source
      if (message.source) {
        const sourceStr = message.source.toString();
        
        // Extract text content
        const textMatches = sourceStr.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\nContent-Type)/i);
        if (textMatches && textMatches[1]) {
          textContent = textMatches[1].trim();
        }
        
        // Extract HTML content
        const htmlMatches = sourceStr.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\n$)/i);
        if (htmlMatches && htmlMatches[1]) {
          htmlContent = htmlMatches[1].trim();
        }
        
        // If we couldn't extract from envelope, try from headers
        if (!from.email) {
          const fromMatch = sourceStr.match(/From:\s*"?([^"<]*)"?\s*<?([^>]*)>?/i);
          if (fromMatch) {
            from = {
              name: fromMatch[1]?.trim() || '',
              email: fromMatch[2]?.trim() || ''
            };
          }
        }
        
        if (!subject) {
          const subjectMatch = sourceStr.match(/Subject:\s*(.*?)(?:\r\n|\n)/i);
          if (subjectMatch && subjectMatch[1]) {
            subject = subjectMatch[1].trim();
          }
        }
      }
    } catch (error) {
      console.error('Error parsing message content:', error);
    }
    
    // Create inbox message
    const inboxMessage = new InboxMessage({
      userId: account.userId.toString(),
      emailAccountId: account._id.toString(),
      messageId: messageId,
      threadId: messageId, // Simple implementation - in production you'd use proper threading
      from: from,
      to: to,
      subject: subject,
      content: {
        text: textContent,
        html: htmlContent
      },
      isRead: false,
      isStarred: false,
      receivedAt: receivedDate
    });
    
    await inboxMessage.save();
    console.log('✅ Message stored in inbox database:', inboxMessage._id);
    
    return inboxMessage;
  } catch (error) {
    console.error('Error storing inbox message:', error);
    console.error('Error details:', error.stack);
    return null;
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