import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, BarChart3, Download, Timer } from 'lucide-react';
import { timeTrackerAPI } from '../../services/api';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';

interface SharedTimeSheetData {
  sharedSheet: {
    title: string;
    description: string;
    createdBy: string;
    createdAt: string;
    filters: any;
  };
  summary: {
    totalDuration: number;
    totalEntries: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  entries: any[];
  projectBreakdown: any[];
  dailyBreakdown: any[];
}

export const SharedTimeSheet: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [data, setData] = useState<SharedTimeSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareId) {
      loadSharedSheet();
    }
  }, [shareId]);

  const loadSharedSheet = async () => {
    try {
      setLoading(true);
      const response = await timeTrackerAPI.getSharedSheet(shareId!);
      setData(response.data);
    } catch (error: any) {
      console.error('Error loading shared sheet:', error);
      setError(error.message || 'Failed to load shared time sheet');
    } finally {
      setLoading(false);
    }
  };

  const formatDurationHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shared time sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In to View
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Time Sheet Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400">This shared time sheet may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{data.sharedSheet.title}</h1>
              {data.sharedSheet.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{data.sharedSheet.description}</p>
              )}
            </div>
            <button
              onClick={exportToPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created by</p>
                <p className="font-medium text-gray-900 dark:text-white">{data.sharedSheet.createdBy}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date Range</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(data.summary.dateRange.start), 'MMM dd')} - {format(new Date(data.summary.dateRange.end), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Timer className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDurationHours(data.summary.totalDuration)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {Math.round(data.summary.totalDuration / 3600 * 10) / 10}h
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.summary.totalEntries}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.projectBreakdown.length}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time by Project</h3>
            <div className="space-y-3">
              {data.projectBreakdown.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.entries} entries</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatDurationHours(project.duration)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round((project.duration / data.summary.totalDuration) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Breakdown</h3>
            <div className="space-y-3">
              {data.dailyBreakdown.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(day.date), 'MMM dd, yyyy')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{day.entries} entries</p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDurationHours(day.duration)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Time Entries */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Time Entries</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project/Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.projectName}</div>
                        {entry.taskName && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{entry.taskName}</div>
                        )}
                        {entry.description && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">{entry.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.startTime), 'HH:mm')} - {entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : 'Running'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatDurationHours(entry.duration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')} • Powered by Nexa Pro
          </p>
        </div>
      </div>
    </div>
  );
};