import React from 'react';
import { Search, Bell, User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { user, logout } = useFirebaseAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const getTabTitle = (tab: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      goals: 'Goals & Objectives',
      tasks: 'Task Management',
      notes: 'Notes & Knowledge Base',
      proposals: 'Proposals & Projects',
      reminders: 'Reminders & Notifications',
      alerts: 'Google Alerts Monitoring',
      scripts: 'YouTube Script Generator',
      email: 'Email Management',
      'cold-email': 'Cold Email Marketing',
      finance: 'Finance Management',
      analytics: 'Analytics & Reports',
      settings: 'Settings & Configuration',
      help: 'Help & Support',
      pomodoro: 'Pomodoro Timer'
    };
    return titles[tab] || 'Dashboard';
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{getTabTitle(activeTab)}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="hidden sm:block pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 w-64"
            />
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          <button className="hidden sm:block p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.displayName || 'User'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
            <div className="relative group">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">{user?.displayName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};