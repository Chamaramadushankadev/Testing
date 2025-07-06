import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Users, 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  Settings,
  Upload,
  Download,
  Eye,
  Edit3,
  Trash2,
  Star,
  Archive,
  RefreshCw,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Zap,
  Globe,
  Shield
} from 'lucide-react';
import { coldEmailAPI } from '../../services/api';

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: string;
  dailyLimit: number;
  isActive: boolean;
  warmupStatus: string;
  reputation: number;
  createdAt: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  website?: string;
  jobTitle?: string;
  industry?: string;
  tags: string[];
  status: string;
  score: number;
  source: string;
  addedAt: string;
  lastContactedAt?: string;
  notes: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  emailAccountIds: string[];
  leadIds: string[];
  sequence: any[];
  settings: any;
  createdAt: string;
  startedAt?: string;
  stats: {
    totalLeads: number;
    emailsSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
    interested: number;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  industry?: string;
  useCase: string;
  createdAt: string;
}

export const ColdEmailManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'leads' | 'campaigns' | 'templates' | 'inbox'>('dashboard');
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, leadsRes, campaignsRes, templatesRes] = await Promise.all([
        coldEmailAPI.getAccounts(),
        coldEmailAPI.getLeads(),
        coldEmailAPI.getCampaigns(),
        coldEmailAPI.getTemplates()
      ]);
      
      setAccounts(accountsRes.data || []);
      setLeads(leadsRes.data?.leads || []);
      setCampaigns(campaignsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error loading cold email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (formData: FormData) => {
    try {
      const accountData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        provider: formData.get('provider') as string || 'namecheap',
        smtpSettings: {
          host: formData.get('smtpHost') as string || 'mail.privateemail.com',
          port: parseInt(formData.get('smtpPort') as string) || 587,
          username: formData.get('smtpUsername') as string,
          password: formData.get('smtpPassword') as string,
          secure: true
        },
        dailyLimit: parseInt(formData.get('dailyLimit') as string) || 50
      };

      if (editingAccount) {
        const response = await coldEmailAPI.updateAccount(editingAccount.id, accountData);
        setAccounts(accounts.map(a => a.id === editingAccount.id ? response.data : a));
      } else {
        const response = await coldEmailAPI.createAccount(accountData);
        setAccounts([...accounts, response.data]);
      }

      setShowAddAccount(false);
      setEditingAccount(null);
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to delete this email account?')) return;
    
    try {
      await coldEmailAPI.deleteAccount(accountId);
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleAddLead = async (formData: FormData) => {
    try {
      const leadData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        company: formData.get('company') as string || '',
        website: formData.get('website') as string || '',
        jobTitle: formData.get('jobTitle') as string || '',
        industry: formData.get('industry') as string || '',
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
        source: formData.get('source') as string || 'Manual Entry',
        notes: formData.get('notes') as string || ''
      };

      if (editingLead) {
        const response = await coldEmailAPI.updateLead(editingLead.id, leadData);
        setLeads(leads.map(l => l.id === editingLead.id ? response.data : l));
      } else {
        const response = await coldEmailAPI.createLead(leadData);
        setLeads([response.data, ...leads]);
      }

      setShowAddLead(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await coldEmailAPI.deleteLead(leadId);
      setLeads(leads.filter(l => l.id !== leadId));
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleAddTemplate = async (formData: FormData) => {
    try {
      const templateData = {
        name: formData.get('name') as string,
        category: formData.get('category') as string || 'custom',
        subject: formData.get('subject') as string,
        content: formData.get('content') as string,
        variables: (formData.get('variables') as string).split(',').map(v => v.trim()).filter(v => v),
        industry: formData.get('industry') as string || '',
        useCase: formData.get('useCase') as string || ''
      };

      if (editingTemplate) {
        const response = await coldEmailAPI.updateTemplate(editingTemplate.id, templateData);
        setTemplates(templates.map(t => t.id === editingTemplate.id ? response.data : t));
      } else {
        const response = await coldEmailAPI.createTemplate(templateData);
        setTemplates([response.data, ...templates]);
      }

      setShowAddTemplate(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await coldEmailAPI.deleteTemplate(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'opened': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'interested': return 'bg-purple-100 text-purple-800';
      case 'not-interested': return 'bg-red-100 text-red-800';
      case 'bounced': return 'bg-orange-100 text-orange-800';
      case 'unsubscribed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Email Accounts', value: accounts.length, icon: Mail, color: 'bg-blue-500' },
          { label: 'Total Leads', value: leads.length, icon: Users, color: 'bg-green-500' },
          { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: Send, color: 'bg-purple-500' },
          { label: 'Templates', value: templates.length, icon: FileText, color: 'bg-orange-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowAddAccount(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Add Email Account</p>
          </button>
          <button
            onClick={() => setShowAddLead(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
          >
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Add Lead</p>
          </button>
          <button
            onClick={() => setShowAddTemplate(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
          >
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Create Template</p>
          </button>
          <button
            onClick={() => setShowAddCampaign(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center"
          >
            <Send className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Start Campaign</p>
          </button>
        </div>
      </div>
    </div>
  );

  const AccountsView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900">Email Accounts</h3>
        <button
          onClick={() => {
            setEditingAccount(null);
            setShowAddAccount(true);
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{account.name}</h4>
                <p className="text-sm text-gray-600">{account.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {account.provider}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingAccount(account);
                    setShowAddAccount(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Daily Limit:</span>
                <span className="font-medium ml-1">{account.dailyLimit}</span>
              </div>
              <div>
                <span className="text-gray-500">Reputation:</span>
                <span className="font-medium ml-1">{account.reputation}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LeadsView = () => (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="opened">Opened</option>
              <option value="replied">Replied</option>
              <option value="interested">Interested</option>
              <option value="not-interested">Not Interested</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={() => {
            setEditingLead(null);
            setShowAddLead(true);
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.company || '-'}</div>
                    <div className="text-sm text-gray-500">{lead.jobTitle || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingLead(lead);
                          setShowAddLead(true);
                        }}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-gray-600 hover:text-red-600"
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
      </div>
    </div>
  );

  const TemplatesView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowAddTemplate(true);
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {template.category}
                  </span>
                  {template.industry && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {template.industry}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setShowAddTemplate(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {template.variables.map((variable, index) => (
                <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cold email system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Send className="w-6 h-6 mr-2 text-blue-600" />
            Cold Email Marketing
          </h2>
          <p className="text-gray-600 mt-1">Manage your cold email campaigns and outreach</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'accounts', label: 'Email Accounts', icon: Mail },
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'campaigns', label: 'Campaigns', icon: Send },
            { id: 'templates', label: 'Templates', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'accounts' && <AccountsView />}
      {activeTab === 'leads' && <LeadsView />}
      {activeTab === 'templates' && <TemplatesView />}

      {/* Add/Edit Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingAccount ? 'Edit Email Account' : 'Add Email Account'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddAccount(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingAccount?.name || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Primary Outreach"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingAccount?.email || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="outreach@yourdomain.com"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <select
                    name="provider"
                    defaultValue={editingAccount?.provider || 'namecheap'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="namecheap">Namecheap</option>
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="smtp">Custom SMTP</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Limit</label>
                  <input
                    type="number"
                    name="dailyLimit"
                    defaultValue={editingAccount?.dailyLimit || 50}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="200"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    name="smtpHost"
                    defaultValue="mail.privateemail.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    name="smtpPort"
                    defaultValue="587"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                  <input
                    type="text"
                    name="smtpUsername"
                    defaultValue={editingAccount?.email || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Usually your email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                  <input
                    type="password"
                    name="smtpPassword"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your email password"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAccount(false);
                    setEditingAccount(null);
                  }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddLead(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={editingLead?.firstName || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={editingLead?.lastName || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingLead?.email || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    defaultValue={editingLead?.company || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    defaultValue={editingLead?.jobTitle || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    defaultValue={editingLead?.website || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    defaultValue={editingLead?.industry || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingLead?.tags.join(', ') || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., saas, marketing, high-priority"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <input
                    type="text"
                    name="source"
                    defaultValue={editingLead?.source || 'Manual Entry'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingLead?.notes || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this lead..."
                />
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLead(false);
                    setEditingLead(null);
                  }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingLead ? 'Update Lead' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Template Modal */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingTemplate ? 'Edit Template' : 'Create Email Template'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddTemplate(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTemplate?.name || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SaaS Cold Outreach"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    defaultValue={editingTemplate?.category || 'custom'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cold-outreach">Cold Outreach</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="partnership">Partnership</option>
                    <option value="sales">Sales</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  name="subject"
                  defaultValue={editingTemplate?.subject || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quick question about {{company}}"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                <textarea
                  name="content"
                  rows={12}
                  defaultValue={editingTemplate?.content || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Hi {{first_name}},&#10;&#10;I noticed {{company}} has been..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variables (comma-separated)</label>
                  <input
                    type="text"
                    name="variables"
                    defaultValue={editingTemplate?.variables.join(', ') || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="first_name, company, industry"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    defaultValue={editingTemplate?.industry || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SaaS, E-commerce"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Use Case</label>
                <input
                  type="text"
                  name="useCase"
                  defaultValue={editingTemplate?.useCase || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Initial cold outreach to SaaS companies"
                />
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplate(false);
                    setEditingTemplate(null);
                  }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedLead.firstName} {selectedLead.lastName}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingLead(selectedLead);
                    setShowAddLead(true);
                    setSelectedLead(null);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    handleDeleteLead(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                </div>
              </div>
              
              {selectedLead.company && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company</label>
                    <p className="text-gray-900">{selectedLead.company}</p>
                  </div>
                  {selectedLead.jobTitle && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Job Title</label>
                      <p className="text-gray-900">{selectedLead.jobTitle}</p>
                    </div>
                  )}
                </div>
              )}
              
              {(selectedLead.website || selectedLead.industry) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedLead.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {selectedLead.website}
                      </a>
                    </div>
                  )}
                  {selectedLead.industry && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Industry</label>
                      <p className="text-gray-900">{selectedLead.industry}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Source</label>
                  <p className="text-gray-900">{selectedLead.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Score</label>
                  <p className="text-gray-900">{selectedLead.score}/100</p>
                </div>
              </div>
              
              {selectedLead.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLead.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedLead.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900 whitespace-pre-line">{selectedLead.notes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span>Added: {new Date(selectedLead.addedAt).toLocaleDateString()}</span>
                  </div>
                  {selectedLead.lastContactedAt && (
                    <div>
                      <span>Last contacted: {new Date(selectedLead.lastContactedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};