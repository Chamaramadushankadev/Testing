import React, { useState } from 'react';
import { Plus, StickyNote, Search, Filter, Tag, Calendar, Edit3, Trash2, Eye, BookOpen } from 'lucide-react';
import { Note, Goal } from '../../types';
import { mockNotes, mockGoals } from '../../data/mockData';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

export const NotesManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [goals] = useState<Goal[]>(mockGoals);
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

  const handleAddNote = (formData: FormData) => {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const goalId = formData.get('goalId') as string;
    const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t);

    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      goalId: goalId || undefined,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: []
    };

    setNotes([newNote, ...notes]);
    setShowAddNote(false);
  };

  const handleEditNote = (formData: FormData) => {
    if (!selectedNote) return;

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const goalId = formData.get('goalId') as string;
    const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t);

    const updatedNote: Note = {
      ...selectedNote,
      title,
      content,
      goalId: goalId || undefined,
      tags,
      updatedAt: new Date()
    };

    setNotes(notes.map(note => note.id === selectedNote.id ? updatedNote : note));
    setIsEditing(false);
    setSelectedNote(updatedNote);
  };

const handleDeleteNote = async (noteId: string) => {
  const confirmed = window.confirm("Are you sure you want to delete this note?");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

    setNotes(prev => prev.filter(note => note.id !== noteId));
    setSelectedNote(null);
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    alert('Failed to delete note.');
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
            setSelectedNote(note);
            setIsEditing(true);
          }}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="prose prose-sm max-w-none mb-4">
        <ReactMarkdown className="line-clamp-3 text-gray-600">
          {note.content}
        </ReactMarkdown>
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
          {format(note.updatedAt, 'MMM dd')}
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          
          <button
            onClick={() => setShowAddNote(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{selectedNote.title}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
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
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
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
                Updated {format(selectedNote.updatedAt, 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {(showAddNote || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  defaultValue={isEditing ? selectedNote?.title : ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter note title..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Associated Goal</label>
                  <select 
                    name="goalId"
                    defaultValue={isEditing ? selectedNote?.goalId || '' : ''}
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
                    defaultValue={isEditing ? selectedNote?.tags.join(', ') : ''}
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
                  defaultValue={isEditing ? selectedNote?.content : ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Write your note content here... You can use Markdown formatting."
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNote(false);
                    setIsEditing(false);
                    setSelectedNote(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};