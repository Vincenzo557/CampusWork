// ============================================================
// src/components/Layout.jsx
// ============================================================
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const studentNav = [
  { to: '/student/dashboard',    icon: '🏠', label: 'Dashboard' },
  { to: '/student/jobs',         icon: '🔍', label: 'Browse jobs' },
  { to: '/student/applications', icon: '📄', label: 'Applications' },
  { to: '/student/schedule',     icon: '📅', label: 'My schedule' },
  { to: '/student/profile',      icon: '👤', label: 'Profile' },
]

const businessNav = [
  { to: '/business/dashboard',  icon: '🏠', label: 'Dashboard' },
  { to: '/business/post-job',   icon: '➕', label: 'Post a job' },
  { to: '/business/jobs',       icon: '📋', label: 'Manage jobs' },
  { to: '/business/applicants', icon: '👥', label: 'Applicants' },
  { to: '/business/profile',    icon: '🏪', label: 'Profile' },
]

const adminNav = [
  { to: '/admin/dashboard',  icon: '🏠', label: 'Dashboard' },
  { to: '/admin/students',   icon: '🎓', label: 'Students' },
  { to: '/admin/businesses', icon: '🏪', label: 'Businesses' },
  { to: '/admin/conflicts',  icon: '⚠️', label: 'Conflict reports' },
  { to: '/admin/jobs',       icon: '💼', label: 'All jobs' },
]

const brandColors = {
  student:  { bg: 'bg-brand-500',   active: 'bg-brand-50 text-brand-600' },
  business: { bg: 'bg-success-700', active: 'bg-success-50 text-success-700' },
  admin:    { bg: 'bg-brand-600',   active: 'bg-brand-50 text-brand-600' },
}

export default function Layout({ children }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = role === 'student' ? studentNav : role === 'business' ? businessNav : adminNav
  const colors   = brandColors[role] ?? brandColors.student

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col py-4 px-3">
        {/* Brand */}
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className={`w-7 h-7 ${colors.bg} rounded-lg flex items-center justify-center text-white text-sm`}>
            💼
          </div>
          <span className="text-sm font-semibold text-gray-900">CampusWork</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? colors.active
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-white text-xs font-medium shrink-0`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>🚪</span> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}


// ============================================================
// src/components/PageHeader.jsx
// ============================================================
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}


// ============================================================
// src/components/StatCard.jsx
// ============================================================
export function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}


// ============================================================
// src/components/Badge.jsx
// ============================================================
const badgeStyles = {
  pending:  'bg-yellow-50 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  withdrawn:'bg-gray-100 text-gray-500',
  open:     'bg-brand-50 text-brand-500',
  closed:   'bg-gray-100 text-gray-500',
  draft:    'bg-gray-100 text-gray-500',
  approved: 'bg-green-100 text-green-700',
  suspended:'bg-red-50 text-red-700',
  clear:    'bg-green-100 text-green-700',
  conflict: 'bg-yellow-50 text-yellow-700',
  over_limit:'bg-red-50 text-red-700',
  unresolved:'bg-yellow-50 text-yellow-700',
  resolved:  'bg-green-100 text-green-700',
}

export function Badge({ status }) {
  const style = badgeStyles[status] ?? 'bg-gray-100 text-gray-500'
  const label = status?.replace(/_/g, ' ')
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${style}`}>
      {label}
    </span>
  )
}


// ============================================================
// src/components/Spinner.jsx
// ============================================================
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}


// ============================================================
// src/components/EmptyState.jsx
// ============================================================
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
