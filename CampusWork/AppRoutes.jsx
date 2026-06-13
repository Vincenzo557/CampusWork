// ============================================================
// src/routes/ProtectedRoute.jsx
// ============================================================
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role: requiredRole }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && role !== requiredRole) {
    // Redirect to correct dashboard if wrong role
    const dashMap = { student: '/student/dashboard', business: '/business/dashboard', admin: '/admin/dashboard' }
    return <Navigate to={dashMap[role] ?? '/login'} replace />
  }

  return <Outlet />
}


// ============================================================
// src/routes/AppRoutes.jsx
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'

// Auth pages
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Student pages
import StudentDashboard   from '../pages/student/Dashboard'
import JobListings        from '../pages/student/JobListings'
import JobDetail          from '../pages/student/JobDetail'
import MyApplications     from '../pages/student/MyApplications'
import MySchedule         from '../pages/student/MySchedule'
import StudentProfile     from '../pages/student/Profile'

// Business pages
import BusinessDashboard  from '../pages/business/Dashboard'
import PostJob            from '../pages/business/PostJob'
import ManageJobs         from '../pages/business/ManageJobs'
import Applicants         from '../pages/business/Applicants'
import BusinessProfile    from '../pages/business/Profile'

// Admin pages
import AdminDashboard     from '../pages/admin/Dashboard'
import ManageStudents     from '../pages/admin/ManageStudents'
import ManageBusinesses   from '../pages/admin/ManageBusinesses'
import ConflictReports    from '../pages/admin/ConflictReports'
import AdminManageJobs    from '../pages/admin/ManageJobs'

function RootRedirect() {
  const { user, role } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const map = { student: '/student/dashboard', business: '/business/dashboard', admin: '/admin/dashboard' }
  return <Navigate to={map[role] ?? '/login'} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student */}
      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student/dashboard"    element={<StudentDashboard />} />
        <Route path="/student/jobs"         element={<JobListings />} />
        <Route path="/student/jobs/:id"     element={<JobDetail />} />
        <Route path="/student/applications" element={<MyApplications />} />
        <Route path="/student/schedule"     element={<MySchedule />} />
        <Route path="/student/profile"      element={<StudentProfile />} />
      </Route>

      {/* Business */}
      <Route element={<ProtectedRoute role="business" />}>
        <Route path="/business/dashboard"  element={<BusinessDashboard />} />
        <Route path="/business/post-job"   element={<PostJob />} />
        <Route path="/business/jobs"       element={<ManageJobs />} />
        <Route path="/business/applicants" element={<Applicants />} />
        <Route path="/business/profile"    element={<BusinessProfile />} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin/dashboard"   element={<AdminDashboard />} />
        <Route path="/admin/students"    element={<ManageStudents />} />
        <Route path="/admin/businesses"  element={<ManageBusinesses />} />
        <Route path="/admin/conflicts"   element={<ConflictReports />} />
        <Route path="/admin/jobs"        element={<AdminManageJobs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
