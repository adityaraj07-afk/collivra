import { Link } from 'react-router-dom'

const DOMAIN_COLORS = {
  'AI/ML': 'text-accent bg-primary/10',
  'Web Dev': 'text-accent bg-accent/10',
  'Mobile': 'text-warning bg-warning/10',
  'Data Science': 'text-accent bg-primary/10',
  'Cybersecurity': 'text-danger bg-danger/10',
  'IoT': 'text-accent bg-accent/10',
}

export default function ProjectCard({ project }) {
  const domainClass = DOMAIN_COLORS[project.domain] || 'text-muted bg-border'
  const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No deadline'

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-text">{project.name}</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${domainClass}`}>{project.domain}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(project.skills_required || []).slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>Deadline: {deadline}</span>
        <span>Team of {project.team_size}</span>
      </div>

      <Link
        to={`/project/${project.id}`}
        className="mt-4 rounded-lg border border-border px-3 py-2 text-center text-sm font-medium text-text transition-colors hover:border-primary"
      >
        View Project
      </Link>
    </div>
  )
}
