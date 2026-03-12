import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 404 });
  }

  const driverPass = process.env.DRIVER_PASSWORD;
  return NextResponse.json({
    DRIVER_PASSWORD: {
      set: !!driverPass,
      length: driverPass?.length ?? 0,
      trimmedLength: driverPass?.trim().length ?? 0,
    },
  });
}
