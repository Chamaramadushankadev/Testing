import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { financeAPI } from '../../services/financeAPI';

export const FinanceReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'profit-loss' | 'expense-breakdown' | 'income-trend' | 'client-analysis'>('profit-loss');
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const generateReport = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would call the API to generate the report
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // For demo purposes, we'll just show a success message
      alert('Report generated successfully! In a real app, this would download a PDF or CSV file.');
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      description: 'Comprehensive income and expense report',
      icon: TrendingUp
    },
    {
      id: 'expense-breakdown',
      name: 'Expense Breakdown',
      description: 'Detailed analysis of expenses by category',
      icon: BarChart3
    },
    {
      id: 'income-trend',
      name: 'Income Trend Analysis',
      description: 'Revenue trends over time',
      icon: TrendingUp
    },
    {
      id: 'client-analysis',
      name: 'Client Profitability Analysis',
      description: 'Revenue and profit by client',
      icon: FileText
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-green-600" />
          Financial Reports
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Generate detailed financial reports for analysis and accounting</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Report Configuration</h4>
        
        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Report Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label key={type.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value={type.id}
                      checked={reportType === type.id}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg transition-all ${
                      reportType === type.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-5 h-5 mt-1 ${reportType === type.id ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">{type.name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Date Range</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Quick Select</label>
                <select
                  value={dateRange}
                  onChange={(e) => {
                    const range = e.target.value as any;
                    setDateRange(range);
                    
                    const now = new Date();
                    let start: Date;
                    
                    switch (range) {
                      case 'month':
                        start = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                      case 'quarter':
                        const quarter = Math.floor(now.getMonth() / 3);
                        start = new Date(now.getFullYear(), quarter * 3, 1);
                        break;
                      case 'year':
                        start = new Date(now.getFullYear(), 0, 1);
                        break;
                      default:
                        start = new Date(now.getFullYear(), now.getMonth(), 1);
                    }
                    
                    setStartDate(start.toISOString().slice(0, 10));
                    setEndDate(now.toISOString().slice(0, 10));
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Report Preview</h4>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              {reportTypes.find(t => t.id === reportType)?.name}
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Report preview will appear here after generation</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Export Options</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">PDF Report</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Professional formatted report</p>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Excel/CSV</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Raw data for analysis</p>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Tax Package</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ready for accountant</p>
          </button>
        </div>
      </div>
    </div>
  );
};