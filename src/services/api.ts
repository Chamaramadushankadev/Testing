import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5173';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      headers: error.config?.headers,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
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

  // Campaigns
  getCampaigns: (params?: any) => api.get('/cold-email-system/campaigns', { params }),
  createCampaign: (data: any) => api.post('/cold-email-system/campaigns', data),
  updateCampaign: (id: string, data: any) => api.put(`/cold-email-system/campaigns/${id}`, data),
  deleteCampaign: (id: string) => api.delete(`/cold-email-system/campaigns/${id}`),
  toggleCampaign: (id: string) => api.patch(`/cold-email-system/campaigns/${id}/toggle`),
  getCampaignAnalytics: (id: string) => api.get(`/cold-email-system/campaigns/${id}/analytics`),

  // Warmup & Analytics
  getWarmupStatus: () => api.get('/cold-email-system/warmup/status'),
  startWarmup: (accountId: string) => api.post(`/cold-email-system/warmup/${accountId}/start`),
  getInboxSyncStatus: () => api.get('/cold-email-system/inbox/sync-status'),
  syncInbox: (accountId: string) => api.post(`/cold-email-system/inbox/sync/${accountId}`),
  getEmailLogs: (params?: any) => api.get('/cold-email-system/logs', { params }),
  getDashboardAnalytics: (params?: any) => api.get('/cold-email-system/analytics/dashboard', { params }),
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
  getDashboard: (params?: any) => api.get('/analytics/dashboard', { params }),
  getGoalsAnalytics: () => api.get('/analytics/goals'),
  getTasksAnalytics: () => api.get('/analytics/tasks'),
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
export const youtubeScriptsAPI = {
  getAll: (params?: any) => api.get('/youtube-scripts', { params }),
  getById: (id: string) => api.get(`/youtube-scripts/${id}`),
  getByChannel: (channelId: string, params?: any) => api.get(`/youtube-scripts/channel/${channelId}`, { params }),
  create: (data: any) => api.post('/youtube-scripts', data),
  update: (id: string, data: any) => api.put(`/youtube-scripts/${id}`, data),
  delete: (id: string) => api.delete(`/youtube-scripts/${id}`),
  generate: (data: any) => api.post('/youtube-scripts/generate', data),
};

export default api;
