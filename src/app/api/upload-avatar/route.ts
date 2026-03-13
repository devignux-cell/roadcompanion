import { createClient, createAdmin } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null

  if (!file || !userId || userId !== user.id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const path = `${userId}/avatar.${safeExt}`

  const admin = createAdmin()
  const { error } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}` })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  return NextResponse.json({ publicUrl })
}
