const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/v1').replace(/\/$/, '');

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, config);
    
    const data = response.headers.get('Content-Type')?.includes('application/json') 
      ? await response.json()
      : null;

    // Check if it's a 401 Unauthorized
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error(data?.message || 'Authentication required');
    }

    if (!response.ok) {
      throw new Error(data?.message || `Server returned ${response.status}: ${response.statusText}`);
    }

    if (data === null) {
      throw new Error('Expected JSON response but received something else.');
    }

    return data;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
}

export const api = {
  auth: {
    login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  members: {
    getAll: (params: any = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/members?${query}`);
    },
    getProfile: () => request('/members/me'),
    getDetail: (id: string) => request(`/members/${id}`),
    create: (data: any) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    provisionLogin: (id: string) =>
      request(`/members/${id}/provision-login`, { method: 'POST' }),
    updateMemberRank: (memberId: string, rankId: string, data: any) =>
      request(`/members/${memberId}/ranks/${rankId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  org: {
    getProvinces: () => request('/org/provinces'),
    getBranches: (provinceId: string) => request(`/org/branches/${provinceId}`),
    getDojos: (branchId: string) => request(`/org/dojos/${branchId}`),
    getDojoDetail: (id: string) => request(`/org/dojo/${id}`),
    createProvince: (data: any) => request('/org/provinces', { method: 'POST', body: JSON.stringify(data) }),
    createBranch: (data: any) => request('/org/branches', { method: 'POST', body: JSON.stringify(data) }),
    createDojo: (data: any) => request('/org/dojos', { method: 'POST', body: JSON.stringify(data) }),
    updateProvince: (id: string, data: any) => request(`/org/provinces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateBranch: (id: string, data: any) => request(`/org/branches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateDojo: (id: string, data: any) => request(`/org/dojos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  attendance: {
    getLogs: (params: any = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/attendance?${query}`);
    },
  },
  events: {
    getAll: () => request('/events'),
    getById: (id: string) => request(`/events/${id}`),
    create: (data: unknown) =>
      request('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request(`/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/events/${id}`, { method: 'DELETE' }),
    bulkRegister: (data: { eventId: string; memberIds: string[]; categoryId?: string }) =>
      request('/events/register/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  notifications: {
    getNotifications: () => request('/notifications/my'),
    markAsRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    broadcast: (data: any) => request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),
  },
  dashboard: {
    getStats: () => request('/dashboard/stats'),
    getRecentActivities: () => request('/dashboard/recent-activities'),
  },
  billing: {
    getMemberBills: (memberId: string) => request(`/billing/member/${memberId}`),
    createBill: (data: any) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  },
  verifications: {
    getPending: () => request('/verifications/pending'),
    process: (id: string, data: { status: 'APPROVED' | 'REJECTED'; adminNotes?: string }) =>
      request(`/verifications/${id}/process`, { method: 'POST', body: JSON.stringify(data) }),
  },
  roles: {
    getAll: () => request('/roles'),
    getPermissions: () => request('/roles/permissions'),
    updatePermissions: (roleId: string, data: any) => request(`/roles/${roleId}/permissions`, { method: 'PUT', body: JSON.stringify(data) }),
  }
};
