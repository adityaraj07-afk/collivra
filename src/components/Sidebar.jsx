import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import Logo from './Logo'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/find-people', label: 'Find People', icon: '👥' },
  { path: '/network', label: 'My Network', icon: '🔗', badgeKey: 'network' },
  { path: '/discover', label: 'Find Projects', icon: '🔍' },
  { path: '/create-project', label: 'Create Project', icon: '➕' },
  { path: '/my-teams', label: 'My Teams', icon: '🤝' },
  { path: '/messages', label: 'Messages', icon: '💬', badgeKey: 'messages' },
  { path: '/notifications', label: 'Notifications', icon: '🔔', badgeKey: 'notifications' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

const MOBILE_PATHS = ['/dashboard', '/find-people', '/network', '/messages', '/notifications']

export default function Sidebar() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [badges, setBadges] = useState({ messages: 0, notifications: 0, network: 0 })

  useEffect(() => {
    if (!user) return
    loadBadges()
  }, [user])

  async function loadBadges() {
    const [{ count: invites }, { count: pendingConnections }, { count: unreadDirect }] = await Promise.all([
      supabase.from('team_invites').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('status', 'pending'),
      supabase.from('connections').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('status', 'pending'),
      supabase.from('direct_messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).is('read_at', null),
    ])

    const { data: memberRows } = await supabase.from('team_members').select('team_id').eq('student_id', user.id)
    const teamIds = (memberRows || []).map((m) => m.team_id)
    let unreadMessages = 0
    if (teamIds.length > 0) {
      const { data: reads } = await supabase.from('message_reads').select('team_id, last_read_at').eq('user_id', user.id)
      const readMap = Object.fromEntries((reads || []).map((r) => [r.team_id, r.last_read_at]))
      const counts = await Promise.all(
        teamIds.map(async (teamId) => {
          const since = readMap[teamId] || '1970-01-01'
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
            .gt('created_at', since)
            .neq('sender_id', user.id)
          return count || 0
        })
      )
      unreadMessages = counts.reduce((a, b) => a + b, 0)
    }

    setBadges({
      messages: unreadMessages + (unreadDirect || 0),
      notifications: (invites || 0) + (pendingConnections || 0),
      network: pendingConnections || 0,
    })
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[230px] flex-col bg-sidebarBg md:flex">
      <div className="px-5 py-[22px]">
        <Logo dark size="md" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[9px] px-3.5 py-[11px] text-sm transition-colors ${
                isActive ? 'bg-sidebarActive font-semibold text-white' : 'text-sidebarText hover:bg-sidebarHover'
              }`
            }
          >
            <span className="text-[15px] leading-none">{item.icon}</span>
            <span>{item.label}</span>
            {item.badgeKey && badges[item.badgeKey] > 0 && (
              <span className="ml-auto min-w-[18px] rounded-full bg-danger px-[7px] py-px text-center text-[10px] font-bold text-white">
                {badges[item.badgeKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebarHover/60 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] text-white">{profile?.name || 'Student'}</p>
          <p className="truncate text-[11px]" style={{ color: '#95D5B2' }}>Student</p>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const [badges, setBadges] = useState({ messages: 0, notifications: 0, network: 0 })
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('team_invites').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('status', 'pending'),
      supabase.from('connections').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('status', 'pending'),
    ]).then(([{ count: invites }, { count: pendingConnections }]) => {
      setBadges((b) => ({ ...b, notifications: (invites || 0) + (pendingConnections || 0), network: pendingConnections || 0 }))
    })
  }, [user])

  const mobileItems = MOBILE_PATHS.map((path) => NAV_ITEMS.find((item) => item.path === path)).filter(Boolean)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-sidebarBg md:hidden">
      {mobileItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `relative flex-1 py-2.5 text-center text-lg ${isActive ? 'text-white' : 'text-sidebarText'}`}
        >
          {item.icon}
          {item.badgeKey && badges[item.badgeKey] > 0 && (
            <span className="absolute right-3 top-1 h-2 w-2 rounded-full bg-danger" />
          )}
        </NavLink>
      ))}
    </nav>
  )
}
