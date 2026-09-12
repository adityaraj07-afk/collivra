import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { projectId, name, description, domain, skillsRequired, experienceRequired } = await req.json()

    const prompt = `You are an AI project advisor for student teams. Given this project:
Name: ${name}
Description: ${description}
Domain: ${domain}
Skills Required: ${skillsRequired?.join(', ')}
Experience Level: ${experienceRequired}

Return ONLY a valid JSON object with no markdown, no explanation, exactly this structure:
{
  "identified_roles": ["Role 1", "Role 2", "Role 3"],
  "skill_gaps": ["Skill gap 1", "Skill gap 2"],
  "sustainability_notes": "One paragraph about environmental or social sustainability considerations for this project."
}`

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
    const parsed = JSON.parse(cleaned)

    // Save to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('ai_analysis').upsert({
      project_id: projectId,
      identified_roles: parsed.identified_roles,
      skill_gaps: parsed.skill_gaps,
      sustainability_notes: parsed.sustainability_notes,
      raw_response: rawText
    })

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
