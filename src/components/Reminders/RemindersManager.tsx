import React, { useState, useEffect } from 'react';
import { Plus, Bell, Calendar, Clock, Target, CheckSquare, AlertCircle, Repeat, Edit3, Trash2, MoreVertical, SunSnow as Snooze } from 'lucide-react';
import { Reminder, Goal, Task } from '../../types';
import { remindersAPI, goalsAPI, tasksAPI } from '../../services/api';
import { format, isToday, isTomorrow, isPast, addDays, addWeeks, addMonths } from 'date-fns';

export const RemindersManager: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [remindersResponse, goalsResponse, tasksResponse] = await Promise.all([
        remindersAPI.getAll(),
        goalsAPI.getAll(),
        tasksAPI.getAll()
      ]);
      setReminders(remindersResponse.data || []);
      setGoals(goalsResponse.data || []);
      setTasks(tasksResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setReminders([]);
      setGoals([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesType = filterType === 'all' || reminder.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'completed' && reminder.isCompleted) ||
      (filterStatus === 'pending' && !reminder.isCompleted);
    return matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return Target;
      case 'task': return CheckSquare;
      case 'custom': return Bell;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'goal': return 'bg-blue-100 text-blue-800';
      case 'task': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDateStatus = (scheduledAt: Date) => {
    const date = new Date(scheduledAt);
    if (isPast(date) && !isToday(date)) return { color: 'text-red-600', label: 'Overdue' };
    if (isToday(date)) return { color: 'text-orange-600', label: 'Today' };
    if (isTomorrow(date)) return { color: 'text-yellow-600', label: 'Tomorrow' };
    return { color: 'text-gray-600', label: format(date, 'MMM dd, yyyy') };
  };

  const toggleReminderStatus = async (reminderId: string) => {
    try {
      const response = await remindersAPI.toggle(reminderId);
      setReminders(reminders.map(reminder => 
        reminder.id === reminderId ? response.data : reminder
      ));
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const handleAddOrUpdateReminder = async (formData: FormData) => {
    try {
      const reminderData = {
        title: formData.get('title') as string,
        message: formData.get('message') as string,
        type: formData.get('type') as string,
        scheduledAt: new Date(formData.get('scheduledAt') as string),
        entityId: formData.get('entityId') as string || undefined,
        entityType: formData.get('entityType') as string || undefined,
        isRecurring: formData.get('isRecurring') === 'true',
        recurringPattern: formData.get('isRecurring') === 'true' ? {
          frequency: formData.get('frequency') as any,
          interval: parseInt(formData.get('interval') as string) || 1,
          endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
          maxOccurrences: formData.get('maxOccurrences') ? parseInt(formData.get('maxOccurrences') as string) : undefined
        } : undefined
      };

      if (editingReminder) {
        const response = await remindersAPI.update(editingReminder.id, reminderData);
        setReminders(reminders.map(r => r.id === editingReminder.id ? response.data : r));
      } else {
        const response = await remindersAPI.create(reminderData);
        setReminders([response.data, ...reminders]);
      }

      setEditingReminder(null);
      setShowAddReminder(false);
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string, deleteAll = false) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      await remindersAPI.delete(reminderId);
      setReminders(reminders.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const upcomingReminders = filteredReminders
    .filter(r => !r.isCompleted && !isPast(new Date(r.scheduledAt)))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="goal">Goal Reminders</option>
              <option value="task">Task Reminders</option>
              <option value="custom">Custom Reminders</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={() => {
            setEditingReminder(null);
            setShowAddReminder(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reminders', value: filteredReminders.length, color: 'bg-blue-500' },
          { label: 'Pending', value: filteredReminders.filter(r => !r.isCompleted).length, color: 'bg-orange-500' },
          { label: 'Completed', value: filteredReminders.filter(r => r.isCompleted).length, color: 'bg-green-500' },
          { label: 'Overdue', value: filteredReminders.filter(r => !r.isCompleted && isPast(new Date(r.scheduledAt))).length, color: 'bg-red-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-2`}>
                <Bell className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
            Upcoming Reminders
          </h3>
          <div className="space-y-3">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => {
                const Icon = getTypeIcon(reminder.type);
                const dateStatus = getDateStatus(new Date(reminder.scheduledAt));
                
                return (
                  <div key={reminder.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <Icon className="w-4 h-4 text-gray-600 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">{reminder.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{reminder.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-medium ${dateStatus.color}`}>
                            {dateStatus.label}
                          </span>
                          <div className="flex items-center space-x-1">
                            {reminder.isRecurring && <Repeat className="w-3 h-3 text-gray-400" />}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(reminder.type)}`}>
                              {reminder.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No upcoming reminders</p>
              </div>
            )}
          </div>
        </div>

        {/* All Reminders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Reminders</h3>
            <div className="space-y-4">
              {filteredReminders.length > 0 ? (
                filteredReminders.map((reminder) => {
                  const Icon = getTypeIcon(reminder.type);
                  const dateStatus = getDateStatus(new Date(reminder.scheduledAt));
                  
                  return (
                    <div key={reminder.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <button
                            onClick={() => toggleReminderStatus(reminder.id)}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              reminder.isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {reminder.isCompleted && <CheckSquare className="w-3 h-3" />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Icon className="w-4 h-4 text-gray-600" />
                              <h4 className={`font-medium ${reminder.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {reminder.title}
                              </h4>
                              {reminder.isRecurring && <Repeat className="w-4 h-4 text-blue-600" />}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{reminder.message}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className={`text-xs font-medium ${dateStatus.color}`}>
                                  {format(new Date(reminder.scheduledAt), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(reminder.type)}`}>
                                {reminder.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                          <button
                            onClick={() => {
                              setEditingReminder(reminder);
                              setShowAddReminder(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No reminders found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Reminder Modal */}
      {showAddReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateReminder(formData);
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingReminder?.title || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reminder title..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  rows={3}
                  defaultValue={editingReminder?.message || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reminder message..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select 
                    name="type"
                    defaultValue={editingReminder?.type || 'custom'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="custom">Custom Reminder</option>
                    <option value="goal">Goal Reminder</option>
                    <option value="task">Task Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    defaultValue={editingReminder ? new Date(editingReminder.scheduledAt).toISOString().slice(0, 16) : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Recurring Options */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    value="true"
                    defaultChecked={editingReminder?.isRecurring || false}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      const recurringOptions = document.getElementById('recurring-options');
                      if (recurringOptions) {
                        recurringOptions.style.display = e.target.checked ? 'block' : 'none';
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">Make this a recurring reminder</span>
                </label>
              </div>

              <div id="recurring-options" style={{ display: editingReminder?.isRecurring ? 'block' : 'none' }} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <select 
                      name="frequency"
                      defaultValue={editingReminder?.recurringPattern?.frequency || 'daily'}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repeat every</label>
                    <input
                      type="number"
                      name="interval"
                      min="1"
                      defaultValue={editingReminder?.recurringPattern?.interval || 1}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date (optional)</label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={editingReminder?.recurringPattern?.endDate ? new Date(editingReminder.recurringPattern.endDate).toISOString().slice(0, 10) : ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Occurrences (optional)</label>
                    <input
                      type="number"
                      name="maxOccurrences"
                      min="1"
                      defaultValue={editingReminder?.recurringPattern?.maxOccurrences || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddReminder(false);
                    setEditingReminder(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};