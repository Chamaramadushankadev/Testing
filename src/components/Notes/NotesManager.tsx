import React, { useState, useEffect } from 'react';
import { Plus, StickyNote, Search, Filter, Tag, Calendar, Edit3, Trash2, Eye, BookOpen } from 'lucide-react';
import { Note, Goal } from '../../types';
import { notesAPI, goalsAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { useSubscription } from '../../context/SubscriptionContext';
import { UpgradeModal } from '../Upgrade/UpgradeModal';

export const NotesManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { canCreate, getUpgradeMessage, limits } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesResponse, goalsResponse] = await Promise.all([
        notesAPI.getAll(),
        goalsAPI.getAll()
      ]);
      setNotes(Array.isArray(notesResponse.data) ? notesResponse.data : []);
      setGoals(Array.isArray(goalsResponse.data) ? goalsResponse.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setNotes([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesGoal = filterGoal === 'all' || note.goalId === filterGoal;
    const matchesTag = filterTag === 'all' || note.tags.includes(filterTag);
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGoal && matchesTag && matchesSearch;
  });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return 'Personal Notes';
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.title : 'Unknown Goal';
  };

  const handleAddNote = async (formData: FormData) => {
    try {
      if (!canCreate('notes', notes.length)) {
        alert(getUpgradeMessage('notes'));
        return;
      }

      const title = formData.get('title') as string;
      const content = formData.get('content') as string;
      const goalId = formData.get('goalId') as string;
      const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t);

      const noteData = {
        title,
        content,
        goalId: goalId || undefined,
        tags
      };

      const response = await notesAPI.create(noteData);
      setNotes([response.data, ...notes]);
      setShowAddNote(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleEditNote = async (formData: FormData) => {
    if (!editingNote) return;

    try {
      const title = formData.get('title') as string;
      const content = formData.get('content') as string;
      const goalId = formData.get('goalId') as string;
      const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t);

      const noteData = {
        title,
        content,
        goalId: goalId || undefined,
        tags
      };

      const response = await notesAPI.update(editingNote.id, noteData);
      setNotes(notes.map(note => note.id === editingNote.id ? response.data : note));
      setIsEditing(false);
      setEditingNote(null);
      setSelectedNote(response.data);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;

    try {
      await notesAPI.delete(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
      setSelectedNote(null);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const NoteCard: React.FC<{ note: Note }> = ({ note }) => (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => setSelectedNote(note)}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 line-clamp-2">{note.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingNote(note);
            setIsEditing(true);
          }}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="prose prose-sm max-w-none mb-4">
        <div className="line-clamp-3 text-gray-600 whitespace-pre-line">
  {note.content}
</div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {format(new Date(note.updatedAt), 'MMM dd')}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <BookOpen className="w-3 h-3 mr-1" />
          {getGoalTitle(note.goalId)}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Goals</option>
              <option value="">Personal Notes</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
            
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          
         <button
  onClick={() => {
    if (canCreate('notes', notes.length)) {
      setShowAddNote(true);
    } else {
      setShowUpgradeModal(true);
    }
  }}
  className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
    canCreate('notes', notes.length)
      ? 'bg-blue-700 text-white dark:text-white border border-blue-800 dark:border-blue-500 hover:bg-blue-800'
      : 'bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed'
  }`}
  disabled={!canCreate('notes', notes.length)}
>
            <Plus className="w-4 h-4" />
            <span>{canCreate('notes', notes.length) ? 'Add Note' : `Limit: ${limits.notes}`}</span>
          </button>
        </div>
      </div>

      {/* Notes Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notes found matching your filters</p>
          </div>
        )}
      </div>

      {/* Note Detail Modal */}
      {selectedNote && !isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{selectedNote.title}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingNote(selectedNote);
                    setIsEditing(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="prose max-w-none mb-6">
              <div className="whitespace-pre-line">{selectedNote.content}</div>

            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {selectedNote.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                Updated {format(new Date(selectedNote.updatedAt), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {(showAddNote || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {isEditing ? 'Edit Note' : 'Create New Note'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (isEditing) {
                  handleEditNote(formData);
                } else {
                  handleAddNote(formData);
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={isEditing ? editingNote?.title : ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter note title..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Associated Goal</label>
                  <select 
                    name="goalId"
                    defaultValue={isEditing ? editingNote?.goalId || '' : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Personal Notes</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={isEditing ? editingNote?.tags.join(', ') : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ideas, research, important"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content (Markdown supported)</label>
                <textarea
                  name="content"
                  rows={12}
                  defaultValue={isEditing ? editingNote?.content : ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Write your note content here... You can use Markdown formatting."
                />
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNote(false);
                    setIsEditing(false);
                    setEditingNote(null);
                    setSelectedNote(null);
                  }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
};