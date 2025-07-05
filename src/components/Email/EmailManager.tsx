import React, { useState } from 'react';
import { Mail, Send, Star, Archive, Trash2, Search, Filter, Plus, Users, BarChart3, Calendar } from 'lucide-react';
import { Email, EmailCampaign, AudienceList, Contact } from '../../types';
import { mockEmails, mockCampaigns, mockAudienceLists, mockContacts } from '../../data/mockData';
import { format } from 'date-fns';

export const EmailManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'campaigns' | 'contacts'>('inbox');
  const [emails] = useState<Email[]>(mockEmails);
  const [campaigns] = useState<EmailCampaign[]>(mockCampaigns);
  const [audienceLists] = useState<AudienceList[]>(mockAudienceLists);
  const [contacts] = useState<Contact[]>(mockContacts);
  const [showCompose, setShowCompose] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const InboxView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search emails..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-500" />
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Compose</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                !email.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <button className={`text-gray-400 hover:text-yellow-500 transition-colors ${
                      email.isStarred ? 'text-yellow-500' : ''
                    }`}>
                      <Star className="w-4 h-4" />
                    </button>
                    <div className={`w-2 h-2 rounded-full ${email.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${email.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                        {email.from}
                      </p>
                      <span className="text-xs text-gray-500">
                        {format(email.receivedAt, 'MMM dd')}
                      </span>
                    </div>
                    <p className={`text-sm ${email.isRead ? 'text-gray-600' : 'font-medium text-gray-900'} truncate`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {email.content.substring(0, 100)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {email.labels.map((label, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CampaignsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Email Campaigns</h3>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Campaigns', value: campaigns.length, color: 'bg-blue-500' },
          { label: 'Sent This Month', value: campaigns.filter(c => c.status === 'sent').length, color: 'bg-green-500' },
          { label: 'Total Subscribers', value: contacts.filter(c => c.subscribed).length, color: 'bg-purple-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-2`}>
                <Mail className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{campaign.subject}</p>
                  
                  {campaign.status === 'sent' && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Sent:</span>
                        <span className="font-medium ml-1">{campaign.stats.sent}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Opened:</span>
                        <span className="font-medium ml-1">{campaign.stats.opened}</span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({Math.round((campaign.stats.opened / campaign.stats.sent) * 100)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Clicked:</span>
                        <span className="font-medium ml-1">{campaign.stats.clicked}</span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({Math.round((campaign.stats.clicked / campaign.stats.sent) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ContactsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Contacts & Lists</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Audience Lists
          </h4>
          <div className="space-y-3">
            {audienceLists.map((list) => (
              <div key={list.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h5 className="font-medium text-gray-900">{list.name}</h5>
                <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {contacts.filter(c => c.subscribed).length} contacts
                  </span>
                  <span className="text-xs text-gray-500">
                    Created {format(list.createdAt, 'MMM dd')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">All Contacts</h4>
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{contact.name}</h5>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {contact.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contact.subscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Added {format(contact.addedAt, 'MMM dd')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'inbox', label: 'Inbox', icon: Mail },
            { id: 'campaigns', label: 'Campaigns', icon: Send },
            { id: 'contacts', label: 'Contacts', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
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
      {activeTab === 'inbox' && <InboxView />}
      {activeTab === 'campaigns' && <CampaignsView />}
      {activeTab === 'contacts' && <ContactsView />}

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Compose Email</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email subject"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={12}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your message..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};