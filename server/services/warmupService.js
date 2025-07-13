import dns from 'dns';
import { promisify } from 'util';
import { 
  EmailAccount, 
  WarmupEmail, 
  InboxSync, 
  InboxMessage 
} from '../models/ColdEmailSystemIndex.js';
import { sendEmail, createTransporter } from './emailService.js';

// Promisify DNS functions
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);

// Blacklisted domains for warmup
const BLACKLISTED_DOMAINS = [
  'yopmail.com',
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'trashmail.com',
  'temp-mail.org',
  'disposablemail.com',
  'throwawaymail.com',
  'fakeinbox.com'
];

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
    
    // Check if this is a warmup email
    const isWarmup = await WarmupEmail.findOne({
      $or: [
        { messageId },
        { 
          $and: [
            { fromAccountId: { $ne: account._id } },
            { toAccountId: account._id }
          ]
        }
      ]
    });
    
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
      isWarmup: !!isWarmup || subject.toLowerCase().includes('warmup') || from.email.includes('warmup'),
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

// Start warmup for an account
export const startWarmupForAccount = async (account) => {
  try {
    console.log(`🔥 Starting warmup for account: ${account.email}`);
    
    // Update account status
    account.warmupStatus = 'in-progress';
    
    // Initialize warmup settings if not present
    if (!account.warmupSettings) {
      account.warmupSettings = {
        enabled: true,
        dailyWarmupEmails: 5,
        rampUpDays: 30,
        maxDailyEmails: 40,
        throttleRate: 5,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        workingDays: [0, 1, 2, 3, 4, 5, 6], // All days of the week
        startTime: '09:00',
        endTime: '17:00',
        autoReply: true,
        autoArchive: true,
        replyDelay: 30,
        maxThreadLength: 3
      };
    }
    
    await account.save();
    
    // Schedule warmup emails immediately
    await scheduleWarmupEmails(account);
    
    console.log(`✅ Warmup started for account: ${account.email}`);
    return account;
  } catch (error) {
    console.error(`Error starting warmup for account ${account.email}:`, error);
    throw error;
  }
};

// Pause warmup for an account
export const pauseWarmupForAccount = async (account) => {
  try {
    console.log(`⏸️ Pausing warmup for account: ${account.email}`);
    
    // Update account status
    account.warmupStatus = 'paused';
    await account.save();
    
    console.log(`✅ Warmup paused for account: ${account.email}`);
    return account;
  } catch (error) {
    console.error(`Error pausing warmup for account ${account.email}:`, error);
    throw error;
  }
};

// Resume warmup for an account
export const resumeWarmupForAccount = async (account) => {
  try {
    console.log(`▶️ Resuming warmup for account: ${account.email}`);
    
    // Update account status
    account.warmupStatus = 'in-progress';
    await account.save();
    
    console.log(`✅ Warmup resumed for account: ${account.email}`);
    return account;
  } catch (error) {
    console.error(`Error resuming warmup for account ${account.email}:`, error);
    throw error;
  }
};

// Stop warmup for an account
export const stopWarmupForAccount = async (account) => {
  try {
    console.log(`⏹️ Stopping warmup for account: ${account.email}`);
    
    // Update account status
    account.warmupStatus = 'not-started';
    await account.save();
    
    console.log(`✅ Warmup stopped for account: ${account.email}`);
    return account;
  } catch (error) {
    console.error(`Error stopping warmup for account ${account.email}:`, error);
    throw error;
  }
};

