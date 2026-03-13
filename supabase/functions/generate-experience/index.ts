import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEM_PROMPT = (cityName: string) => `You are a local expert for ${cityName}. Respond ONLY with a valid JSON object — no prose, no markdown — matching this exact structure:
{
  "title": "short label",
  "city": "${cityName}",
  "items": [{
    "order": 1,
    "type": "place | activity | food | transport",
    "title": "string",
    "description": "string",
    "start_time": "string or null",
    "duration_label": "string or null",
    "map_link": "string or null",
    "booking_link": "string or null"
  }]
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verify user JWT
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  // Check subscription
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single()

  if (sub?.status !== 'active' && sub?.status !== 'trialing') {
    return new Response(JSON.stringify({ error: 'premium_required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { driver_profile_id, prompt } = await req.json()
  if (!driver_profile_id || !prompt) {
    return new Response('Missing driver_profile_id or prompt', { status: 400 })
  }

  // Resolve city from driver profile — never trust city_id from client
  const { data: driverProfile } = await supabaseAdmin
    .from('driver_profiles')
    .select('city_id')
    .eq('id', driver_profile_id)
    .single()

  if (!driverProfile) return new Response('Invalid driver context', { status: 400 })

  const { data: city } = await supabaseAdmin
    .from('cities')
    .select('name')
    .eq('id', (driverProfile as { city_id: string }).city_id)
    .single()

  const cityName = (city as { name: string } | null)?.name ?? 'Tampa'

  // Call Claude
  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT(cityName),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!aiResponse.ok) {
    return new Response('AI service error', { status: 502 })
  }

  const aiData = await aiResponse.json()
  let parsed: object
  try {
    parsed = JSON.parse(aiData.content[0].text)
  } catch {
    return new Response('AI response unparseable', { status: 500 })
  }

  // Store generation
  const { data: generation, error: insertErr } = await supabaseAdmin
    .from('ai_generations')
    .insert({
      user_id: user.id,
      city_id: (driverProfile as { city_id: string }).city_id,
      driver_profile_id,
      prompt,
      response_json: parsed,
      preview_text: (parsed as Record<string, unknown>).title as string | null ?? prompt.slice(0, 80),
    })
    .select()
    .single()

  if (insertErr) return new Response('Failed to store generation', { status: 500 })

  return new Response(JSON.stringify(generation), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
