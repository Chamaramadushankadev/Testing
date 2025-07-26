import React, { useState } from 'react';
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
import { HelpCenter } from './components/Help/HelpCenter';
import { FinanceManager } from './components/Finance/FinanceManager';
import PomodoroTimer from './components/PomodoroTimer/PomodoroTimer';
import { ChatManager } from './components/Chat/ChatManager';
import { AdminPanel } from './components/Admin/AdminPanel';
import { Menu, X, Home, Target, CheckSquare, StickyNote, FileText, Bell, Video, Mail, Send, BarChart3, Settings, Clock, HelpCircle, DollarSign } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { TeamProvider } from './context/TeamContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UpgradePage } from './components/Upgrade/UpgradePage';

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
      case 'finance':
        return <FinanceManager />;
      case 'analytics':
        return <AnalyticsManager />;
      case 'settings':
        return <SettingsManager />;
      case 'pomodoro':
        return <PomodoroTimer />;
      case 'help':
        return <HelpCenter />;
      case 'chat':
        return <ChatManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <TeamProvider>
        <SubscriptionProvider>
          <Router>
            <Routes>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/upgrade" element={<UpgradePage />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  {/* Mobile sidebar overlay */}
                  {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
                      <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nexa Pro</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your AI-Powered Workspace</p>
                          </div>
                          <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                            { id: 'pomodoro', label: 'Pomodoro', icon: Clock },
                            { id: 'scripts', label: 'YouTube Scripts', icon: Video },
                            { id: 'cold-email', label: 'Cold Email', icon: Send },
                            { id: 'finance', label: 'Finance', icon: DollarSign },
                            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                            { id: 'chat', label: 'Chat', icon: Hash },
                            { id: 'settings', label: 'Settings', icon: Settings },
                            { id: 'help', label: 'Help & Support', icon: HelpCircle },
                          ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-500'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
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
                <div className="lg:hidden flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nexa Pro</h1>
                </div>
                <Header activeTab={activeTab} />
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">{renderContent()}</main>
                <DatabaseStatus />
              </div>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </SubscriptionProvider>
   </TeamProvider>
  </ThemeProvider>
  );
}

export default App;
