import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import TeamChat from './TeamChat'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const { data: memberRows } = await supabase.from('team_members').select('team_id').eq('student_id', user.id)
    const teamIds = [...new Set((memberRows || []).map((m) => m.team_id))]

    const results = await Promise.all(
      teamIds.map(async (teamId) => {
        const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).maybeSingle()
        const { data: project } = team ? await supabase.from('projects').select('name').eq('id', team.project_id).maybeSingle() : { data: null }
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        return { teamId, projectName: project?.name || 'Team', lastMessage }
      })
    )
    setConversations(results)
    setLoading(false)
    if (results.length > 0) setSelected(results[0].teamId)
  }

  return (
    <AppShell breadcrumb={<span>Messages</span>}>
      <div className="mx-auto flex max-w-content gap-5 px-6 py-7 md:px-9">
        <div className="w-full max-w-[280px] shrink-0">
          <h1 className="mb-4 text-xl font-bold text-text">💬 Messages</h1>
          {loading ? (
            <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-[14px]" />)}</div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted">No team conversations yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((c) => (
                <button
                  key={c.teamId}
                  onClick={() => setSelected(c.teamId)}
                  className={`rounded-[12px] border p-3 text-left transition-colors ${
                    selected === c.teamId ? 'border-primary bg-surface2' : 'border-border bg-surface hover:border-accentLight'
                  }`}
                >
                  <p className="m-0 truncate text-sm font-semibold text-text">{c.projectName}</p>
                  <p className="m-0 truncate text-xs text-muted">{c.lastMessage?.content || 'No messages yet'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {selected ? <TeamChat teamId={selected} /> : <p className="text-sm text-muted">Select a conversation.</p>}
        </div>
      </div>
    </AppShell>
  )
}
