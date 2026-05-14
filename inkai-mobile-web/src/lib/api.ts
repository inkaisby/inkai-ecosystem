import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://inkai-ecosystem.vercel.app/v1';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/v1';
};

const API_BASE_URL = getBaseUrl();


const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Tingkatkan timeout ke 30 detik untuk upload file
});

// Interceptor for token
apiInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('inkai_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor for response (handle 401 globally — bukan untuk percobaan login gagal)
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const cfg = error.config as { url?: string; baseURL?: string } | undefined;
    const reqUrl = `${cfg?.baseURL ?? ''}${cfg?.url ?? ''}`;
    /** 401 dari salah password tidak boleh dipaksa redirect (halaman login member = `/`) */
    const isCredentialLoginAttempt =
      reqUrl.includes('/auth/login') || reqUrl.includes('/auth/admin-login');

    if (status === 401 && typeof window !== 'undefined' && !isCredentialLoginAttempt) {
      localStorage.removeItem('inkai_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const admin = window.location.pathname.includes('/admin');
      window.location.href = admin ? '/admin/login' : '/';
    }
    return Promise.reject(error);
  }
);

export const getAssetUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // If it's a relative path from the old system, try to point it to the production backend
  // but warn that it might not exist on Vercel
  const baseUrl = API_BASE_URL.replace('/v1', '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Special handling for Supabase paths that might have been saved incorrectly
  if (path.includes('supabase.co')) return path;
  
  return `${baseUrl}${normalizedPath}`;
};

export const authApi = {
  login: (identifier: string, password: string) => 
    apiInstance.post('/auth/login', { identifier, password }),
  /** Ringkas untuk session bootstrap (bukan `/members/me` yang berat) */
  getSession: () =>
    apiInstance.get('/auth/me'),
  getProfile: () => 
    apiInstance.get('/members/me'),
  getConnectedProfiles: () => 
    apiInstance.get('/members/me/children'),
};

export const eventApi = {
  getEvents: () => 
    apiInstance.get('/events'),
  getEvent: (id: string) => 
    apiInstance.get(`/events/${id}`),
  getMyEvents: () => 
    apiInstance.get('/events/my/registrations'),
  registerEvent: (data: { eventId: string, memberId: string, categoryId?: string }) =>
    apiInstance.post('/events/register', data),
};

export const billingApi = {
  getMyBillings: () => 
    apiInstance.get('/billing/my'),
  processPayment: (data: { billingId: string, paymentMethod: string }) =>
    apiInstance.post('/billing/pay', data),
  deleteBilling: (id: string) =>
    apiInstance.delete(`/billing/${id}`),
};

export interface Member {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  address?: string;
  dojoId?: string;
  userId?: string;
  role?: string;
  nia?: string;
  nik?: string;
  status?: string;
  currentRank?: string;
  dojo?: {
    id: string;
    name: string;
  };
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  categories?: any[];
}

