import { NextResponse } from "next/server";

// Helper to check if NASA data is valid
function isValidData(data: any) {
  if (!data?.properties?.parameter) return false;
  const params = data.properties.parameter.T2M || {};
  const values = Object.values(params);
  return values.some((v) => v !== -999 && v !== null);
}

// Fetch function from NASA POWER API
async function fetchNasaData(lat: string, lon: string, start: string, end: string) {
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOT,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NASA API Error: ${response.status}`);
  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const latitude = searchParams.get("latitude") || "30.3753"; // Pakistan default
  const longitude = searchParams.get("longitude") || "69.3451";
  const date = searchParams.get("date");

  // If no date given, use today’s date in YYYYMMDD
  const today = new Date();
  const formattedDate = date || today.toISOString().slice(0, 10).replace(/-/g, "");

  let currentDate = formattedDate;
  let data: any = null;
  let valid = false;
  let attempts = 0;

  // Try up to 3 previous days if no valid data found
  while (attempts < 3 && !valid) {
    data = await fetchNasaData(latitude, longitude, currentDate, currentDate);
    valid = isValidData(data);

    if (!valid) {
      const d = new Date(
        `${currentDate.slice(0, 4)}-${currentDate.slice(4, 6)}-${currentDate.slice(6, 8)}`
      );
      d.setDate(d.getDate() - 1);
      currentDate = d.toISOString().slice(0, 10).replace(/-/g, "");
      attempts++;
    }
  }

  if (!isValidData(data)) {
    return NextResponse.json({
      error: "❌ No valid data found for this location or nearby days.",
    });
  }

  // Extract data
  const params = data.properties.parameter;
  const T2M = params.T2M || {};
  const PRECTOT = params.PRECTOT || {};
  const WS10M = params.WS10M || {};

  const result = Object.keys(T2M).map((d) => ({
    date: d,
    temperature: T2M[d],
    precipitation: PRECTOT[d],
    windSpeed: WS10M[d],
  }));

  return NextResponse.json({
    location: { latitude, longitude },
    usedDate: currentDate,
    weatherData: result,
    message:
      attempts > 0
        ? `✅ Fetched NASA POWER data from nearest valid day (${currentDate}).`
        : "✅ Live data fetched successfully from NASA POWER API.",
  });
}
