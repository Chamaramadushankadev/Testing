import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

interface SubscriptionLimits {
  goals: number;
  tasks: number;
  notes: number;
  proposals: number;
  reminders: number;
  scripts: number;
  teamMembers: number;
  emailAccounts: number;
  hasFinanceTools: boolean;
  hasAdvancedAI: boolean;
  hasAnalytics: boolean;
  hasEmailCampaigns: boolean;
  hasEmailWarmup: boolean;
  hasSocialTemplates: boolean;
  hasChat: boolean;
}

interface SubscriptionContextType {
  userPlan: string;
  limits: SubscriptionLimits;
  hasAccess: (feature: string) => boolean;
  canCreate: (type: string, currentCount: number) => boolean;
  getUpgradeMessage: (feature: string) => string;
  isFeatureRestricted: (feature: string) => boolean;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    goals: 5,
    tasks: 10,
    notes: 5,
    proposals: 5,
    reminders: 5,
    scripts: 5,
    teamMembers: 1,
    emailAccounts: 0,
    hasFinanceTools: false,
    hasAdvancedAI: false,
    hasAnalytics: false,
    hasEmailCampaigns: false,
    hasEmailWarmup: false,
    hasSocialTemplates: false,
    hasChat: false
  },
  starter: {
    goals: -1, // unlimited
    tasks: -1,
    notes: -1,
    proposals: -1,
    reminders: -1,
    scripts: -1,
    teamMembers: 2,
    emailAccounts: 0,
    hasFinanceTools: false,
    hasAdvancedAI: false,
    hasAnalytics: false,
    hasEmailCampaigns: false,
    hasEmailWarmup: false,
    hasSocialTemplates: false,
    hasChat: true
  },
  creator: {
    goals: -1,
    tasks: -1,
    notes: -1,
    proposals: -1,
    reminders: -1,
    scripts: -1,
    teamMembers: 5,
    emailAccounts: 2,
    hasFinanceTools: true,
    hasAdvancedAI: true,
    hasAnalytics: false,
    hasEmailCampaigns: false,
    hasEmailWarmup: false,
    hasSocialTemplates: true,
    hasChat: true
  },
  business: {
    goals: -1,
    tasks: -1,
    notes: -1,
    proposals: -1,
    reminders: -1,
    scripts: -1,
    teamMembers: -1,
    emailAccounts: 10,
    hasFinanceTools: true,
    hasAdvancedAI: true,
    hasAnalytics: true,
    hasEmailCampaigns: true,
    hasEmailWarmup: true,
    hasSocialTemplates: true,
    hasChat: true
  }
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useFirebaseAuth();
  const [userPlan, setUserPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the user's plan from the backend
    // For now, we'll use localStorage or default to free
    const savedPlan = localStorage.getItem('userPlan') || 'free';
    setUserPlan(savedPlan);
    setLoading(false);
  }, [user]);

  const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

  const hasAccess = (feature: string): boolean => {
    switch (feature) {
      case 'finance':
        return limits.hasFinanceTools;
      case 'analytics':
        return limits.hasAnalytics;
      case 'cold-email':
        return limits.hasEmailCampaigns;
      case 'email-warmup':
        return limits.hasEmailWarmup;
      case 'advanced-ai':
        return limits.hasAdvancedAI;
      case 'social-templates':
        return limits.hasSocialTemplates;
      case 'chat':
        return limits.hasChat;
      default:
        return true;
    }
  };

  const canCreate = (type: string, currentCount: number): boolean => {
    const limit = limits[type as keyof SubscriptionLimits] as number;
    if (limit === -1) return true; // unlimited
    return currentCount < limit;
  };

  const isFeatureRestricted = (feature: string): boolean => {
    return !hasAccess(feature);
  };

  const getUpgradeMessage = (feature: string): string => {
    const messages: Record<string, string> = {
      'finance': 'Upgrade to Creator plan to access Finance Management tools',
      'analytics': 'Upgrade to Business plan to access Advanced Analytics',
      'cold-email': 'Upgrade to Business plan to access Cold Email Marketing',
      'email-warmup': 'Upgrade to Business plan to access Email Warmup',
      'advanced-ai': 'Upgrade to Creator plan to access Advanced AI features',
      'social-templates': 'Upgrade to Creator plan to access Social Templates',
      'chat': 'Upgrade to Starter plan to access Team Chat',
      'goals': `You've reached the limit of ${limits.goals} goals. Upgrade to get unlimited goals.`,
      'tasks': `You've reached the limit of ${limits.tasks} tasks. Upgrade to get unlimited tasks.`,
      'notes': `You've reached the limit of ${limits.notes} notes. Upgrade to get unlimited notes.`,
      'proposals': `You've reached the limit of ${limits.proposals} proposals. Upgrade to get unlimited proposals.`,
      'reminders': `You've reached the limit of ${limits.reminders} reminders. Upgrade to get unlimited reminders.`,
      'scripts': `You've reached the limit of ${limits.scripts} scripts. Upgrade to get unlimited scripts.`,
      'teamMembers': `You've reached the limit of ${limits.teamMembers} team members. Upgrade to add more members.`,
      'emailAccounts': `You've reached the limit of ${limits.emailAccounts} email accounts. Upgrade to add more accounts.`
    };
    return messages[feature] || 'Upgrade your plan to access this feature';
  };

  return (
    <SubscriptionContext.Provider value={{
      userPlan,
      limits,
      hasAccess,
      canCreate,
      getUpgradeMessage,
      isFeatureRestricted,
      loading
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};