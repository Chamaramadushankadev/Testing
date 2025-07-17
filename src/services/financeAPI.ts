import api from './api';

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