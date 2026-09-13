import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useConnections } from '../hooks/useConnections'
import AppShell from '../components/AppShell'
import ConnectButton from '../components/ConnectButton'

const QUICK_ACTIONS = [
  { icon: '📋', title: 'Create Project', sub: 'Turn your idea into reality', to: '/create-project' },
  { icon: '👥', title: 'Find People', sub: 'Discover skilled peers', to: '/find-people' },
  { icon: '🔍', title: 'Find Projects', sub: 'Join existing initiatives', to: '/discover' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { connectedIds } = useConnections()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('people')
  const [stats, setStats] = useState({ projects: 0, teamRequests: 0, pendingInvites: 0 })
  const [recommendedPeople, setRecommendedPeople] = useState([])
  const [recommendedProjects, setRecommendedProjects] = useState([])

  useEffect(() => {
    if (user) {
      loadStats()
      loadRecommendations()
    }
  }, [user, profile])

  async function loadStats() {
    const [{ count: projects }, { count: teamRequests }, { count: pendingInvites }] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
      supabase.from('team_invites').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('status', 'pending'),
      supabase.from('team_invites').select('*', { count: 'exact', head: true }).eq('sender_id', user.id).eq('status', 'pending'),
    ])
    setStats({ projects: projects || 0, teamRequests: teamRequests || 0, pendingInvites: pendingInvites || 0 })
  }

  async function loadRecommendations() {
    const mySkills = profile?.skills || []

    const { data: students } = await supabase.from('student_profiles').select('*').neq('id', user.id).limit(20)
    const scored = (students || [])
      .map((s) => {
        const overlap = (s.skills || []).filter((sk) => mySkills.some((ms) => ms.toLowerCase() === sk.toLowerCase()))
        return { ...s, matchScore: Math.min(95, 55 + overlap.length * 10) }
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6)
    setRecommendedPeople(scored)

    const { data: projects } = await supabase.from('projects').select('*').eq('status', 'open').neq('creator_id', user.id).limit(6)
    setRecommendedProjects(projects || [])
  }

  const activity = [
    { icon: '📊', bg: 'bg-info/10', count: stats.projects, label: 'Active Projects' },
    { icon: '👤', bg: 'bg-warning/10', count: stats.teamRequests, label: 'Team Requests' },
    { icon: '📩', bg: 'bg-danger/10', count: stats.pendingInvites, label: 'Pending Invitation' },
    { icon: '🔗', bg: 'bg-primary/10', count: connectedIds.length, label: 'Connections' },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const greetingIcon = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'

  return (
    <AppShell>
      <div className="mx-auto max-w-content px-6 py-7 md:px-9">
        <div
          className="mb-5 flex min-h-[120px] flex-col items-start justify-between gap-4 rounded-2xl p-7 sm:flex-row sm:items-center"
          style={{ background: 'linear-gradient(100deg, #DCF0E4 0%, #EBF5EF 55%, #FFFFFF 100%)' }}
        >
          <div>
            <h1 className="text-[22px] font-bold text-text">
              {greeting}, {profile?.name?.split(' ')[0] || 'there'}! {greetingIcon}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-textSecondary">Ideas grow when the right people come together.</p>
          </div>
          <div className="text-right text-[15px] font-semibold leading-relaxed text-primary">
            <p className="m-0">Collaborate.</p>
            <p className="m-0">Innovate.</p>
            <p className="m-0">Create Impact.</p>
          </div>
        </div>

        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex items-center gap-3 rounded-[14px] border border-border bg-surface p-[18px] text-left transition-all hover:-translate-y-0.5 hover:border-accentLight"
            >
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-surface2 text-lg">{action.icon}</span>
              <div>
                <p className="m-0 text-[14.5px] font-semibold text-text">{action.title}</p>
                <p className="m-0 text-xs text-muted">{action.sub}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Your Activity</h2>
          <span className="cursor-pointer text-[13px] text-primary">View all →</span>
        </div>
        <div className="mb-7 flex divide-x divide-border rounded-[14px] border border-border bg-surface">
          {activity.map((a) => (
            <div key={a.label} className="flex flex-1 items-center gap-3 px-6 py-5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${a.bg}`}>{a.icon}</span>
              <div>
                <p className="m-0 text-2xl font-bold text-text">{a.count}</p>
                <p className="m-0 text-xs text-muted">{a.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Recommended for You</h2>
          <span className="cursor-pointer text-[13px] text-primary">View all →</span>
        </div>

        <div className="mb-5 flex w-fit gap-1 rounded-[9px] bg-surface2 p-1">
          {['people', 'projects'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-5 py-1.5 text-xs font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-surface text-text shadow-sm' : 'text-muted'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'people' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedPeople.map((student) => (
              <div key={student.id} className="rounded-[14px] border border-border bg-surface p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-surface2 text-base font-bold text-primary">
                      {student.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="m-0 text-sm font-semibold text-text">{student.name}</p>
                      <p className="m-0 text-[11.5px] text-muted">{student.college} · Year {student.year}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">✓ {student.matchScore}% match</span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {student.skills?.slice(0, 3).map((sk) => (
                    <span key={sk} className="rounded-md bg-surface2 px-2.5 py-1 text-[11.5px] font-medium text-primary">{sk}</span>
                  ))}
                </div>
                <ConnectButton studentId={student.id} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedProjects.map((project) => (
              <div key={project.id} className="rounded-[14px] border border-border bg-surface p-4">
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <h3 className="text-[14.5px] font-semibold text-text">{project.name}</h3>
                  <span className="shrink-0 rounded-md bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info">{project.domain}</span>
                </div>
                <p className="mb-2.5 line-clamp-2 text-xs text-textSecondary">{project.description}</p>
                <p className="mb-2.5 text-[11.5px] text-muted">
                  Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'} · Team: {project.team_size}
                </p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {project.skills_required?.slice(0, 3).map((sk) => (
                    <span key={sk} className="rounded-md bg-surface2 px-2.5 py-1 text-[11.5px] font-medium text-primary">{sk}</span>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="w-full rounded-[9px] border border-borderStrong bg-surface px-3 py-2 text-sm font-medium text-primary hover:bg-surface2"
                >
                  View Project
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-[13px] italic text-muted">"Better teams build a brighter tomorrow."</p>
      </div>
    </AppShell>
  )
}
