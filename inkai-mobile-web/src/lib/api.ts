import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5001/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor for token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('inkai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

export const authApi = {
  login: (identifier: string, password: string) => 
    api.post('/auth/login', { identifier, password }),
  getProfile: () => 
    api.get('/members/me'),
  getConnectedProfiles: () => 
    api.get('/members/me/children'),
};

export const eventApi = {
  getEvents: () => 
    api.get('/events'),
  getEvent: (id: string) => 
    api.get(`/events/${id}`),
  getMyEvents: () => 
    api.get('/events/my/registrations'),
  registerEvent: (data: { eventId: string, memberId: string, categoryId?: string }) =>
    api.post('/events/register', data),
};

export const billingApi = {
  getMyBillings: () => 
    api.get('/billing/my'),
  processPayment: (data: { billingId: string, paymentMethod: string }) =>
    api.post('/billing/pay', data),
  deleteBilling: (id: string) =>
    api.delete(`/billing/${id}`),
};
