import React from 'react';
import { Search, Bell, User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { UpgradeModal } from '../Upgrade/UpgradeModal';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { user, logout } = useFirebaseAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { refreshUserPlan, userPlan } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

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

  // Refresh plan data when header loads
  React.useEffect(() => {
    const interval = setInterval(() => {
      refreshUserPlan();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshUserPlan]);

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
          <div className="relative mr-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="hidden sm:block pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 w-64"
            />
          </div>
          
          {/* Plan Status Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              userPlan === 'business' ? 'bg-red-500' :
              userPlan === 'creator' || userPlan === 'pro' ? 'bg-blue-500' :
              userPlan === 'starter' ? 'bg-yellow-500' :
              'bg-green-500'
            }`} />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
              {userPlan} Plan
            </span>
          </div>

          {/* Upgrade Button */}
<button
  onClick={() => setShowUpgradeModal(true)}
  className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white font-medium rounded-full hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-600 transition-all duration-300 overflow-hidden group shadow-md"
>
  {/* Animated border background */}
  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 dark:from-purple-500 dark:via-pink-500 dark:to-purple-500 rounded-full opacity-30 animate-pulse z-0"></div>

  {/* Inner background */}
  <div className="absolute inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 rounded-full z-10"></div>

  {/* Content and white dot */}
  <span className="relative z-50 flex items-center space-x-2">
    <span className="text-sm font-semibold">Upgrade</span>
  </span>

  {/* Optional spinning glow */}
  <div className="absolute inset-0 rounded-full overflow-hidden z-0">
    <div
      className="absolute w-8 h-8 bg-white opacity-10 rounded-full animate-spin"
      style={{
        animation: 'circulate 3s linear infinite',
        transformOrigin: '50% 200%',
      }}
    ></div>
  </div>
</button>


          
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
                    onClick={() => {
                      refreshUserPlan();
                      setShowUpgradeModal(true);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  >
                    <span>Manage Subscription</span>
                  </button>
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
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </header>
  );
};