import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get("location")

  if (!location) {
    return NextResponse.json({ error: "Location parameter is required" }, { status: 400 })
  }

  // For demonstration, we'll return fixed coordinates for a few example cities.
  let latitude = "30.3753" // Default: Lahore, Pakistan
  let longitude = "69.3451" // Default: Lahore, Pakistan

  const lowerCaseLocation = location.toLowerCase()

  if (lowerCaseLocation.includes("london")) {
    latitude = "51.5074"
    longitude = "0.1278"
  } else if (lowerCaseLocation.includes("new york")) {
    latitude = "40.7128"
    longitude = "-74.0060"
  } else if (lowerCaseLocation.includes("paris")) {
    latitude = "48.8566"
    longitude = "2.3522"
  } else if (lowerCaseLocation.includes("tokyo")) {
    latitude = "35.6895"
    longitude = "139.6917"
  } else if (lowerCaseLocation.includes("lahore")) {
    latitude = "31.5497"
    longitude = "74.3436"
  } else if (lowerCaseLocation.includes("karachi")) {
    latitude = "24.8607"
    longitude = "67.0011"
  } else if (lowerCaseLocation.includes("islamabad")) {
    latitude = "33.6844"
    longitude = "73.0479"
  }

  console.log(`[v0] Geocoding for '${location}': Lat ${latitude}, Lon ${longitude}`)

  return NextResponse.json({ latitude, longitude })
}
