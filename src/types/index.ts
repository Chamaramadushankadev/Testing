export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  progress: number;
  dueDate: Date;
  createdAt: Date;
  tasks: Task[];
  notes: Note[];
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: Date;
  createdAt: Date;
  attachments: Attachment[];
}

export interface Note {
  id: string;
  goalId?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'link';
  url: string;
  size?: number;
}

export interface GoogleAlert {
  id: string;
  keyword: string;
  rssUrl: string;
  isActive: boolean;
  category: string;
  createdAt: Date;
  lastFetch: Date;
  articles: Article[];
}

export interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
  source: string;
  keyword: string;
}

export interface YouTubeScript {
  id: string;
  title: string;
  content: string;
  tone: 'witty' | 'emotional' | 'informative' | 'casual';
  source: string;
  createdAt: Date;
  keywords: string[];
}

export interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  content: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  receivedAt: Date;
  attachments: Attachment[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  audienceList: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: Date;
  sentAt?: Date;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

export interface AudienceList {
  id: string;
  name: string;
  description: string;
  contacts: Contact[];
  createdAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  tags: string[];
  subscribed: boolean;
  addedAt: Date;
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'goal' | 'custom';
  scheduledAt: Date;
  isCompleted: boolean;
  completedAt?: Date;
  entityId?: string;
  entityType?: 'Goal' | 'Task';
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    maxOccurrences?: number;
  };
  notificationSent: boolean;
  parentReminderId?: string;
  occurrenceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cold Email Marketing Types
export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'smtp';
  smtpSettings?: {
    host: string;
    port: number;
    username: string;
    password: string;
    secure: boolean;
  };
  dailyLimit: number;
  isActive: boolean;
  warmupStatus: 'not-started' | 'in-progress' | 'completed';
  reputation: number;
  createdAt: Date;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  website?: string;
  jobTitle?: string;
  industry?: string;
  customFields: Record<string, string>;
  tags: string[];
  status: 'new' | 'contacted' | 'opened' | 'replied' | 'interested' | 'not-interested' | 'bounced' | 'unsubscribed';
  score: number;
  source: string;
  addedAt: Date;
  lastContactedAt?: Date;
  notes: string;
}

export interface ColdEmailCampaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  emailAccountIds: string[];
  leadListIds: string[];
  sequence: EmailSequenceStep[];
  settings: {
    sendingSchedule: {
      timezone: string;
      workingDays: number[];
      startTime: string;
      endTime: string;
    };
    throttling: {
      emailsPerHour: number;
      delayBetweenEmails: number;
      randomizeDelay: boolean;
    };
    tracking: {
      openTracking: boolean;
      clickTracking: boolean;
      replyTracking: boolean;
    };
  };
  createdAt: Date;
  startedAt?: Date;
  stats: CampaignStats;
}

export interface EmailSequenceStep {
  id: string;
  stepNumber: number;
  subject: string;
  content: string;
  delayDays: number;
  conditions?: {
    ifOpened?: boolean;
    ifClicked?: boolean;
    ifReplied?: boolean;
  };
  isActive: boolean;
}

export interface CampaignStats {
  totalLeads: number;
  emailsSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  interested: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'cold-outreach' | 'follow-up' | 'partnership' | 'sales' | 'custom';
  subject: string;
  content: string;
  variables: string[];
  industry?: string;
  useCase: string;
  createdAt: Date;
}

export interface LeadList {
  id: string;
  name: string;
  description: string;
  leadIds: string[];
  tags: string[];
  source: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface EmailTracking {
  id: string;
  campaignId: string;
  leadId: string;
  emailAccountId: string;
  stepNumber: number;
  subject: string;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
  bouncedAt?: Date;
  unsubscribedAt?: Date;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  trackingPixelId?: string;
  clickedLinks: string[];
}

export interface UnsubscribeRequest {
  id: string;
  email: string;
  campaignId?: string;
  reason?: string;
  unsubscribedAt: Date;
  ipAddress?: string;
}

export interface EmailReply {
  id: string;
  campaignId: string;
  leadId: string;
  subject: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  isAutoReply: boolean;
  receivedAt: Date;
  processed: boolean;
  assignedTo?: string;
}

export interface DomainHealth {
  domain: string;
  reputation: number;
  spfRecord: boolean;
  dkimRecord: boolean;
  dmarcRecord: boolean;
  blacklisted: boolean;
  lastChecked: Date;
  issues: string[];
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'email-opened' | 'email-clicked' | 'email-replied' | 'email-bounced' | 'time-based';
    conditions: Record<string, any>;
  };
  actions: {
    type: 'add-tag' | 'remove-tag' | 'change-status' | 'add-to-campaign' | 'send-notification' | 'update-score';
    parameters: Record<string, any>;
  }[];
  isActive: boolean;
  createdAt: Date;
}