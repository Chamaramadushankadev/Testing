import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5173';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
 
// Add token to headers
api.interceptors.request.use(async (config) => {
  // Try to get Firebase auth token first
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔥 Using Firebase token for API request');
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
  } else {
    // Fallback to localStorage token for backward compatibility
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Using localStorage token for API request');
    }
  }
  return config;
});

// Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status !== 401) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    if (error.response?.status === 401) {
      console.log('🔒 Authentication required - redirecting to login');
    }

    return Promise.reject({
      message: error.response?.data?.message || error.message || 'Network error',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    });
  }
);

// ---------------- AUTH ----------------
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// ---------------- GOALS ----------------
export const goalsAPI = {
  getAll: (params?: any) => api.get('/goals', { params }),
  getById: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post('/goals', data),
  update: (id: string, data: any) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  updateProgress: (id: string, progress: number) =>
    api.patch(`/goals/${id}/progress`, { progress }),
};

// ---------------- TASKS ----------------
export const tasksAPI = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  toggle: (id: string) => api.patch(`/tasks/${id}/toggle`),
  
  // Subtask operations
  addSubtask: (taskId: string, data: any) => api.post(`/tasks/${taskId}/subtasks`, data),
  updateSubtask: (taskId: string, subtaskId: string, data: any) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  toggleSubtask: (taskId: string, subtaskId: string) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`),
  deleteSubtask: (taskId: string, subtaskId: string) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
};

// ---------------- NOTES ----------------
export const notesAPI = {
  getAll: (params?: any) => api.get('/notes', { params }),
  getById: (id: string) => api.get(`/notes/${id}`),
  create: (data: any) => api.post('/notes', data),
  update: (id: string, data: any) => api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
  toggleFavorite: (id: string) => api.patch(`/notes/${id}/favorite`),
};

// ---------------- PROPOSALS ----------------
export const proposalsAPI = {
  getAll: (params?: any) => api.get('/proposals', { params }),
  getById: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any) => api.put(`/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/proposals/${id}`),
  
  // Categories
  getCategories: () => api.get('/proposals/categories'),
  createCategory: (data: any) => api.post('/proposals/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/proposals/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/proposals/categories/${id}`),
};

// ---------------- REMINDERS ----------------
export const remindersAPI = {
  getAll: (params?: any) => api.get('/reminders', { params }),
  getById: (id: string) => api.get(`/reminders/${id}`),
  create: (data: any) => api.post('/reminders', data),
  update: (id: string, data: any) => api.put(`/reminders/${id}`, data),
  delete: (id: string) => api.delete(`/reminders/${id}`),
  toggle: (id: string) => api.patch(`/reminders/${id}/toggle`),
  getUpcoming: () => api.get('/reminders/upcoming/list'),
  getOverdue: () => api.get('/reminders/overdue/list'),
  snooze: (id: string, minutes: number) => api.patch(`/reminders/${id}/snooze`, { minutes }),
};

