import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Calendar, Clock, Filter, Search, MoreVertical, Flag, User, Paperclip } from 'lucide-react';
import { Task, Goal } from '../../types';
import { tasksAPI, goalsAPI } from '../../services/api';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';

export const TasksManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, goalsResponse] = await Promise.all([
        tasksAPI.getAll(),
        goalsAPI.getAll()
      ]);
      setTasks(tasksResponse.data || []);
      setGoals(goalsResponse.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setTasks([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesGoal = filterGoal === 'all' || task.goalId === filterGoal;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesGoal && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDateStatus = (dueDate: Date) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return { color: 'text-red-600', label: 'Overdue' };
    if (isToday(date)) return { color: 'text-orange-600', label: 'Due Today' };
    if (isTomorrow(date)) return { color: 'text-yellow-600', label: 'Due Tomorrow' };
    if (isThisWeek(date)) return { color: 'text-blue-600', label: 'This Week' };
    return { color: 'text-gray-600', label: format(date, 'MMM dd') };
  };

  const toggleTaskStatus = async (taskId: string) => {
    try {
      const response = await tasksAPI.toggle(taskId);
      setTasks(tasks.map(task => 
        task.id === taskId ? response.data : task
      ));
    } catch (error: any) {
      console.error('Error toggling task status:', error);
    }
  };

  const handleAddTask = async (formData: FormData) => {
    try {
      const taskData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        goalId: formData.get('goalId') as string || undefined,
        priority: formData.get('priority') as string,
        status: formData.get('status') as string,
        dueDate: new Date(formData.get('dueDate') as string),
      };

      const response = await tasksAPI.create(taskData);
      setTasks([response.data, ...tasks]);
      setShowAddTask(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
    }
  };

  const getGoalTitle = (goalId: string) => {
    if (!goalId) return 'No Goal';
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.title : 'No Goal';
  };

  const tasksByStatus = {
    pending: filteredTasks.filter(task => task.status === 'pending'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    completed: filteredTasks.filter(task => task.status === 'completed')
  };

const TaskCard: React.FC<{ task: Task; isKanban?: boolean }> = ({ task, isKanban = false }) => {
  const dateStatus = getDateStatus(task.dueDate);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksAPI.delete(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEdit = () => {
    const form = new FormData();
    form.set('title', task.title);
    form.set('description', task.description);
    form.set('goalId', task.goalId || '');
    form.set('priority', task.priority);
    form.set('status', task.status);
    form.set('dueDate', new Date(task.dueDate).toISOString().slice(0, 16));
    // Store formData and taskId in state for the modal
    setShowAddTask(true);
    (document.querySelector('input[name="title"]') as HTMLInputElement).value = task.title;
    (document.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value = task.description || '';
    (document.querySelector('select[name="goalId"]') as HTMLSelectElement).value = task.goalId || '';
    (document.querySelector('select[name="priority"]') as HTMLSelectElement).value = task.priority;
    (document.querySelector('select[name="status"]') as HTMLSelectElement).value = task.status;
    (document.querySelector('input[name="dueDate"]') as HTMLInputElement).value = new Date(task.dueDate).toISOString().slice(0, 16);

    // For future improvement: use a separate state to pass this cleanly
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${
      isKanban ? 'mb-3' : 'mb-4'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => toggleTaskStatus(task.id)}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              task.status === 'completed'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {task.status === 'completed' && <CheckSquare className="w-3 h-3" />}
          </button>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleEdit} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Edit</button>
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className={`text-xs font-medium ${dateStatus.color}`}>{dateStatus.label}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            <Flag className="w-3 h-3 inline mr-1" />
            {task.priority}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <Paperclip className="w-3 h-3 mr-1" />
              {task.attachments.length}
            </div>
          )}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('-', ' ')}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Goal: {getGoalTitle(task.goalId)}</span>
          <span>Created {format(new Date(task.createdAt), 'MMM dd')}</span>
        </div>
      </div>
    </div>
  );
};


  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Goals</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Kanban
            </button>
          </div>
          
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: filteredTasks.length, color: 'bg-blue-500' },
          { label: 'Pending', value: tasksByStatus.pending.length, color: 'bg-gray-500' },
          { label: 'In Progress', value: tasksByStatus['in-progress'].length, color: 'bg-yellow-500' },
          { label: 'Completed', value: tasksByStatus.completed.length, color: 'bg-green-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-2`}>
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tasks Display */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h3>
          <div className="space-y-0">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="text-center py-16">
                <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterGoal !== 'all'
                    ? 'No tasks match your current filters. Try adjusting your search or filters.'
                    : 'Get started by creating your first task to track your work and progress.'
                  }
                </p>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Task</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {status.replace('-', ' ')}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {statusTasks.length}
                </span>
              </div>
              <div className="space-y-0">
                {statusTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isKanban />
                ))}
                {statusTasks.length === 0 && (
                  <div className="text-center py-8">
                    <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No {status} tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Task</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddTask(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                  <input
                    type="text"
                    name="title"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title..."
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the task..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Associated Goal</label>
                  <select 
                    name="goalId"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a goal (optional)</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select 
                    name="priority"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    name="status"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};