import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { projectId, skillsRequired, experienceRequired, domain } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch all student profiles
    const { data: students } = await supabase
      .from('student_profiles')
      .select('id, name, skills, experience, cgpa, department, college')

    if (!students || students.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const prompt = `You are a team-matching AI. Given a project requiring these skills: ${skillsRequired?.join(', ')} in domain ${domain} at experience level ${experienceRequired}, score each of the following students from 0 to 100 based on their fit.

Students: ${JSON.stringify(students)}

Return ONLY a valid JSON array with no markdown:
[
  {
    "student_id": "uuid-here",
    "score_percent": 87,
    "skill_overlap": ["Python", "ML"],
    "notes": "Strong match due to relevant ML experience."
  }
]`

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
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const scores = JSON.parse(cleaned)

    // Save match scores to Supabase
    for (const score of scores) {
      await supabase.from('match_scores').upsert({
        student_id: score.student_id,
        project_id: projectId,
        score_percent: score.score_percent,
        skill_overlap: score.skill_overlap,
        notes: score.notes
      })
    }

    return new Response(JSON.stringify(scores), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