// ---------------- COLD EMAIL ----------------
export const coldEmailAPI = {
  // Email Accounts
  getAccounts: () => api.get('/cold-email-system/accounts'),
  createAccount: (data: any) => api.post('/cold-email-system/accounts', data),
  updateAccount: (id: string, data: any) => api.put(`/cold-email-system/accounts/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/cold-email-system/accounts/${id}`),
  testAccount: (id: string) => api.post(`/cold-email-system/accounts/${id}/test`),

  // Leads
  getLeads: (params?: any) => api.get('/cold-email-system/leads', { params }),
  createLead: (data: any) => api.post('/cold-email-system/leads', data),
  updateLead: (id: string, data: any) => api.put(`/cold-email-system/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/cold-email-system/leads/${id}`),
  bulkImportLeads: (leads: any[]) => api.post('/cold-email-system/leads/bulk-import', { leads }),
  
  // Lead Categories
  getCategories: () => api.get('/cold-email-system/lead-categories'),
  createCategory: (data: any) => api.post('/cold-email-system/lead-categories', data),
  deleteCategory: (id: string) => api.delete(`/cold-email-system/lead-categories/${id}`),
  deleteCategoryLeads: (categoryId: string) => api.delete(`/cold-email-system/leads/category/${categoryId}`),

  // CSV Import
  previewCsv: (file: File) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/cold-email-system/leads/csv-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importCsv: (file: File, mapping: any, tags?: string) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('mapping', JSON.stringify(mapping));
    if (tags) formData.append('categoryId', tags);
    return api.post('/cold-email-system/leads/csv-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getImportHistory: () => api.get('/cold-email-system/leads/import-history'),

  // Campaigns
  getCampaigns: (params?: any) => api.get('/cold-email-system/campaigns', { params }),
  createCampaign: (data: any) => api.post('/cold-email-system/campaigns', data),
  updateCampaign: (id: string, data: any) => api.put(`/cold-email-system/campaigns/${id}`, data),
  deleteCampaign: (id: string) => api.delete(`/cold-email-system/campaigns/${id}`),
  toggleCampaign: (id: string) => api.patch(`/cold-email-system/campaigns/${id}/toggle`),
  getCampaignAnalytics: (id: string) => api.get(`/cold-email-system/campaigns/${id}/analytics`),
  runCampaignNow: (id: string) => api.post(`/cold-email-system/campaigns/${id}/run-now`),
  
  // Email Templates
  getTemplates: (params?: any) => api.get('/cold-email-system/templates', { params }),
  createTemplate: (data: any) => api.post('/cold-email-system/templates', data),
  updateTemplate: (id: string, data: any) => api.put(`/cold-email-system/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/cold-email-system/templates/${id}`),
  duplicateTemplate: (id: string) => api.post(`/cold-email-system/templates/${id}/duplicate`),
  
  // Unified Inbox
  getInboxMessages: (params?: any) => api.get('/cold-email-system/inbox', { params }),
  markAsRead: (id: string, isRead?: boolean) => api.patch(`/cold-email-system/inbox/${id}/read`, { isRead }),
  toggleStar: (id: string, isStarred?: boolean) => api.patch(`/cold-email-system/inbox/${id}/star`, { isStarred }),
  deleteMessage: (id: string) => api.delete(`/cold-email-system/inbox/${id}`),
  updateLabels: (id: string, labels: string[], action: 'add' | 'remove' | 'set') => 
    api.patch(`/cold-email-system/inbox/${id}/labels`, { labels, action }),
  getInboxStats: (params?: any) => api.get('/cold-email-system/inbox/stats', { params }),
  syncInbox: (accountId: string) => api.post(`/cold-email-system/inbox/sync/${accountId}`),
  sendReply: (data: any) => api.post('/cold-email-system/inbox/reply', data),

  // Warmup & Analytics
  getWarmupStatus: () => api.get('/cold-email-system/warmup/status'),
  startWarmup: (accountId: string) => api.post(`/cold-email-system/warmup/${accountId}/start`),
  pauseWarmup: (accountId: string) => api.post(`/cold-email-system/warmup/${accountId}/pause`),
  resumeWarmup: (accountId: string) => api.post(`/cold-email-system/warmup/${accountId}/start`),
  stopWarmup: (accountId: string) => api.post(`/cold-email-system/warmup/${accountId}/pause`),
  updateWarmupSettings: (accountId: string, settings: any) => api.put(`/cold-email-system/warmup/${accountId}/settings`, settings),
  sendWarmupNow: (accountId: string) => api.post(`/cold-email-system/warmup/${accountId}/send-now`),
  getWarmupLogs: (params?: any) => api.get('/cold-email-system/warmup/logs', { params }),
  checkDnsRecords: (accountId: string) => api.get(`/cold-email-system/warmup/${accountId}/dns-check`),
  getAnalytics: (params?: any) => api.get('/cold-email-system/analytics', { params }),
  getDashboardAnalytics: (params?: any) => api.get('/cold-email-system/analytics/dashboard', { params })
};

// ---------------- SCRIPTS ----------------
export const scriptsAPI = {
  getAll: () => api.get('/scripts'),
  create: (data: any) => api.post('/scripts', data),
  delete: (id: string) => api.delete(`/scripts/${id}`),
  generate: (data: any) => api.post('/scripts/generate', data),
};

// ---------------- EMAIL ----------------
export const emailAPI = {
  getEmails: () => api.get('/email/emails'),
  getCampaigns: () => api.get('/email/campaigns'),
  createCampaign: (data: any) => api.post('/email/campaigns', data),
  markAsRead: (id: string) => api.patch(`/email/emails/${id}/read`),
  toggleStar: (id: string) => api.patch(`/email/emails/${id}/star`),
};

// ---------------- GOOGLE ALERTS ----------------
export const googleAlertsAPI = {
  getAlerts: () => api.get('/google-alerts/alerts'),
  getArticles: (params?: any) => api.get('/google-alerts/articles', { params }),
  createAlert: (data: any) => api.post('/google-alerts/alerts', data),
};

// ---------------- ANALYTICS ----------------
export const analyticsAPI = {
  getDashboard: (params?: any) => api.get('/api/analytics/dashboard', { params }),
  getColdEmailDashboard: (params?: any) => api.get('/api/cold-email-system/analytics/dashboard', { params }),
  getGoalsAnalytics: () => api.get('/analytics/goals'),
  getTasksAnalytics: () => api.get('/analytics/tasks'),
  getColdEmailAnalytics: (params?: any) => api.get('/cold-email-system/analytics', { params })
};

// ---------------- POMODORO ----------------
export const pomodoroAPI = {
  getStats: (date?: string) => api.get('/pomodoro/stats', { params: { date } }),
  getSessions: (params?: any) => api.get('/pomodoro/sessions', { params }),
  createSession: (data: any) => api.post('/pomodoro/sessions', data),
  getAnalytics: (period?: string) => api.get('/pomodoro/analytics', { params: { period } })
};

// ---------------- YOUTUBE CHANNELS ----------------
export const youtubeChannelsAPI = {
  getAll: (params?: any) => api.get('/youtube-channels', { params }),
  getById: (id: string) => api.get(`/youtube-channels/${id}`),
  create: (data: any) => api.post('/youtube-channels', data),
  update: (id: string, data: any) => api.put(`/youtube-channels/${id}`, data),
  delete: (id: string) => api.delete(`/youtube-channels/${id}`),
};

// ---------------- YOUTUBE SCRIPTS ----------------
// ---------------- SOCIAL MEDIA ----------------
export const socialMediaAPI = {
  // Posts
  getPosts: (params?: any) => api.get('/social-media/posts', { params }),
  getById: (id: string) => api.get(`/social-media/posts/${id}`),
  createPost: (data: any) => api.post('/social-media/posts', data),
  updatePost: (id: string, data: any) => api.put(`/social-media/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/social-media/posts/${id}`),
  uploadImage: (id: string, formData: FormData) => api.post(`/social-media/posts/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (postId: string, imageId: string) => api.delete(`/social-media/posts/${postId}/images/${imageId}`),
  
  // Categories
  getCategories: () => api.get('/social-media/categories'),
  createCategory: (data: any) => api.post('/social-media/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/social-media/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/social-media/categories/${id}`),
  
  // Accounts
  getAccounts: () => api.get('/social-media/accounts'),
  createAccount: (data: any) => api.post('/social-media/accounts', data),
  updateAccount: (id: string, data: any) => api.put(`/social-media/accounts/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/social-media/accounts/${id}`),
  
  // AI Generation
  generateContent: (data: any) => api.post('/social-media/generate', data),
  
  // Analytics
  getAnalytics: (params?: any) => api.get('/social-media/analytics', { params })
};

export const youtubeScriptsAPI = {
  getAll: (params?: any) => api.get('/youtube-scripts', { params }),
  getById: (id: string) => api.get(`/youtube-scripts/${id}`),
  getByChannel: (channelId: string, params?: any) => api.get(`/youtube-scripts/channel/${channelId}`, { params }),
  create: (data: any) => api.post('/youtube-scripts', data),
  update: (id: string, data: any) => api.put(`/youtube-scripts/${id}`, data),
  delete: (id: string) => api.delete(`/youtube-scripts/${id}`),
  generate: (data: any) => api.post('/youtube-scripts/generate', data),
};

// ---------------- FINANCE ----------------
export const financeAPI = {
  // Dashboard
  getDashboard: (period?: string) => api.get('/finance/dashboard', { params: { period } }),

  // Transactions
  getTransactions: (params?: any) => api.get('/finance/transactions', { params }),
  createTransaction: (data: any) => api.post('/finance/transactions', data),
  updateTransaction: (id: string, data: any) => api.put(`/finance/transactions/${id}`, data),
  deleteTransaction: (id: string) => api.delete(`/finance/transactions/${id}`),

  // Invoices
  getInvoices: (params?: any) => api.get('/finance/invoices', { params }),
  createInvoice: (data: any) => api.post('/finance/invoices', data),
  updateInvoice: (id: string, data: any) => api.put(`/finance/invoices/${id}`, data),
  deleteInvoice: (id: string) => api.delete(`/finance/invoices/${id}`),
  markInvoicePaid: (id: string) => api.patch(`/finance/invoices/${id}/paid`),

  // Clients
  getClients: () => api.get('/finance/clients'),
  createClient: (data: any) => api.post('/finance/clients', data),
  updateClient: (id: string, data: any) => api.put(`/finance/clients/${id}`, data),
  deleteClient: (id: string) => api.delete(`/finance/clients/${id}`),

  // Projects
  getProjects: (params?: any) => api.get('/finance/projects', { params }),
  createProject: (data: any) => api.post('/finance/projects', data),
  updateProject: (id: string, data: any) => api.put(`/finance/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/finance/projects/${id}`),

  // Tax estimation
  getTaxEstimate: (params?: any) => api.get('/finance/tax-estimate', { params }),

  // Settings
  getSettings: () => api.get('/finance/settings'),
  updateSettings: (data: any) => api.put('/finance/settings', data)
};

export default api;

// ---------------- CLIENTS ----------------
export const clientsAPI = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  updateStats: (id: string, stats: any) => api.patch(`/clients/${id}/stats`, stats),
  getStats: (id: string) => api.get(`/clients/${id}/stats`)
};

