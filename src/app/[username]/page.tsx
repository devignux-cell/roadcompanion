import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/app/HomeClient'
import type { DriverProfile } from '@/lib/supabase/types'

interface WeatherData {
  temp: number
  condition: string
  emoji: string
}

export interface DriverData {
  displayName: string
  bio: string | null
  avatarUrl: string | null
  tipCashapp: string | null
  tipVenmo: string | null
  tipPaypal: string | null
}

function wmoToCondition(code: number): { condition: string; emoji: string } {
  if (code === 0) return { condition: 'Clear', emoji: '☀️' }
  if (code <= 3) return { condition: 'Partly cloudy', emoji: '⛅' }
  if (code <= 48) return { condition: 'Foggy', emoji: '🌫️' }
  if (code <= 57) return { condition: 'Drizzle', emoji: '🌦️' }
  if (code <= 67) return { condition: 'Rain', emoji: '🌧️' }
  if (code <= 77) return { condition: 'Snow', emoji: '❄️' }
  if (code <= 82) return { condition: 'Showers', emoji: '🌦️' }
  if (code <= 99) return { condition: 'Thunderstorm', emoji: '⛈️' }
  return { condition: 'Cloudy', emoji: '☁️' }
}

async function getWeather(): Promise<WeatherData> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=27.9506&longitude=-82.4572&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America%2FNew_York',
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    const temp = Math.round(data.current.temperature_2m as number)
    const { condition, emoji } = wmoToCondition(data.current.weathercode as number)
    return { temp, condition, emoji }
  } catch {
    return { temp: 79, condition: 'Sunny', emoji: '☀️' }
  }
}

async function getDriver(username: string): Promise<DriverData | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('driver_profiles')
    .select('display_name, bio, avatar_url, tip_cashapp, tip_venmo, tip_paypal')
    .eq('public_url_slug', username)
    .eq('is_published', true)
    .single<Pick<DriverProfile, 'display_name' | 'bio' | 'avatar_url' | 'tip_cashapp' | 'tip_venmo' | 'tip_paypal'>>()

  if (!data) return null

  return {
    displayName: data.display_name ?? username,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    tipCashapp: data.tip_cashapp,
    tipVenmo: data.tip_venmo,
    tipPaypal: data.tip_paypal,
  }
}

export default async function UserHomePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const [driver, weather] = await Promise.all([getDriver(username), getWeather()])

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !driver) notFound()

  return (
    <HomeClient
      weather={weather}
      username={username}
      driverData={driver}
    />
  )
}
