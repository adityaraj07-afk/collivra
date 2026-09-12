import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Profile from './pages/Profile'
import CreateProject from './pages/CreateProject'
import DiscoverProjects from './pages/DiscoverProjects'
import ProjectDetail from './pages/ProjectDetail'
import TeamFormation from './pages/TeamFormation'
import ProjectWorkspace from './pages/ProjectWorkspace'
import Teammates from './pages/Teammates'
import Dashboard from './pages/Dashboard'
import FindPeople from './pages/FindPeople'
import TeamRecommendation from './pages/TeamRecommendation'
import MyTeams from './pages/MyTeams'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

function Protected({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="skeleton h-8 w-32" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!data) {
          window.location.href = '/profile'
        } else {
          window.location.href = '/dashboard'
        }
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/find-people" element={<Protected><FindPeople /></Protected>} />
      <Route path="/discover" element={<Protected><DiscoverProjects /></Protected>} />
      <Route path="/create-project" element={<Protected><CreateProject /></Protected>} />
      <Route path="/my-teams" element={<Protected><MyTeams /></Protected>} />
      <Route path="/messages" element={<Protected><Messages /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/profile/:id" element={<Protected><Profile /></Protected>} />
      <Route path="/project/:id" element={<Protected><ProjectDetail /></Protected>} />
      <Route path="/team/:projectId/form" element={<Protected><TeamFormation /></Protected>} />
      <Route path="/team/:projectId/recommend" element={<Protected><TeamRecommendation /></Protected>} />
      <Route path="/team/:teamId" element={<Protected><ProjectWorkspace /></Protected>} />
      <Route path="/teammates/:projectId" element={<Protected><Teammates /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