// Send warmup email
export const sendWarmupEmail = async (fromAccount, toAccount) => {
  try {
    console.log(`📧 Sending warmup email from ${fromAccount.email} to ${toAccount.email}`);
    
    // Generate warmup email content
    const { subject, content } = generateWarmupContent();
    
    // Send email
    const emailData = {
      to: toAccount.email,
      subject,
      content,
      type: 'warmup'
    };
    
    const result = await sendEmail(fromAccount, emailData);
    
    if (result.success) {
      // Create warmup email record
      const warmupEmail = new WarmupEmail({
        userId: fromAccount.userId,
        fromAccountId: fromAccount._id,
        toAccountId: toAccount._id,
        subject,
        content,
        sentAt: new Date(),
        status: 'sent',
        isReply: false
      });
      
      await warmupEmail.save();
      
      console.log(`✅ Warmup email sent from ${fromAccount.email} to ${toAccount.email}`);
      return warmupEmail;
    } else {
      throw new Error(result.error || 'Failed to send warmup email');
    }
  } catch (error) {
    console.error(`Error sending warmup email from ${fromAccount.email} to ${toAccount.email}:`, error);
    throw error;
  }
};

// Generate warmup email content
export const generateWarmupContent = () => {
  // Random subjects
  const subjects = [
    '【WARMUP】Quick update on our project',
    '【WARMUP】Following up on our conversation',
    '【WARMUP】Thoughts on the latest developments',
    '【WARMUP】Checking in - how are things going?',
    '【WARMUP】Quick question about our collaboration',
    '【WARMUP】Updates from our team',
    '【WARMUP】Interesting article you might enjoy',
    '【WARMUP】Feedback on your recent work',
    '【WARMUP】Just wanted to touch base',
    '【WARMUP】Ideas for our next steps',
    '【WARMUP】Proposal for improvement',
    '【WARMUP】Great news to share',
    '【WARMUP】Important information for you',
    '【WARMUP】Scheduling our next meeting',
    '【WARMUP】Resources you might find helpful'
  ];
  
  // Random greetings
  const greetings = [
    'Hi there,',
    'Hello,',
    'Good morning,',
    'Good afternoon,',
    'Hey,',
    'Greetings,',
    'Hi friend,',
    'Hello there,'
  ];
  
  // Random body content
  const bodyContents = [
    'I wanted to follow up on our previous conversation. How are things progressing on your end? We\'ve made some significant progress here and I\'d love to share updates with you soon.',
    
    'I came across this interesting article that I thought might be relevant to our discussion. It highlights some innovative approaches that could be beneficial for our project.',
    
    'I\'ve been thinking about the challenges we discussed last time. I have a few ideas that might help address them effectively. Would you be available for a quick call to discuss?',
    
    'Just checking in to see how everything is going. Our team has been making steady progress, and we\'re on track to meet our deadlines. Let me know if you need any assistance from our end.',
    
    'I wanted to share some exciting news with you. We\'ve recently achieved a significant milestone, and I believe it will positively impact our collaboration.',
    
    'I hope this email finds you well. I\'ve been reviewing our project timeline and wanted to ensure we\'re aligned on the next steps. Could you provide a quick update on your progress?',
    
    'I\'ve been reflecting on our last meeting and had some additional thoughts that might be worth exploring. I\'d appreciate your perspective on these ideas.',
    
    'I wanted to touch base regarding our upcoming deadline. Is there anything you need from me to ensure we stay on track? I\'m here to help if needed.',
    
    'I recently discovered a new tool that could streamline our workflow significantly. I\'d be happy to demonstrate how it works if you\'re interested.',
    
    'I hope you\'re having a productive week. I wanted to follow up on the action items from our last discussion. Have you had a chance to review the materials I sent?'
  ];
  
  // Random closings
  const closings = [
    'Best regards,',
    'Thanks,',
    'Cheers,',
    'All the best,',
    'Warm regards,',
    'Kind regards,',
    'Regards,',
    'Sincerely,',
    'Best wishes,',
    'Appreciate your time,'
  ];
  
  // Random signatures
  const signatures = [
    'John',
    'Sarah',
    'Michael',
    'Emily',
    'David',
    'Jennifer',
    'Robert',
    'Lisa',
    'William',
    'Jessica'
  ];
  
  // Randomly select components
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const bodyContent = bodyContents[Math.floor(Math.random() * bodyContents.length)];
  const closing = closings[Math.floor(Math.random() * closings.length)];
  const signature = signatures[Math.floor(Math.random() * signatures.length)];
  
  // Construct email content
  const content = `${greeting}

${bodyContent}

${closing}
${signature}`;
  
  return { subject, content };
};

