import React, { useState, useEffect } from 'react';
import { Plus, Target, Calendar, BarChart3, Filter, Search, Pencil, Trash2 } from 'lucide-react';
import { Goal } from '../../types';
import { goalsAPI } from '../../services/api';
import { useSubscription } from '../../context/SubscriptionContext';

export const GoalsManager: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { canCreate, getUpgradeMessage, limits } = useSubscription();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getAll();
      setGoals(response.data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateGoal = async (formData: FormData) => {
    try {
      if (!editingGoal && !canCreate('goals', goals.length)) {
        alert(getUpgradeMessage('goals'));
        return;
      }

      const goalData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        priority: formData.get('priority') as string,
        dueDate: new Date(formData.get('dueDate') as string),
      };

      if (editingGoal) {
        const response = await goalsAPI.update(editingGoal._id, goalData);
        setGoals(goals.map(g => (g._id === editingGoal._id ? response.data : g)));
      } else {
        const response = await goalsAPI.create(goalData);
        setGoals([response.data, ...goals]);
      }

      setEditingGoal(null);
      setShowAddGoal(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await goalsAPI.delete(goalId);
      setGoals(goals.filter(g => g._id !== goalId));
      if (selectedGoal && selectedGoal._id === goalId) {
        setSelectedGoal(null);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

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
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
    const matchesSearch =
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <p>Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => { setShowAddGoal(true); setEditingGoal(null); }}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            canCreate('goals', goals.length)
              ? 'bg-blue-700 text-white dark:text-white border border-blue-800 dark:border-blue-500 hover:bg-blue-800'
              : 'bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed'
          }`}
          disabled={!canCreate('goals', goals.length)}
          onClick={() => {
            if (canCreate('goals', goals.length)) {
              setShowAddGoal(true);
              setEditingGoal(null);
            } else {
              alert(getUpgradeMessage('goals'));
            }
          }}
        >
          <Plus className="w-4 h-4" />
          <span>{canCreate('goals', goals.length) ? 'Add Goal' : `Limit: ${limits.goals}`}</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGoals.length > 0 ? (
          filteredGoals.map(goal => (
            <div 
              key={goal._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md space-y-3 cursor-pointer transition-all duration-200"
              onClick={() => setSelectedGoal(goal)}
            >
              {/* Top row */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2 max-w-[70%]">
                  <Target className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{goal.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditingGoal(goal); 
                      setShowAddGoal(true); 
                    }}
                  >
                    <Pencil className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDeleteGoal(goal._id); 
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2">{goal.description}</p>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progress</span>
                  <span className="font-medium text-gray-900">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex justify-between items-center text-xs pt-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 whitespace-nowrap">
                    Due {new Date(goal.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                  {goal.priority}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2 border-t border-gray-200 text-xs">
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">{goal.tasks?.length || 0} tasks</span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 truncate">{goal.category}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-16 bg-white rounded-xl border">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Found</h3>
            <p className="mb-6">Try changing filters or create a new goal.</p>
            <button
              onClick={() => { setEditingGoal(null); setShowAddGoal(true); }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Goal</span>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingGoal ? 'Edit Goal' : 'Add New Goal'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateGoal(formData);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" defaultValue={editingGoal?._id} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  placeholder="Title" 
                  defaultValue={editingGoal?.title || ''} 
                  className="w-full border rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                name="description" 
                rows={6} 
                placeholder="Description (line breaks will be preserved)" 
                defaultValue={editingGoal?.description || ''} 
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input 
                  type="text" 
                  name="category" 
                  placeholder="Category" 
                  defaultValue={editingGoal?.category || ''} 
                  className="w-full border rounded-lg px-3 py-2" 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select 
                    name="priority" 
                    defaultValue={editingGoal?.priority || 'low'} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    name="dueDate" 
                    required 
                    defaultValue={editingGoal?.dueDate?.slice(0, 10)} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowAddGoal(false); setEditingGoal(null); }} 
                  className="w-full sm:w-auto px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white dark:text-white border border-blue-700 dark:border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingGoal ? 'Update' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 min-w-0">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: '#3B82F6' + '20', color: '#3B82F6' }}
                >
                  <Target className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{selectedGoal.title}</h3>
                  <p className="text-sm text-gray-600">{selectedGoal.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingGoal(selectedGoal);
                    setShowAddGoal(true);
                    setSelectedGoal(null);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    handleDeleteGoal(selectedGoal._id);
                    setSelectedGoal(null);
                  }}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              <div className="xl:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Description</h4>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {selectedGoal.description}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Goal Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedGoal.status)}`}>
                        {selectedGoal.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Priority</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedGoal.priority)}`}>
                        {selectedGoal.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{selectedGoal.progress}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Due Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedGoal.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Category</span>
                      <span className="text-sm font-medium text-gray-900">{selectedGoal.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completion</span>
                      <span className="font-medium text-gray-900">{selectedGoal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedGoal.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {selectedGoal.progress === 100 ? 'Goal completed!' : 
                       selectedGoal.progress >= 75 ? 'Almost there!' :
                       selectedGoal.progress >= 50 ? 'Making good progress' :
                       selectedGoal.progress >= 25 ? 'Getting started' :
                       'Just beginning'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 order-2 sm:order-1">
                Created {new Date(selectedGoal.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-3 order-1 sm:order-2">
                <button
                  onClick={() => {
                    setEditingGoal(selectedGoal);
                    setShowAddGoal(true);
                    setSelectedGoal(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Goal
                </button>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};