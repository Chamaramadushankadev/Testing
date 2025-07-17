import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, Calendar, Users, Target } from 'lucide-react';
import { financeAPI } from '../../services/financeAPI';
import { FinanceDashboard as DashboardType } from '../../types/finance';

export const FinanceDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.getDashboard(period);
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading finance dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Financial Data</h3>
        <p className="text-gray-600 dark:text-gray-400">Start by adding your first transaction or creating an invoice.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Overview</h3>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(dashboard.totalIncome)}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(dashboard.totalExpenses)}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
              <p className={`text-2xl font-bold mt-1 ${dashboard.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dashboard.netProfit)}
              </p>
            </div>
            <div className={`${dashboard.netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg p-3`}>
              <DollarSign className={`w-6 h-6 ${dashboard.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Margin</p>
              <p className={`text-2xl font-bold mt-1 ${dashboard.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboard.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income vs Expenses Trend</h3>
          <div className="space-y-4">
            {dashboard.monthlyData.slice(-6).map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{month.month}</span>
                  <span className={`font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.profit)}
                  </span>
                </div>
                <div className="relative">
                  <div className="flex space-x-1 h-6">
                    <div 
                      className="bg-green-500 rounded-l"
                      style={{ 
                        width: `${Math.max(month.income / Math.max(...dashboard.monthlyData.map(m => Math.max(m.income, m.expenses))) * 100, 5)}%` 
                      }}
                    />
                    <div 
                      className="bg-red-500 rounded-r"
                      style={{ 
                        width: `${Math.max(month.expenses / Math.max(...dashboard.monthlyData.map(m => Math.max(m.income, m.expenses))) * 100, 5)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Income: {formatCurrency(month.income)}</span>
                    <span>Expenses: {formatCurrency(month.expenses)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Invoices */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Upcoming Invoices
          </h3>
          <div className="space-y-3">
            {dashboard.upcomingInvoices.length > 0 ? (
              dashboard.upcomingInvoices.map((invoice) => (
                <div key={invoice.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.clientId?.name || 'Unknown Client'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.totalAmount)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Due {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming invoices</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-600" />
            Top Clients
          </h3>
          <div className="space-y-3">
            {dashboard.topClients.length > 0 ? (
              dashboard.topClients.map((client) => (
                <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{client.clientName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Revenue: {formatCurrency(client.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${client.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(client.profit)}
                    </p>
                    <p className="text-xs text-gray-500">Profit</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No clients yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {dashboard.expensesByCategory.length > 0 ? (
              dashboard.expensesByCategory.slice(0, 5).map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{category.category}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-right">{category.percentage.toFixed(1)}%</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingDown className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No expenses recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Invoices Alert */}
      {dashboard.overdueInvoices.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">Overdue Invoices</h3>
          </div>
          <div className="space-y-2">
            {dashboard.overdueInvoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {invoice.clientId?.name} • Due {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-medium text-red-600 dark:text-red-400">{formatCurrency(invoice.totalAmount)}</p>
              </div>
            ))}
            {dashboard.overdueInvoices.length > 3 && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">
                +{dashboard.overdueInvoices.length - 3} more overdue invoices
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};