// Process warmup reply
export const processWarmupReply = async (account, message, originalEmail) => {
  try {
    console.log(`📧 Processing warmup reply for account: ${account.email}`);
    
    // Check if auto-reply is enabled
    if (!account.warmupSettings?.autoReply) {
      console.log(`❌ Auto-reply disabled for account: ${account.email}`);
      return;
    }
    
    // Check thread length
    const maxThreadLength = account.warmupSettings?.maxThreadLength || 3;
    const threadId = message.threadId || message.messageId;
    
    // Count existing replies in this thread
    const existingReplies = await WarmupEmail.countDocuments({
      userId: account.userId,
      $or: [
        { threadId },
        { parentEmailId: originalEmail._id }
      ],
      isReply: true
    });
    
    if (existingReplies >= maxThreadLength - 1) {
      console.log(`❌ Maximum thread length reached for thread: ${threadId}`);
      return;
    }
    
    // Add random delay before replying
    const replyDelay = account.warmupSettings?.replyDelay || 30;
    const randomDelay = Math.floor(Math.random() * replyDelay * 60 * 1000);
    
    setTimeout(async () => {
      try {
        // Generate reply content
        const { subject, content } = generateWarmupReply(message.subject, message.content?.text);
        
        // Get the original sender account
        const fromAccount = await EmailAccount.findById(originalEmail.fromAccountId);
        
        if (!fromAccount) {
          console.log(`❌ Original sender account not found: ${originalEmail.fromAccountId}`);
          return;
        }
        
        // Send reply
        const emailData = {
          to: fromAccount.email,
          subject,
          content,
          type: 'warmup',
          inReplyTo: message.messageId,
          threadId: message.threadId || message.messageId
        };
        
        const result = await sendEmail(account, emailData);
        
        if (result.success) {
          // Create warmup email record
          const warmupEmail = new WarmupEmail({
            userId: account.userId,
            fromAccountId: account._id,
            toAccountId: fromAccount._id,
            subject,
            content,
            sentAt: new Date(),
            status: 'sent',
            isReply: true,
            parentEmailId: originalEmail._id,
            threadId: message.threadId || message.messageId
          });
          
          await warmupEmail.save();
          
          // Update original email
          originalEmail.repliedAt = new Date();
          originalEmail.status = 'replied';
          await originalEmail.save();
          
          console.log(`✅ Warmup reply sent from ${account.email} to ${fromAccount.email}`);
          
          // Auto archive if enabled
          if (account.warmupSettings?.autoArchive) {
            // Mark message as read and archived
            // This would be implemented with IMAP in a production environment
            console.log(`📁 Auto-archiving message: ${message.messageId}`);
          }
        } else {
          console.error(`❌ Failed to send warmup reply: ${result.error}`);
        }
      } catch (replyError) {
        console.error(`Error sending warmup reply:`, replyError);
      }
    }, randomDelay);
    
    console.log(`⏱️ Scheduled warmup reply with ${replyDelay} minute delay (actual: ${randomDelay / 1000 / 60} minutes)`);
  } catch (error) {
    console.error(`Error processing warmup reply:`, error);
    throw error;
  }
};

