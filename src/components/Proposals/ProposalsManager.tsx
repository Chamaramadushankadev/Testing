import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, Filter, Tag, Calendar, Edit3, Trash2, Eye, Briefcase, DollarSign, Clock, Flag, Folder, Settings, Palette, Code, Video, PenTool, Megaphone } from 'lucide-react';
import { Proposal, ProposalCategory } from '../../types';
import { proposalsAPI } from '../../services/api';
import { format } from 'date-fns';
import { useSubscription } from '../../context/SubscriptionContext';

export const ProposalsManager: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [categories, setCategories] = useState<ProposalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProposal, setShowAddProposal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProposalCategory | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { canCreate, getUpgradeMessage, limits } = useSubscription();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProposals();
  }, [filterCategory, filterStatus, filterPriority, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [proposalsResponse, categoriesResponse] = await Promise.all([
        proposalsAPI.getAll(),
        proposalsAPI.getCategories()
      ]);
      setProposals(Array.isArray(proposalsResponse.data) ? proposalsResponse.data : []);
      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setProposals([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async () => {
    try {
      const params: any = {};
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (searchTerm) params.search = searchTerm;

      const response = await proposalsAPI.getAll(params);
      setProposals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setProposals([]);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesCategory = filterCategory === 'all' || proposal.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || proposal.priority === filterPriority;
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (proposal.clientName && proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesPriority && matchesSearch;
  });

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      'megaphone': Megaphone,
      'video': Video,
      'palette': Palette,
      'code': Code,
      'pen-tool': PenTool,
      'briefcase': Briefcase,
      'folder': Folder
    };
    return icons[iconName] || Folder;
  };

  const getCategoryInfo = (categoryName: string) => {
    return categories.find(c => c.name === categoryName);
  };

  const handleAddProposal = async (formData: FormData) => {
    try {
      if (!canCreate('proposals', proposals.length)) {
        alert(getUpgradeMessage('proposals'));
        return;
      }

      const proposalData = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        category: formData.get('category') as string,
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
        status: formData.get('status') as string || 'draft',
        priority: formData.get('priority') as string || 'medium',
        clientName: formData.get('clientName') as string || '',
        projectValue: formData.get('projectValue') ? parseFloat(formData.get('projectValue') as string) : undefined,
        deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : undefined
      };

      const response = await proposalsAPI.create(proposalData);
      setProposals([response.data, ...proposals]);
      setShowAddProposal(false);
    } catch (error) {
      console.error('Error creating proposal:', error);
    }
  };

  const handleEditProposal = async (formData: FormData) => {
    if (!editingProposal) return;

    try {
      const proposalData = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        category: formData.get('category') as string,
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
        status: formData.get('status') as string || 'draft',
        priority: formData.get('priority') as string || 'medium',
        clientName: formData.get('clientName') as string || '',
        projectValue: formData.get('projectValue') ? parseFloat(formData.get('projectValue') as string) : undefined,
        deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : undefined
      };

      const response = await proposalsAPI.update(editingProposal.id, proposalData);
      setProposals(proposals.map(proposal => proposal.id === editingProposal.id ? response.data : proposal));
      setIsEditing(false);
      setEditingProposal(null);
      setSelectedProposal(response.data);
    } catch (error) {
      console.error('Error updating proposal:', error);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this proposal?");
    if (!confirmed) return;

    try {
      await proposalsAPI.delete(proposalId);
      setProposals(proposals.filter(proposal => proposal.id !== proposalId));
      setSelectedProposal(null);
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const handleAddOrUpdateCategory = async (formData: FormData) => {
    try {
      const categoryData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || '',
        color: formData.get('color') as string || '#3B82F6',
        icon: formData.get('icon') as string || 'folder'
      };

      if (editingCategory) {
        const response = await proposalsAPI.updateCategory(editingCategory.id, categoryData);
        setCategories(categories.map(cat => cat.id === editingCategory.id ? response.data : cat));
      } else {
        const response = await proposalsAPI.createCategory(categoryData);
        setCategories([...categories, response.data]);
      }

      setEditingCategory(null);
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
    
    // Reload data to get updated categories
    await loadData();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category?.isDefault) {
      alert('Cannot delete default categories');
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this category?");
    if (!confirmed) return;

    try {
      await proposalsAPI.deleteCategory(categoryId);
      setCategories(categories.filter(cat => cat.id !== categoryId));
      // Reload data to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const ProposalCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
    const categoryInfo = getCategoryInfo(proposal.category);
    const CategoryIcon = getCategoryIcon(categoryInfo?.icon || 'folder');

    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => setSelectedProposal(proposal)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: categoryInfo?.color + '20', color: categoryInfo?.color }}
            >
              <CategoryIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 line-clamp-1">{proposal.title}</h4>
              <p className="text-xs text-gray-500">{proposal.category}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingProposal(proposal);
              setIsEditing(true);
            }}
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="line-clamp-3 text-gray-600 text-sm whitespace-pre-line">
            {proposal.content}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
              {proposal.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(proposal.priority)}`}>
              <Flag className="w-3 h-3 inline mr-1" />
              {proposal.priority}
            </span>
          </div>
          {proposal.projectValue && (
            <div className="flex items-center text-xs text-green-600">
              <DollarSign className="w-3 h-3 mr-1" />
              {proposal.projectValue.toLocaleString()}
            </div>
          )}
        </div>

        {proposal.clientName && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Briefcase className="w-3 h-3 mr-1" />
            {proposal.clientName}
          </div>
        )}

        {proposal.deadline && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <Clock className="w-3 h-3 mr-1" />
            Due {format(new Date(proposal.deadline), 'MMM dd, yyyy')}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {proposal.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
            {proposal.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{proposal.tags.length - 2}</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(proposal.updatedAt), 'MMM dd')}
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
          <p className="text-gray-600">Loading proposals...</p>
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
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowAddCategory(true);
            }}
            className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Categories</span>
          </button>

          <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          
          <button
            onClick={() => setShowAddProposal(true)}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              canCreate('proposals', proposals.length)
                ? 'bg-blue-700 text-white dark:text-white border border-blue-800 dark:border-blue-500 hover:bg-blue-800'
                : 'bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed'
            }`}
            disabled={!canCreate('proposals', proposals.length)}
            onClick={() => {
              if (canCreate('proposals', proposals.length)) {
                setShowAddProposal(true);
              } else {
                alert(getUpgradeMessage('proposals'));
              }
            }}
          >
            <Plus className="w-4 h-4" />
            <span>{canCreate('proposals', proposals.length) ? 'Add Proposal' : `Limit: ${limits.proposals}`}</span>
          </button>
        </div>
      </div>

      {/* Categories Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {categories.map((category) => {
            const CategoryIcon = getCategoryIcon(category.icon);
            const count = proposals.filter(p => p.category === category.name).length;
            
            return (
              <div
                key={category.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setFilterCategory(category.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: category.color + '20', color: category.color }}
                  >
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {!category.isDefault && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                            setShowAddCategory(true);
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{count} proposals</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proposals Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredProposals.length > 0 ? (
          filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No proposals found matching your filters</p>
          </div>
        )}
      </div>

      {/* Proposal Detail Modal */}
      {selectedProposal && !isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: getCategoryInfo(selectedProposal.category)?.color + '20', 
                    color: getCategoryInfo(selectedProposal.category)?.color 
                  }}
                >
                  {React.createElement(getCategoryIcon(getCategoryInfo(selectedProposal.category)?.icon || 'folder'), { className: "w-5 h-5" })}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{selectedProposal.title}</h3>
                  <p className="text-sm text-gray-600">{selectedProposal.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingProposal(selectedProposal);
                    setIsEditing(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteProposal(selectedProposal.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              <div className="xl:col-span-2">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line">{selectedProposal.content}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Project Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProposal.status)}`}>
                        {selectedProposal.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Priority</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedProposal.priority)}`}>
                        {selectedProposal.priority}
                      </span>
                    </div>
                    {selectedProposal.clientName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Client</span>
                        <span className="text-sm font-medium text-gray-900">{selectedProposal.clientName}</span>
                      </div>
                    )}
                    {selectedProposal.projectValue && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Value</span>
                        <span className="text-sm font-medium text-green-600">
                          ${selectedProposal.projectValue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedProposal.deadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Deadline</span>
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(selectedProposal.deadline), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 order-2 sm:order-1">
                {selectedProposal.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-500 order-1 sm:order-2">
                Updated {format(new Date(selectedProposal.updatedAt), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Proposal Modal */}
      {(showAddProposal || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {isEditing ? 'Edit Proposal' : 'Create New Proposal'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (isEditing) {
                  handleEditProposal(formData);
                } else {
                  handleAddProposal(formData);
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={isEditing ? editingProposal?.title : ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter proposal title..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select 
                    name="category"
                    defaultValue={isEditing ? editingProposal?.category : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    name="status"
                    defaultValue={isEditing ? editingProposal?.status : 'draft'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select 
                    name="priority"
                    defaultValue={isEditing ? editingProposal?.priority : 'medium'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  name="content"
                  rows={12}
                  defaultValue={isEditing ? editingProposal?.content : ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your proposal content here..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    defaultValue={isEditing ? editingProposal?.clientName : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Client or company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Value ($)</label>
                  <input
                    type="number"
                    name="projectValue"
                    defaultValue={isEditing ? editingProposal?.projectValue : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={isEditing && editingProposal?.deadline ? new Date(editingProposal.deadline).toISOString().slice(0, 10) : ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  defaultValue={isEditing ? editingProposal?.tags.join(', ') : ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., urgent, high-value, recurring"
                />
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProposal(false);
                    setIsEditing(false);
                    setEditingProposal(null);
                    setSelectedProposal(null);
                  }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white border border-blue-700 dark:border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Update Proposal' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateCategory(formData);
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory?.name || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Web Development"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingCategory?.description || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe this category..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingCategory?.color || '#3B82F6'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-12"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <select
                    name="icon"
                    defaultValue={editingCategory?.icon || 'folder'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="folder">Folder</option>
                    <option value="megaphone">Marketing</option>
                    <option value="video">Video</option>
                    <option value="palette">Design</option>
                    <option value="code">Development</option>
                    <option value="pen-tool">Writing</option>
                    <option value="briefcase">Business</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false);
                    setEditingCategory(null);
                  }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {editingCategory && !editingCategory.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(editingCategory.id)}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};