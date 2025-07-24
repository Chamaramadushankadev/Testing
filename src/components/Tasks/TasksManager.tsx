import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Calendar, Clock, Filter, Search, MoreVertical, Flag, User, Paperclip } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Task, Goal } from '../../types';
import { tasksAPI, goalsAPI } from '../../services/api';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';

export const TasksManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
const [dndReady, setDndReady] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);



  useEffect(() => {
  // Wait until next tick to ensure DOM is fully ready
  const timeout = setTimeout(() => {
    setDndReady(true);
  }, 0);
  return () => clearTimeout(timeout);
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

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // Get the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    // Update task status based on destination
    const newStatus = destination.droppableId;
    
    try {
      const updatedTask = { ...task, status: newStatus };
      const response = await tasksAPI.update(task.id, updatedTask);
      
      // Update local state
      setTasks(tasks.map(t => t.id === task.id ? response.data : t));
    } catch (error) {
      console.error('Error updating task status:', error);
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

  const handleAddOrUpdateTask = async (formData: FormData) => {
    try {
      const taskData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        goalId: formData.get('goalId') as string || undefined,
        priority: formData.get('priority') as string,
        status: formData.get('status') as string,
        dueDate: new Date(formData.get('dueDate') as string),
      };

      if (editingTask) {
        const response = await tasksAPI.update(editingTask.id, taskData);
        setTasks(tasks.map(task => task.id === editingTask.id ? response.data : task));
      } else {
        const response = await tasksAPI.create(taskData);
        setTasks([response.data, ...tasks]);
      }

      setShowAddTask(false);
      setEditingTask(null);
    } catch (error: any) {
      console.error('Error saving task:', error);
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
    setEditingTask(task);
    setShowAddTask(true);
  };

return (
  <div
    className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg transition-all duration-300 ${
      isKanban ? 'mb-4' : 'mb-6'
    }`}
  >
    {/* Top: Title + Actions */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3 flex-1">
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
          <h4
            className={`text-md font-semibold leading-snug ${
              task.status === 'completed'
                ? 'line-through text-gray-500'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {task.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 whitespace-pre-line">
            {task.description}
          </p>
        </div>
      </div>

      <div className="flex gap-2 text-xs font-semibold">
        <button
          onClick={handleEdit}
          className="text-blue-500 hover:text-blue-700 transition"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 transition"
        >
          Delete
        </button>
      </div>
    </div>

    {/* Middle: Tags */}
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1 ${dateStatus.color}`}>
          <Calendar className="w-3 h-3" />
          {dateStatus.label}
        </span>
        <span
          className={`border rounded-full px-2 py-0.5 flex items-center gap-1 ${getPriorityColor(
            task.priority
          )}`}
        >
          <Flag className="w-3 h-3" />
          {task.priority}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {task.attachments?.length > 0 && (
          <span className="flex items-center text-gray-500">
            <Paperclip className="w-3 h-3 mr-1" />
            {task.attachments.length}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 ${getStatusColor(task.status)}`}
        >
          {task.status.replace('-', ' ')}
        </span>
      </div>
    </div>

    {/* Footer: Goal + Created */}
    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
      <span>Goal: {getGoalTitle(task.goalId)}</span>
      <span>Created {format(new Date(task.createdAt), 'MMM dd')}</span>
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
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Goals</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Kanban
            </button>
          </div>
          
          <button
            onClick={() => {
              setEditingTask(null);
              setShowAddTask(true);
            }}
            className="w-full sm:w-auto bg-blue-700 text-white dark:text-white border border-blue-800 dark:border-blue-500 px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    { label: 'Total Tasks', value: filteredTasks.length, color: 'bg-blue-500' },
    { label: 'Pending', value: tasksByStatus.pending.length, color: 'bg-gray-500' },
    { label: 'In Progress', value: tasksByStatus['in-progress'].length, color: 'bg-yellow-500' },
    { label: 'Completed', value: tasksByStatus.completed.length, color: 'bg-green-500' }
  ].map((stat, index) => (
    <div
      key={index}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
        </div>
        <div className={`${stat.color} rounded-lg p-2`}>
          <CheckSquare className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  ))}
</div>


{/* Tasks Display */}
{dndReady && (
  <DragDropContext onDragEnd={handleDragEnd}>
    {viewMode === 'list' ? (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All Tasks ({filteredTasks.length})
        </h3>
        <div className="space-y-0">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="text-center py-16">
              <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tasks Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterGoal !== 'all'
                  ? 'No tasks match your current filters. Try adjusting your search or filters.'
                  : 'Get started by creating your first task to track your work and progress.'}
              </p>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowAddTask(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Task</span>
              </button>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div
            key={status}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {status.replace('-', ' ')}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {statusTasks.length}
              </span>
            </div>
            <Droppable droppableId={status}>
  {(provided) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className="flex flex-col gap-3 min-h-[300px] transition-all"
    >
      {statusTasks.map((task, index) => (
        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="rounded-lg"
            >
              <TaskCard task={task} isKanban />
            </div>
          )}
        </Draggable>
      ))}
      {provided.placeholder}
      {statusTasks.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-400">
          <CheckSquare className="w-6 h-6 mx-auto mb-2" />
          No {status.replace('-', ' ')} tasks
        </div>
      )}
    </div>
  )}
</Droppable>

            
          </div>
        ))}
      </div>
    )}
  </DragDropContext>
)}



      {/* Add/Edit Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateTask(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingTask?.title || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={editingTask?.description || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the task..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Associated Goal</label>
                  <select 
                    name="goalId"
                    defaultValue={editingTask?.goalId || ''}
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
                    defaultValue={editingTask?.priority || 'low'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    name="status"
                    defaultValue={editingTask?.status || 'pending'}
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
                    defaultValue={editingTask ? new Date(editingTask.dueDate).toISOString().slice(0, 16) : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowAddTask(false); setEditingTask(null); }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white border border-blue-700 dark:border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};