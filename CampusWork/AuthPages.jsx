// ============================================================
// src/pages/auth/Login.jsx
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const role = await login(form.email, form.password)
      toast.success('Welcome back!')
      const map = { student: '/student/dashboard', business: '/business/dashboard', admin: '/admin/dashboard' }
      navigate(map[role] ?? '/')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Invalid credentials. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white text-lg">
              💼
            </div>
            <span className="font-semibold text-gray-900">CampusWork</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-7">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@university.edu"
                value={form.email}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="input"
              />
              <div className="text-right mt-1">
                <Link to="/forgot-password" className="text-xs text-brand-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Feature panel */}
      <div className="hidden lg:flex flex-1 bg-brand-500 items-center justify-center p-12">
        <div className="max-w-sm text-white">
          <h2 className="text-2xl font-semibold mb-4">
            Find flexible work around your studies
          </h2>
          <p className="text-white/80 text-sm leading-relaxed mb-8">
            CampusWork connects university students with part-time opportunities at local
            businesses — while keeping your academic schedule safe.
          </p>
          <ul className="space-y-3">
            {[
              'Jobs matched to your free hours',
              'Automatic clash detection',
              'University-verified businesses',
              'Admin-monitored workloads',
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  ✓
                </div>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}


// ============================================================
// src/pages/auth/Register.jsx
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [role, setRole]       = useState('student')
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    name: '', email: '', password: '', password_confirmation: '',
    student_id: '', faculty: '', course: '', year_of_study: '',
    business_name: '', description: '', location: '', contact_number: '',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      return toast.error('Passwords do not match.')
    }
    setLoading(true)
    try {
      const assignedRole = await register({ ...form, role })
      toast.success('Account created!')
      const map = { student: '/student/dashboard', business: '/business/dashboard' }
      navigate(map[assignedRole] ?? '/')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        Object.values(errors).flat().forEach((msg) => toast.error(msg))
      } else {
        toast.error(err.response?.data?.message ?? 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const faculties = ['Engineering', 'Business', 'Sciences', 'Humanities', 'Law', 'Medicine', 'Social Sciences']

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white text-lg">💼</div>
            <span className="font-semibold text-gray-900">CampusWork</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create an account</h1>
          <p className="text-sm text-gray-500 mb-6">Choose your role to get started</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'student',  label: 'Student',  icon: '🎓', desc: 'Browse and apply for jobs' },
              { value: 'business', label: 'Business', icon: '🏪', desc: 'Post jobs and hire students' },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === r.value
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">{r.icon}</div>
                <div className="text-sm font-medium text-gray-900">{r.label}</div>
                <div className="text-xs text-gray-500">{r.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Common fields */}
            <div>
              <label className="label">Full name</label>
              <input name="name" required placeholder="Kwame Asante" value={form.name} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" required placeholder="you@university.edu" value={form.email} onChange={handleChange} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" required placeholder="••••••••" value={form.password} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input name="password_confirmation" type="password" required placeholder="••••••••" value={form.password_confirmation} onChange={handleChange} className="input" />
              </div>
            </div>

            {/* Student-specific fields */}
            {role === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Student ID</label>
                    <input name="student_id" required placeholder="UG/2024/001" value={form.student_id} onChange={handleChange} className="input" />
                  </div>
                  <div>
                    <label className="label">Year of study</label>
                    <select name="year_of_study" required value={form.year_of_study} onChange={handleChange} className="input">
                      <option value="">Select year</option>
                      {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Faculty</label>
                  <select name="faculty" required value={form.faculty} onChange={handleChange} className="input">
                    <option value="">Select faculty</option>
                    {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Course / Programme</label>
                  <input name="course" required placeholder="Computer Engineering" value={form.course} onChange={handleChange} className="input" />
                </div>
              </>
            )}

            {/* Business-specific fields */}
            {role === 'business' && (
              <>
                <div>
                  <label className="label">Business name</label>
                  <input name="business_name" required placeholder="Café Legon" value={form.business_name} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input name="location" placeholder="Near Main Gate, UG Legon" value={form.location} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Contact number</label>
                  <input name="contact_number" placeholder="024 000 0000" value={form.contact_number} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea name="description" rows={2} placeholder="Brief description of your business..." value={form.description} onChange={handleChange} className="input resize-none" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !mt-5">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Side panel */}
      <div className="hidden lg:flex flex-1 bg-brand-500 items-center justify-center p-12">
        <div className="max-w-sm text-white">
          <h2 className="text-2xl font-semibold mb-4">Join the campus work community</h2>
          <p className="text-white/80 text-sm leading-relaxed mb-8">
            Thousands of students have found flexible work that fits around their lectures,
            tutorials, and exams.
          </p>
          <ul className="space-y-3">
            {['Free for students', 'Verified campus businesses only', 'Your timetable stays protected', 'Apply in minutes'].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
