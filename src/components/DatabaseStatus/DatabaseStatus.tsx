import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import api from '../../services/api';

interface HealthStatus {
  status: string;
  database: string;
  message: string;
  mongoUri: string;
}

export const DatabaseStatus: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    checkDatabaseStatus();
    const interval = setInterval(checkDatabaseStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await api.get('/health');
      const status = response.data;
      setHealthStatus(status);
      
      const connected = status.database === 'Connected';
      setIsConnected(connected);
      setIsVisible(!connected); // Only show when disconnected
    } catch (error) {
      console.error('Failed to check database status:', error);
      setIsConnected(false);
      setIsVisible(true);
      setHealthStatus({
        status: 'ERROR',
        database: 'Disconnected',
        message: 'Unable to connect to server',
        mongoUri: 'Unknown'
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-red-50 border-t border-red-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-red-600" />
            <Database className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">
              Database Not Connected
            </p>
            <p className="text-xs text-red-600">
              {healthStatus?.message || 'Running in demo mode - data will not be saved'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-xs text-red-600">
            Status: {healthStatus?.database || 'Unknown'}
          </div>
          <button
            onClick={checkDatabaseStatus}
            className="text-xs text-red-700 hover:text-red-900 underline"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};