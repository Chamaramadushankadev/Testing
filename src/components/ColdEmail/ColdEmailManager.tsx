import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Mail, 
  Users, 
  BarChart3, 
  Settings, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  Send, 
  Play, 
  Pause, 
  FileText,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp
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
  notes: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  emailAccountIds: string[];
  leadIds: string[];
  sequence: any[];
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
  createdAt: string;
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
  const [activeTab, setActiveTab] = useState<'accounts' | 'leads' | 'campaigns' | 'templates' | 'analytics'>('accounts');
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // CSV Import states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvMapping, setCsvMapping] = useState<any>({});
  const [csvTags, setCsvTags] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, leadsRes, campaignsRes, templatesRes] = await Promise.all([
        coldEmailAPI.getAccounts().catch(() => ({ data: [] })),
        coldEmailAPI.getLeads().catch(() => ({ data: { leads: [] } })),
        coldEmailAPI.getCampaigns().catch(() => ({ data: [] })),
        coldEmailAPI.getTemplates().catch(() => ({ data: [] }))
      ]);
      
      setAccounts(accountsRes.data || []);
      setLeads(leadsRes.data?.leads || leadsRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
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

      const response = await coldEmailAPI.createAccount(accountData);
      setAccounts([...accounts, response.data]);
      setShowAddAccount(false);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleAddLead = async (formData: FormData) => {
    try {
      const leadData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        company: formData.get('company') as string || '',
        jobTitle: formData.get('jobTitle') as string || '',
        industry: formData.get('industry') as string || '',
        website: formData.get('website') as string || '',
        source: formData.get('source') as string || 'Manual Entry',
        tags: (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(t => t),
        notes: formData.get('notes') as string || ''
      };

      if (editingLead) {
        const response = await coldEmailAPI.updateLead(editingLead.id, leadData);
        setLeads(leads.map(l => l.id === editingLead.id ? response.data : l));
        setEditingLead(null);
      } else {
        const response = await coldEmailAPI.createLead(leadData);
        setLeads([...leads, response.data]);
      }
      setShowAddLead(false);
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const handleAddCampaign = async (formData: FormData) => {
    try {
      const campaignData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || '',
        emailAccountIds: [formData.get('emailAccountId') as string].filter(Boolean),
        leadIds: Array.from(formData.getAll('leadIds')) as string[],
        sequence: [{
          stepNumber: 1,
          subject: formData.get('subject') as string,
          content: formData.get('content') as string,
          delayDays: 0,
          isActive: true
        }],
        settings: {
          sendingSchedule: {
            timezone: 'UTC',
            workingDays: [1, 2, 3, 4, 5],
            startTime: '09:00',
            endTime: '17:00'
          },
          throttling: {
            emailsPerHour: 10,
            delayBetweenEmails: 300,
            randomizeDelay: true
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true
          }
        }
      };

      const response = await coldEmailAPI.createCampaign(campaignData);
      setCampaigns([...campaigns, response.data]);
      setShowAddCampaign(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleAddTemplate = async (formData: FormData) => {
    try {
      const templateData = {
        name: formData.get('name') as string,
        category: formData.get('category') as string || 'custom',
        subject: formData.get('subject') as string,
        content: formData.get('content') as string,
        variables: (formData.get('variables') as string || '').split(',').map(v => v.trim()).filter(v => v),
        industry: formData.get('industry') as string || '',
        useCase: formData.get('useCase') as string || ''
      };

      if (editingTemplate) {
        const response = await coldEmailAPI.updateTemplate(editingTemplate.id, templateData);
        setTemplates(templates.map(t => t.id === editingTemplate.id ? response.data : t));
        setEditingTemplate(null);
      } else {
        const response = await coldEmailAPI.createTemplate(templateData);
        setTemplates([...templates, response.data]);
      }
      setShowAddTemplate(false);
    } catch (error) {
      console.error('Error saving template:', error);
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

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to delete this email account?')) return;
    
    try {
      await coldEmailAPI.deleteAccount(accountId);
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (error) {
      console.error('Error deleting account:', error);
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

  const handleCsvUpload = async (file: File) => {
    try {
      setCsvFile(file);
      const response = await coldEmailAPI.previewCsv(file);
      setCsvPreview(response.data);
      setCsvMapping(response.data.suggestedMapping || {});
    } catch (error) {
      console.error('Error previewing CSV:', error);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    
    try {
      const response = await coldEmailAPI.importCsv(csvFile, csvMapping, csvTags);
      setLeads([...leads, ...response.data.leads || []]);
      setShowImportCsv(false);
      setCsvFile(null);
      setCsvPreview(null);
      setCsvMapping({});
      setCsvTags('');
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'interested': return 'bg-emerald-100 text-emerald-800';
      case 'not-interested': return 'bg-red-100 text-red-800';
      case 'bounced': return 'bg-orange-100 text-orange-800';
      case 'unsubscribed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cold email data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cold Email Marketing</h2>
          <p className="text-gray-600 mt-1">Manage your cold email outreach campaigns</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'accounts', label: 'Email Accounts', icon: Mail },
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'campaigns', label: 'Campaigns', icon: Send },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Email Accounts</h3>
            <button
              onClick={() => setShowAddAccount(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{account.name}</h4>
                    <p className="text-sm text-gray-600">{account.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingAccount(account);
                        setShowAddAccount(true);
                      }}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium capitalize">{account.provider}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Daily Limit:</span>
                    <span className="font-medium">{account.dailyLimit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Warmup:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.warmupStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      account.warmupStatus === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {account.warmupStatus.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
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
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowImportCsv(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => setShowAddLead(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
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
                          {lead.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.score}/100
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
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-600 hover:text-red-900"
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
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Email Campaigns</h3>
            <button
              onClick={() => setShowAddCampaign(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{campaign.stats.emailsSent}</div>
                    <div className="text-xs text-gray-600">Emails Sent</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{campaign.stats.opened}</div>
                    <div className="text-xs text-gray-600">Opened</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{campaign.stats.replied}</div>
                    <div className="text-xs text-gray-600">Replied</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {campaign.stats.emailsSent > 0 ? Math.round((campaign.stats.opened / campaign.stats.emailsSent) * 100) : 0}%
                    </div>
                    <div className="text-xs text-gray-600">Open Rate</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {campaign.stats.totalLeads} leads
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                      {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
            <button
              onClick={() => setShowAddTemplate(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.category}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowAddTemplate(true);
                      }}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Subject:</span>
                    <p className="text-gray-600 mt-1">{template.subject}</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Use Case:</span>
                    <p className="text-gray-600 mt-1">{template.useCase}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
            </select>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{leads.length}</p>
                </div>
                <div className="bg-blue-500 rounded-lg p-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaigns.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="bg-green-500 rounded-lg p-3">
                  <Send className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaigns.reduce((sum, c) => sum + c.stats.emailsSent, 0)}
                  </p>
                </div>
                <div className="bg-purple-500 rounded-lg p-3">
                  <Mail className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaigns.length > 0 ? Math.round(
                      campaigns.reduce((sum, c) => {
                        const rate = c.stats.emailsSent > 0 ? (c.stats.opened / c.stats.emailsSent) * 100 : 0;
                        return sum + rate;
                      }, 0) / campaigns.length
                    ) : 0}%
                  </p>
                </div>
                <div className="bg-orange-500 rounded-lg p-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h4>
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const openRate = campaign.stats.emailsSent > 0 ? (campaign.stats.opened / campaign.stats.emailsSent) * 100 : 0;
                const replyRate = campaign.stats.emailsSent > 0 ? (campaign.stats.replied / campaign.stats.emailsSent) * 100 : 0;
                
                return (
                  <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">{campaign.name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Sent:</span>
                        <span className="font-medium ml-1">{campaign.stats.emailsSent}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Opened:</span>
                        <span className="font-medium ml-1">{campaign.stats.opened}</span>
                        <span className="text-xs text-gray-400 ml-1">({Math.round(openRate)}%)</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Replied:</span>
                        <span className="font-medium ml-1">{campaign.stats.replied}</span>
                        <span className="text-xs text-gray-400 ml-1">({Math.round(replyRate)}%)</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Interested:</span>
                        <span className="font-medium ml-1">{campaign.stats.interested}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Open Rate</span>
                        <span>{Math.round(openRate)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${openRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lead Engagement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Lead Engagement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-3">Status Distribution</h5>
                <div className="space-y-2">
                  {['new', 'contacted', 'opened', 'replied', 'interested'].map((status) => {
                    const count = leads.filter(l => l.status === status).length;
                    const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-3">Top Sources</h5>
                <div className="space-y-2">
                  {Array.from(new Set(leads.map(l => l.source))).slice(0, 5).map((source) => {
                    const count = leads.filter(l => l.source === source).length;
                    const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                    
                    return (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{source}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingAccount?.name || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Primary Outreach"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                  <input
                    type="text"
                    name="smtpUsername"
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

      {/* Add Lead Modal */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    defaultValue={editingLead?.industry || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    defaultValue={editingLead?.website || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <input
                    type="text"
                    name="source"
                    defaultValue={editingLead?.source || 'Manual Entry'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingLead?.tags.join(', ') || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="prospect, high-value, tech"
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

      {/* Add Campaign Modal */}
   {showAddCampaign && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Campaign</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleAddCampaign(formData,selectedLeadIds);
        }}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
          <input
            type="text"
            name="name"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="SaaS Outreach Campaign"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your campaign goals and target audience..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Account</label>
          <select
            name="emailAccountId"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select an email account</option>
            {accounts.filter(a => a.isActive).map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.email})
              </option>
            ))}
          </select>
        </div>

<div className="relative">
  <label className="block text-sm font-medium text-gray-700 mb-2">Select Leads</label>
  <button
    type="button"
    onClick={() => setDropdownOpen(!dropdownOpen)}
    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    {selectedLeadIds.length === 0
      ? 'Choose leads...'
      : `${selectedLeadIds.length} lead(s) selected`}
  </button>

  {dropdownOpen && (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {leads
        .filter((lead) =>
          `${lead.firstName} ${lead.lastName} ${lead.email}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((lead) => (
          <label
            key={lead.id}
            className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              value={lead.id}
              checked={selectedLeadIds.includes(lead.id)}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedLeadIds((prev) =>
                  e.target.checked
                    ? [...prev, id]
                    : prev.filter((lid) => lid !== id)
                );
              }}
              className="mr-2"
            />
            {lead.firstName} {lead.lastName} ({lead.email})
          </label>
        ))}
    </div>
  )}

  {/* Search input inside dropdown */}
  <div className="mt-2">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Search leads..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>
</div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
          <input
            type="text"
            name="subject"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Quick question about {{company}}"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
          <textarea
            name="content"
            rows={8}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Hi {{first_name}},&#10;&#10;I noticed {{company}} has been doing some interesting work...&#10;&#10;Best regards,&#10;[Your Name]"
            required
          />
        </div>

        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowAddCampaign(false)}
            className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Campaign
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      {/* Add Template Modal */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTemplate?.name || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SaaS Cold Outreach"
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
                  rows={10}
                  defaultValue={editingTemplate?.content || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hi {{first_name}},&#10;&#10;I noticed {{company}} has been doing some interesting work...&#10;&#10;Best regards,&#10;[Your Name]"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="SaaS, E-commerce, etc."
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
                  placeholder="Initial cold outreach to SaaS companies"
                  required
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

      {/* CSV Import Modal */}
      {showImportCsv && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Import Leads from CSV</h3>
            
            {!csvPreview ? (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h4>
                  <p className="text-gray-600 mb-4">Select a CSV file containing your leads data</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvUpload(file);
                    }}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                  >
                    Choose File
                  </label>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Include columns for: first_name, last_name, email (required)</li>
                    <li>• Optional columns: company, job_title, industry, website, source</li>
                    <li>• First row should contain column headers</li>
                    <li>• Maximum file size: 10MB</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">CSV Preview</h4>
                  <p className="text-sm text-green-800">
                    Found {csvPreview.totalRows} rows. Please map the columns below:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries({
                    firstName: 'First Name',
                    lastName: 'Last Name',
                    email: 'Email',
                    company: 'Company',
                    jobTitle: 'Job Title',
                    industry: 'Industry',
                    website: 'Website',
                    source: 'Source'
                  }).map(([field, label]) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <select
                        value={csvMapping[field] || ''}
                        onChange={(e) => setCsvMapping({ ...csvMapping, [field]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column</option>
                        {csvPreview.headers.map((header: string) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={csvTags}
                    onChange={(e) => setCsvTags(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="imported, prospect, high-value"
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Preview Data:</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          {csvPreview.headers.map((header: string) => (
                            <th key={header} className="text-left p-2 border-b">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.preview.slice(0, 3).map((row: any, index: number) => (
                          <tr key={index}>
                            {csvPreview.headers.map((header: string) => (
                              <td key={header} className="p-2 border-b">{row[header]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowImportCsv(false);
                  setCsvFile(null);
                  setCsvPreview(null);
                  setCsvMapping({});
                  setCsvTags('');
                }}
                className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {csvPreview && (
                <button
                  onClick={handleCsvImport}
                  disabled={!csvMapping.firstName || !csvMapping.lastName || !csvMapping.email}
                  className="w-full sm:flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import Leads
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Name:</span> {selectedLead.firstName} {selectedLead.lastName}</p>
                    <p><span className="text-gray-600">Email:</span> {selectedLead.email}</p>
                    {selectedLead.company && <p><span className="text-gray-600">Company:</span> {selectedLead.company}</p>}
                    {selectedLead.jobTitle && <p><span className="text-gray-600">Job Title:</span> {selectedLead.jobTitle}</p>}
                    {selectedLead.industry && <p><span className="text-gray-600">Industry:</span> {selectedLead.industry}</p>}
                    {selectedLead.website && (
                      <p>
                        <span className="text-gray-600">Website:</span>{' '}
                        <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedLead.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lead Information</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Status:</span>{' '}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLead.status)}`}>
                        {selectedLead.status.replace('-', ' ')}
                      </span>
                    </p>
                    <p><span className="text-gray-600">Score:</span> {selectedLead.score}/100</p>
                    <p><span className="text-gray-600">Source:</span> {selectedLead.source}</p>
                    <p><span className="text-gray-600">Added:</span> {new Date(selectedLead.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {selectedLead.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
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
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedLead.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditingLead(selectedLead);
                  setSelectedLead(null);
                  setShowAddLead(true);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Lead
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};