// ---------------- QUOTES ----------------
export const quotesAPI = {
  getAll: (params?: any) => api.get('/quotes', { params }),
  getById: (id: string) => api.get(`/quotes/${id}`),
  create: (data: any) => api.post('/quotes', data),
  update: (id: string, data: any) => api.put(`/quotes/${id}`, data),
  delete: (id: string) => api.delete(`/quotes/${id}`),
  getRandom: () => api.get('/quotes/random/daily')
};

// ---------------- TIME TRACKER ----------------
export const timeTrackerAPI = {
  getCurrentTimer: () => api.get('/time-tracker/current'),
  getEntries: (params?: any) => api.get('/time-tracker/entries', { params }),
  startTimer: (data: any) => api.post('/time-tracker/start', data),
  stopTimer: (data: any) => api.post('/time-tracker/stop', data),
  updateEntry: (id: string, data: any) => api.put(`/time-tracker/entries/${id}`, data),
  deleteEntry: (id: string) => api.delete(`/time-tracker/entries/${id}`),
  getAnalytics: (period?: string) => api.get('/time-tracker/analytics', { params: { period } }),
  
  // Shared sheets
  createShare: (data: any) => api.post('/time-tracker/share', data),
  getSharedSheets: () => api.get('/time-tracker/shared'),
  getSharedSheet: (shareId: string) => api.get(`/time-tracker/shared/${shareId}`),
  deleteSharedSheet: (id: string) => api.delete(`/time-tracker/shared/${id}`)
};

// ---------------- MOODBOARDS ----------------
export const moodboardAPI = {
  getAll: (params?: any) => api.get('/moodboards', { params }),
  getById: (id: string) => api.get(`/moodboards/${id}`),
  create: (data: any) => api.post('/moodboards', data),
  update: (id: string, data: any) => api.put(`/moodboards/${id}`, data),
  delete: (id: string) => api.delete(`/moodboards/${id}`),
  uploadImage: (id: string, formData: FormData) => api.post(`/moodboards/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (id: string, s3Key: string) => api.delete(`/moodboards/${id}/files/${s3Key}`),
  getStorageInfo: () => api.get('/moodboards/storage/info'),
  extractVideo: (data: { url: string }) => api.post('/moodboards/extract-video', data)
};