import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Logo from '../components/Logo'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Go to Supabase Dashboard → Authentication → Providers → Email → turn OFF
  // "Confirm email" toggle → Save. This allows instant signup without email
  // verification during development.

  async function handleSignUp(e) {
    e.preventDefault()
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('Anon key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Session exists = email confirmation is OFF, user is logged in right away
    if (data?.session) {
      navigate('/profile')
      return
    }

    // No session but user created = confirmation is still ON.
    // Try signing in immediately as a fallback.
    if (data?.user) {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInData?.session) {
        navigate('/profile')
        return
      }

      setError('Account created. Please confirm your email, then sign in.')
    }

    setLoading(false)
  }

  async function handleSignIn(e) {
    e.preventDefault()
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('Anon key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.session) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('id', data.session.user.id)
        .maybeSingle()
      navigate(profile ? '/dashboard' : '/profile')
    }
    setLoading(false)
  }

  function handleSubmit(e) {
    return isSignUp ? handleSignUp(e) : handleSignIn(e)
  }

  async function handleGoogleLogin() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/profile',
      },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen">
      <div
        className="hidden w-2/5 flex-col justify-between p-12 md:flex"
        style={{ background: 'linear-gradient(180deg, #DCF0E4 0%, #B7E4C7 100%)' }}
      >
        <div>
          <Logo size="lg" />
        </div>
        <div>
          <p className="mb-4 text-sm text-textSecondary">Build Together. Go Further.</p>
          <h1 className="text-[28px] font-bold leading-[1.35] text-text">
            Great minds
            <br />
            Build brighter
            <br />
            tomorrows.
          </h1>
        </div>
        <p className="text-[13px] italic text-muted">"Better teams build a brighter tomorrow."</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-bg px-4 md:w-3/5">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex justify-center md:hidden">
            <Logo />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-[9px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text hover:border-borderStrong"
          >
            <span className="text-base">G</span> Continue with Google
          </button>

          <button
            onClick={() => setShowEmailForm((v) => !v)}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-[9px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text hover:border-borderStrong"
          >
            ✉️ Continue with Email
          </button>

          {showEmailForm && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[9px] border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
                  placeholder="you@college.edu"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[9px] border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-center text-[13px] text-danger">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="rounded-[9px] bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primaryHover disabled:opacity-50"
              >
                {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>
          )}

          {!showEmailForm && error && <p className="mt-3 text-center text-[13px] text-danger">{error}</p>}

          <p className="mt-6 text-center text-sm text-muted">
            {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
            <button onClick={() => setIsSignUp((v) => !v)} className="font-semibold text-primary hover:underline">
              {isSignUp ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
