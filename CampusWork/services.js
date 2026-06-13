// ============================================================
// src/services/api.js  — Axios base instance
// ============================================================
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api


// ============================================================
// src/services/authService.js
// ============================================================
import api from './api'

export const authService = {
  register: (data)        => api.post('/auth/register', data),
  login: (data)           => api.post('/auth/login', data),
  logout: ()              => api.post('/auth/logout'),
  me: ()                  => api.get('/me'),
  updateProfile: (data)   => api.put('/me', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data)   => api.post('/auth/reset-password', data),
}


// ============================================================
// src/services/jobService.js
// ============================================================
import api from './api'

export const jobService = {
  // Public
  getAll: (params)  => api.get('/jobs', { params }),
  getOne: (id)      => api.get(`/jobs/${id}`),

  // Business
  getMyJobs: ()             => api.get('/business/jobs'),
  getMyJob: (id)            => api.get(`/business/jobs/${id}`),
  createJob: (data)         => api.post('/business/jobs', data),
  updateJob: (id, data)     => api.put(`/business/jobs/${id}`, data),
  deleteJob: (id)           => api.delete(`/business/jobs/${id}`),

  // Admin
  adminGetAll: (params)     => api.get('/admin/jobs', { params }),
  adminCloseJob: (id)       => api.put(`/admin/jobs/${id}/close`),
}


// ============================================================
// src/services/applicationService.js
// ============================================================
import api from './api'

export const applicationService = {
  // Student
  getMyApplications: ()     => api.get('/student/applications'),
  apply: (jobId)            => api.post('/student/applications', { job_id: jobId }),
  withdraw: (id)            => api.delete(`/student/applications/${id}`),
  checkConflict: (jobId)    => api.post('/student/check-conflict', { job_id: jobId }),

  // Business
  getApplicants: (jobId)    => api.get(`/business/jobs/${jobId}/applications`),
  acceptApplicant: (id)     => api.put(`/business/applications/${id}/accept`),
  rejectApplicant: (id, reason) =>
    api.put(`/business/applications/${id}/reject`, { reason }),
}


// ============================================================
// src/services/scheduleService.js
// ============================================================
import api from './api'

export const scheduleService = {
  // Student class schedule
  getClassSchedule: ()          => api.get('/student/class-schedule'),
  addClass: (data)              => api.post('/student/class-schedule', data),
  updateClass: (id, data)       => api.put(`/student/class-schedule/${id}`, data),
  deleteClass: (id)             => api.delete(`/student/class-schedule/${id}`),

  // Student work + full schedule
  getWorkSchedule: ()           => api.get('/student/work-schedule'),
  getFullSchedule: ()           => api.get('/student/full-schedule'),

  // Business
  getBusinessWorkSchedules: ()  => api.get('/business/work-schedules'),
}


// ============================================================
// src/services/adminService.js
// ============================================================
import api from './api'

export const adminService = {
  // Students
  getStudents: ()               => api.get('/admin/students'),
  getStudent: (id)              => api.get(`/admin/students/${id}`),
  updateMaxHours: (id, hours)   => api.put(`/admin/students/${id}/max-hours`, {
    max_work_hours_per_week: hours,
  }),

  // Businesses
  getBusinesses: ()             => api.get('/admin/businesses'),
  approveBusiness: (id)         => api.put(`/admin/businesses/${id}/approve`),
  suspendBusiness: (id)         => api.put(`/admin/businesses/${id}/suspend`),

  // Conflicts
  getConflicts: (params)        => api.get('/admin/conflicts', { params }),
  resolveConflict: (id)         => api.put(`/admin/conflicts/${id}/resolve`),
  notifyConflict: (id, data)    => api.post(`/admin/conflicts/${id}/notify`, data),
}


// ============================================================
// src/services/notificationService.js
// ============================================================
import api from './api'

export const notificationService = {
  getAll: ()    => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
}
