import cron from 'node-cron';
import { EmailAccount, Campaign, Lead, WarmupEmail } from '../models/ColdEmailSystem.js';
import { sendEmail, generateWarmupContent } from './emailService.js';
import { 
  scheduleWarmupEmails, 
  processSpamFolder, 
  autoPauseOnSpamAlert, 
  updateInboxHealthScore 
} from './warmupService.js';

// Schedule campaign emails
export const scheduleCampaignEmails = async (campaign) => {
  try {
    if (campaign.status !== 'active') return;

    const leads = await Lead.find({
      _id: { $in: campaign.leadIds },
      status: { $nin: ['unsubscribed', 'bounced'] }
    });

    const emailAccounts = await EmailAccount.find({
      _id: { $in: campaign.emailAccountIds },
      isActive: true
    });

    if (emailAccounts.length === 0) {
      console.log('No active email accounts available for campaign');
      return;
    }

    let accountIndex = 0;
    let emailsSentToday = 0;

    for (const lead of leads) {
      const account = emailAccounts[accountIndex % emailAccounts.length];
      
      // Check daily limit
      if (account.emailsSentToday >= account.dailyLimit) {
        accountIndex++;
        continue;
      }

      // Get the first step of the sequence
      const firstStep = campaign.sequence.find(step => step.stepNumber === 1 && step.isActive);
      if (!firstStep) continue;

      // Replace variables in subject and content
      const subject = replaceVariables(firstStep.subject, lead);
      const content = replaceVariables(firstStep.content, lead);

      // Calculate delay based on throttling settings
      const baseDelay = campaign.settings.throttling.delayBetweenEmails * 1000;
      const randomDelay = campaign.settings.throttling.randomizeDelay 
        ? Math.floor(Math.random() * baseDelay * 0.5) 
        : 0;
      const totalDelay = baseDelay + randomDelay + (emailsSentToday * baseDelay);

      // Schedule the email
      setTimeout(async () => {
        try {
          const emailData = {
            to: lead.email,
            subject,
            content,
            type: 'campaign',
            campaignId: campaign._id,
            leadId: lead._id,
            stepNumber: firstStep.stepNumber,
            trackingEnabled: campaign.settings.tracking.openTracking
          };

          const result = await sendEmail(account, emailData);
          
          if (result.success) {
            // Update lead status
            lead.status = 'contacted';
            lead.lastContactedAt = new Date();
            await lead.save();

            // Update campaign stats
            campaign.stats.emailsSent += 1;
            await campaign.save();

            console.log(`Campaign email sent to ${lead.email} from ${account.email}`);
          }
        } catch (error) {
          console.error('Error sending campaign email:', error);
        }
      }, totalDelay);

      emailsSentToday++;
      accountIndex++;
    }
  } catch (error) {
    console.error('Error scheduling campaign emails:', error);
  }
};

// Replace variables in email content
const replaceVariables = (text, lead) => {
  return text
    .replace(/\{\{first_name\}\}/g, lead.firstName)
    .replace(/\{\{last_name\}\}/g, lead.lastName)
    .replace(/\{\{company\}\}/g, lead.company || '')
    .replace(/\{\{job_title\}\}/g, lead.jobTitle || '')
    .replace(/\{\{website\}\}/g, lead.website || '')
    .replace(/\{\{industry\}\}/g, lead.industry || '');
};

// Start background jobs
export const startBackgroundJobs = () => {
  // Run warmup emails every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const accounts = await EmailAccount.find({
        warmupStatus: 'in-progress',
        isActive: true,
        'warmupSettings.enabled': true
      });

      for (const account of accounts) {
        await scheduleWarmupEmails(account);
      }
    } catch (error) {
      console.error('Error in warmup cron job:', error);
    }
  });

  // Run inbox sync every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { syncInbox } = await import('./emailService.js');
      const accounts = await EmailAccount.find({ isActive: true });

      for (const account of accounts) {
        try {
          await syncInbox(account);
        } catch (error) {
          console.error(`Error syncing inbox for ${account.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in inbox sync cron job:', error);
    }
  });

  // Reset daily email counts at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await EmailAccount.updateMany(
        {},
        { 
          emailsSentToday: 0,
          lastResetDate: new Date()
        }
      );
      console.log('Daily email counts reset');
    } catch (error) {
      console.error('Error resetting daily email counts:', error);
    }
  });

  console.log('Background jobs started');
};
// Schedule daily warmup emails for all accounts
export const scheduleDailyWarmupEmails = async () => {
  try {
    console.log('🔄 Scheduling daily warmup emails');
    
    // Get all accounts in warmup
    const accounts = await EmailAccount.find({
      warmupStatus: 'in-progress',
      isActive: true,
      'warmupSettings.enabled': true
    });
    
    console.log(`📊 Found ${accounts.length} accounts in active warmup`);
    
    for (const account of accounts) {
      try {
        await scheduleWarmupEmails(account);
      } catch (accountError) {
        console.error(`Error scheduling warmup for account ${account.email}:`, accountError);
      }
    }
    
    console.log('✅ Completed scheduling daily warmup emails');
  } catch (error) {
    console.error('Error in daily warmup scheduler:', error);
  }
};

// Process spam folders for all accounts
export const processAllSpamFolders = async () => {
  try {
    console.log('🔄 Processing spam folders for all accounts');
    
    // Get all active accounts
    const accounts = await EmailAccount.find({
      isActive: true
    });
    
    console.log(`📊 Found ${accounts.length} active accounts`);
    
    for (const account of accounts) {
      try {
        await processSpamFolder(account);
      } catch (accountError) {
        console.error(`Error processing spam folder for account ${account.email}:`, accountError);
      }
    }
    
    console.log('✅ Completed processing spam folders');
  } catch (error) {
    console.error('Error in spam folder processor:', error);
  }
};

// Check for spam alerts and auto-pause if needed
export const checkAllSpamAlerts = async () => {
  try {
    console.log('🔄 Checking spam alerts for all accounts');
    
    // Get all accounts in warmup
    const accounts = await EmailAccount.find({
      warmupStatus: 'in-progress',
      isActive: true
    });
    
    console.log(`📊 Found ${accounts.length} accounts in active warmup`);
    
    for (const account of accounts) {
      try {
        await autoPauseOnSpamAlert(account);
      } catch (accountError) {
        console.error(`Error checking spam alerts for account ${account.email}:`, accountError);
      }
    }
    
    console.log('✅ Completed checking spam alerts');
  } catch (error) {
    console.error('Error in spam alert checker:', error);
  }
};

// Update health scores for all accounts
export const updateAllHealthScores = async () => {
  try {
    console.log('🔄 Updating health scores for all accounts');
    
    // Get all active accounts
    const accounts = await EmailAccount.find({
      isActive: true
    });
    
    console.log(`📊 Found ${accounts.length} active accounts`);
    
    for (const account of accounts) {
      try {
        await updateInboxHealthScore(account);
      } catch (accountError) {
        console.error(`Error updating health score for account ${account.email}:`, accountError);
      }
    }
    
    console.log('✅ Completed updating health scores');
  } catch (error) {
    console.error('Error in health score updater:', error);
  }
};