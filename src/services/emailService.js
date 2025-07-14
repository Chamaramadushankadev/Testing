@@ .. @@
 import { ImapFlow } from 'imapflow';
 import { EmailAccount, EmailLog, WarmupEmail, InboxSync, Lead, Campaign } from '../models/ColdEmailSystem.js';
 import { processWarmupReply, isDomainBlacklisted } from './warmupService.js';
 
+// Generate warmup email content
+export const generateWarmupContent = () => {
+  // Random subjects
+  const subjects = [
+    'Quick update on our project',
+    'Following up on our conversation',
+    'Thoughts on the latest developments',
+    'Checking in - how are things going?',
+    'Quick question about our collaboration',
+    'Updates from our team',
+    'Interesting article you might enjoy',
+    'Feedback on your recent work',
+    'Just wanted to touch base',
+    'Ideas for our next steps',
+    'Proposal for improvement',
+    'Great news to share',
+    'Important information for you',
+    'Scheduling our next meeting',
+    'Resources you might find helpful'
+  ];
+  
+  // Random greetings
+  const greetings = [
+    'Hi there,',
+    'Hello,',
+    'Good morning,',
+    'Good afternoon,',
+    'Hey,',
+    'Greetings,',
+    'Hi friend,',
+    'Hello there,'
+  ];
+  
+  // Random body content
+  const bodyContents = [
+    'I wanted to follow up on our previous conversation. How are things progressing on your end? We\'ve made some significant progress here and I\'d love to share updates with you soon.',
+    
+    'I came across this interesting article that I thought might be relevant to our discussion. It highlights some innovative approaches that could be beneficial for our project.',
+    
+    'I\'ve been thinking about the challenges we discussed last time. I have a few ideas that might help address them effectively. Would you be available for a quick call to discuss?',
+    
+    'Just checking in to see how everything is going. Our team has been making steady progress, and we\'re on track to meet our deadlines. Let me know if you need any assistance from our end.',
+    
+    'I wanted to share some exciting news with you. We\'ve recently achieved a significant milestone, and I believe it will positively impact our collaboration.',
+    
+    'I hope this email finds you well. I\'ve been reviewing our project timeline and wanted to ensure we\'re aligned on the next steps. Could you provide a quick update on your progress?',
+    
+    'I\'ve been reflecting on our last meeting and had some additional thoughts that might be worth exploring. I\'d appreciate your perspective on these ideas.',
+    
+    'I wanted to touch base regarding our upcoming deadline. Is there anything you need from me to ensure we stay on track? I\'m here to help if needed.',
+    
+    'I recently discovered a new tool that could streamline our workflow significantly. I\'d be happy to demonstrate how it works if you\'re interested.',
+    
+    'I hope you\'re having a productive week. I wanted to follow up on the action items from our last discussion. Have you had a chance to review the materials I sent?'
+  ];
+  
+  // Random closings
+  const closings = [
+    'Best regards,',
+    'Thanks,',
+    'Cheers,',
+    'All the best,',
+    'Warm regards,',
+    'Kind regards,',
+    'Regards,',
+    'Sincerely,',
+    'Best wishes,',
+    'Appreciate your time,'
+  ];
+  
+  // Random signatures
+  const signatures = [
+    'John',
+    'Sarah',
+    'Michael',
+    'Emily',
+    'David',
+    'Jennifer',
+    'Robert',
+    'Lisa',
+    'William',
+    'Jessica'
+  ];
+  
+  // Randomly select components
+  const subject = subjects[Math.floor(Math.random() * subjects.length)];
+  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
+  const bodyContent = bodyContents[Math.floor(Math.random() * bodyContents.length)];
+  const closing = closings[Math.floor(Math.random() * closings.length)];
+  const signature = signatures[Math.floor(Math.random() * signatures.length)];
+  
+  // Construct email content
+  const content = `${greeting}
+
+${bodyContent}
+
+${closing}
+${signature}`;
+  
+  return { subject, content };
+};
+
 // Create SMTP transporter
 export const createTransporter = (account) => {
   console.log('Creating SMTP transporter for:', account.email);
@@ .. @@
     // Skip blacklisted domains for warmup emails
     if (emailData.type === 'warmup' && isDomainBlacklisted(emailData.to)) {
       console.log(`⚠️ Skipping blacklisted domain for warmup: ${emailData.to}`);
       return { success: false, error: 'Recipient domain is blacklisted for warmup' };
     }
     
     if (!account.smtpSettings || !account.smtpSettings.host || !account.smtpSettings.username || !account.smtpSettings.password) {
       throw new Error('Invalid SMTP settings. Please check your email account configuration.');
     }
     
     const transporter = createTransporter(account);
     
     // Improved HTML email template with better formatting
     // Create HTML content from text
     const htmlContent = `
@@ .. @@
     let mailOptions = {
       from: `${account.name} <${account.email}>`,
       to: emailData.to,
       subject: emailData.subject,
       html: htmlContent,
       text: cleanTextContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
       headers: {
         'X-Mailer': 'ProductivePro Cold Email System',
         'List-Unsubscribe': `<mailto:unsubscribe@${account.email.split('@')[1]}>`,
-        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
+        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
+        ...(emailData.headers || {})
       }
     };
 
@@ .. @@
 
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
         source: true,
+        headers: ['x-warmup']
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
 
         // Check if this is a warmup email reply
         const isWarmupReply = await checkIfWarmupReply(message, account);
         if (isWarmupReply.isReply) {
           console.log('↩️ Found reply to warmup email');
           repliesFound++;
           await processWarmupReply(account, message, isWarmupReply.originalEmail);
         }
 
         // Check if this is a bounce
         const isBounce = await checkIfBounce(message, account);
         if (isBounce) {
           console.log('↩️ Found bounce notification');
           bouncesFound++;
           await processBounce(message, account);
         }
         
         // Store the message in the inbox
         await storeInboxMessage(message, account, {
-          threadId: inferredThreadId || message.threadId || message.messageId || null,
+          threadId: message.threadId || message.messageId || null,
           isReply: true
         });
         
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