// Generate warmup reply
export const generateWarmupReply = (originalSubject, originalContent) => {
  // Ensure subject has Re: prefix
  const subject = originalSubject.startsWith('Re:') 
    ? originalSubject 
    : `Re: ${originalSubject}`;
  
  // Random reply intros
  const replyIntros = [
    'Thanks for your email!',
    'Good to hear from you.',
    'Thanks for the update.',
    'I appreciate you reaching out.',
    'Thanks for sharing this information.',
    'Great to get your message.',
    'Thanks for following up.',
    'I received your email, thank you.',
    'Thanks for the quick response.',
    'I appreciate your thoughts on this.'
  ];
  
  // Random reply bodies
  const replyBodies = [
    'I completely agree with your points. Let\'s continue this discussion soon.',
    'That sounds like a great approach. I\'ll review the details and get back to you with any additional thoughts.',
    'I think you\'re on the right track. Let\'s schedule some time to discuss this further.',
    'Your suggestions make a lot of sense. I\'ll work on implementing them right away.',
    'I see what you mean. Let\'s explore these ideas in more depth when we next connect.',
    'This is very helpful information. I\'ll incorporate it into our planning.',
    'I think this is a solid plan. Let\'s move forward with it and see how it goes.',
    'You\'ve given me a lot to think about. I\'ll consider these points carefully.',
    'I\'m excited about the direction this is taking. Let\'s keep the momentum going.',
    'This aligns well with what I was thinking. Great minds think alike!'
  ];
  
  // Random questions to add
  const questions = [
    'What do you think about moving forward with this next week?',
    'Do you have any other suggestions we should consider?',
    'Would it make sense to involve the team in this discussion?',
    'What timeline are you thinking for the next steps?',
    'Have you had any experience with similar projects before?',
    'Do you think we should prioritize this over our other initiatives?',
    'What resources do you think we\'ll need to make this happen?',
    'Is there anyone else we should loop into this conversation?',
    'What potential challenges do you foresee with this approach?',
    'How does this align with our overall objectives?'
  ];
  
  // Random closings
  const closings = [
    'Looking forward to your thoughts.',
    'Let me know what you think.',
    'I\'m eager to hear your perspective.',
    'Let\'s touch base soon.',
    'Looking forward to our continued collaboration.',
    'Thanks again for your input.',
    'I value your feedback on this.',
    'Let\'s keep this conversation going.',
    'I appreciate your time and insights.',
    'Looking forward to working together on this.'
  ];
  
  // Random signatures
  const signatures = [
    'Best regards,',
    'Thanks,',
    'Cheers,',
    'All the best,',
    'Warm regards,',
    'Kind regards,',
    'Regards,',
    'Sincerely,',
    'Best wishes,',
    'Appreciate your time,'
  ];
  
  // Randomly select components
  const intro = replyIntros[Math.floor(Math.random() * replyIntros.length)];
  const body = replyBodies[Math.floor(Math.random() * replyBodies.length)];
  const question = questions[Math.floor(Math.random() * questions.length)];
  const closing = closings[Math.floor(Math.random() * closings.length)];
  const signature = signatures[Math.floor(Math.random() * signatures.length)];
  
  // Construct reply content
  const content = `${intro}

${body}

${question}

${closing}

${signature}
`;
  
  return { subject, content };
};

// Check DNS records for an email domain
export const checkDnsRecords = async (account) => {
  try {
    console.log(`🔍 Checking DNS records for domain: ${account.email.split('@')[1]}`);
    
    const domain = account.email.split('@')[1];
    
    // Check MX records
    let mxRecords = [];
    let spfRecords = [];
    let dkimRecords = [];
    let dmarcRecords = [];
    
    try {
      mxRecords = await resolveMx(domain);
    } catch (mxError) {
      console.error(`Error resolving MX records for ${domain}:`, mxError);
    }
    
    // Check SPF records
    try {
      const txtRecords = await resolveTxt(domain);
      spfRecords = txtRecords.filter(record => 
        record.join('').toLowerCase().startsWith('v=spf1')
      );
    } catch (spfError) {
      console.error(`Error resolving SPF records for ${domain}:`, spfError);
    }
    
    // Check DKIM records (this is a simplified check)
    try {
      const selectors = ['default', 'dkim', 'mail', 'email', 'selector1', 'selector2'];
      for (const selector of selectors) {
        try {
          const dkimRecord = await resolveTxt(`${selector}._domainkey.${domain}`);
          if (dkimRecord.length > 0) {
            dkimRecords.push(dkimRecord);
            break; // Found a valid DKIM record
          }
        } catch (dkimSelectorError) {
          // Ignore errors for individual selectors
        }
      }
    } catch (dkimError) {
      console.error(`Error resolving DKIM records for ${domain}:`, dkimError);
    }
    
    // Check DMARC records
    try {
      const dmarcRecord = await resolveTxt(`_dmarc.${domain}`);
      dmarcRecords = dmarcRecord.filter(record => 
        record.join('').toLowerCase().startsWith('v=dmarc1')
      );
    } catch (dmarcError) {
      console.error(`Error resolving DMARC records for ${domain}:`, dmarcError);
    }
    
    const result = {
      domain,
      mx: mxRecords.length > 0,
      spf: spfRecords.length > 0,
      dkim: dkimRecords.length > 0,
      dmarc: dmarcRecords.length > 0,
      checkedAt: new Date(),
      details: {
        mxRecords,
        spfRecords,
        dkimRecords,
        dmarcRecords
      }
    };
    
    console.log(`✅ DNS check completed for ${domain}:`, {
      mx: result.mx,
      spf: result.spf,
      dkim: result.dkim,
      dmarc: result.dmarc
    });
    
    return result;
  } catch (error) {
    console.error(`Error checking DNS records:`, error);
    throw error;
  }
};

