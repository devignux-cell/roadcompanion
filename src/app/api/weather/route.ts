import { NextResponse } from "next/server";

export const revalidate = 1800;

interface WeatherResponse {
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

export async function GET(): Promise<NextResponse<WeatherResponse>> {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=27.9506&longitude=-82.4572&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America%2FNew_York";

    const res = await fetch(url, { next: { revalidate: 1800 } });

    if (!res.ok) {
      throw new Error("Open-Meteo fetch failed");
    }

    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m as number);
    const code = data.current.weathercode as number;
    const { condition, emoji } = wmoToCondition(code);

    return NextResponse.json({ temp, condition, emoji });
  } catch {
    return NextResponse.json({ temp: 79, condition: "Sunny", emoji: "☀️" });
  }
}
