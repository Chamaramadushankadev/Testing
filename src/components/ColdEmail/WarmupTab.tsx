import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Settings, 
  Play, 
  Pause, 
  BarChart3, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Zap, 
  Shield, 
  Mail, 
  Inbox, 
  Send, 
  Trash2, 
  Edit3, 
  Plus, 
  Info
} from 'lucide-react';
import { coldEmailAPI } from '../../services/api';

interface WarmupTabProps {
  emailAccounts: any[];
  setEmailAccounts: (accounts: any[]) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
}

export const WarmupTab: React.FC<WarmupTabProps> = ({
  emailAccounts,
  setEmailAccounts,
  showNotification
}) => {
  const [loading, setLoading] = useState(true);
  const [warmupStats, setWarmupStats] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [warmupSettings, setWarmupSettings] = useState<any>({
    enabled: true,
    dailyWarmupEmails: 5,
    rampUpDays: 30,
    maxDailyEmails: 40,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    startTime: '09:00',
    endTime: '17:00',
    throttleRate: 5, // emails per hour
    autoReply: true,
    autoArchive: true,
    replyDelay: 30, // minutes
    maxThreadLength: 3
  });
  const [warmupLogs, setWarmupLogs] = useState<any[]>([]);
  const [warmupLogsPage, setWarmupLogsPage] = useState(1);
  const [warmupLogsLoading, setWarmupLogsLoading] = useState(false);
  const [dnsChecks, setDnsChecks] = useState<any>({});
  const [showDnsDetails, setShowDnsDetails] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState<string | null>(null);
  const [warmupAction, setWarmupAction] = useState<{accountId: string, action: string} | null>(null);

  useEffect(() => {
    if (emailAccounts.length > 0) {
      loadWarmupStats();
      loadWarmupLogs();
    } else {
      setLoading(false);
    }
  }, [emailAccounts]);

  const loadWarmupStats = async () => {
    try {
      setLoading(true);
      const response = await coldEmailAPI.getWarmupStatus();
      setWarmupStats(response.data);
    } catch (error) {
      console.error('Error loading warmup stats:', error);
      showNotification('error', 'Failed to load warmup statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadWarmupLogs = async (page = 1) => {
    try {
      setWarmupLogsLoading(true);
      const response = await coldEmailAPI.getWarmupLogs({ page, limit: 10 });
      if (page === 1) {
        setWarmupLogs(response.data.logs || []);
      } else {
        setWarmupLogs([...warmupLogs, ...(response.data.logs || [])]);
      }
      setWarmupLogsPage(page);
    } catch (error) {
      console.error('Error loading warmup logs:', error);
    } finally {
      setWarmupLogsLoading(false);
    }
  };

  const checkDnsRecords = async (accountId: string) => {
    try {
      const response = await coldEmailAPI.checkDnsRecords(accountId);
      setDnsChecks({
        ...dnsChecks,
        [accountId]: response.data
      });
    } catch (error) {
      console.error('Error checking DNS records:', error);
      showNotification('error', 'Failed to check DNS records');
    }
  };

  const handleStartWarmup = async (accountId: string) => {
    try {
      setWarmupAction({ accountId, action: 'start' });
      const response = await coldEmailAPI.startWarmup(accountId);
      
      // Update the account in the list
      const updatedAccounts = emailAccounts.map(account => 
        account.id === accountId 
          ? { ...account, warmupStatus: 'in-progress' } 
          : account
      );
      setEmailAccounts(updatedAccounts);
      
      showNotification('success', 'Warmup started successfully');
      loadWarmupStats();
    } catch (error: any) {
      console.error('Error starting warmup:', error);
      showNotification('error', error.message || 'Failed to start warmup');
    } finally {
      setWarmupAction(null);
    }
  };

  const handlePauseWarmup = async (accountId: string) => {
    try {
      setWarmupAction({ accountId, action: 'pause' });
      const response = await coldEmailAPI.stopWarmup(accountId);
      
      // Update the account in the list
      const updatedAccounts = emailAccounts.map(account => 
        account.id === accountId 
          ? { ...account, warmupStatus: 'not-started' } 
          : account
      );
      setEmailAccounts(updatedAccounts);
      
      showNotification('success', 'Warmup stopped successfully');
      loadWarmupStats();
    } catch (error: any) {
      console.error('Error stopping warmup:', error);
      showNotification('error', error.message || 'Failed to stop warmup');
    } finally {
      setWarmupAction(null);
    }
  };

  const handleResumeWarmup = async (accountId: string) => {
    try {
      setWarmupAction({ accountId, action: 'resume' });
      const response = await coldEmailAPI.resumeWarmup(accountId);
      
      // Update the account in the list
      const updatedAccounts = emailAccounts.map(account => 
        account.id === accountId 
          ? { ...account, warmupStatus: 'in-progress' } 
          : account
      );
      setEmailAccounts(updatedAccounts);
      
      showNotification('success', 'Warmup resumed successfully');
      loadWarmupStats();
    } catch (error: any) {
      console.error('Error resuming warmup:', error);
      showNotification('error', error.message || 'Failed to resume warmup');
    } finally {
      setWarmupAction(null);
    }
  };

  const handleStopWarmup = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to stop the warmup process? This will reset your warmup progress.')) {
      return;
    }
    
    try {
      setWarmupAction({ accountId, action: 'stop' });
      const response = await coldEmailAPI.stopWarmup(accountId);
      
      // Update the account in the list
      const updatedAccounts = emailAccounts.map(account => 
        account.id === accountId 
          ? { ...account, warmupStatus: 'not-started' } 
          : account
      );
      setEmailAccounts(updatedAccounts);
      
      showNotification('success', 'Warmup stopped successfully');
      loadWarmupStats();
    } catch (error: any) {
      console.error('Error stopping warmup:', error);
      showNotification('error', error.message || 'Failed to stop warmup');
    } finally {
      setWarmupAction(null);
    }
  };

  const handleSyncInbox = async (accountId: string) => {
    try {
      setSyncingInbox(accountId);
      const response = await coldEmailAPI.syncInbox(accountId);
      showNotification('success', 'Inbox synced successfully');
      loadWarmupLogs();
    } catch (error: any) {
      console.error('Error syncing inbox:', error);
      showNotification('error', error.message || 'Failed to sync inbox');
    } finally {
      setSyncingInbox(null);
    }
  };

  const handleSendWarmupNow = async (accountId: string) => {
    try {
      setWarmupAction({ accountId, action: 'send' });
      const response = await coldEmailAPI.sendWarmupNow(accountId);
      showNotification('success', 'Warmup email sent successfully');
      loadWarmupLogs();
    } catch (error: any) {
      console.error('Error sending warmup email:', error);
      showNotification('error', error.message || 'Failed to send warmup email');
    } finally {
      setWarmupAction(null);
    }
  };

  const handleUpdateWarmupSettings = async (accountId: string, settings: any) => {
    try {
      // Ensure workingDays is an array of numbers
      if (settings.workingDays && !Array.isArray(settings.workingDays)) {
        settings.workingDays = [];
      }
      
      // Convert any string values to numbers
      if (settings.workingDays) {
        settings.workingDays = settings.workingDays.map((day: any) => 
          typeof day === 'string' ? parseInt(day) : day
        );
      }
      
      const response = await coldEmailAPI.updateWarmupSettings(accountId, settings);
      
      // Update the account in the list
      const updatedAccounts = emailAccounts.map(account => 
        account.id === accountId 
          ? { ...account, warmupSettings: settings } 
          : account
      );
      setEmailAccounts(updatedAccounts);
      
      showNotification('success', 'Warmup settings updated successfully');
      setShowSettings(false);
    } catch (error: any) {
      console.error('Error updating warmup settings:', error);
      showNotification('error', error.message || 'Failed to update warmup settings');
    }
  };

  const getWarmupStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'not-started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && !warmupStats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading warmup system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Flame className="w-5 h-5 mr-2 text-orange-600" />
            Email Warmup System
          </h3>
          <p className="text-gray-600 mt-1">Warm up your email accounts to improve deliverability</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadWarmupStats}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {emailAccounts.map((account) => {
          const accountStats = warmupStats?.accounts?.find((a: any) => a.accountId === account.id);
          const accountDnsCheck = dnsChecks[account.id];
          
          return (
            <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">{account.name}</h4>
                  <p className="text-sm text-gray-600">{account.email}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getWarmupStatusColor(account.warmupStatus)}`}>
                  {account.warmupStatus?.replace('-', ' ')}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Health Score:</span>
                  <span className={`font-medium ${getHealthScoreColor(account.reputation || 0)}`}>
                    {account.reputation || 0}/100
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      account.reputation >= 80 ? 'bg-green-600' :
                      account.reputation >= 60 ? 'bg-yellow-600' :
                      account.reputation >= 40 ? 'bg-orange-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${account.reputation || 0}%` }}
                  />
                </div>
                
                {accountStats && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Emails Sent:</span>
                      <span className="font-medium text-gray-900">{accountStats.emailsSent || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Emails Opened:</span>
                      <span className="font-medium text-gray-900">{accountStats.emailsOpened || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Replies Received:</span>
                      <span className="font-medium text-gray-900">{accountStats.repliesReceived || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Spam Placements:</span>
                      <span className="font-medium text-gray-900">{accountStats.spamPlacements || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Daily Volume:</span>
                      <span className="font-medium text-gray-900">{accountStats.currentDailyVolume || 0} emails</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Days in Warmup:</span>
                      <span className="font-medium text-gray-900">{accountStats.daysInWarmup || 0} days</span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => {
                    setSelectedAccount(account.id);
                    setWarmupSettings(account.warmupSettings || warmupSettings);
                    setShowSettings(true);
                  }}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={() => checkDnsRecords(account.id)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Shield className="w-4 h-4" />
                  <span>Check DNS</span>
                </button>
                
                <button
                  onClick={() => handleSyncInbox(account.id)}
                  disabled={syncingInbox === account.id}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncingInbox === account.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Inbox className="w-4 h-4" />
                      <span>Sync Inbox</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleSendWarmupNow(account.id)}
                  disabled={warmupAction?.accountId === account.id && warmupAction?.action === 'send'}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {warmupAction?.accountId === account.id && warmupAction?.action === 'send' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Now</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                {account.warmupStatus === 'not-started' && (
                  <button
                    onClick={() => handleStartWarmup(account.id)}
                    disabled={warmupAction?.accountId === account.id && warmupAction?.action === 'start'}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {warmupAction?.accountId === account.id && warmupAction?.action === 'start' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Start Warmup</span>
                      </>
                    )}
                  </button>
                )}
                
                {account.warmupStatus === 'in-progress' && (
                  <button
                    onClick={() => handlePauseWarmup(account.id)}
                    disabled={warmupAction?.accountId === account.id && warmupAction?.action === 'pause'}
                    className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {warmupAction?.accountId === account.id && warmupAction?.action === 'pause' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Stopping...</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Stop Warmup</span>
                      </>
                    )}
                  </button>
                )}
                
                {account.warmupStatus === 'paused' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleResumeWarmup(account.id)}
                      disabled={warmupAction?.accountId === account.id && warmupAction?.action === 'resume'}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {warmupAction?.accountId === account.id && warmupAction?.action === 'resume' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Resuming...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Resume</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleStopWarmup(account.id)}
                      disabled={warmupAction?.accountId === account.id && warmupAction?.action === 'stop'}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {warmupAction?.accountId === account.id && warmupAction?.action === 'stop' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Stopping...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Stop</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {account.warmupStatus === 'completed' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartWarmup(account.id)}
                      disabled={warmupAction?.accountId === account.id && warmupAction?.action === 'start'}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {warmupAction?.accountId === account.id && warmupAction?.action === 'start' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Restart</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* DNS Check Results */}
              {accountDnsCheck && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">DNS Configuration</h5>
                    <button
                      onClick={() => setShowDnsDetails(!showDnsDetails)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      {showDnsDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">MX Records:</span>
                      <span className={`font-medium ${accountDnsCheck.mx ? 'text-green-600' : 'text-red-600'}`}>
                        {accountDnsCheck.mx ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">SPF:</span>
                      <span className={`font-medium ${accountDnsCheck.spf ? 'text-green-600' : 'text-red-600'}`}>
                        {accountDnsCheck.spf ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">DKIM:</span>
                      <span className={`font-medium ${accountDnsCheck.dkim ? 'text-green-600' : 'text-red-600'}`}>
                        {accountDnsCheck.dkim ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">DMARC:</span>
                      <span className={`font-medium ${accountDnsCheck.dmarc ? 'text-green-600' : 'text-red-600'}`}>
                        {accountDnsCheck.dmarc ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    
                    {showDnsDetails && accountDnsCheck.details && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(accountDnsCheck.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {emailAccounts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Email Accounts</h3>
            <p className="text-gray-600 mb-6">Add email accounts to start warming them up</p>
          </div>
        )}
      </div>

      {/* Warmup Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Warmup Activity Logs
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {warmupLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.accountName}</div>
                    <div className="text-sm text-gray-500">{log.accountEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.type === 'sent' ? 'bg-blue-100 text-blue-800' :
                      log.type === 'received' ? 'bg-green-100 text-green-800' :
                      log.type === 'reply' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' :
                      log.status === 'opened' ? 'bg-blue-100 text-blue-800' :
                      log.status === 'replied' ? 'bg-purple-100 text-purple-800' :
                      log.status === 'spam' ? 'bg-red-100 text-red-800' :
                      log.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {warmupLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No warmup logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {warmupLogs.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => loadWarmupLogs(warmupLogsPage + 1)}
              disabled={warmupLogsLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {warmupLogsLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Warmup Settings Modal */}
      {showSettings && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-orange-600" />
                Warmup Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateWarmupSettings(selectedAccount, warmupSettings);
              }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">General Settings</h4>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Enable Warmup</h5>
                    <p className="text-sm text-gray-600">Turn on/off the warmup process</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={warmupSettings.enabled}
                      onChange={(e) => setWarmupSettings({...warmupSettings, enabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Starting Daily Emails
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={warmupSettings.dailyWarmupEmails}
                      onChange={(e) => setWarmupSettings({...warmupSettings, dailyWarmupEmails: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of emails to send daily at the beginning</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ramp-up Days
                    </label>
                    <input
                      type="number"
                      min="7"
                      max="60"
                      value={warmupSettings.rampUpDays}
                      onChange={(e) => setWarmupSettings({...warmupSettings, rampUpDays: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of days to reach maximum volume</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Daily Emails
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={warmupSettings.maxDailyEmails}
                      onChange={(e) => setWarmupSettings({...warmupSettings, maxDailyEmails: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of daily emails after ramp-up</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Throttle Rate (emails/hour)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={warmupSettings.throttleRate}
                      onChange={(e) => setWarmupSettings({...warmupSettings, throttleRate: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum emails sent per hour</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Schedule Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={warmupSettings.startDate}
                      onChange={(e) => setWarmupSettings({...warmupSettings, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={warmupSettings.endDate}
                      onChange={(e) => setWarmupSettings({...warmupSettings, endDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={warmupSettings.startTime}
                      onChange={(e) => setWarmupSettings({...warmupSettings, startTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={warmupSettings.endTime}
                      onChange={(e) => setWarmupSettings({...warmupSettings, endTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                      <label key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={warmupSettings.workingDays.includes(index)}
                          onChange={(e) => {
                            const newWorkingDays = e.target.checked
                              ? [...warmupSettings.workingDays, index].sort()
                              : warmupSettings.workingDays.filter((d: number) => d !== index);
                            setWarmupSettings({...warmupSettings, workingDays: newWorkingDays});
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Reply Settings</h4>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Auto Reply</h5>
                    <p className="text-sm text-gray-600">Automatically reply to warmup emails</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={warmupSettings.autoReply}
                      onChange={(e) => setWarmupSettings({...warmupSettings, autoReply: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Auto Archive</h5>
                    <p className="text-sm text-gray-600">Automatically archive warmup emails after reply</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={warmupSettings.autoArchive}
                      onChange={(e) => setWarmupSettings({...warmupSettings, autoArchive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply Delay (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={warmupSettings.replyDelay}
                      onChange={(e) => setWarmupSettings({...warmupSettings, replyDelay: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">How long to wait before replying</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Thread Length
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={warmupSettings.maxThreadLength}
                      onChange={(e) => setWarmupSettings({...warmupSettings, maxThreadLength: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of replies in a thread</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};