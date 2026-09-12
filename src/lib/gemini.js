import { supabase } from './supabaseClient'

export async function analyzeProject(projectData) {
  const { data, error } = await supabase.functions.invoke('analyze-project', {
    body: projectData
  })
  if (error) throw error
  return data
}

export async function matchStudents(matchData) {
  const { data, error } = await supabase.functions.invoke('match-students', {
    body: matchData
  })
  if (error) throw error
  return data
}

export async function suggestTeam(teamData) {
  const { data, error } = await supabase.functions.invoke('suggest-team', {
    body: teamData
  })
  if (error) throw error
  return data
}
