import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { GoalsManager } from './components/Goals/GoalsManager';
import { TasksManager } from './components/Tasks/TasksManager';
import { NotesManager } from './components/Notes/NotesManager';
import { ProposalsManager } from './components/Proposals/ProposalsManager';
import { RemindersManager } from './components/Reminders/RemindersManager';
import { GoogleAlerts } from './components/GoogleAlerts/GoogleAlerts';
import { YouTubeScripts } from './components/YouTubeScripts/YouTubeScripts';
import { EmailManager } from './components/Email/EmailManager';
import { ColdEmailManager } from './components/ColdEmail/ColdEmailManager';
import { AnalyticsManager } from './components/Analytics/AnalyticsManager';
import { SettingsManager } from './components/Settings/SettingsManager';
import { DatabaseStatus } from './components/DatabaseStatus/DatabaseStatus';
import { Menu, X } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'goals':
        return <GoalsManager />;
      case 'tasks':
        return <TasksManager />;
      case 'notes':
        return <NotesManager />;
      case 'proposals':
        return <ProposalsManager />;
      case 'reminders':
        return <RemindersManager />;
      case 'alerts':
        return <GoogleAlerts />;
      case 'scripts':
        return <YouTubeScripts />;
      case 'email':
        return <EmailManager />;
      case 'cold-email':
        return <ColdEmailManager />;
      case 'analytics':
        return <AnalyticsManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ProductivePro</h1>
                  <p className="text-sm text-gray-600 mt-1">Your AI-Powered Workspace</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-6">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: Home },
                  { id: 'goals', label: 'Goals', icon: Target },
                  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                  { id: 'notes', label: 'Notes', icon: StickyNote },
                  { id: 'proposals', label: 'Proposals', icon: FileText },
                  { id: 'reminders', label: 'Reminders', icon: Bell },
                  { id: 'scripts', label:  'YouTube Scripts', icon: Video },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'cold-email', label: 'Cold Email', icon: Send },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
        
        {/* Desktop sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="lg:hidden flex items-center p-4 border-b border-gray-200">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">ProductivePro</h1>
          </div>
          <Header activeTab={activeTab} />
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>
          <DatabaseStatus />
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default App;