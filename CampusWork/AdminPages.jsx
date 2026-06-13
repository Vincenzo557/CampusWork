// ============================================================
// src/pages/admin/Dashboard.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { PageHeader, StatCard, Badge, Spinner } from '../../components/Layout'
import { adminService } from '../../services/services'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [students,   setStudents]   = useState([])
  const [businesses, setBusinesses] = useState([])
  const [conflicts,  setConflicts]  = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      adminService.getStudents(),
      adminService.getBusinesses(),
      adminService.getConflicts({ status: 'unresolved' }),
    ]).then(([s, b, c]) => {
      setStudents(s.data.students)
      setBusinesses(b.data.businesses)
      setConflicts(c.data.conflicts)
    }).finally(() => setLoading(false))
  }, [])

  const pendingBiz     = businesses.filter(b => b.businessProfile?.status === 'pending')
  const workingStudents = students.filter(s => s.active_jobs > 0)

  return (
    <Layout>
      <PageHeader title="Admin dashboard" subtitle="System-wide overview for University of Ghana" />
      {loading ? <Spinner /> : (
        <>
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-5 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => navigate('/admin/conflicts')}>
              <span className="text-red-500 text-lg">⚠️</span>
              <p className="text-sm text-red-700 font-medium">
                {conflicts.length} unresolved schedule conflict{conflicts.length !== 1 ? 's' : ''} require your attention
              </p>
              <span className="ml-auto text-xs text-red-400">View →</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Total students"   value={students.length}    sub={`${workingStudents.length} working`} />
            <StatCard label="Businesses"       value={businesses.length}  sub={`${pendingBiz.length} pending approval`} />
            <StatCard label="Conflicts"        value={conflicts.length}   color={conflicts.length > 0 ? 'text-red-600' : 'text-gray-900'} sub="Unresolved" />
            <StatCard label="Pending approvals" value={pendingBiz.length} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Recent conflicts */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">Recent conflicts</p>
                <button onClick={() => navigate('/admin/conflicts')} className="text-xs text-brand-500 hover:underline">View all</button>
              </div>
              {conflicts.length === 0 ? (
                <p className="text-sm text-gray-400">No unresolved conflicts.</p>
              ) : conflicts.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{c.student?.name}</p>
                    <p className="text-xs text-gray-400">{c.job?.title} · {c.conflict_type?.replace(/_/g,' ')}</p>
                  </div>
                  <Badge status="unresolved" />
                </div>
              ))}
            </div>

            {/* Pending business approvals */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">Pending approvals</p>
                <button onClick={() => navigate('/admin/businesses')} className="text-xs text-brand-500 hover:underline">View all</button>
              </div>
              {pendingBiz.length === 0 ? (
                <p className="text-sm text-gray-400">No pending approvals.</p>
              ) : pendingBiz.slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{b.businessProfile?.business_name}</p>
                    <p className="text-xs text-gray-400">{b.email}</p>
                  </div>
                  <Badge status="pending" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/admin/ManageStudents.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/Layout'
import { adminService } from '../../services/services'
import toast from 'react-hot-toast'

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    adminService.getStudents().then(res => setStudents(res.data.students)).finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentProfile?.faculty?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentProfile?.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  const handleMaxHours = async (student) => {
    const val = prompt(`Set max hours/week for ${student.name}:`, student.studentProfile?.max_work_hours_per_week ?? 20)
    if (!val) return
    try {
      await adminService.updateMaxHours(student.id, parseInt(val))
      toast.success('Max hours updated')
      const res = await adminService.getStudents()
      setStudents(res.data.students)
    } catch { toast.error('Failed') }
  }

  return (
    <Layout>
      <PageHeader title="Manage students" subtitle="Monitor academic and work schedules" />
      <input
        placeholder="Search by name, ID, or faculty..."
        className="input mb-5"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="🎓" title="No students found" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Student','Faculty','Year','Work hrs/wk','Active job','Status',''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => {
                const p = s.studentProfile ?? s.student_profile
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{p?.student_id}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p?.faculty}</td>
                    <td className="px-4 py-3 text-gray-600">{p?.year_of_study}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${(s.total_work_hours ?? 0) > (p?.max_work_hours_per_week ?? 20) ? 'text-red-600' : 'text-gray-900'}`}>
                        {s.total_work_hours ?? 0}
                      </span>
                      <span className="text-gray-400 text-xs"> / {p?.max_work_hours_per_week}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.active_jobs > 0 ? `${s.active_jobs} job(s)` : '—'}</td>
                    <td className="px-4 py-3"><Badge status={s.conflict_status ?? 'clear'} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleMaxHours(s)} className="text-xs text-brand-500 hover:underline whitespace-nowrap">
                        Edit hours
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/admin/ManageBusinesses.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/Layout'
import { adminService } from '../../services/services'
import toast from 'react-hot-toast'

export default function ManageBusinesses() {
  const [businesses, setBusinesses] = useState([])
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)

  const load = async () => {
    const res = await adminService.getBusinesses()
    setBusinesses(res.data.businesses)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = businesses.filter(b =>
    b.businessProfile?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleApprove = async (id) => {
    try {
      await adminService.approveBusiness(id)
      toast.success('Business approved')
      load()
    } catch { toast.error('Failed') }
  }

  const handleSuspend = async (id) => {
    if (!confirm('Suspend this business? All their open jobs will be closed.')) return
    try {
      await adminService.suspendBusiness(id)
      toast.success('Business suspended')
      load()
    } catch { toast.error('Failed') }
  }

  return (
    <Layout>
      <PageHeader title="Manage businesses" subtitle="Approve, monitor, or suspend campus businesses" />
      <input placeholder="Search businesses..." className="input mb-5" value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="🏪" title="No businesses found" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Business','Email','Active jobs','Students hired','Status',''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => {
                const p = b.businessProfile ?? b.business_profile
                const status = p?.status ?? 'pending'
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p?.business_name}</p>
                      <p className="text-xs text-gray-400">{p?.location}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.email}</td>
                    <td className="px-4 py-3 text-gray-600">{b.active_jobs_count ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">{b.students_hired ?? 0}</td>
                    <td className="px-4 py-3"><Badge status={status} /></td>
                    <td className="px-4 py-3">
                      {status === 'pending' && (
                        <button onClick={() => handleApprove(b.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Approve</button>
                      )}
                      {status === 'approved' && (
                        <button onClick={() => handleSuspend(b.id)} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">Suspend</button>
                      )}
                      {status === 'suspended' && (
                        <button onClick={() => handleApprove(b.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Reinstate</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/admin/ConflictReports.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/Layout'
import { adminService } from '../../services/services'
import toast from 'react-hot-toast'

export default function ConflictReports() {
  const [conflicts, setConflicts] = useState([])
  const [filter,    setFilter]    = useState('unresolved')
  const [loading,   setLoading]   = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await adminService.getConflicts(filter ? { status: filter } : {})
    setConflicts(res.data.conflicts)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleResolve = async (id) => {
    try {
      await adminService.resolveConflict(id)
      toast.success('Conflict marked as resolved')
      load()
    } catch { toast.error('Failed') }
  }

  const handleNotify = async (id, whom) => {
    try {
      await adminService.notifyConflict(id, { notify: [whom] })
      toast.success(`${whom.charAt(0).toUpperCase()+whom.slice(1)} notified`)
    } catch { toast.error('Failed to send notification') }
  }

  return (
    <Layout>
      <PageHeader title="Conflict reports" subtitle="Schedule clashes flagged by the system" />

      <div className="flex gap-2 mb-5">
        {['unresolved', 'resolved', ''].map((f, i) => (
          <button
            key={i}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              filter === f ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {f === '' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : conflicts.length === 0 ? (
        <EmptyState icon="✅" title="No conflicts found" subtitle="Everything looks good" />
      ) : (
        <div className="space-y-3">
          {conflicts.map(c => {
            const profile = c.student?.studentProfile ?? c.student?.student_profile
            return (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.student?.name} — {c.job?.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {profile?.student_id} · Year {profile?.year_of_study} · {profile?.faculty}
                    </p>
                  </div>
                  <Badge status={c.status} />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 flex gap-2">
                  <span className="text-yellow-500 shrink-0">⚠️</span>
                  <p className="text-xs text-yellow-700 leading-relaxed">{c.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {c.conflict_type?.replace(/_/g,' ')} · Reported {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  {c.status === 'unresolved' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleNotify(c.id, 'student')}  className="btn-secondary text-xs py-1.5 px-3">Notify student</button>
                      <button onClick={() => handleNotify(c.id, 'business')} className="btn-secondary text-xs py-1.5 px-3">Notify business</button>
                      <button onClick={() => handleResolve(c.id)}            className="btn-primary text-xs py-1.5 px-3">Mark resolved</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}


// ============================================================
// src/pages/admin/ManageJobs.jsx
// ============================================================
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/Layout'
import { adminService } from '../../services/services'
import toast from 'react-hot-toast'

export default function AdminManageJobs() {
  const [jobs,    setJobs]    = useState([])
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await adminService.adminGetAll ? adminService.adminGetAll({ status: filter }) : { data: { jobs: [] } }
    setJobs(res.data?.jobs ?? [])
    setLoading(false)
  }

  useEffect(() => {
    // Use jobService for admin jobs
    import('../../services/services').then(({ jobService }) => {
      jobService.adminGetAll({ status: filter }).then(res => {
        setJobs(res.data.jobs)
        setLoading(false)
      })
    })
  }, [filter])

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.business?.businessProfile?.business_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleClose = async (id) => {
    if (!confirm('Force-close this job listing?')) return
    try {
      const { jobService } = await import('../../services/services')
      await jobService.adminCloseJob(id)
      toast.success('Job closed')
      const res = await jobService.adminGetAll({ status: filter })
      setJobs(res.data.jobs)
    } catch { toast.error('Failed') }
  }

  return (
    <Layout>
      <PageHeader title="All jobs" subtitle="Monitor all job listings across campus" />
      <div className="flex gap-3 mb-5">
        <input placeholder="Search jobs or businesses..." className="input flex-1" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-36" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="💼" title="No jobs found" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Job','Business','Rate','Hrs/wk','Applicants','Status',''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(j => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{j.title}</td>
                  <td className="px-4 py-3 text-gray-500">{j.business?.businessProfile?.business_name}</td>
                  <td className="px-4 py-3 text-gray-600">GH₵ {j.hourly_rate}</td>
                  <td className="px-4 py-3 text-gray-600">{j.hours_per_week}</td>
                  <td className="px-4 py-3 text-gray-600">{j.applications_count ?? 0}</td>
                  <td className="px-4 py-3"><Badge status={j.status} /></td>
                  <td className="px-4 py-3">
                    {j.status === 'open' && (
                      <button onClick={() => handleClose(j.id)} className="text-xs text-red-400 hover:text-red-600">Force close</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
