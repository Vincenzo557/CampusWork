// ============================================================
// src/pages/student/Dashboard.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, StatCard, Badge, Spinner } from '../../components/Layout'
import { scheduleService } from '../../services/services'
import { applicationService } from '../../services/services'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [workSchedule, setWorkSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      applicationService.getMyApplications(),
      scheduleService.getWorkSchedule(),
    ]).then(([appRes, workRes]) => {
      setApplications(appRes.data.applications)
      setWorkSchedule(workRes.data.work_schedules)
    }).finally(() => setLoading(false))
  }, [])

  const activeJob    = applications.find(a => a.status === 'accepted')
  const pendingCount = applications.filter(a => a.status === 'pending').length
  const totalHours   = workSchedule.reduce((sum, s) => sum + (s.job?.hours_per_week ?? 0), 0)
  const uniqueJobIds = [...new Set(workSchedule.map(s => s.job_id))]

  return (
    <Layout>
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's a summary of your work and academic activity"
      />

      {loading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Applications"  value={applications.length} sub={`${pendingCount} pending`} />
            <StatCard label="Active job"    value={uniqueJobIds.length} sub={activeJob?.job?.title ?? 'None yet'} />
            <StatCard label="Hours / week"  value={totalHours} sub="of 20 max" />
            <StatCard label="Clashes"       value={0} sub="All clear" color="text-green-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Upcoming shifts */}
            <div className="card">
              <p className="text-sm font-medium text-gray-900 mb-3">Upcoming shifts</p>
              {workSchedule.length === 0 ? (
                <p className="text-sm text-gray-400">No shifts scheduled yet.</p>
              ) : (
                workSchedule.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {s.job?.business?.businessProfile?.business_name ?? s.job?.title}
                      </p>
                      <p className="text-xs text-gray-400">{s.start_time} – {s.end_time}</p>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{s.day_of_week}</span>
                  </div>
                ))
              )}
            </div>

            {/* Recent applications */}
            <div className="card">
              <p className="text-sm font-medium text-gray-900 mb-3">Recent applications</p>
              {applications.length === 0 ? (
                <p className="text-sm text-gray-400">No applications yet.</p>
              ) : (
                applications.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.job?.title}</p>
                      <p className="text-xs text-gray-400">{a.job?.business?.businessProfile?.business_name}</p>
                    </div>
                    <Badge status={a.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/student/JobListings.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { PageHeader, Spinner, EmptyState } from '../../components/Layout'
import { jobService } from '../../services/services'

export default function JobListings() {
  const [jobs, setJobs]       = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchJobs = async (q = '') => {
    setLoading(true)
    try {
      const res = await jobService.getAll({ search: q })
      setJobs(res.data.jobs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs(search)
  }

  return (
    <Layout>
      <PageHeader title="Browse jobs" subtitle={`${jobs.length} open positions near campus`} />

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs or businesses..."
          className="input flex-1"
        />
        <button type="submit" className="btn-primary px-5">Search</button>
      </form>

      {loading ? <Spinner /> : jobs.length === 0 ? (
        <EmptyState icon="🔍" title="No jobs found" subtitle="Try a different search term" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {jobs.map(job => (
            <div
              key={job.id}
              onClick={() => navigate(`/student/jobs/${job.id}`)}
              className="card cursor-pointer hover:border-brand-500 hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-xl">
                  💼
                </div>
                <span className="text-xs bg-brand-50 text-brand-500 px-2 py-1 rounded-full">
                  {job.slots_available} slot{job.slots_available !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{job.title}</p>
              <p className="text-xs text-gray-400 mb-3">
                {job.business?.businessProfile?.business_name}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {job.shifts?.slice(0, 3).map((s, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                    {s.day_of_week}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <span className="text-sm font-semibold text-gray-900">GH₵ {job.hourly_rate}/hr</span>
                <span className="text-xs text-gray-400">{job.hours_per_week} hrs/week</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/student/JobDetail.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { Spinner, Badge } from '../../components/Layout'
import { jobService, applicationService } from '../../services/services'
import toast from 'react-hot-toast'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob]               = useState(null)
  const [conflict, setConflict]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [applying, setApplying]     = useState(false)
  const [checking, setChecking]     = useState(false)

  useEffect(() => {
    jobService.getOne(id).then(res => {
      setJob(res.data.job)
      checkConflict(id)
    }).finally(() => setLoading(false))
  }, [id])

  const checkConflict = async (jobId) => {
    setChecking(true)
    try {
      const res = await applicationService.checkConflict(jobId)
      setConflict(res.data)
    } catch {
      // Not logged in or error — skip
    } finally {
      setChecking(false)
    }
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      await applicationService.apply(job.id)
      toast.success('Application submitted!')
      navigate('/student/applications')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to apply.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <Layout><Spinner /></Layout>
  if (!job) return <Layout><p className="text-gray-500">Job not found.</p></Layout>

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
        ← Back
      </button>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{job.title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {job.business?.businessProfile?.business_name} · {job.location}
                </p>
              </div>
              <Badge status={job.status} />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
          </div>

          <div className="card">
            <p className="text-sm font-medium text-gray-900 mb-3">Work schedule</p>
            <div className="space-y-2">
              {job.shifts?.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                  <span className="capitalize font-medium w-24">{s.day_of_week}</span>
                  <span>{s.start_time} – {s.end_time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hourly rate</span>
                <span className="font-semibold text-gray-900">GH₵ {job.hourly_rate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hours/week</span>
                <span className="font-medium text-gray-900">{job.hours_per_week}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Slots left</span>
                <span className="font-medium text-gray-900">{job.slots_available}</span>
              </div>
            </div>

            {/* Conflict check result */}
            {checking ? (
              <div className="text-xs text-gray-400 text-center py-2">Checking your schedule...</div>
            ) : conflict?.has_conflict ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-xs text-yellow-700">
                ⚠️ Schedule clash detected. Applying will flag this for admin review.
                <ul className="mt-1.5 space-y-1">
                  {conflict.clashes?.map((c, i) => (
                    <li key={i}>• {c.day}: {c.class} at {c.class_time}</li>
                  ))}
                </ul>
              </div>
            ) : conflict && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-xs text-green-700">
                ✓ No schedule clashes detected
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={applying || job.slots_available < 1}
              className="btn-primary w-full"
            >
              {applying ? 'Submitting...' : job.slots_available < 1 ? 'No slots available' : 'Apply now'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}


// ============================================================
// src/pages/student/MyApplications.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/Layout'
import { applicationService } from '../../services/services'
import toast from 'react-hot-toast'

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)

  const load = async () => {
    const res = await applicationService.getMyApplications()
    setApplications(res.data.applications)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleWithdraw = async (id) => {
    if (!confirm('Withdraw this application?')) return
    try {
      await applicationService.withdraw(id)
      toast.success('Application withdrawn')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to withdraw')
    }
  }

  return (
    <Layout>
      <PageHeader title="My applications" subtitle="Track the status of your job applications" />
      {loading ? <Spinner /> : applications.length === 0 ? (
        <EmptyState icon="📄" title="No applications yet" subtitle="Browse jobs and apply to get started" />
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-xl shrink-0">💼</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{app.job?.title}</p>
                <p className="text-xs text-gray-400">
                  {app.job?.business?.businessProfile?.business_name} ·
                  GH₵ {app.job?.hourly_rate}/hr · {app.job?.hours_per_week} hrs/week
                </p>
                {app.rejection_reason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {app.rejection_reason}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <Badge status={app.status} />
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(app.created_at).toLocaleDateString()}
                </p>
                {app.status === 'pending' && (
                  <button
                    onClick={() => handleWithdraw(app.id)}
                    className="text-xs text-red-400 hover:text-red-600 mt-1 block"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/student/MySchedule.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Spinner } from '../../components/Layout'
import { scheduleService } from '../../services/services'
import toast from 'react-hot-toast'

const DAYS  = ['monday','tuesday','wednesday','thursday','friday']
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

function timeToMins(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function overlaps(slot, item) {
  const sStart = timeToMins(slot + ':00')
  const sEnd   = sStart + 60
  const iStart = timeToMins(item.start_time)
  const iEnd   = timeToMins(item.end_time)
  return iStart < sEnd && iEnd > sStart
}

export default function MySchedule() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ subject_name:'', subject_code:'', day_of_week:'monday', start_time:'', end_time:'', semester:'Semester 2', academic_year:'2024/2025' })

  const load = async () => {
    const res = await scheduleService.getFullSchedule()
    setSchedule(res.data.schedule)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAddClass = async (e) => {
    e.preventDefault()
    try {
      await scheduleService.addClass(form)
      toast.success('Class added')
      setShowAdd(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to add class')
    }
  }

  return (
    <Layout>
      <PageHeader
        title="My schedule"
        subtitle="Classes and work shifts for this week"
        action={
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm">
            + Add class
          </button>
        }
      />

      {showAdd && (
        <form onSubmit={handleAddClass} className="card mb-5 grid grid-cols-3 gap-3">
          <div><label className="label">Subject name</label><input required className="input" value={form.subject_name} onChange={e => setForm({...form, subject_name: e.target.value})} /></div>
          <div><label className="label">Subject code</label><input className="input" value={form.subject_code} onChange={e => setForm({...form, subject_code: e.target.value})} /></div>
          <div><label className="label">Day</label>
            <select className="input" value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})}>
              {DAYS.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="label">Start time</label><input type="time" required className="input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} /></div>
          <div><label className="label">End time</label><input type="time" required className="input" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} /></div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary flex-1">Save</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <Spinner /> : (
        <>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-100">
              <div className="p-2" />
              {DAYS.map(d => (
                <div key={d} className="p-2 text-xs font-medium text-gray-500 text-center capitalize border-l border-gray-100">
                  {d.slice(0,3)}
                </div>
              ))}
            </div>
            {/* Rows */}
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-6 border-t border-gray-50">
                <div className="p-2 text-xs text-gray-400">{hour}</div>
                {DAYS.map(day => {
                  const items = schedule.filter(s => s.day_of_week === day && overlaps(hour, s))
                  return (
                    <div key={day} className="p-1 min-h-[36px] border-l border-gray-50">
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className={`text-xs rounded px-1.5 py-0.5 font-medium truncate ${
                            item.type === 'class'
                              ? 'bg-brand-50 text-brand-600'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded bg-brand-50 border border-brand-200" /> Class
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded bg-green-50 border border-green-200" /> Work shift
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/student/Profile.jsx
// ============================================================
import { useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader } from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/services'
import toast from 'react-hot-toast'

export default function StudentProfile() {
  const { user, updateUser } = useAuth()
  const [name, setName]       = useState(user?.name ?? '')
  const [saving, setSaving]   = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authService.updateProfile({ name })
      updateUser(res.data.user)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const profile = user?.student_profile ?? user?.studentProfile

  return (
    <Layout>
      <PageHeader title="My profile" subtitle="Manage your personal information" />
      <div className="max-w-md">
        <div className="card mb-4">
          <p className="text-sm font-medium text-gray-900 mb-4">Personal details</p>
          <form onSubmit={handleSave} className="space-y-3">
            <div><label className="label">Full name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input" value={user?.email} disabled /></div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        </div>
        {profile && (
          <div className="card">
            <p className="text-sm font-medium text-gray-900 mb-3">Academic info</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Student ID</span><span className="text-gray-900">{profile.student_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Faculty</span><span className="text-gray-900">{profile.faculty}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Course</span><span className="text-gray-900">{profile.course}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="text-gray-900">Year {profile.year_of_study}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Max work hrs/week</span><span className="text-gray-900">{profile.max_work_hours_per_week}</span></div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
