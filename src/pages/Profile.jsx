import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import AppShell from '../components/AppShell'

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const SKILL_LEVEL_STYLE = {
  Advanced: 'bg-accent/10 text-accent',
  Intermediate: 'bg-warning/10 text-warning',
  Beginner: 'bg-danger/10 text-danger',
}

function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('')

  function addTag(e) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()])
      setInput('')
    }
  }

  return (
    <div className="rounded-[9px] border border-border bg-bg px-3 py-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-md bg-surface2 px-2.5 py-1 text-xs font-medium text-primary">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-primary/60 hover:text-primary">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={addTag}
          placeholder={placeholder}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-text placeholder:text-muted focus:outline-none"
        />
      </div>
    </div>
  )
}

function SetupForm({ userId, onComplete }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', college: '', year: '', department: '', cgpa: '',
    skills: [], experience: 'Intermediate', previous_projects: [],
    github_url: '', linkedin_url: '', photo_url: '',
  })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = `${userId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      update('photo_url', data.publicUrl)
    }
  }

  async function handleSubmit() {
    setSaving(true)
    const { error } = await supabase.from('student_profiles').upsert({
      id: userId,
      name: form.name,
      college: form.college,
      year: form.year ? Number(form.year) : null,
      department: form.department,
      cgpa: form.cgpa ? Number(form.cgpa) : null,
      skills: form.skills,
      skills_detailed: form.skills.map((name) => ({ name, level: 'Intermediate' })),
      experience: form.experience,
      previous_projects: form.previous_projects,
      github_url: form.github_url,
      linkedin_url: form.linkedin_url,
      photo_url: form.photo_url,
    })
    setSaving(false)
    if (!error) onComplete()
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>
      <p className="mb-6 text-sm font-medium text-muted">Step {step} of 3</p>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text">Personal Info</h2>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          <input value={form.college} onChange={(e) => update('college', e.target.value)} placeholder="College" className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} placeholder="Year (1-5)" className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
            <input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Department" className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          </div>
          <input type="number" step="0.01" value={form.cgpa} onChange={(e) => update('cgpa', e.target.value)} placeholder="CGPA" className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text">Skills & Experience</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Skills</label>
            <TagInput tags={form.skills} onChange={(v) => update('skills', v)} placeholder="e.g. Python, press Enter" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Experience Level</label>
            <select value={form.experience} onChange={(e) => update('experience', e.target.value)} className="w-full rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none">
              {EXPERIENCE_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Previous Projects</label>
            <TagInput tags={form.previous_projects} onChange={(v) => update('previous_projects', v)} placeholder="Project name, press Enter" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text">Links</h2>
          <input value={form.github_url} onChange={(e) => update('github_url', e.target.value)} placeholder="GitHub URL" className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          <input value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="LinkedIn URL" className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Profile Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm text-muted" />
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
          className="rounded-[9px] border border-border px-4 py-2 text-sm font-medium text-text disabled:opacity-30"
        >
          Back
        </button>
        {step < 3 ? (
          <button onClick={() => setStep((s) => s + 1)} className="rounded-[9px] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryHover">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={saving} className="rounded-[9px] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryHover disabled:opacity-50">
            {saving ? 'Saving...' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  )
}

function AddSkillForm({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState('Intermediate')

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), level)
    setName('')
    setOpen(false)
  }

  if (!open) return <button onClick={() => setOpen(true)} className="text-[13px] font-medium text-primary hover:underline">+ Add Skill</button>

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill name" className="rounded-[9px] border border-border bg-bg px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none" />
      <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-[9px] border border-border bg-bg px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none">
        {EXPERIENCE_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
      </select>
      <button type="submit" className="rounded-[9px] bg-primary px-3 py-1.5 text-xs font-semibold text-white">Add</button>
    </form>
  )
}

function ViewProfile({ student, isOwn, onEdit, onUpdate }) {
  const initial = student.name?.charAt(0)?.toUpperCase() || '?'
  const idTag = `CLV-${(student.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`
  const skillsDetailed = student.skills_detailed?.length
    ? student.skills_detailed
    : (student.skills || []).map((name) => ({ name, level: 'Intermediate' }))

  async function addSkill(name, level) {
    const nextDetailed = [...skillsDetailed, { name, level }]
    const nextSkills = [...(student.skills || []), name]
    await supabase.from('student_profiles').update({ skills_detailed: nextDetailed, skills: nextSkills }).eq('id', student.id)
    onUpdate?.()
  }

  async function toggleCollaborate() {
    await supabase.from('student_profiles').update({ open_to_collaborate: !student.open_to_collaborate }).eq('id', student.id)
    onUpdate?.()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[14px] border border-border bg-surface p-6">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} className="h-[88px] w-[88px] rounded-full object-cover" />
            ) : (
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-surface2 text-3xl font-bold text-primary">{initial}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 text-[21px] font-bold text-text">{student.name}</h1>
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">Student</span>
              <span className="text-[11px] text-muted">ID: {idTag}</span>
              {isOwn && (
                <button onClick={onEdit} className="ml-auto rounded-[9px] border border-borderStrong bg-surface px-4 py-1.5 text-xs font-medium text-primary hover:bg-surface2">
                  Edit Profile
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[13px] text-textSecondary">
              {[student.department, student.college, student.year ? `Year ${student.year}` : null].filter(Boolean).join(' · ')}
            </p>
            {student.location && <p className="mt-1 text-[12.5px] text-muted">📍 {student.location}</p>}
            {student.tagline && <p className="mt-1.5 text-[13px] italic text-primaryHover">"{student.tagline}"</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex divide-x divide-border rounded-[14px] border border-border bg-surface">
        <div className="flex-1 px-5 py-4">
          <p className="m-0 text-[11.5px] text-muted">🎓 CGPA</p>
          <p className="m-0 text-[15px] font-semibold text-text">{student.cgpa ? `${student.cgpa} / 10` : '—'}</p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="m-0 text-[11.5px] text-muted">💼 Experience</p>
          <p className="m-0 text-[15px] font-semibold text-text">{student.experience || '—'}</p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="m-0 text-[11.5px] text-muted">⏱ Availability</p>
          <p className="m-0 text-[15px] font-semibold text-text">{student.availability_hours || '—'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 text-sm font-semibold text-text">&lt;/&gt; Skills &amp; Skill Level</h3>
          {isOwn && <AddSkillForm onAdd={addSkill} />}
        </div>
        <div className="flex flex-wrap gap-2">
          {skillsDetailed.map((skill) => (
            <div key={skill.name} className="flex items-center gap-1.5 rounded-full border border-border bg-bg py-1 pl-3 pr-1.5">
              <span className="text-[12.5px] font-medium text-text">{skill.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${SKILL_LEVEL_STYLE[skill.level] || SKILL_LEVEL_STYLE.Intermediate}`}>{skill.level}</span>
            </div>
          ))}
          {skillsDetailed.length === 0 && <p className="text-sm text-muted">No skills added yet.</p>}
        </div>
      </div>

      {student.project_interests?.length > 0 && (
        <div className="mt-4 rounded-[14px] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text">📍 Project Interests</h3>
          <div className="flex flex-wrap gap-2">
            {student.project_interests.map((interest) => (
              <span key={interest} className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-primary">{interest}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[14px] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text">🔗 Links</h3>
          <div className="flex flex-col gap-2">
            {student.github_url && <a href={student.github_url} target="_blank" rel="noreferrer" className="text-[13px] text-primary hover:underline">GitHub: {student.github_url.replace(/^https?:\/\//, '')}</a>}
            {student.linkedin_url && <a href={student.linkedin_url} target="_blank" rel="noreferrer" className="text-[13px] text-primary hover:underline">LinkedIn: {student.linkedin_url.replace(/^https?:\/\//, '')}</a>}
            {!student.github_url && !student.linkedin_url && <p className="text-sm text-muted">No links added.</p>}
          </div>
        </div>
        <div className="rounded-[14px] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text">👥 Collaboration Status</h3>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-textSecondary">Open to collaborate</span>
            {isOwn ? (
              <button onClick={toggleCollaborate} className={`relative h-[23px] w-[42px] rounded-full transition-colors ${student.open_to_collaborate !== false ? 'bg-accent' : 'bg-border'}`}>
                <span className={`absolute top-[2.5px] h-[18px] w-[18px] rounded-full bg-surface transition-all ${student.open_to_collaborate !== false ? 'left-[21px]' : 'left-[2.5px]'}`} />
              </button>
            ) : (
              <span className={`text-xs font-medium ${student.open_to_collaborate !== false ? 'text-accent' : 'text-muted'}`}>
                {student.open_to_collaborate !== false ? 'Yes' : 'No'}
              </span>
            )}
          </div>
        </div>
      </div>

      {student.previous_projects?.length > 0 && (
        <div className="mt-4 rounded-[14px] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text">Previous Projects</h3>
          <div className="flex flex-col gap-2">
            {student.previous_projects.map((proj) => (
              <div key={proj} className="rounded-[9px] border border-border bg-bg px-4 py-3 text-sm text-text">{proj}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const { id } = useParams()
  const { user } = useAuth()
  const { profile: ownProfile, loading: ownLoading, refresh } = useProfile()
  const navigate = useNavigate()
  const [otherProfile, setOtherProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(!!id)

  const isOwn = !id || id === user?.id

  async function loadOther() {
    if (!id) return
    setLoading(true)
    const { data } = await supabase.from('student_profiles').select('*').eq('id', id).maybeSingle()
    setOtherProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!id || isOwn) return
    loadOther()
  }, [id, isOwn])

  if (ownLoading || loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-content px-6 py-12"><div className="skeleton h-20 w-20 rounded-full" /></div>
      </AppShell>
    )
  }

  const showSetup = isOwn && (!ownProfile || editing)
  const profileToShow = isOwn ? ownProfile : otherProfile

  return (
    <AppShell breadcrumb={<span>{isOwn ? 'My Profile' : profileToShow?.name || 'Profile'}</span>}>
      <div className="mx-auto max-w-content px-6 py-7 md:px-9">
        {showSetup ? (
          <SetupForm
            userId={user.id}
            onComplete={async () => {
              await refresh()
              setEditing(false)
              navigate('/discover')
            }}
          />
        ) : profileToShow ? (
          <ViewProfile
            student={profileToShow}
            isOwn={isOwn}
            onEdit={() => setEditing(true)}
            onUpdate={isOwn ? refresh : loadOther}
          />
        ) : (
          <p className="text-muted">Profile not found.</p>
        )}
      </div>
    </AppShell>
  )
}
