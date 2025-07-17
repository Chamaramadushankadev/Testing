import React, { useState } from 'react';
import { DollarSign, TrendingUp, Receipt, FileText, Users, Settings, Calculator, BarChart3 } from 'lucide-react';
import { FinanceDashboard } from './FinanceDashboard';
import { TransactionManager } from './TransactionManager';
import { InvoiceManager } from './InvoiceManager';
import { ClientManager } from './ClientManager';
import { ProjectManager } from './ProjectManager';
import { TaxEstimator } from './TaxEstimator';
import { FinanceReports } from './FinanceReports';
import { FinanceSettings } from './FinanceSettings';

export const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'invoices' | 'clients' | 'projects' | 'tax' | 'reports' | 'settings'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'projects', label: 'Projects', icon: Receipt },
    { id: 'tax', label: 'Tax Estimator', icon: Calculator },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-green-600" />
            Finance Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track income, expenses, and manage your finances</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
      {activeTab === 'dashboard' && <FinanceDashboard />}
      {activeTab === 'transactions' && <TransactionManager />}
      {activeTab === 'invoices' && <InvoiceManager />}
      {activeTab === 'clients' && <ClientManager />}
      {activeTab === 'projects' && <ProjectManager />}
      {activeTab === 'tax' && <TaxEstimator />}
      {activeTab === 'reports' && <FinanceReports />}
      {activeTab === 'settings' && <FinanceSettings />}
    </div>
  );
};