// Create the combined api object
export const api = Object.assign(apiInstance, {
  auth: {
    login: (data: { identifier: string; password: string }) => apiInstance.post('/auth/login', data).then(res => res.data),
    adminLogin: (data: { identifier: string; password: string }) => apiInstance.post('/auth/admin-login', data).then(res => res.data),
    register: (data: any) => apiInstance.post('/auth/register', data).then(res => res.data),
    profile: () => apiInstance.get('/auth/profile').then(res => res.data),
    updateProfile: (data: any) => apiInstance.put('/auth/profile', data).then(res => res.data),
    uploadPhoto: (formData: FormData) => apiInstance.post('/auth/upload-photo', formData).then(res => res.data),
    uploadFile: (formData: FormData) => apiInstance.post('/auth/upload', formData).then(res => res.data),
  },
  members: {
    getAll: (params?: Record<string, any>) => apiInstance.get('/members', { params }).then(res => res.data),
    create: (data: Partial<Member>) => apiInstance.post('/members', data).then(res => res.data),
    bulkCreate: (data: { members: any[] }) => apiInstance.post('/members/bulk', data).then(res => res.data),
    update: (id: string, data: Partial<Member>) => apiInstance.patch(`/members/${id}`, data).then(res => res.data),
    delete: (id: string) => apiInstance.delete(`/members/${id}`).then(res => res.data),
    getDetail: (id: string) => apiInstance.get(`/members/${id}`).then(res => res.data),
    updateMemberRank: (
      memberId: string,
      rankId: string,
      payload: {
        rank?: string;
        date?: string;
        location?: string | null;
        isVerified?: boolean;
      }
    ) =>
      apiInstance
        .patch(`/members/${memberId}/ranks/${rankId}`, payload)
        .then((res) => res.data),
    verify: (id: string) => apiInstance.get(`/members/verify/${id}`).then(res => res.data),
    uploadDocument: (formData: FormData) => apiInstance.post('/members/upload-document', formData).then(res => res.data),
  },
  org: {
    getProvinces: () => apiInstance.get('/org/provinces').then(res => res.data),
    getBranches: (provinceId: string) => apiInstance.get(`/org/branches/${provinceId}`).then(res => res.data),
    getDojos: (branchId: string) => apiInstance.get(`/org/dojos/${branchId}`).then(res => res.data),
    getDojoDetail: (id: string) => apiInstance.get(`/org/dojo/${id}`).then(res => res.data),
    createProvince: (data: { name: string; headName?: string; adminEmail?: string; adminPassword?: string; code?: string }) => apiInstance.post('/org/provinces', data).then(res => res.data),
    updateProvince: (id: string, data: { name?: string; headName?: string; adminEmail?: string; adminPassword?: string; code?: string }) => apiInstance.patch(`/org/provinces/${id}`, data).then(res => res.data),
    createBranch: (data: { name: string; provinceId: string; headName?: string; adminEmail?: string; adminPassword?: string; code?: string }) => apiInstance.post('/org/branches', data).then(res => res.data),
    updateBranch: (id: string, data: { name?: string; provinceId?: string; headName?: string; adminEmail?: string; adminPassword?: string; code?: string }) => apiInstance.patch(`/org/branches/${id}`, data).then(res => res.data),
    createDojo: (data: { name: string; branchId: string; address?: string; contactPerson?: string; kecamatan?: string; tempatLatihan?: string; phoneNumber?: string; schedule?: string; adminEmail?: string; adminPassword?: string }) => apiInstance.post('/org/dojos', data).then(res => res.data),
    updateDojo: (id: string, data: { name?: string; branchId?: string; address?: string; contactPerson?: string; kecamatan?: string; tempatLatihan?: string; phoneNumber?: string; schedule?: string; adminEmail?: string; adminPassword?: string }) => apiInstance.patch(`/org/dojos/${id}`, data).then(res => res.data),
  },
  dashboard: {
    getStats: () => apiInstance.get('/dashboard/stats').then(res => res.data),
    getRecentActivities: () => apiInstance.get('/dashboard/recent-activities').then(res => res.data),
  },
  events: {
    getAll: () => apiInstance.get('/events').then(res => res.data),
    getDetail: (id: string) => apiInstance.get(`/events/${id}`).then(res => res.data),
    create: (data: Partial<Event>) => apiInstance.post('/events', data).then(res => res.data),
    delete: (id: string) => apiInstance.delete(`/events/${id}`).then(res => res.data),
    update: (id: string, data: Partial<Event>) => apiInstance.patch(`/events/${id}`, data).then(res => res.data),
  },
  attendance: {
    getLogs: () => apiInstance.get('/attendance/logs').then(res => res.data),
    checkIn: (data: { memberId?: string; dojoId: string; method?: string; latitude?: number; longitude?: number }) => apiInstance.post('/attendance/checkin', data).then(res => res.data),
  },
  verifications: {
    getPending: () => apiInstance.get('/verifications/pending').then(res => res.data),
    process: (id: string, data: { status: 'APPROVED' | 'REJECTED'; adminNotes?: string }) => 
      apiInstance.post(`/verifications/${id}/process`, data).then(res => res.data),
    claim: (data: { type: string; data: string; proofUrl?: string }) => 
      apiInstance.post('/verifications/claim', data).then(res => res.data),
    getMy: () => apiInstance.get('/verifications/my').then(res => res.data),
  },
  billing: {
    getAll: (params?: any) => apiInstance.get('/billing', { params }).then(res => res.data),
    verify: (data: { billingId: string; adminNotes?: string }) => apiInstance.post('/billing/verify', data).then(res => res.data),
    delete: (id: string) => apiInstance.delete(`/billing/${id}`).then(res => res.data),
    getMy: () => apiInstance.get('/billing/my').then(res => res.data),
    pay: (data: { billingId: string; paymentMethod: string; externalId?: string }) => apiInstance.post('/billing/pay', data).then(res => res.data),
  },
  notifications: {
    broadcast: (data: { title: string; content: string; type: string }) => 
      apiInstance.post('/notifications/broadcast', data).then(res => res.data),
    getMy: () => apiInstance.get('/notifications/my').then(res => res.data),
    markAsRead: (id: string) => apiInstance.patch(`/notifications/${id}/read`).then(res => res.data),
    clearRead: () => apiInstance.delete('/notifications/clear-read').then(res => res.data),
  },
  inventory: {
    getAll: () => apiInstance.get('/inventory').then(res => res.data),
    create: (data: any) => apiInstance.post('/inventory', data).then(res => res.data),
    update: (id: string, data: any) => apiInstance.patch(`/inventory/${id}`, data).then(res => res.data),
    delete: (id: string) => apiInstance.delete(`/inventory/${id}`).then(res => res.data),
  },
  roles: {
    getAll: () => apiInstance.get('/roles').then(res => res.data),
    getPermissions: () => apiInstance.get('/roles/permissions').then(res => res.data),
    updatePermissions: (id: string, data: { permissionIds: string[] }) => apiInstance.patch(`/roles/${id}/permissions`, data).then(res => res.data),
  },
  chat: {
    getConversations: () => apiInstance.get('/chat/conversations').then(res => res.data),
    getMessages: (conversationId: string) => apiInstance.get(`/chat/messages/${conversationId}`).then(res => res.data),
    createConversation: (participantId: string) => apiInstance.post('/chat/conversations', { participantId }).then(res => res.data),
    sendMessage: (data: { conversationId: string; content: string }) => apiInstance.post('/chat/messages', data).then(res => res.data),
  },
  memberGuide: {
    getPublic: () => apiInstance.get('/member-mobile-welcome').then(res => res.data),
    save: (data: Record<string, unknown>) =>
      apiInstance.put('/member-mobile-welcome', data).then((res) => res.data),
  },
});

export default api;


