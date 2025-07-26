import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5173';

const adminAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to headers
adminAPI.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global errors
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

export const adminAuthAPI = {
  login: (email: string, password: string) =>
    adminAPI.post('/admin/login', { email, password }),
  
  getDashboard: () => adminAPI.get('/admin/dashboard'),
  
  getUsers: (params?: any) => adminAPI.get('/admin/users', { params }),
  createUser: (data: any) => adminAPI.post('/admin/users', data),
  updateUser: (id: string, data: any) => adminAPI.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => adminAPI.delete(`/admin/users/${id}`),
  
  getPackages: () => adminAPI.get('/admin/packages'),
  createPackage: (data: any) => adminAPI.post('/admin/packages', data),
  updatePackage: (id: string, data: any) => adminAPI.put(`/admin/packages/${id}`, data),
  deletePackage: (id: string) => adminAPI.delete(`/admin/packages/${id}`)
};

export default adminAPI;