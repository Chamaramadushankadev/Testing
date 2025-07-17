import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { financeAPI } from '../../services/financeAPI';
import { TaxEstimate } from '../../types/finance';

export const TaxEstimator: React.FC = () => {
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'quarterly' | 'annual'>('quarterly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  useEffect(() => {
    loadTaxEstimate();
  }, [period, year, quarter]);

  const loadTaxEstimate = async () => {
    try {
      setLoading(true);
      const params: any = { period, year };
      if (period === 'quarterly') {
        params.quarter = quarter;
      }
      
      const response = await financeAPI.getTaxEstimate(params);
      setEstimate(response.data);
    } catch (error) {
      console.error('Error loading tax estimate:', error);
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCurrentQuarter = () => {
    return Math.ceil((new Date().getMonth() + 1) / 3);
  };

  const getQuarterName = (q: number) => {
    return `Q${q} ${year}`;
  };

  const getQuarterDates = (q: number, y: number) => {
    const startMonth = (q - 1) * 3;
    const endMonth = startMonth + 2;
    const startDate = new Date(y, startMonth, 1);
    const endDate = new Date(y, endMonth + 1, 0);
    return {
      start: startDate.toLocaleDateString(),
      end: endDate.toLocaleDateString()
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Calculating tax estimate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-green-600" />
            Tax Estimator
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Calculate estimated taxes based on your income and expenses</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
          
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          
          {period === 'quarterly' && (
            <select
              value={quarter}
              onChange={(e) => setQuarter(parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={1}>Q1 (Jan-Mar)</option>
              <option value={2}>Q2 (Apr-Jun)</option>
              <option value={3}>Q3 (Jul-Sep)</option>
              <option value={4}>Q4 (Oct-Dec)</option>
            </select>
          )}
        </div>
      </div>

      {estimate ? (
        <div className="space-y-6">
          {/* Period Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {period === 'quarterly' ? getQuarterName(quarter) : `${year} Annual`} Tax Estimate
              </h4>
              {period === 'quarterly' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getQuarterDates(quarter, year).start} - {getQuarterDates(quarter, year).end}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(estimate.totalIncome)}</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(estimate.totalExpenses)}</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Calculator className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxable Income</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(estimate.taxableIncome)}</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Tax</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(estimate.estimatedTax)}</p>
              </div>
            </div>
          </div>

          {/* Tax Breakdown */}
          {estimate.breakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tax Breakdown</h4>
              <div className="space-y-3">
                {estimate.breakdown.map((tax, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{tax.taxType.replace('-', ' ')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{tax.rate}% tax rate</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(tax.amount)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {((tax.amount / estimate.estimatedTax) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Date Alert */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-400">Tax Payment Due Date</h4>
                <p className="text-yellow-800 dark:text-yellow-300 mt-1">
                  {period === 'quarterly' ? 'Quarterly' : 'Annual'} tax payment is due on{' '}
                  <span className="font-medium">{new Date(estimate.dueDate).toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tax Planning Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tax Planning Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Deduction Opportunities</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Business equipment and software</li>
                  <li>• Home office expenses</li>
                  <li>• Professional development</li>
                  <li>• Business travel and meals</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Payment Strategies</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Set aside 25-30% of income for taxes</li>
                  <li>• Make quarterly estimated payments</li>
                  <li>• Consider retirement contributions</li>
                  <li>• Track all business expenses</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quarterly Comparison */}
          {period === 'quarterly' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quarterly Comparison</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(q => {
                  const isCurrentQuarter = q === quarter;
                  const isPastQuarter = q < getCurrentQuarter() || year < new Date().getFullYear();
                  
                  return (
                    <div 
                      key={q} 
                      className={`p-4 rounded-lg border-2 ${
                        isCurrentQuarter 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white">Q{q} {year}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {getQuarterDates(q, year).start.split('/')[0]}/{getQuarterDates(q, year).start.split('/')[2]} - {getQuarterDates(q, year).end}
                        </p>
                        {isCurrentQuarter && (
                          <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                            {formatCurrency(estimate.estimatedTax)}
                          </p>
                        )}
                        {isPastQuarter && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Click to view
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tax Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">Add some transactions and configure tax settings to see estimates.</p>
        </div>
      )}
    </div>
  );
};