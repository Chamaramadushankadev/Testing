import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings, Check, Moon, Sun, Volume2, VolumeX, Clock, Calendar, Plus, Edit3, Trash2, User, Briefcase, Maximize, X, DollarSign } from 'lucide-react';
import axios from 'axios';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

// Define types
interface PomodoroSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  sessionsGoal: number;
  soundEnabled: boolean;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroSession {
  userId: string;
  date: string;
  completedSessions: number;
  totalFocusTime: number;
}

interface Client {
  id: string;
  name: string;
  color: string;
  hourlyRate?: number;
}

interface TimeEntry {
  id: string;
  clientId: string;
  description: string;
  duration: number;
  date: string;
  billable: boolean;
}

const PomodoroTimer: React.FC = () => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'timer' | 'history' | 'clients'>('timer');
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [clients, setClients] = useState<Client[]>([
    { id: '1', name: 'Personal', color: '#3B82F6' },
    { id: '2', name: 'Client A', color: '#10B981', hourlyRate: 75 },
    { id: '3', name: 'Client B', color: '#F59E0B', hourlyRate: 100 }
  ]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { 
      id: '1', 
      clientId: '2', 
      description: 'Website development', 
      duration: 7200, // 2 hours in seconds
      date: '2025-01-15',
      billable: true
    },
    { 
      id: '2', 
      clientId: '3', 
      description: 'Logo design', 
      duration: 5400, // 1.5 hours in seconds
      date: '2025-01-14',
      billable: true
    },
    { 
      id: '3', 
      clientId: '1', 
      description: 'Personal project', 
      duration: 3600, // 1 hour in seconds
      date: '2025-01-13',
      billable: false
    }
  ]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showAddTimeEntry, setShowAddTimeEntry] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('1'); // Default to Personal
  const [timeEntryForm, setTimeEntryForm] = useState({
    clientId: '1',
    description: '',
    duration: 0,
    hours: 0,
    minutes: 0,
    date: new Date().toISOString().split('T')[0],
    billable: false
  });
  const [clientForm, setClientForm] = useState({
    name: '',
    color: '#3B82F6',
    hourlyRate: ''
  });

  // Default settings
  const defaultSettings: PomodoroSettings = {
    focusTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    sessionsGoal: 8,
    soundEnabled: true
  };

  // Load settings from localStorage or use defaults
  const loadSettings = (): PomodoroSettings => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  };

  // State variables
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todayStats, setTodayStats] = useState<PomodoroSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs
  const timerRef = useRef<number | null>(null);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Load today's stats on component mount
  useEffect(() => {
    loadTodayStats();
  }, []);

  // Handle timer logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Reset timer when mode changes
  useEffect(() => {
    let newTime = 0;
    switch (mode) {
      case 'focus':
        newTime = settings.focusTime * 60;
        break;
      case 'shortBreak':
        newTime = settings.shortBreakTime * 60;
        break;
      case 'longBreak':
        newTime = settings.longBreakTime * 60;
        break;
    }
    setTimeLeft(newTime);
    setIsActive(false);
  }, [mode, settings]);

  // Load today's stats
  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/pomodoro/stats', { params: { date: today } });
      if (response.data) {
        setTodayStats(response.data);
        setSessionsCompleted(response.data.completedSessions || 0);
      }
    } catch (error) {
      console.error('Error loading pomodoro stats:', error);
      // If API fails, use local storage as fallback
      const localSessions = localStorage.getItem('pomodoroSessions');
      if (localSessions) {
        setSessionsCompleted(parseInt(localSessions));
      }
    }
  };

  // Save session to backend
  const saveSession = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.post('/pomodoro/sessions', {
        date: today,
        focusTime: settings.focusTime
      });
      await loadTodayStats(); // Reload stats after saving
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
      // If API fails, use local storage as fallback
      localStorage.setItem('pomodoroSessions', String(sessionsCompleted));
    }
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    if (settings.soundEnabled) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
      }
    }

    if (mode === 'focus') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      // Save completed session to backend
      saveSession();
      
      // After every 4 focus sessions, take a long break
      if (newSessionsCompleted % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // After a break, go back to focus mode
      setMode('focus');
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')};
  };

  // Timer controls
  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    switch (mode) {
      case 'focus':
        setTimeLeft(settings.focusTime * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakTime * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakTime * 60);
        break;
    }
  };

  const skipToNext = () => {
    setIsActive(false);
    if (mode === 'focus') {
      // If in focus mode, skip to break without counting it as completed
      if ((sessionsCompleted + 1) % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // If in break mode, skip to focus
      setMode('focus');
    }
  };

  // Format duration as hh:mm:ss
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return ${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')};
    }
    
    return ${minutes}:${secs.toString().padStart(2, '0')};
  };

  // Toggle sound
  const toggleSound = () => {
    setSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled
    });
  };

  // Handle client form input change
  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle time entry form input change
  const handleTimeEntryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'hours' || name === 'minutes') {
      const hours = name === 'hours' ? parseInt(value) || 0 : parseInt(timeEntryForm.hours.toString()) || 0;
      const minutes = name === 'minutes' ? parseInt(value) || 0 : parseInt(timeEntryForm.minutes.toString()) || 0;
      const duration = (hours * 3600) + (minutes * 60);
      
      setTimeEntryForm(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
        duration
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setTimeEntryForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setTimeEntryForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Save client
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      // Update existing client
      const updatedClients = clients.map(client => 
        client.id === editingClient.id 
          ? { 
              ...client, 
              name: clientForm.name, 
              color: clientForm.color,
              hourlyRate: clientForm.hourlyRate ? parseFloat(clientForm.hourlyRate) : undefined
            } 
          : client
      );
      setClients(updatedClients);
    } else {
      // Add new client
      const newClient: Client = {
        id: Date.now().toString(),
        name: clientForm.name,
        color: clientForm.color,
        hourlyRate: clientForm.hourlyRate ? parseFloat(clientForm.hourlyRate) : undefined
      };
      setClients([...clients, newClient]);
    }
    
    setClientForm({ name: '', color: '#3B82F6', hourlyRate: '' });
    setEditingClient(null);
    setShowAddClient(false);
  };

  // Delete client
  const handleDeleteClient = (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client? All time entries for this client will also be deleted.')) {
      return;
    }
    
    setClients(clients.filter(client => client.id !== clientId));
    setTimeEntries(timeEntries.filter(entry => entry.clientId !== clientId));
  };

  // Save time entry
  const handleSaveTimeEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTimeEntry) {
      // Update existing time entry
      const updatedEntries = timeEntries.map(entry => 
        entry.id === editingTimeEntry.id 
          ? { 
              ...entry, 
              clientId: timeEntryForm.clientId,
              description: timeEntryForm.description,
              duration: timeEntryForm.duration,
              date: timeEntryForm.date,
              billable: timeEntryForm.billable
            } 
          : entry
      );
      setTimeEntries(updatedEntries);
    } else {
      // Add new time entry
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        clientId: timeEntryForm.clientId,
        description: timeEntryForm.description,
        duration: timeEntryForm.duration,
        date: timeEntryForm.date,
        billable: timeEntryForm.billable
      };
      setTimeEntries([newEntry, ...timeEntries]);
    }
    
    resetTimeEntryForm();
  };

  // Delete time entry
  const handleDeleteTimeEntry = (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) {
      return;
    }
    
    setTimeEntries(timeEntries.filter(entry => entry.id !== entryId));
  };

  // Reset time entry form
  const resetTimeEntryForm = () => {
    setTimeEntryForm({
      clientId: selectedClient,
      description: '',
      duration: 0,
      hours: 0,
      minutes: 0,
      date: new Date().toISOString().split('T')[0],
      billable: false
    });
    setEditingTimeEntry(null);
    setShowAddTimeEntry(false);
  };

  // Edit time entry
  const handleEditTimeEntry = (entry: TimeEntry) => {
    const hours = Math.floor(entry.duration / 3600);
    const minutes = Math.floor((entry.duration % 3600) / 60);
    
    setTimeEntryForm({
      clientId: entry.clientId,
      description: entry.description,
      duration: entry.duration,
      hours,
      minutes,
      date: entry.date,
      billable: entry.billable
    });
    
    setEditingTimeEntry(entry);
    setShowAddTimeEntry(true);
  };

  // Edit client
  const handleEditClient = (client: Client) => {
    setClientForm({
      name: client.name,
      color: client.color,
      hourlyRate: client.hourlyRate?.toString() || ''
    });
    
    setEditingClient(client);
    setShowAddClient(true);
  };

  // Get client by ID
  const getClient = (clientId: string): Client | undefined => {
    return clients.find(client => client.id === clientId);
  };

  // Calculate total time for a client
  const getClientTotalTime = (clientId: string): number => {
    return timeEntries
      .filter(entry => entry.clientId === clientId)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  // Calculate billable amount for a client
  const getClientBillableAmount = (clientId: string): number => {
    const client = getClient(clientId);
    if (!client?.hourlyRate) return 0;
    
    const billableSeconds = timeEntries
      .filter(entry => entry.clientId === clientId && entry.billable)
      .reduce((total, entry) => total + entry.duration, 0);
    
    return (billableSeconds / 3600) * client.hourlyRate;
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    let totalTime = 0;
    switch (mode) {
      case 'focus':
        totalTime = settings.focusTime * 60;
        break;
      case 'shortBreak':
        totalTime = settings.shortBreakTime * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakTime * 60;
        break;
    }
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Save settings
  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newSettings: PomodoroSettings = {
      focusTime: parseInt(form.focusTime.value),
      shortBreakTime: parseInt(form.shortBreakTime.value),
      longBreakTime: parseInt(form.longBreakTime.value),
      sessionsGoal: parseInt(form.sessionsGoal.value),
      soundEnabled: settings.soundEnabled
    };
    setSettings(newSettings);
    setShowSettings(false);
    resetTimer();
  };

  // Get mode label
  const getModeLabel = (): string => {
    switch (mode) {
      case 'focus':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  // Get mode color
  const getModeColor = (): string => {
    switch (mode) {
      case 'focus':
        return darkMode ? 'bg-blue-700' : 'bg-blue-600';
      case 'shortBreak':
        return darkMode ? 'bg-green-700' : 'bg-green-600';
      case 'longBreak':
        return darkMode ? 'bg-purple-700' : 'bg-purple-600';
    }
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    setShowFullScreen(!showFullScreen);
  };

  // Main container classes
  const containerClasses = ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300;
  
  // If in fullscreen mode, render a different layout
  if (showFullScreen) {
    return (
      <div className={fixed inset-0 z-50 ${containerClasses} flex flex-col}>
        <div className="flex justify-between items-center p-6">
          <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
          <button 
            onClick={toggleFullScreen} 
            className={p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-9xl font-bold mb-8">{formatTime(timeLeft)}</div>
          <div className="text-2xl font-medium mb-8">{getModeLabel()}</div>
          
          <div className="w-full max-w-md h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-12 overflow-hidden">
            <div 
              className={h-full ${getModeColor()} transition-all duration-300} 
              style={{ width: ${calculateProgress()}% }}
            ></div>
          </div>
          
          <div className="flex justify-center space-x-8 mb-12">
            <button 
              onClick={toggleTimer} 
              className={p-6 rounded-full ${getModeColor()} text-white hover:opacity-90 transition-opacity}
            >
              {isActive ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button 
              onClick={resetTimer} 
              className={p-6 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} hover:opacity-90 transition-opacity}
            >
              <RotateCcw size={32} />
            </button>
            <button 
              onClick={skipToNext} 
              className={p-6 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} hover:opacity-90 transition-opacity}
            >
              <SkipForward size={32} />
            </button>
          </div>
          
          <div className="flex space-x-2 mb-8">
            {Array.from({ length: settings.sessionsGoal }).map((_, index) => (
              <div 
                key={index} 
                className={`w-12 h-12 flex items-center justify-center rounded-full ${
                  index < sessionsCompleted 
                    ? getModeColor() 
                    : darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
                }`}
              >
                {index < sessionsCompleted && <Check size={24} className="text-white" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Pomodoro Timer
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your focus time and client work</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'timer', label: 'Timer', icon: Clock },
            { id: 'history', label: 'History', icon: Calendar },
            { id: 'clients', label: 'Clients', icon: Briefcase }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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

      {/* Timer Tab */}
      {activeTab === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className={rounded-xl shadow-lg p-6 ${containerClasses}}>
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">Focus Timer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {todayStats ? ${todayStats.completedSessions} sessions completed today : 'Start your first session'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={toggleSound} 
                    className={p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}}
                    aria-label={settings.soundEnabled ? "Mute sound" : "Enable sound"}
                  >
                    {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                  <button 
                    onClick={() => setShowSettings(true)} 
                    className={p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}}
                    aria-label="Settings"
                  >
                    <Settings size={18} />
                  </button>
                  <button 
                    onClick={toggleFullScreen} 
                    className={p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}}
                    aria-label="Full Screen"
                  >
                    <Maximize size={18} />
                  </button>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="flex mb-6 rounded-lg overflow-hidden">
                <button 
                  onClick={() => { setMode('focus'); resetTimer(); }}
                  className={flex-1 py-2 text-center font-medium ${mode === 'focus' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-200'}}
                >
                  Focus
                </button>
                <button 
                  onClick={() => { setMode('shortBreak'); resetTimer(); }}
                  className={flex-1 py-2 text-center font-medium ${mode === 'shortBreak' ? 'bg-green-600 text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-200'}}
                >
                  Short Break
                </button>
                <button 
                  onClick={() => { setMode('longBreak'); resetTimer(); }}
                  className={flex-1 py-2 text-center font-medium ${mode === 'longBreak' ? 'bg-purple-600 text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-200'}}
                >
                  Long Break
                </button>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-6">
                <div className="text-7xl font-bold mb-2">{formatTime(timeLeft)}</div>
                <div className="text-lg font-medium">{getModeLabel()}</div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
                <div 
                  className={h-full ${getModeColor()} transition-all duration-300} 
                  style={{ width: ${calculateProgress()}% }}
                ></div>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center space-x-6 mb-8">
                <button 
                  onClick={toggleTimer} 
                  className={p-5 rounded-full ${getModeColor()} text-white hover:opacity-90 transition-opacity shadow-lg}
                  aria-label={isActive ? "Pause" : "Start"}
                >
                  {isActive ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button 
                  onClick={resetTimer} 
                  className={p-5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} hover:opacity-90 transition-opacity}
                  aria-label="Reset"
                >
                  <RotateCcw size={24} />
                </button>
                <button 
                  onClick={skipToNext} 
                  className={p-5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} hover:opacity-90 transition-opacity}
                  aria-label="Skip"
                >
                  <SkipForward size={24} />
                </button>
              </div>

              {/* Session Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Sessions</span>
                  <span>{sessionsCompleted} / {settings.sessionsGoal}</span>
                </div>
                <div className="flex space-x-1">
                  {Array.from({ length: settings.sessionsGoal }).map((_, index) => (
                    <div 
                      key={index} 
                      className={`flex-1 h-2 rounded-full ${
                        index < sessionsCompleted 
                          ? getModeColor() 
                          : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Session Checkmarks */}
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: settings.sessionsGoal }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`w-10 h-10 flex items-center justify-center rounded-full ${
                      index < sessionsCompleted 
                        ? getModeColor() 
                        : darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {index < sessionsCompleted && <Check size={20} className="text-white" />}
                  </div>
                ))}
              </div>

              {/* Client Selection */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-3">Track Time For</h4>
                <div className="flex flex-wrap gap-2">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedClient === client.id
                          ? 'text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={{ 
                        backgroundColor: selectedClient === client.id ? client.color : undefined 
                      }}
                    >
                      {client.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Time Entry Button */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setTimeEntryForm(prev => ({ ...prev, clientId: selectedClient }));
                    setShowAddTimeEntry(true);
                  }}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Time Entry Manually</span>
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Stats</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {todayStats?.completedSessions || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {todayStats ? Math.floor(todayStats.totalFocusTime / 60) : 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Sessions</h4>
                  
                  <div className="space-y-2">
                    {timeEntries.slice(0, 3).map((entry) => {
                      const client = getClient(entry.clientId);
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: client?.color || '#3B82F6' }}
                            ></div>
                            <span className="text-sm text-gray-900 dark:text-white">{client?.name}</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Entries</h3>
              <button
                onClick={() => {
                  setEditingTimeEntry(null);
                  setShowAddTimeEntry(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Entry</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Billable</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {timeEntries.map((entry) => {
                    const client = getClient(entry.clientId);
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: client?.color || '#3B82F6' }}
                            ></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{client?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDuration(entry.duration)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {entry.billable ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                              Billable
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                              Non-billable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditTimeEntry(entry)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTimeEntry(entry.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {timeEntries.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No time entries yet</p>
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Focus Time by Day</h4>
                <div className="space-y-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                    // Simulate some data
                    const minutes = Math.floor(Math.random() * 120) + 30;
                    const percentage = (minutes / 240) * 100; // Assuming 4 hours is max
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{day}</div>
                        <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 dark:bg-blue-500" 
                            style={{ width: ${percentage}% }}
                          ></div>
                        </div>
                        <div className="w-16 text-right text-sm text-gray-600 dark:text-gray-400">
                          {Math.floor(minutes / 60)}h {minutes % 60}m
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Time by Client</h4>
                <div className="space-y-3">
                  {clients.map((client) => {
                    const totalSeconds = getClientTotalTime(client.id);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    
                    return (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: client.color }}
                          ></div>
                          <span className="font-medium text-gray-900 dark:text-white">{client.name}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {hours}h {minutes}m
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clients</h3>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setClientForm({ name: '', color: '#3B82F6', hourlyRate: '' });
                  setShowAddClient(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => {
                const totalSeconds = getClientTotalTime(client.id);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const billableAmount = getClientBillableAmount(client.id);
                
                return (
                  <div 
                    key={client.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-3" 
                          style={{ backgroundColor: client.color + '20', color: client.color }}
                        >
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{client.name}</h4>
                          {client.hourlyRate && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${client.hourlyRate}/hour
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {hours}h {minutes}m
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Total Time</div>
                      </div>
                      {client.hourlyRate && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            ${billableAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Billable Amount</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Recent entries:
                      <div className="mt-2 space-y-1">
                        {timeEntries
                          .filter(entry => entry.clientId === client.id)
                          .slice(0, 2)
                          .map(entry => (
                            <div key={entry.id} className="flex items-center justify-between text-xs">
                              <span className="truncate max-w-[150px]">{entry.description}</span>
                              <span>{formatDuration(entry.duration)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {clients.length === 0 && (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No clients yet</p>
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billable Summary</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Billable Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {clients
                    .filter(client => client.hourlyRate)
                    .map((client) => {
                      const billableSeconds = timeEntries
                        .filter(entry => entry.clientId === client.id && entry.billable)
                        .reduce((total, entry) => total + entry.duration, 0);
                      
                      const billableHours = billableSeconds / 3600;
                      const billableAmount = billableHours * (client.hourlyRate || 0);
                      
                      return (
                        <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: client.color }}
                              ></div>
                              <span className="font-medium text-gray-900 dark:text-white">{client.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white">
                            ${client.hourlyRate}/hr
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white">
                            {formatDuration(billableSeconds)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-green-600 dark:text-green-400">
                            ${billableAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            
            {clients.filter(client => client.hourlyRate).length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No billable clients yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={w-full max-w-md rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}}>
            <h2 className="text-xl font-bold mb-4">Timer Settings</h2>
            <form onSubmit={saveSettings}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Focus Time (minutes)</label>
                  <input 
                    type="number" 
                    name="focusTime" 
                    defaultValue={settings.focusTime}
                    min="1" 
                    max="60" 
                    className={w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Short Break (minutes)</label>
                  <input 
                    type="number" 
                    name="shortBreakTime" 
                    defaultValue={settings.shortBreakTime}
                    min="1" 
                    max="60" 
                    className={w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Long Break (minutes)</label>
                  <input 
                    type="number" 
                    name="longBreakTime" 
                    defaultValue={settings.longBreakTime}
                    min="1" 
                    max="60" 
                    className={w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Daily Sessions Goal</label>
                  <input 
                    type="number" 
                    name="sessionsGoal" 
                    defaultValue={settings.sessionsGoal}
                    min="1" 
                    max="16" 
                    className={w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowSettings(false)}
                  className={px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add/Edit Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <form onSubmit={handleSaveClient} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client Name</label>
                <input
                  type="text"
                  name="name"
                  value={clientForm.name}
                  onChange={handleClientFormChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                <input
                  type="color"
                  name="color"
                  value={clientForm.color}
                  onChange={handleClientFormChange}
                  className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg px-4 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hourly Rate (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">$</span>
                  </div>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={clientForm.hourlyRate}
                    onChange={handleClientFormChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClient(false);
                    setEditingClient(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add/Edit Time Entry Modal */}
      {showAddTimeEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingTimeEntry ? 'Edit Time Entry' : 'Add Time Entry'}
            </h3>
            <form onSubmit={handleSaveTimeEntry} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</label>
                <select
                  name="clientId"
                  value={timeEntryForm.clientId}
                  onChange={handleTimeEntryFormChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={timeEntryForm.description}
                  onChange={handleTimeEntryFormChange}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hours</label>
                  <input
                    type="number"
                    name="hours"
                    value={timeEntryForm.hours}
                    onChange={handleTimeEntryFormChange}
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minutes</label>
                  <input
                    type="number"
                    name="minutes"
                    value={timeEntryForm.minutes}
                    onChange={handleTimeEntryFormChange}
                    min="0"
                    max="59"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={timeEntryForm.date}
                  onChange={handleTimeEntryFormChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billable"
                  name="billable"
                  checked={timeEntryForm.billable}
                  onChange={handleTimeEntryFormChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="billable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Billable
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetTimeEntryForm}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTimeEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;