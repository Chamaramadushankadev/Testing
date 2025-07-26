import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Mail, ShieldCheck, Check, X } from 'lucide-react';
import { useTeam, TeamMember } from '../../context/TeamContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { UpgradeModal } from '../Upgrade/UpgradeModal';

export const TeamManagement: React.FC = () => {
  const { members, addMember, updateMember, removeMember, loading } = useTeam();
  const { canCreate, getUpgradeMessage, limits } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer',
    permissions: {
      dashboard: true,
      goals: true,
      tasks: true,
      notes: true,
      proposals: false,
      reminders: true,
      pomodoro: true,
      scripts: false,
      email: false,
      'cold-email': false,
      analytics: false,
      settings: false,
      help: true
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [name]: checked
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember && !canCreate('teamMembers', members.length)) {
      setShowUpgradeModal(true);
      return;
    }
    
    try {
      if (editingMember) {
        await updateMember(editingMember.id, formData);
      } else {
        await addMember(formData);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving team member:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await removeMember(id);
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'viewer',
      permissions: {
        dashboard: true,
        goals: true,
        tasks: true,
        notes: true,
        proposals: false,
        reminders: true,
        pomodoro: true,
        scripts: false,
        email: false,
        'cold-email': false,
        analytics: false,
        settings: false,
        help: true
      }
    });
    setEditingMember(null);
    setShowAddMember(false);
  };

  const editMember = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      permissions: { ...member.permissions }
    });
    setShowAddMember(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'viewer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Management</h3>
        <button
          onClick={() => {
            if (canCreate('teamMembers', members.length)) {
              setShowAddMember(true);
            } else {
              setShowUpgradeModal(true);
            }
          }}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            canCreate('teamMembers', members.length)
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!canCreate('teamMembers', members.length)}
        >
          <Plus className="w-4 h-4" />
          <span>{canCreate('teamMembers', members.length) ? 'Add Team Member' : `Limit: ${limits.teamMembers}`}</span>
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full" />
                        ) : (
                          <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(member.permissions)
                        .filter(([_, value]) => value)
                        .slice(0, 3)
                        .map(([key]) => (
                          <span key={key} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                            {key}
                          </span>
                        ))}
                      {Object.values(member.permissions).filter(Boolean).length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                          +{Object.values(member.permissions).filter(Boolean).length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => editMember(member)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
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
        </div>
        
        {members.length === 0 && (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No team members yet</p>
          </div>
        )}
      </div>

      {/* Add/Edit Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin (Full Access)</option>
                  <option value="editor">Editor (Can edit content)</option>
                  <option value="viewer">Viewer (Read-only access)</option>
                </select>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Permissions
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'goals', label: 'Goals' },
                    { id: 'tasks', label: 'Tasks' },
                    { id: 'notes', label: 'Notes' },
                    { id: 'proposals', label: 'Proposals' },
                    { id: 'reminders', label: 'Reminders' },
                    { id: 'pomodoro', label: 'Pomodoro Timer' },
                    { id: 'scripts', label: 'YouTube Scripts' },
                    { id: 'email', label: 'Email' },
                    { id: 'cold-email', label: 'Cold Email' },
                    { id: 'analytics', label: 'Analytics' },
                    { id: 'settings', label: 'Settings' },
                    { id: 'help', label: 'Help & Support' }
                  ].map((permission) => (
                    <label key={permission.id} className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <input
                        type="checkbox"
                        name={permission.id}
                        checked={formData.permissions[permission.id] || false}
                        onChange={handlePermissionChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
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