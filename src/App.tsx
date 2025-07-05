import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { GoalsManager } from './components/Goals/GoalsManager';
import { TasksManager } from './components/Tasks/TasksManager';
import { NotesManager } from './components/Notes/NotesManager';
import { RemindersManager } from './components/Reminders/RemindersManager';
import { GoogleAlerts } from './components/GoogleAlerts/GoogleAlerts';
import { YouTubeScripts } from './components/YouTubeScripts/YouTubeScripts';
import { EmailManager } from './components/Email/EmailManager';
import { ColdEmailManager } from './components/ColdEmail/ColdEmailManager';
import { AnalyticsManager } from './components/Analytics/AnalyticsManager';
import { SettingsManager } from './components/Settings/SettingsManager';
import { DatabaseStatus } from './components/DatabaseStatus/DatabaseStatus';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
        <DatabaseStatus />
      </div>
    </div>
  );
}

export default App;