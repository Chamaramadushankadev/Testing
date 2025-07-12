import EmailAccount from './EmailSystemAccount.js';
import Lead from './EmailSystemLead.js';
import Campaign from './EmailSystemCampaign.js';
import EmailLog from './EmailLog.js';
import WarmupEmail from './WarmupEmail.js';
import InboxSync from './InboxSync.js';
import EmailTemplate from './EmailTemplate.js';
import InboxMessage from './InboxMessage.js';
import CsvImport from './CsvImport.js';
import mongoose from 'mongoose';

// Create InboxMessage model if it doesn't exist
if (!mongoose.models.InboxMessage) {
  console.log('Creating InboxMessage model');
  mongoose.model('InboxMessage', InboxMessage.schema);
}
export {
  EmailAccount,
  Lead,
  Campaign,
  EmailLog,
  WarmupEmail,
  InboxSync,
  EmailTemplate,
  InboxMessage,
  CsvImport
};