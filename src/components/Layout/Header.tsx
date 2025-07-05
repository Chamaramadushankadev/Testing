import React from 'react';
import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { user, logout } = useFirebaseAuth();

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
      analytics: 'Analytics & Reports',
      settings: 'Settings & Configuration'
    };
    return titles[tab] || 'Dashboard';
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{getTabTitle(activeTab)}</h2>
          <p className="text-sm text-gray-600 mt-1">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 w-64"
            />
          </div>
          
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.displayName || 'User'}</p>
              <p className="text-xs text-gray-600">{user?.email}</p>
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.displayName}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
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