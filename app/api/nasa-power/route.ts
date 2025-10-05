import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get("latitude")
    const longitude = searchParams.get("longitude")
    const date = searchParams.get("date") // single day YYYYMMDD
    const startDate = searchParams.get("startDate") // range start
    const endDate = searchParams.get("endDate") // range end

    // 🧩 Validate input
    if (!latitude || !longitude || (!date && (!startDate || !endDate))) {
      return NextResponse.json(
        { error: "Missing latitude, longitude, or date/date range parameters" },
        { status: 400 }
      )
    }

    // 🎯 Determine start and end
    let startParam = date || startDate
    let endParam = date || endDate

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "Invalid date parameters. Provide either 'date' or 'startDate' and 'endDate'." },
        { status: 400 }
      )
    }

    // 🌍 NASA POWER API URL
    const nasaApiUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOT,WS10M&community=RE&longitude=${longitude}&latitude=${latitude}&start=${startParam}&end=${endParam}&format=JSON`

    console.log("[v0] Fetching NASA data from:", nasaApiUrl)

    const response = await fetch(nasaApiUrl)

    // ❌ Check if NASA API request failed
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] NASA API error response:", errorText)
      return NextResponse.json(
        { error: `NASA API failed with status ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    // 🧠 Validate data structure
    if (
      !data.properties ||
      !data.properties.parameter ||
      !data.properties.parameter.T2M
    ) {
      console.error("[v0] Unexpected NASA API data format:", data)
      return NextResponse.json(
        { error: "Unexpected NASA API response format", rawData: data },
        { status: 502 }
      )
    }

    // 📅 Extract daily weather data
    const dailyData: any[] = []
    const dates = Object.keys(data.properties.parameter.T2M)

    for (const d of dates) {
      dailyData.push({
        date: d,
        T2M: data.properties.parameter.T2M[d],
        PRECTOT: data.properties.parameter.PRECTOT?.[d] ?? null,
        WS10M: data.properties.parameter.WS10M?.[d] ?? null,
      })
    }

    // ✅ Return clean JSON response
    return NextResponse.json({
      location: { latitude, longitude },
      dateRange: { start: startParam, end: endParam },
      weatherData: dailyData,
      message: "Data fetched successfully from NASA POWER API",
    })
  } catch (err: any) {
    console.error("[v0] Error fetching data from NASA POWER API:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch data from NASA POWER API" },
      { status: 500 }
    )
  }
}
