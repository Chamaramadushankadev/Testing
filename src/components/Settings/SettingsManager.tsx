import React, { useState } from 'react';
import { Settings, User, Bell, Mail, Shield, Database, Palette, Globe } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'email' | 'security' | 'data' | 'appearance'>('profile');

  const ProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="John Doe"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              defaultValue="john@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
            <input
              type="text"
              defaultValue="Content Creator"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
            <select className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>UTC-8 (Pacific Time)</option>
              <option>UTC-5 (Eastern Time)</option>
              <option>UTC+0 (GMT)</option>
              <option>UTC+1 (Central European Time)</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            rows={4}
            defaultValue="AI enthusiast and content creator focused on productivity tools and automation."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {[
            { id: 'task-reminders', label: 'Task Reminders', description: 'Get notified about upcoming task deadlines' },
            { id: 'goal-updates', label: 'Goal Updates', description: 'Receive updates on goal progress and milestones' },
            { id: 'email-campaigns', label: 'Email Campaign Results', description: 'Get notified about campaign performance' },
            { id: 'script-generation', label: 'Script Generation', description: 'Notifications when new scripts are generated' },
            { id: 'google-alerts', label: 'Google Alerts', description: 'New articles from your monitored keywords' },
            { id: 'weekly-summary', label: 'Weekly Summary', description: 'Weekly productivity and progress reports' }
          ].map((setting) => (
            <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{setting.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Email</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Push</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const EmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Server</label>
            <input
              type="text"
              placeholder="smtp.gmail.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
            <input
              type="number"
              placeholder="587"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              placeholder="your-email@gmail.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Email Marketing Integration</h4>
          <div className="space-y-3">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">Brevo (Sendinblue)</h5>
                  <p className="text-sm text-gray-600">Connect your Brevo account for email campaigns</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Connect
                </button>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">MailerLite</h5>
                  <p className="text-sm text-gray-600">Integrate with MailerLite for advanced campaigns</p>
                </div>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Privacy</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Change Password</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Enable 2FA</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">API Keys</h4>
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">OpenAI API Key</p>
                    <p className="text-sm text-gray-600">For AI script generation</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Configure
                  </button>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Google API Key</p>
                    <p className="text-sm text-gray-600">For Google Alerts integration</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Export Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Goals & Tasks', description: 'Export all goals and tasks data' },
                { label: 'Notes', description: 'Export all notes and knowledge base' },
                { label: 'Scripts', description: 'Export generated YouTube scripts' },
                { label: 'Email Data', description: 'Export email campaigns and contacts' }
              ].map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Backup & Sync</h4>
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Auto Backup</p>
                    <p className="text-sm text-gray-600">Automatically backup your data daily</p>
                  </div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </label>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Google Drive Sync</p>
                    <p className="text-sm text-gray-600">Sync data with Google Drive</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3 text-red-600">Danger Zone</h4>
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance & Display</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Theme</h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'light', label: 'Light', preview: 'bg-white border-2 border-blue-500' },
                { id: 'dark', label: 'Dark', preview: 'bg-gray-900 border-2 border-gray-300' },
                { id: 'auto', label: 'Auto', preview: 'bg-gradient-to-r from-white to-gray-900 border-2 border-gray-300' }
              ].map((theme) => (
                <label key={theme.id} className="cursor-pointer">
                  <input type="radio" name="theme" value={theme.id} defaultChecked={theme.id === 'light'} className="sr-only" />
                  <div className={`p-4 rounded-lg ${theme.preview} hover:opacity-80 transition-opacity`}>
                    <div className="h-16 rounded flex items-center justify-center">
                      <span className="font-medium">{theme.label}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Display Options</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Compact Mode</p>
                  <p className="text-sm text-gray-600">Show more content in less space</p>
                </div>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Show Animations</p>
                  <p className="text-sm text-gray-600">Enable smooth transitions and animations</p>
                </div>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Language & Region</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'email' && <EmailSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'data' && <DataSettings />}
              {activeTab === 'appearance' && <AppearanceSettings />}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};