// Check if domain is blacklisted
export const isDomainBlacklisted = (email) => {
  const domain = email.split('@')[1].toLowerCase();
  return BLACKLISTED_DOMAINS.includes(domain);
};

// Update inbox health score
export const updateInboxHealthScore = async (account) => {
  try {
    console.log(`📊 Updating inbox health score for account: ${account.email}`);
    
    // Get warmup emails sent by this account
    const sentEmails = await WarmupEmail.find({ 
      userId: account.userId,
      fromAccountId: account._id
    });
    
    // Calculate metrics
    const totalSent = sentEmails.length;
    
    if (totalSent === 0) {
      console.log(`❌ No warmup emails sent yet for account: ${account.email}`);
      return;
    }
    
    const openRate = sentEmails.filter(email => email.openedAt).length / totalSent;
    const replyRate = sentEmails.filter(email => email.repliedAt).length / totalSent;
    
    // Get inbox sync data
    const inboxSync = await InboxSync.findOne({ 
      userId: account.userId,
      emailAccountId: account._id
    });
    
    const spamRate = inboxSync?.spamPlacements 
      ? inboxSync.spamPlacements / totalSent 
      : 0;
    
    // Calculate health score (0-100)
    // 50% weight on open rate, 30% on reply rate, 20% on spam rate (inverted)
    const healthScore = Math.round(
      (openRate * 50) + 
      (replyRate * 30) + 
      ((1 - spamRate) * 20)
    );
    
    // Update account reputation
    account.reputation = Math.max(0, Math.min(100, healthScore));
    await account.save();
    
    console.log(`✅ Updated inbox health score for ${account.email}: ${account.reputation}`);
    return account.reputation;
  } catch (error) {
    console.error(`Error updating inbox health score:`, error);
    throw error;
  }
};

