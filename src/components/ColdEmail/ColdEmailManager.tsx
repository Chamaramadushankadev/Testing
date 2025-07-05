import React, { useState } from 'react';
import { Send, Users, Mail, BarChart3, Settings, Plus, Filter, Search, Eye, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock, Target } from 'lucide-react';
import { ColdEmailCampaign, Lead, EmailAccount, EmailTemplate, CampaignStats } from '../../types';
import { mockColdEmailCampaigns, mockLeads, mockEmailAccounts, mockEmailTemplates } from '../../data/coldEmailMockData';

export const ColdEmailManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'leads' | 'accounts' | 'templates' | 'inbox' | 'analytics'>('dashboard');
  const [campaigns] = useState<ColdEmailCampaign[]>(mockColdEmailCampaigns);
  const [leads] = useState<Lead[]>(mockLeads);
  const [emailAccounts] = useState<EmailAccount[]>(mockEmailAccounts);
  const [templates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);

  const DashboardView = () => {
    const totalStats = campaigns.reduce((acc, campaign) => ({
      totalLeads: acc.totalLeads + campaign.stats.totalLeads,
      emailsSent: acc.emailsSent + campaign.stats.emailsSent,
      opened: acc.opened + campaign.stats.opened,
      replied: acc.replied + campaign.stats.replied,
      interested: acc.interested + campaign.stats.interested
    }), { totalLeads: 0, emailsSent: 0, opened: 0, replied: 0, interested: 0 });

    const overallOpenRate = totalStats.emailsSent > 0 ? (totalStats.opened / totalStats.emailsSent) * 100 : 0;
    const overallReplyRate = totalStats.emailsSent > 0 ? (totalStats.replied / totalStats.emailsSent) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: Target, color: 'bg-blue-500', change: '+2 this month' },
            { label: 'Total Leads', value: totalStats.totalLeads.toLocaleString(), icon: Users, color: 'bg-green-500', change: '+156 this week' },
            { label: 'Emails Sent', value: totalStats.emailsSent.toLocaleString(), icon: Send, color: 'bg-purple-500', change: '+1.2K this week' },
            { label: 'Reply Rate', value: `${overallReplyRate.toFixed(1)}%`, icon: MessageSquare, color: 'bg-orange-500', change: '+2.3% vs last month' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Send className="w-5 h-5 mr-2 text-blue-600" />
              Active Campaigns
            </h3>
            <div className="space-y-4">
              {campaigns.filter(c => c.status === 'active').slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{campaign.stats.emailsSent}</p>
                      <p className="text-gray-500">Sent</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{campaign.stats.openRate.toFixed(1)}%</p>
                      <p className="text-gray-500">Open Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{campaign.stats.replyRate.toFixed(1)}%</p>
                      <p className="text-gray-500">Reply Rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Performance Overview
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Open Rate</span>
                  <span className="text-lg font-bold text-blue-900">{overallOpenRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${overallOpenRate}%` }} />
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Reply Rate</span>
                  <span className="text-lg font-bold text-green-900">{overallReplyRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${overallReplyRate * 4}%` }} />
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">Interested Leads</span>
                  <span className="text-lg font-bold text-purple-900">{totalStats.interested}</span>
                </div>
                <p className="text-xs text-purple-700">Ready for follow-up</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Account Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-orange-600" />
            Email Account Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emailAccounts.map((account) => (
              <div key={account.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{account.name}</h4>
                  <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{account.email}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Reputation</span>
                  <span className={`font-medium ${account.reputation >= 80 ? 'text-green-600' : account.reputation >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {account.reputation}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${account.reputation >= 80 ? 'bg-green-500' : account.reputation >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${account.reputation}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const CampaignsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-500" />
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{campaign.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">{campaign.stats.totalLeads}</p>
                    <p className="text-gray-600">Total Leads</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-900">{campaign.stats.emailsSent}</p>
                    <p className="text-blue-700">Sent</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="font-semibold text-green-900">{campaign.stats.openRate.toFixed(1)}%</p>
                    <p className="text-green-700">Open Rate</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="font-semibold text-purple-900">{campaign.stats.clickRate.toFixed(1)}%</p>
                    <p className="text-purple-700">Click Rate</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="font-semibold text-orange-900">{campaign.stats.replyRate.toFixed(1)}%</p>
                    <p className="text-orange-700">Reply Rate</p>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <p className="font-semibold text-indigo-900">{campaign.stats.interested}</p>
                    <p className="text-indigo-700">Interested</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LeadsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search leads..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="replied">Replied</option>
            <option value="interested">Interested</option>
          </select>
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{lead.company}</p>
                      <p className="text-sm text-gray-600">{lead.jobTitle}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === 'interested' ? 'bg-green-100 text-green-800' :
                      lead.status === 'replied' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'new' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {lead.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">{lead.score}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${lead.score >= 80 ? 'bg-green-500' : lead.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-green-600 hover:text-green-900">Contact</button>
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'accounts', label: 'Email Accounts', icon: Mail },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
    { id: 'inbox', label: 'Inbox', icon: Eye },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
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
      {activeTab === 'campaigns' && <CampaignsView />}
      {activeTab === 'leads' && <LeadsView />}
      {activeTab === 'accounts' && <div className="text-center py-12"><p className="text-gray-600">Email Accounts management coming soon...</p></div>}
      {activeTab === 'templates' && <div className="text-center py-12"><p className="text-gray-600">Email Templates management coming soon...</p></div>}
      {activeTab === 'inbox' && <div className="text-center py-12"><p className="text-gray-600">Unified Inbox coming soon...</p></div>}
      {activeTab === 'analytics' && <div className="text-center py-12"><p className="text-gray-600">Advanced Analytics coming soon...</p></div>}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Cold Email Campaign</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SaaS Outreach Q1 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Account</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {emailAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name} ({account.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your campaign goals and target audience..."
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewCampaign(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};