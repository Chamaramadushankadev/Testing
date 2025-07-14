@@ .. @@
 import { promisify } from 'util';
 import { 
   EmailAccount, 
   WarmupEmail, 
   InboxSync, 
   InboxMessage 
 } from '../models/ColdEmailSystemIndex.js';
-import { sendEmail, createTransporter } from './emailService.js';
+import { sendEmail, createTransporter, generateWarmupContent } from './emailService.js';
 
 // Promisify DNS functions
 const resolveMx = promisify(dns.resolveMx);
@@ .. @@
 
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
           textContent = textMatches[1].trim()
           // Remove virus-free message
             .replace(/\s*Virus-free\..*avast\.com\s*$/i, '')
             .replace(/\s*This email has been checked for viruses by.*$/im, '');
         }
         
         // Extract HTML content
         const htmlMatches = sourceStr.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\n$)/i);
         if (htmlMatches && htmlMatches[1]) {
           htmlContent = htmlMatches[1].trim()
           // Remove virus-free message
             .replace(/<div.*?Virus-free.*?avast\.com.*?<\/div>/i, '')
             .replace(/<div.*?This email has been checked for viruses by.*?<\/div>/i, '')
             .replace(/Virus-free\..*?avast\.com/i, '')
             .replace(/This email has been checked for viruses by.*/i, '');
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
-      threadId: inferredThreadId, // Use provided threadId or fallback to messageId
+      threadId: message.threadId || messageId || null, // Use provided threadId or fallback to messageId
       from: from,
       to: to,
       subject: subject,
       content: {
         text: textContent,
         html: htmlContent
       },
       isRead: false,
-      isWarmup: subject.toLowerCase().includes('warmup') || from.email.includes('warmup'),
+      isWarmup: subject.toLowerCase().includes('warmup') || from.email.includes('warmup') || message.headers?.['x-warmup'] === 'true',
       isStarred: false,
       isReply: false,
       sentByMe: false,
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
 
 // Check if email is a reply to our warmup emails
@@ .. @@
 };
 
 // Generate warmup email content
-export const generateWarmupContent = () => {
-  // Random subjects
-  const subjects = [
-    '【WARMUP】Quick update on our project',
-    '【WARMUP】Following up on our conversation',
-    '【WARMUP】Thoughts on the latest developments',
-    '【WARMUP】Checking in - how are things going?',
-    '【WARMUP】Quick question about our collaboration',
-    '【WARMUP】Updates from our team',
-    '【WARMUP】Interesting article you might enjoy',
-    '【WARMUP】Feedback on your recent work',
-    '【WARMUP】Just wanted to touch base',
-    '【WARMUP】Ideas for our next steps',
-    '【WARMUP】Proposal for improvement',
-    '【WARMUP】Great news to share',
-    '【WARMUP】Important information for you',
-    '【WARMUP】Scheduling our next meeting',
-    '【WARMUP】Resources you might find helpful'
-  ];
-  
-  // Random greetings
-  const greetings = [
-    'Hi there,',
-    'Hello,',
-    'Good morning,',
-    'Good afternoon,',
-    'Hey,',
-    'Greetings,',
-    'Hi friend,',
-    'Hello there,'
-  ];
-  
-  // Random body content
-  const bodyContents = [
-    'I wanted to follow up on our previous conversation. How are things progressing on your end? We\'ve made some significant progress here and I\'d love to share updates with you soon.',
-    
-    'I came across this interesting article that I thought might be relevant to our discussion. It highlights some innovative approaches that could be beneficial for our project.',
-    
-    'I\'ve been thinking about the challenges we discussed last time. I have a few ideas that might help address them effectively. Would you be available for a quick call to discuss?',
-    
-    'Just checking in to see how everything is going. Our team has been making steady progress, and we\'re on track to meet our deadlines. Let me know if you need any assistance from our end.',
-    
-    'I wanted to share some exciting news with you. We\'ve recently achieved a significant milestone, and I believe it will positively impact our collaboration.',
-    
-    'I hope this email finds you well. I\'ve been reviewing our project timeline and wanted to ensure we\'re aligned on the next steps. Could you provide a quick update on your progress?',
-    
-    'I\'ve been reflecting on our last meeting and had some additional thoughts that might be worth exploring. I\'d appreciate your perspective on these ideas.',
-    
-    'I wanted to touch base regarding our upcoming deadline. Is there anything you need from me to ensure we stay on track? I\'m here to help if needed.',
-    
-    'I recently discovered a new tool that could streamline our workflow significantly. I\'d be happy to demonstrate how it works if you\'re interested.',
-    
-    'I hope you\'re having a productive week. I wanted to follow up on the action items from our last discussion. Have you had a chance to review the materials I sent?'
-  ];
-  
-  // Random closings
-  const closings = [
-    'Best regards,',
-    'Thanks,',
-    'Cheers,',
-    'All the best,',
-    'Warm regards,',
-    'Kind regards,',
-    'Regards,',
-    'Sincerely,',
-    'Best wishes,',
-    'Appreciate your time,'
-  ];
-  
-  // Random signatures
-  const signatures = [
-    'John',
-    'Sarah',
-    'Michael',
-    'Emily',
-    'David',
-    'Jennifer',
-    'Robert',
-    'Lisa',
-    'William',
-    'Jessica'
-  ];
-  
-  // Randomly select components
-  const subject = subjects[Math.floor(Math.random() * subjects.length)];
-  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
-  const bodyContent = bodyContents[Math.floor(Math.random() * bodyContents.length)];
-  const closing = closings[Math.floor(Math.random() * closings.length)];
-  const signature = signatures[Math.floor(Math.random() * signatures.length)];
-  
-  // Construct email content
-  const content = `${greeting}
-
-${bodyContent}
-
-${closing}
-${signature}`;
-  
-  return { subject, content };
-};
 
 // Process warmup reply
 export const processWarmupReply = async (account, message, originalEmail) => {
@@ .. @@
       // Send reply
       const emailData = {
         to: fromAccount.email,
+        headers: {
+          'X-Warmup': 'true'
+        },
         subject,
         content,
         type: 'warmup',
@@ .. @@
 
 // Send warmup email
 export const sendWarmupEmail = async (fromAccount, toAccount) => {
   try {
     console.log(`📧 Sending warmup email from ${fromAccount.email} to ${toAccount.email}`);
     
     // Generate warmup email content
     const { subject, content } = generateWarmupContent();
     
     // Send email
     const emailData = {
       to: toAccount.email,
+      headers: {
+        'X-Warmup': 'true'
+      },
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