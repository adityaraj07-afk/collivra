import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useProfile } from '../hooks/useProfile'

export default function Navbar({ breadcrumb }) {
  const { profile } = useProfile()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-border bg-surface px-6 md:ml-[230px]">
      <div className="hidden min-w-0 flex-1 items-center gap-1 text-[13px] text-muted md:flex">
        {breadcrumb || <span>&nbsp;</span>}
      </div>

      <div className="hidden max-w-[440px] flex-1 md:flex">
        <div className="relative w-full">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, projects, skills…"
            className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/notifications" className="relative text-lg text-muted hover:text-text" aria-label="Notifications">
          🔔
        </Link>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 w-48 rounded-lg border border-border bg-surface p-1 shadow-[0_4px_16px_rgba(27,67,50,0.08)]">
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm text-text hover:bg-surface2">Profile</Link>
              <Link to="/discover" onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm text-text hover:bg-surface2">My Projects</Link>
              <button onClick={signOut} className="block w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-surface2">Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
