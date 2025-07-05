import React, { useState, useEffect } from 'react';
import { Plus, Target, Calendar, BarChart3, Filter, Search, Pencil, Trash2 } from 'lucide-react';
import { Goal } from '../../types';
import { goalsAPI } from '../../services/api';

export const GoalsManager: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGoals.length > 0 ? (
          filteredGoals.map(goal => (
            <div key={goal._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md space-y-3">
              {/* Top row */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2 max-w-[70%]">
                  <Target className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{goal.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                  <button onClick={() => { setEditingGoal(goal); setShowAddGoal(true); }}>
                    <Pencil className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                  </button>
                  <button onClick={() => handleDeleteGoal(goal._id)}>
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
                  <span className="text-gray-500">
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
                <span className="text-gray-500">{goal.category}</span>
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
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Goal</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{editingGoal ? 'Edit Goal' : 'Add New Goal'}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateGoal(formData);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" defaultValue={editingGoal?._id} />
              <input type="text" name="title" required placeholder="Title" defaultValue={editingGoal?.title || ''} className="w-full border rounded-lg px-3 py-2" />
              <textarea name="description" rows={3} placeholder="Description" defaultValue={editingGoal?.description || ''} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" name="category" placeholder="Category" defaultValue={editingGoal?.category || ''} className="w-full border rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-4">
                <select name="priority" defaultValue={editingGoal?.priority || 'low'} className="w-full border rounded-lg px-3 py-2">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input type="date" name="dueDate" required defaultValue={editingGoal?.dueDate?.slice(0, 10)} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => { setShowAddGoal(false); setEditingGoal(null); }} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingGoal ? 'Update' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
