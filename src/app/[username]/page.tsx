import { notFound } from "next/navigation";
import HomeClient from "@/app/HomeClient";
import { getAccountByUsername } from "@/lib/data/account";

interface WeatherData {
  temp: number;
  condition: string;
  emoji: string;
}

function wmoToCondition(code: number): { condition: string; emoji: string } {
  if (code === 0) return { condition: "Clear", emoji: "☀️" };
  if (code <= 3) return { condition: "Partly cloudy", emoji: "⛅" };
  if (code <= 48) return { condition: "Foggy", emoji: "🌫️" };
  if (code <= 57) return { condition: "Drizzle", emoji: "🌦️" };
  if (code <= 67) return { condition: "Rain", emoji: "🌧️" };
  if (code <= 77) return { condition: "Snow", emoji: "❄️" };
  if (code <= 82) return { condition: "Showers", emoji: "🌦️" };
  if (code <= 99) return { condition: "Thunderstorm", emoji: "⛈️" };
  return { condition: "Cloudy", emoji: "☁️" };
}

async function getWeather(): Promise<WeatherData> {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=27.9506&longitude=-82.4572&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America%2FNew_York";
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m as number);
    const code = data.current.weathercode as number;
    const { condition, emoji } = wmoToCondition(code);
    return { temp, condition, emoji };
  } catch {
    return { temp: 79, condition: "Sunny", emoji: "☀️" };
  }
}

export default async function UserHomePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const account = getAccountByUsername(username);
  if (!account) notFound();

  const weather = await getWeather();
  return <HomeClient weather={weather} username={username} />;
}