// Schedule warmup emails for the day
export const scheduleWarmupEmails = async (account) => {
  try {
    console.log(`📅 Scheduling warmup emails for account: ${account.email}`);
    
    // Check if warmup is enabled and active
    if (account.warmupStatus !== 'in-progress' || !account.warmupSettings?.enabled) {
      console.log(`❌ Warmup not active for account: ${account.email}`);
      return;
    }
    
    // Send one email immediately after starting warmup
    const otherAccounts = await EmailAccount.find({
      userId: account.userId,
      _id: { $ne: account._id },
      isActive: true
    });
    
    if (otherAccounts.length === 0) {
      console.log(`❌ No other active accounts available for warmup: ${account.email}`);
      return;
    }
    
    // Select random target account for immediate sending
    const targetAccount = otherAccounts[Math.floor(Math.random() * otherAccounts.length)];
    console.log(`🚀 Sending immediate warmup email from ${account.email} to ${targetAccount.email}`);
    
    try {
      await sendWarmupEmail(account, targetAccount);
    } catch (sendError) {
      console.error(`Error sending immediate warmup email:`, sendError);
    }
    
    // Check if today is a working day
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (!account.warmupSettings.workingDays.includes(dayOfWeek)) {
      console.log(`❌ Today is not a working day for account: ${account.email}`);
      return;
    }
    
    // Check if we're within the date range
    const startDate = account.warmupSettings.startDate 
      ? new Date(account.warmupSettings.startDate) 
      : new Date(0);
    
    const endDate = account.warmupSettings.endDate
      ? new Date(account.warmupSettings.endDate)
      : new Date(8640000000000000); // Max date
    
    if (today < startDate || today > endDate) {
      console.log(`❌ Today is outside the warmup date range for account: ${account.email}`);
      return;
    }
    
    // Get other accounts for warmup
    const otherAccounts = await EmailAccount.find({
      userId: account.userId,
      _id: { $ne: account._id },
      isActive: true
    });
    
    if (otherAccounts.length === 0) {
      console.log(`❌ No other active accounts available for warmup: ${account.email}`);
      return;
    }
    
    // Calculate current daily volume based on ramp-up
    const firstWarmupEmail = await WarmupEmail.findOne({
      userId: account.userId,
      fromAccountId: account._id
    }).sort({ createdAt: 1 });
    
    const daysInWarmup = firstWarmupEmail
      ? Math.floor((Date.now() - new Date(firstWarmupEmail.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const dailyIncrease = (account.warmupSettings.maxDailyEmails - account.warmupSettings.dailyWarmupEmails) / account.warmupSettings.rampUpDays;
    const currentDailyVolume = Math.min(
      account.warmupSettings.maxDailyEmails,
      Math.floor(account.warmupSettings.dailyWarmupEmails + (dailyIncrease * daysInWarmup))
    );
    
    console.log(`📊 Current daily volume for ${account.email}: ${currentDailyVolume} emails`);
    
    // Check how many emails have been sent today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const emailsSentToday = await WarmupEmail.countDocuments({
      userId: account.userId,
      fromAccountId: account._id,
      sentAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (emailsSentToday >= currentDailyVolume) {
      console.log(`❌ Daily email limit reached for account: ${account.email}`);
      return;
    }
    
    // Calculate how many emails to send
    const emailsToSend = currentDailyVolume - emailsSentToday;
    
    // Calculate time window for sending
    const startTime = account.warmupSettings.startTime || '09:00';
    const endTime = account.warmupSettings.endTime || '17:00';
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date();
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date();
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    // If current time is outside the window, don't send emails
    if (today < startDateTime || today > endDateTime) {
      console.log(`❌ Current time is outside the sending window for account: ${account.email}`);
      return;
    }
    
    // Calculate time remaining in the window
    const timeRemainingMs = endDateTime.getTime() - today.getTime();
    const timeRemainingHours = timeRemainingMs / (1000 * 60 * 60);
    
    // Calculate throttle rate (emails per hour)
    const throttleRate = Math.min(
      account.warmupSettings.throttleRate || 5,
      Math.max(1, Math.ceil((emailsToSend - 1) / timeRemainingHours)) // Subtract 1 because we already sent one
    );
    
    console.log(`📊 Throttle rate for ${account.email}: ${throttleRate} emails/hour`);
    
    // Schedule emails with throttling
    const intervalMs = Math.floor((1000 * 60 * 60) / throttleRate);
    
    // Start from 1 since we already sent the first email
    for (let i = 1; i < emailsToSend; i++) {
      // Add random delay within the interval
      // Use a more random distribution throughout the day
      const randomDelay = Math.floor(Math.random() * timeRemainingMs);
      const delay = randomDelay;
      
      // Select random target account
      const targetAccount = otherAccounts[Math.floor(Math.random() * otherAccounts.length)];
      
      // Schedule email
      setTimeout(async () => {
        try {
          await sendWarmupEmail(account, targetAccount);
        } catch (sendError) {
          console.error(`Error sending scheduled warmup email:`, sendError);
        }
      }, delay);
      
      console.log(`⏱️ Scheduled warmup email ${i+1}/${emailsToSend} from ${account.email} to ${targetAccount.email} with delay: ${delay/1000} seconds`);
    }
    
    console.log(`✅ Scheduled ${emailsToSend} warmup emails for account: ${account.email}`);
  } catch (error) {
    console.error(`Error scheduling warmup emails:`, error);
    throw error;
  }
};

// Process spam folder for warmup emails
export const processSpamFolder = async (account) => {
  try {
    console.log(`🔍 Processing spam folder for account: ${account.email}`);
    
    // This would be implemented with IMAP in a production environment
    // For now, we'll simulate it
    
    // Get inbox sync data
    const inboxSync = await InboxSync.findOne({ 
      userId: account.userId,
      emailAccountId: account._id
    });
    
    if (!inboxSync) {
      console.log(`❌ No inbox sync data found for account: ${account.email}`);
      return;
    }
    
    // Update spam placements count
    if (!inboxSync.spamPlacements) {
      inboxSync.spamPlacements = 0;
    }
    
    // Check for warmup emails in spam folder
    const spamMessages = await InboxMessage.find({
      userId: account.userId,
      emailAccountId: account._id,
      labels: 'spam'
    });
    
    console.log(`📊 Found ${spamMessages.length} messages in spam folder for account: ${account.email}`);
    
    // Process each message
    for (const message of spamMessages) {
      // Check if this is a warmup email
      const warmupEmail = await WarmupEmail.findOne({
        userId: account.userId,
        toAccountId: account._id,
        messageId: message.messageId
      });
      
      if (warmupEmail) {
        console.log(`🔍 Found warmup email in spam folder: ${message.subject}`);
        
        // Update spam placements count
        inboxSync.spamPlacements += 1;
        
        // Update warmup email status
        warmupEmail.status = 'spam';
        await warmupEmail.save();
        
        // Move message out of spam (would be implemented with IMAP)
        console.log(`🔄 Moving warmup email out of spam: ${message.subject}`);
        
        // Update message labels
        message.labels = message.labels.filter(label => label !== 'spam');
        message.labels.push('inbox');
        message.labels.push('important');
        await message.save();
      }
    }
    
    // Save inbox sync data
    await inboxSync.save();
    
    // Update inbox health score
    await updateInboxHealthScore(account);
    
    console.log(`✅ Processed spam folder for account: ${account.email}`);
  } catch (error) {
    console.error(`Error processing spam folder:`, error);
    throw error;
  }
};

// Auto-pause warmup on spam alert
export const autoPauseOnSpamAlert = async (account) => {
  try {
    console.log(`🚨 Checking spam alerts for account: ${account.email}`);
    
    // Get inbox sync data
    const inboxSync = await InboxSync.findOne({ 
      userId: account.userId,
      emailAccountId: account._id
    });
    
    if (!inboxSync || !inboxSync.spamPlacements) {
      console.log(`❌ No spam data found for account: ${account.email}`);
      return;
    }
    
    // Get recent warmup emails
    const recentEmails = await WarmupEmail.find({
      userId: account.userId,
      fromAccountId: account._id,
      sentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    if (recentEmails.length === 0) {
      console.log(`❌ No recent warmup emails found for account: ${account.email}`);
      return;
    }
    
    // Calculate spam rate
    const spamRate = inboxSync.spamPlacements / recentEmails.length;
    
    console.log(`📊 Spam rate for ${account.email}: ${(spamRate * 100).toFixed(2)}%`);
    
    // If spam rate is too high, pause warmup
    if (spamRate > 0.1) { // More than 10% in spam
      console.log(`🚨 High spam rate detected for account: ${account.email}. Auto-pausing warmup.`);
      
      // Pause warmup
      await pauseWarmupForAccount(account);
      
      // TODO: Send notification to user
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking spam alerts:`, error);
    throw error;
  }
};