import React, { useState, useEffect } from 'react';
import { Target, CheckSquare, Video, Mail, TrendingUp, Calendar, Clock } from 'lucide-react';
import { Goal, Task } from '../../types';
import { goalsAPI, tasksAPI } from '../../services/api';
import { scriptsAPI, emailAPI } from '../../services/api';

export const Dashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      // Set empty arrays on error - no error display needed here
      setGoals([]);
      setTasks([]);
      setScripts([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const activeGoals = goals.filter(goal => goal.status === 'active').length;
  const scriptsGenerated = scripts.length;
  const campaignsSent = campaigns.filter(c => c.status === 'sent').length;

  const stats = [
    {
      title: 'Active Goals',
      value: activeGoals,
      icon: Target,
      color: 'bg-blue-500',
      change: '+2 this month'
    },
    {
      title: 'Tasks Completed',
      value: `${completedTasks}/${totalTasks}`,
      icon: CheckSquare,
      color: 'bg-green-500',
      change: totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% completion rate` : '0% completion rate'
    },
    {
      title: 'Scripts Generated',
      value: scriptsGenerated,
      icon: Video,
      color: 'bg-purple-500',
      change: '+5 this week'
    },
    {
      title: 'Campaigns Sent',
      value: campaignsSent,
      icon: Mail,
      color: 'bg-orange-500',
      change: '1.2K subscribers reached'
    }
  ];

  const recentGoals = goals.slice(0, 3);
const upcomingTasks = Array.isArray(tasks)
  ? tasks
      .filter(task => task.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  : [];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Goals</h3>
          <div className="space-y-4">
            {recentGoals.length > 0 ? (
              recentGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{goal.category}</p>
                    <div className="mt-2">
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
                  <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                    goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                    goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {goal.priority}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No active goals yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first goal to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No upcoming tasks</p>
                <p className="text-xs text-gray-400 mt-1">Create your first task to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {goals.length === 0 && tasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Start by creating goals and tasks to see your activity here</p>
            </div>
          ) : (
            [
              { action: 'Welcome to Nexa Pro!', item: 'Get started by creating your first goal', time: 'Just now', type: 'goal' },
              { action: 'Dashboard loaded', item: 'Your productivity workspace is ready', time: '1 minute ago', type: 'task' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'goal' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {activity.type === 'goal' && <Target className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'task' && <CheckSquare className="w-4 h-4 text-green-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action} <span className="font-normal">"{activity.item}"</span>
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};