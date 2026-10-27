import axios from 'axios';
import {
  IUser,
  IMedicine,
  IMedicineSchedule,
  IDoseOccurrence,
  IDoseAction,
  IInventoryRecord,
  IRefillTransaction,
  ICaregiverInvitation,
  ICaregiverPermission,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dosebloom_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Don't auto-redirect if checking status
      if (!error.config.url.includes('/auth/me')) {
        localStorage.removeItem('dosebloom_token');
        localStorage.removeItem('dosebloom_user');
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth
  auth: {
    register: (data: any) => api.post<{ token: string; user: IUser }>('/auth/register', data),
    login: (data: any) => api.post<{ token: string; user: IUser }>('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get<{ user: IUser }>('/auth/me'),
    updateProfile: (data: any) => api.put<{ message: string; user: IUser }>('/auth/profile', data),
    changePassword: (data: any) => api.put('/auth/change-password', data),
    exportData: () => api.get('/auth/export-data'),
    deleteAccount: () => api.delete('/auth/account'),
  },

  // Medicines
  medicines: {
    create: (data: any) =>
      api.post<{ medicine: IMedicine; schedule: IMedicineSchedule; inventory: IInventoryRecord }>(
        '/medicines',
        data
      ),
    list: (status?: string) =>
      api.get<{ medicines: IMedicine[] }>('/medicines', { params: { status } }),
    get: (id: string) =>
      api.get<{ medicine: IMedicine; schedule: IMedicineSchedule; inventory: IInventoryRecord }>(
        `/medicines/${id}`
      ),
    update: (id: string, data: any) =>
      api.put<{ medicine: IMedicine }>(`/medicines/${id}`, data),
    pause: (id: string) => api.post<{ medicine: IMedicine }>(`/medicines/${id}/pause`),
    resume: (id: string) => api.post<{ medicine: IMedicine }>(`/medicines/${id}/resume`),
    archive: (id: string) => api.post<{ medicine: IMedicine }>(`/medicines/${id}/archive`),
  },

  // Schedules
  schedules: {
    preview: (data: any) => api.post<{ occurrences: any[] }>('/schedules/preview', data),
    getToday: (date?: string) =>
      api.get<{
        date: string;
        timeZone: string;
        stats: {
          totalScheduled: number;
          totalTaken: number;
          totalSkipped: number;
          totalDue: number;
          totalUnconfirmed: number;
          completionPercentage: number;
        };
        grouped: {
          morning: IDoseOccurrence[];
          afternoon: IDoseOccurrence[];
          evening: IDoseOccurrence[];
          night: IDoseOccurrence[];
        };
        all: IDoseOccurrence[];
      }>('/schedules/today', { params: { date } }),
    getWeekly: (startDate?: string) =>
      api.get<{ occurrences: IDoseOccurrence[]; startDate: string; endDate: string }>(
        '/schedules/weekly',
        { params: { startDate } }
      ),
    getMonthly: (year: number, month: number) =>
      api.get<{ occurrences: IDoseOccurrence[]; year: number; month: number }>(
        '/schedules/monthly',
        { params: { year, month } }
      ),
    update: (id: string, data: any) => api.put<{ schedule: IMedicineSchedule }>(`/schedules/${id}`, data),
  },

  // Dose Actions
  doses: {
    markTaken: (occurrenceId: string, data?: { notes?: string; sourceDevice?: string }) =>
      api.post<{ occurrence: IDoseOccurrence; action: IDoseAction }>(
        `/doses/${occurrenceId}/take`,
        data || {}
      ),
    markSkipped: (occurrenceId: string, data?: { notes?: string; sourceDevice?: string }) =>
      api.post<{ occurrence: IDoseOccurrence; action: IDoseAction }>(
        `/doses/${occurrenceId}/skip`,
        data || {}
      ),
    snooze: (occurrenceId: string, snoozeMinutes: number = 15) =>
      api.post<{ occurrence: IDoseOccurrence }>(`/doses/${occurrenceId}/snooze`, { snoozeMinutes }),
    correct: (actionId: string, newActionType: 'taken' | 'skipped', reason: string) =>
      api.put(`/doses/actions/${actionId}/correct`, { newActionType, reason }),
    getHistory: (page: number = 1, limit: number = 30, medicineId?: string) =>
      api.get<{ actions: IDoseAction[]; pagination: any }>('/doses/history', {
        params: { page, limit, medicineId },
      }),
  },

  // Inventory & Refills
  inventory: {
    get: (medicineId?: string) =>
      api.get<{ inventories: IInventoryRecord[]; inventory?: IInventoryRecord }>('/inventory', {
        params: { medicineId },
      }),
    refill: (medicineId: string, addedQuantity: number, note?: string) =>
      api.post<{ inventory: IInventoryRecord; transaction: IRefillTransaction }>(
        `/inventory/${medicineId}/refill`,
        { addedQuantity, note }
      ),
    adjust: (medicineId: string, newQuantity: number, reason?: string) =>
      api.post<{ inventory: IInventoryRecord; transaction: IRefillTransaction }>(
        `/inventory/${medicineId}/adjust`,
        { newQuantity, reason }
      ),
    getLowStock: () => api.get<{ alerts: any[] }>('/inventory/low-stock'),
    getTransactions: (medicineId?: string) =>
      api.get<{ transactions: IRefillTransaction[] }>('/inventory/transactions', {
        params: { medicineId },
      }),
  },

  // Notifications
  notifications: {
    getVapidKey: () => api.get<{ publicKey: string }>('/notifications/vapid-public-key'),
    subscribe: (subscription: any, deviceIdentifier?: string) =>
      api.post('/notifications/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(
            String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))
          ),
          auth: btoa(
            String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!)))
          ),
        },
        deviceIdentifier: deviceIdentifier || 'Web Browser',
      }),
    unsubscribe: (endpoint: string) => api.post('/notifications/unsubscribe', { endpoint }),
    listDevices: () => api.get<{ devices: any[] }>('/notifications/devices'),
    sendTest: () => api.post<{ message: string; result: any }>('/notifications/test'),
    getLogs: () => api.get<{ logs: any[] }>('/notifications/logs'),
    demoSweep: () => api.post<{ message: string; sweepResult: any }>('/notifications/demo-sweep'),
  },

  // Caregivers
  caregivers: {
    invite: (data: { caregiverEmail: string; permissions: any }) =>
      api.post<{ invitation: any }>('/caregivers/invite', data),
    listSent: () => api.get<{ invitations: ICaregiverInvitation[] }>('/caregivers/sent-invitations'),
    accept: (token: string) => api.post('/caregivers/accept', { token }),
    listCaregivers: () => api.get<{ caregivers: ICaregiverPermission[] }>('/caregivers/my-caregivers'),
    listLovedOnes: () => api.get<{ lovedOnes: ICaregiverPermission[] }>('/caregivers/loved-ones'),
    getLovedOneSchedule: (lovedOneId: string) =>
      api.get<{ occurrences: IDoseOccurrence[] }>(`/caregivers/loved-ones/${lovedOneId}/schedule`),
    revoke: (caregiverUserId: string) => api.delete(`/caregivers/caregivers/${caregiverUserId}`),
  },

  // Analytics
  analytics: {
    getSummary: () => api.get<any>('/analytics/summary'),
    getWeeklyTrends: () => api.get<{ weeklyTrends: any[] }>('/analytics/trends'),
    getTimeDistribution: () => api.get<{ distribution: any[] }>('/analytics/time-distribution'),
  },

  // Admin
  admin: {
    getHealth: () => api.get<any>('/admin/health'),
    getMetrics: () => api.get<any>('/admin/metrics'),
    getAuditLogs: (page: number = 1) => api.get<any>('/admin/audit-logs', { params: { page } }),
    triggerSweep: () => api.post<any>('/admin/worker/sweep'),
  },
};

export default api;
