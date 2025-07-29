import React from 'react';
import { 
  Target, CheckSquare, StickyNote, FileText, Bell, Video, 
  Mail, BarChart3, Settings, Home, Send, Clock, HelpCircle, DollarSign, Hash, Palette
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { UpgradeModal } from '../Upgrade/UpgradeModal';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'proposals', label: 'Proposals', icon: FileText },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'pomodoro', label: 'Pomodoro', icon: Clock },
  { id: 'scripts', label: 'Social Media', icon: Video },
  { id: 'cold-email', label: 'Cold Email', icon: Send },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'chat', label: 'Chat', icon: Hash },
  { id: 'moodboard', label: 'Moodboard', icon: Palette },
  { id: 'time-tracker', label: 'Time Tracker', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { darkMode } = useTheme();
  const { hasAccess, isFeatureRestricted } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  return (
    <>
      <div className={`hidden lg:block w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nexa Pro</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your AI-Powered Workspace</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestricted = isFeatureRestricted(item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isRestricted) {
                    setShowUpgradeModal(true);
                  } else {
                    onTabChange(item.id);
                  }
                }}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-500'
                    : isRestricted
                    ? 'text-gray-400 dark:text-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 ${
                    isActive 
                      ? 'text-blue-700 dark:text-blue-400' 
                      : isRestricted
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isRestricted && (
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-orange-500 text-white text-xs font-bold rounded-full">
                      Pro
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </>
  );
};