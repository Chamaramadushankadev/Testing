import React from 'react';
import { 
  Target, 
  CheckSquare, 
  StickyNote, 
  FileText,
  Bell, 
  Rss, 
  Video, 
  Mail, 
  BarChart3,
  Settings,
  Home,
  Send
} from 'lucide-react';

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
  { id: 'scripts', label: 'YouTube Scripts', icon: Video },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'cold-email', label: 'Cold Email', icon: Send },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="hidden lg:block w-64 bg-white shadow-lg border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">ProductivePro</h1>
        <p className="text-sm text-gray-600 mt-1">Your AI-Powered Workspace</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
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
  );
};