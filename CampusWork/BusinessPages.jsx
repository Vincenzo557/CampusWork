// ============================================================
// src/pages/business/Dashboard.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { PageHeader, StatCard, Badge, Spinner } from '../../components/Layout'
import { jobService, applicationService } from '../../services/services'
import { useAuth } from '../../context/AuthContext'

export default function BusinessDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    jobService.getMyJobs().then(res => setJobs(res.data.jobs)).finally(() => setLoading(false))
  }, [])

  const openJobs    = jobs.filter(j => j.status === 'open').length
  const totalApps   = jobs.reduce((s, j) => s + (j.applications_count ?? 0), 0)
  const pendingApps = jobs.reduce((s, j) => s + (j.pending_count ?? 0), 0)

  return (
    <Layout>
      <PageHeader
        title="Business dashboard"
        subtitle={`Welcome back, ${user?.businessProfile?.business_name ?? user?.name}`}
        action={<button onClick={() => navigate('/business/post-job')} className="btn-success">+ Post job</button>}
      />
      {loading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Active listings" value={openJobs}    sub={`${jobs.length} total`} />
            <StatCard label="Total applicants" value={totalApps}  sub="All time" />
            <StatCard label="Pending review"  value={pendingApps} sub="Awaiting decision" />
            <StatCard label="Total listings"  value={jobs.length} />
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-900 mb-3">Your job listings</p>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-400">No listings yet. <button onClick={() => navigate('/business/post-job')} className="text-brand-500 hover:underline">Post your first job.</button></p>
            ) : jobs.map(job => (
              <div key={job.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center text-lg shrink-0">💼</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-400">GH₵ {job.hourly_rate}/hr · {job.hours_per_week} hrs/week · {job.applications_count ?? 0} applicants</p>
                </div>
                <Badge status={job.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/business/PostJob.jsx
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { PageHeader } from '../../components/Layout'
import { jobService } from '../../services/services'
import toast from 'react-hot-toast'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

export default function PostJob() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    hourly_rate: '', hours_per_week: '', slots_available: '', status: 'open',
  })
  const [shifts, setShifts]       = useState([])
  const [newShift, setNewShift]   = useState({ day_of_week: 'monday', start_time: '09:00', end_time: '13:00' })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const addShift = () => {
    setShifts([...shifts, { ...newShift }])
    setNewShift({ day_of_week: 'monday', start_time: '09:00', end_time: '13:00' })
  }

  const removeShift = (i) => setShifts(shifts.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (shifts.length === 0) return toast.error('Add at least one shift.')
    setLoading(true)
    try {
      await jobService.createJob({ ...form, shifts })
      toast.success('Job published!')
      navigate('/business/jobs')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m))
      else toast.error(err.response?.data?.message ?? 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <PageHeader title="Post a job" subtitle="Fill in the details of your vacancy" />
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Job title</label><input name="title" required className="input" placeholder="e.g. Barista" value={form.title} onChange={handleChange} /></div>
            <div><label className="label">Available slots</label><input name="slots_available" type="number" required min="1" className="input" placeholder="2" value={form.slots_available} onChange={handleChange} /></div>
          </div>
          <div><label className="label">Job description</label><textarea name="description" required rows={3} className="input resize-none" placeholder="Describe the role, responsibilities and requirements..." value={form.description} onChange={handleChange} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Hourly rate (GH₵)</label><input name="hourly_rate" type="number" required min="1" className="input" placeholder="15" value={form.hourly_rate} onChange={handleChange} /></div>
            <div><label className="label">Hours/week</label><input name="hours_per_week" type="number" required min="1" max="40" className="input" placeholder="12" value={form.hours_per_week} onChange={handleChange} /></div>
            <div><label className="label">Location</label><input name="location" className="input" placeholder="Near Main Gate" value={form.location} onChange={handleChange} /></div>
          </div>

          {/* Shifts */}
          <div>
            <label className="label">Work schedule</label>
            {shifts.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-2 text-sm">
                <span className="capitalize font-medium text-gray-700 w-24">{s.day_of_week}</span>
                <span className="text-gray-500">{s.start_time} – {s.end_time}</span>
                <button type="button" onClick={() => removeShift(i)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>
            ))}
            <div className="flex gap-2 items-end mt-2">
              <div className="flex-1">
                <select className="input" value={newShift.day_of_week} onChange={e => setNewShift({...newShift, day_of_week: e.target.value})}>
                  {DAYS.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                </select>
              </div>
              <input type="time" className="input w-32" value={newShift.start_time} onChange={e => setNewShift({...newShift, start_time: e.target.value})} />
              <span className="text-gray-400 text-sm pb-2">to</span>
              <input type="time" className="input w-32" value={newShift.end_time} onChange={e => setNewShift({...newShift, end_time: e.target.value})} />
              <button type="button" onClick={addShift} className="btn-success shrink-0">+ Add</button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/business/jobs')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-success">{loading ? 'Publishing...' : 'Publish listing'}</button>
          </div>
        </form>
      </div>
    </Layout>
  )
}


// ============================================================
// src/pages/business/ManageJobs.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/Layout'
import { jobService } from '../../services/services'
import toast from 'react-hot-toast'

export default function ManageJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await jobService.getMyJobs()
    setJobs(res.data.jobs)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open'
    try {
      await jobService.updateJob(job.id, { status: newStatus })
      toast.success(`Job ${newStatus}`)
      load()
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (job) => {
    if (!confirm(`Delete "${job.title}"?`)) return
    try {
      await jobService.deleteJob(job.id)
      toast.success('Job deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete') }
  }

  return (
    <Layout>
      <PageHeader
        title="Manage jobs"
        subtitle="Edit, pause, or close your listings"
        action={<button onClick={() => navigate('/business/post-job')} className="btn-success">+ Post job</button>}
      />
      {loading ? <Spinner /> : jobs.length === 0 ? (
        <EmptyState icon="💼" title="No job listings yet" subtitle="Post your first job to get started" />
      ) : (
        <div className="card divide-y divide-gray-50">
          {jobs.map(job => (
            <div key={job.id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center text-lg shrink-0">💼</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{job.title}</p>
                <p className="text-xs text-gray-400">
                  GH₵ {job.hourly_rate}/hr · {job.hours_per_week} hrs/week ·
                  {job.applications_count ?? 0} applicants · {job.slots_available} slots
                </p>
              </div>
              <Badge status={job.status} />
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => toggleStatus(job)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {job.status === 'open' ? 'Close' : 'Reopen'}
                </button>
                <button
                  onClick={() => handleDelete(job)}
                  className="text-xs text-red-400 hover:text-red-600 px-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/business/Applicants.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/Layout'
import { jobService, applicationService } from '../../services/services'
import toast from 'react-hot-toast'

export default function Applicants() {
  const [jobs, setJobs]             = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    jobService.getMyJobs().then(res => {
      const open = res.data.jobs
      setJobs(open)
      if (open.length > 0) loadApplicants(open[0].id)
      else setLoading(false)
    })
  }, [])

  const loadApplicants = async (jobId) => {
    setLoading(true)
    setSelectedJob(jobId)
    const res = await applicationService.getApplicants(jobId)
    setApplicants(res.data.applications)
    setLoading(false)
  }

  const handleAccept = async (id) => {
    setActionLoading(id)
    try {
      await applicationService.acceptApplicant(id)
      toast.success('Applicant accepted!')
      loadApplicants(selectedJob)
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed') }
    finally { setActionLoading(null) }
  }

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):')
    if (reason === null) return
    setActionLoading(id)
    try {
      await applicationService.rejectApplicant(id, reason)
      toast.success('Applicant rejected')
      loadApplicants(selectedJob)
    } catch { toast.error('Failed') }
    finally { setActionLoading(null) }
  }

  return (
    <Layout>
      <PageHeader title="Applicants" subtitle="Review applications for your job listings" />
      {jobs.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {jobs.map(j => (
            <button
              key={j.id}
              onClick={() => loadApplicants(j.id)}
              className={`text-sm px-4 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                selectedJob === j.id
                  ? 'bg-success-700 text-white border-success-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {j.title}
            </button>
          ))}
        </div>
      )}
      {loading ? <Spinner /> : applicants.length === 0 ? (
        <EmptyState icon="👥" title="No applicants yet" subtitle="Applications will appear here once students apply" />
      ) : (
        <div className="space-y-3">
          {applicants.map(app => {
            const profile = app.student?.studentProfile ?? app.student?.student_profile
            const initials = app.student?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) ?? 'S'
            return (
              <div key={app.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-sm font-medium text-brand-600 shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{app.student?.name}</p>
                    <p className="text-xs text-gray-400">
                      Year {profile?.year_of_study} · {profile?.faculty} · {profile?.course}
                    </p>
                  </div>
                  <Badge status={app.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span>📅 Applied {new Date(app.created_at).toLocaleDateString()}</span>
                  {app.has_conflict && (
                    <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      ⚠️ Schedule clash detected
                    </span>
                  )}
                  {!app.has_conflict && app.status === 'pending' && (
                    <span className="text-green-600">✓ No clashes</span>
                  )}
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={actionLoading === app.id}
                      className="btn-secondary text-sm py-1.5"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAccept(app.id)}
                      disabled={actionLoading === app.id}
                      className="btn-success text-sm py-1.5"
                    >
                      {actionLoading === app.id ? 'Processing...' : 'Accept'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/business/Profile.jsx
// ============================================================
import { useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Badge } from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/services'
import api from '../../services/services'
import toast from 'react-hot-toast'

export default function BusinessProfile() {
  const { user, updateUser } = useAuth()
  const profile = user?.businessProfile ?? user?.business_profile
  const [form, setForm] = useState({
    name: user?.name ?? '',
    business_name:  profile?.business_name  ?? '',
    description:    profile?.description    ?? '',
    location:       profile?.location       ?? '',
    contact_number: profile?.contact_number ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authService.updateProfile({ name: form.name })
      await api.put('/business/profile', {
        business_name:  form.business_name,
        description:    form.description,
        location:       form.location,
        contact_number: form.contact_number,
      })
      toast.success('Profile updated')
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <Layout>
      <PageHeader title="Business profile" subtitle="Manage your business information" />
      <div className="max-w-lg">
        <div className="card mb-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">🏪</div>
          <div>
            <p className="text-sm font-medium text-gray-900">{profile?.business_name}</p>
            <Badge status={profile?.status ?? 'pending'} />
          </div>
        </div>
        <form onSubmit={handleSave} className="card space-y-3">
          <div><label className="label">Contact name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><label className="label">Business name</label><input className="input" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} /></div>
          <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
          <div><label className="label">Contact number</label><input className="input" value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} /></div>
          <div><label className="label">Description</label><textarea rows={3} className="input resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <button type="submit" disabled={saving} className="btn-success">{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </Layout>
  )
}
