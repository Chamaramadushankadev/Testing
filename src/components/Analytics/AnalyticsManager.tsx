import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Target, Calendar, Download, Filter } from 'lucide-react';
import { Goal, Task } from '../../types';
import { goalsAPI, tasksAPI, scriptsAPI, emailAPI } from '../../services/api';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useSubscription } from '../../context/SubscriptionContext';

export const AnalyticsManager: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const { hasAccess, getUpgradeMessage } = useSubscription();

  React.useEffect(() => {
    if (!hasAccess('analytics')) {
      return;
    }
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [goalsResponse, tasksResponse, scriptsResponse, campaignsResponse] = await Promise.all([
        goalsAPI.getAll(),
        tasksAPI.getAll(),
        scriptsAPI.getAll().catch(() => ({ data: [] })),
        emailAPI.getCampaigns().catch(() => ({ data: [] }))
      ]);
      setGoals(goalsResponse.data || []);
      setTasks(tasksResponse.data || []);
      setScripts(scriptsResponse.data || []);
      setCampaigns(campaignsResponse.data || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setGoals([]);
      setTasks([]);
      setScripts([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: subDays(now, 90), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();

  // Calculate metrics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const avgGoalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length;
  const taskCompletionRate = (completedTasks / totalTasks) * 100;

  const scriptsGenerated = scripts.length;
  const campaignsSent = campaigns.filter(c => c.status === 'sent').length;
  const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
  const avgOpenRate = campaigns.length > 0 
    ? campaigns.reduce((sum, c) => sum + (c.stats.opened / c.stats.sent), 0) / campaigns.length * 100 
    : 0;

  if (!hasAccess('analytics')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
          <p className="text-gray-600 mb-6">{getUpgradeMessage('analytics')}</p>
          <a
            href="/upgrade"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <span>Upgrade Now</span>
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{ title: string; value: string | number; change?: string; icon: React.ElementType; color: string }> = 
    ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`${color} rounded-lg p-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Track your productivity and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
            </select>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Goal Progress"
          value={`${Math.round(avgGoalProgress)}%`}
          change="+5% from last month"
          icon={Target}
          color="bg-blue-500"
        />
        <StatCard
          title="Task Completion"
          value={`${Math.round(taskCompletionRate)}%`}
          change="+12% from last month"
          icon={BarChart3}
          color="bg-green-500"
        />
        <StatCard
          title="Scripts Generated"
          value={scriptsGenerated}
          change="+3 this week"
          icon={BarChart3}
          color="bg-purple-500"
        />
        <StatCard
          title="Email Open Rate"
          value={`${Math.round(avgOpenRate)}%`}
          change="+8% from last month"
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Goals Overview
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{totalGoals}</p>
                <p className="text-sm text-gray-600">Total Goals</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{activeGoals}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{completedGoals}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Tasks Performance
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{totalTasks}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                  <span className="text-sm font-bold text-gray-900">{Math.round(taskCompletionRate)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskCompletionRate}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded">
                  <p className="text-lg font-bold text-blue-600">
                    {tasks.filter(t => t.priority === 'high').length}
                  </p>
                  <p className="text-xs text-gray-600">High Priority</p>
                </div>
                <div className="text-center p-2 rounded">
                  <p className="text-lg font-bold text-yellow-600">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </p>
                  <p className="text-xs text-gray-600">In Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Content Creation
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{scriptsGenerated}</p>
                <p className="text-sm text-gray-600">Scripts Generated</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">
                  {scripts.reduce((sum, s) => sum + s.keywords.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Keywords Used</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 text-sm">Script Tones</h4>
              {['informative', 'witty', 'emotional', 'casual'].map((tone) => {
                const count = scripts.filter(s => s.tone === tone).length;
                const percentage = scriptsGenerated > 0 ? (count / scriptsGenerated) * 100 : 0;
                
                return (
                  <div key={tone} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{tone}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Email Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
            Email Performance
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{campaignsSent}</p>
                <p className="text-sm text-gray-600">Campaigns Sent</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{totalEmailsSent}</p>
                <p className="text-sm text-gray-600">Total Emails</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {campaigns.filter(c => c.status === 'sent').map((campaign) => {
                const openRate = (campaign.stats.opened / campaign.stats.sent) * 100;
                const clickRate = (campaign.stats.clicked / campaign.stats.sent) * 100;
                
                return (
                  <div key={campaign.id} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm mb-2">{campaign.name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-700">Open Rate:</span>
                        <span className="text-gray-700 font-medium ml-1">{Math.round(openRate)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Click Rate:</span>
                        <span className="text-gray-700 font-medium ml-1">{Math.round(clickRate)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Time-based Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Activity Timeline
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-lg font-bold text-gray-900">
                {goals.filter(g => g.createdAt >= start && g.createdAt <= end).length}
              </p>
              <p className="text-sm text-gray-600">Goals Created</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-lg font-bold text-gray-900">
                {tasks.filter(t => t.createdAt >= start && t.createdAt <= end).length}
              </p>
              <p className="text-sm text-gray-600">Tasks Added</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-lg font-bold text-gray-900">
                {scripts.filter(s => s.createdAt >= start && s.createdAt <= end).length}
              </p>
              <p className="text-sm text-gray-600">Scripts Generated</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-lg font-bold text-gray-900">
                {campaigns.filter(c => c.sentAt && c.sentAt >= start && c.sentAt <= end).length}
              </p>
              <p className="text-sm text-gray-600">Campaigns Sent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};