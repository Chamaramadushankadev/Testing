import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Calendar, BarChart3, Share2, Plus, Edit3, Trash2, Timer, Target, CheckSquare } from 'lucide-react';
import { timeTrackerAPI, goalsAPI, tasksAPI } from '../../services/api';
import { format, formatDuration, intervalToDuration } from 'date-fns';

interface TimeEntry {
  id: string;
  projectId?: string;
  taskId?: string;
  projectName: string;
  taskName?: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number;
  isRunning: boolean;
  notes?: string;
  tags: string[];
  date: string;
}

interface CurrentTimer {
  id: string;
  projectName: string;
  taskName?: string;
  description: string;
  startTime: string;
  isRunning: boolean;
}

export const TimeTrackerManager: React.FC = () => {
  const [currentTimer, setCurrentTimer] = useState<CurrentTimer | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'timer' | 'logs' | 'analytics' | 'shared'>('timer');
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [analytics, setAnalytics] = useState<any>(null);
  const [sharedSheets, setSharedSheets] = useState<any[]>([]);
  

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTimeEntries();
    loadAnalytics();
  }, [filterPeriod]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentTimer && currentTimer.isRunning) {
      interval = setInterval(() => {
        const start = new Date(currentTimer.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now.getTime() - start.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentTimer]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currentResponse, goalsResponse, tasksResponse, sharedResponse] = await Promise.all([
        timeTrackerAPI.getCurrentTimer(),
        goalsAPI.getAll(),
        tasksAPI.getAll(),
        timeTrackerAPI.getSharedSheets()
      ]);
      
      setCurrentTimer(currentResponse.data);
      setGoals(goalsResponse.data || []);
      setTasks(tasksResponse.data || []);
      setSharedSheets(sharedResponse.data || []);
      
      if (currentResponse.data) {
        const start = new Date(currentResponse.data.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now.getTime() - start.getTime()) / 1000));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (filterPeriod) {
        case 'day':
          startDate = new Date(now.toDateString());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const response = await timeTrackerAPI.getEntries({
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      });
      
      setTimeEntries(response.data.entries || []);
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await timeTrackerAPI.getAnalytics(filterPeriod);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

const handleStartTimer = async (formData: FormData) => {
  try {
    const isValidObjectId = (id: unknown) =>
      typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

    const rawProjectId = formData.get('projectId');
    const rawTaskId = formData.get('taskId');

    const timerData = {
      projectId: isValidObjectId(rawProjectId) ? rawProjectId : undefined,
      taskId: isValidObjectId(rawTaskId) ? rawTaskId : undefined,
      projectName: (formData.get('projectName') as string) || 'Untitled Project',
      taskName: (formData.get('taskName') as string) || '',
      description: (formData.get('description') as string) || '',
    };

    const response = await timeTrackerAPI.startTimer(timerData);
    setCurrentTimer(response.data);
    setElapsedTime(0);
    setShowStartModal(false);
    await loadTimeEntries();
  } catch (error) {
    console.error('Error starting timer:', error);
  }
};


  const handleStopTimer = async (notes?: string) => {
    try {
      await timeTrackerAPI.stopTimer({ notes });
      setCurrentTimer(null);
      setElapsedTime(0);
      await loadTimeEntries();
      await loadAnalytics();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) return;
    
    try {
      await timeTrackerAPI.deleteEntry(entryId);
      setTimeEntries(timeEntries.filter(entry => entry.id !== entryId));
      await loadAnalytics();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleCreateShare = async (formData: FormData) => {
    try {
      const shareData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || '',
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        projectIds: formData.getAll('projectIds') as string[],
        taskIds: formData.getAll('taskIds') as string[],
        expiresAt: formData.get('expiresAt') as string || undefined
      };

      const response = await timeTrackerAPI.createShare(shareData);
      setSharedSheets([response.data, ...sharedSheets]);
      setShowShareModal(false);
    } catch (error) {
      console.error('Error creating shared sheet:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading time tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Timer className="w-6 h-6 mr-2 text-blue-600" />
            Time Tracker
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track time spent on projects and tasks</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'timer', label: 'Timer', icon: Timer },
            { id: 'logs', label: 'Time Logs', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'shared', label: 'Shared Sheets', icon: Share2 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Timer Tab */}
      {activeTab === 'timer' && (
        <div className="space-y-6">
          {/* Current Timer */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white mb-4">
                {formatTime(elapsedTime)}
              </div>
              
              {currentTimer ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{currentTimer.projectName}</h3>
                    {currentTimer.taskName && (
                      <p className="text-gray-600 dark:text-gray-400">{currentTimer.taskName}</p>
                    )}
                    {currentTimer.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{currentTimer.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => {
                        const notes = prompt('Add notes for this time entry (optional):');
                        handleStopTimer(notes || undefined);
                      }}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Square className="w-5 h-5" />
                      <span>Stop Timer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">No timer running</p>
                  <button
                    onClick={() => setShowStartModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Timer</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Entries */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Entries</h3>
            <div className="space-y-3">
              {timeEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{entry.projectName}</h4>
                    {entry.taskName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{entry.taskName}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatDurationHours(entry.duration)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {format(new Date(entry.startTime), 'HH:mm')} - {entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : 'Running'}
                    </p>
                  </div>
                </div>
              ))}
              
              {timeEntries.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No time entries yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Time Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Time Sheet</span>
            </button>
          </div>

          {/* Time Entries */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Entries</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project/Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.projectName}</div>
                          {entry.taskName && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{entry.taskName}</div>
                          )}
                          {entry.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{entry.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(entry.startTime), 'HH:mm')} - {entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : 'Running'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatDurationHours(entry.duration)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {entry.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingEntry(entry);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {timeEntries.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No time entries found for this period</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatDurationHours(analytics.totalDuration)}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analytics.totalEntries}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Average</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatDurationHours(Math.round(analytics.averagePerDay))}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Project Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time by Project</h3>
            <div className="space-y-3">
              {analytics.projectBreakdown.map((project: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.entries} entries</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatDurationHours(project.duration)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round((project.duration / analytics.totalDuration) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shared Sheets Tab */}
      {activeTab === 'shared' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shared Time Sheets</h3>
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Share</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedSheets.map((sheet) => (
              <div key={sheet._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{sheet.title}</h4>
                    {sheet.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sheet.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => timeTrackerAPI.deleteSharedSheet(sheet._id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Accessed {sheet.accessCount} times</p>
                  <p>Created {format(new Date(sheet.createdAt), 'MMM dd, yyyy')}</p>
                  {sheet.expiresAt && (
                    <p>Expires {format(new Date(sheet.expiresAt), 'MMM dd, yyyy')}</p>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sheet.shareUrl);
                      alert('Share URL copied to clipboard!');
                    }}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Copy Share Link
                  </button>
                </div>
              </div>
            ))}
            
            {sharedSheets.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No shared time sheets yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Timer Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Start Timer</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleStartTimer(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project</label>
                <select
                  name="projectId"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const projectName = e.target.selectedOptions[0]?.text || 'Untitled Project';
                    const projectNameInput = document.querySelector('input[name="projectName"]') as HTMLInputElement;
                    if (projectNameInput) {
                      projectNameInput.value = projectName;
                    }
                  }}
                >
                  <option value="">Select project (optional)</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>{goal.title}</option>
                  ))}
                </select>
                <input type="hidden" name="projectName" defaultValue="Untitled Project" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task</label>
                <select
                  name="taskId"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const taskName = e.target.selectedOptions[0]?.text || '';
                    const taskNameInput = document.querySelector('input[name="taskName"]') as HTMLInputElement;
                    if (taskNameInput) {
                      taskNameInput.value = taskName;
                    }
                  }}
                >
                  <option value="">Select task (optional)</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
                <input type="hidden" name="taskName" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  name="description"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What are you working on?"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Timer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create Shared Time Sheet</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateShare(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Project Alpha - Week 1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Projects (optional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {goals.map((goal) => (
                    <label key={goal.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="projectIds"
                        value={goal.id}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{goal.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expires At (optional)</label>
                <input
                  type="datetime-local"
                  name="expiresAt"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};