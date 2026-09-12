import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callGemini(prompt: string) {
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  )

  const geminiData = await geminiRes.json()
  if (!geminiRes.ok) {
    console.error('Gemini API error:', geminiData)
    throw new Error(geminiData.error?.message || `Gemini request failed with status ${geminiRes.status}`)
  }
  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const cleaned = rawText.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { mode } = body

    // Risk mode: assess an already-formed team's composition risk.
    if (mode === 'risk') {
      const { project, teamMembers } = body
      const prompt = `You are a team risk assessment AI. Given this project and its current team members, assess risk across four dimensions.

Project: ${JSON.stringify(project)}
Team Members: ${JSON.stringify(teamMembers)}

Return ONLY valid JSON with no markdown, exactly this structure:
{
  "skill_coverage": { "status": "Strong" | "Moderate" | "Weak", "note": "short explanation" },
  "availability_risk": { "status": "Low" | "Moderate" | "High", "note": "short explanation" },
  "role_dependency": { "status": "Low" | "Moderate" | "High", "note": "short explanation" },
  "experience_balance": { "status": "Good" | "Fair" | "Poor", "note": "short explanation" },
  "ai_suggestion": "One paragraph of actionable advice for this team."
}`
      const result = await callGemini(prompt)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Simulate mode: score a hypothetical team composition without persisting anything.
    if (mode === 'simulate') {
      const { matchedStudents, teamSize } = body
      const prompt = `You are a team formation AI. Score this hypothetical team of ${teamSize} students on overall success probability. Consider skill diversity, experience balance, and complementary strengths.

Students with scores: ${JSON.stringify(matchedStudents)}

Return ONLY valid JSON with no markdown:
{
  "team_score": 91,
  "reasoning": "One or two sentences on why this composition scores this way."
}`
      const result = await callGemini(prompt)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default mode: recommend the best team combination from matched students.
    const { projectId, matchedStudents, teamSize } = body

    const prompt = `You are a team formation AI. From these matched students with scores, pick the best combination of ${teamSize} students that gives the highest overall team success probability. Consider skill diversity, experience balance, and complementary strengths.

Students with scores: ${JSON.stringify(matchedStudents)}

Return ONLY valid JSON with no markdown:
{
  "recommended_team": ["student_id_1", "student_id_2"],
  "team_score": 91,
  "reasoning": "This team combines complementary skills...",
  "coaching_notes": "Focus on weekly syncs. The ML engineer should lead technical decisions..."
}`

    const result = await callGemini(prompt)

    // Save coaching notes to the team record if a team already exists for this project.
    if (projectId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabase.from('teams')
        .update({ coaching_notes: result.coaching_notes, overall_match_score: result.team_score })
        .eq('project_id', projectId)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
