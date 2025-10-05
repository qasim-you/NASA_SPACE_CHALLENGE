"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import dynamic from "next/dynamic"

const DynamicMapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const DynamicTileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const DynamicMarker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })

export function ClimaTrackDashboard() {
  const [location, setLocation] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [weatherData, setWeatherData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLatitude, setCurrentLatitude] = useState("30.3753") // Default: Lahore, Pakistan
  const [currentLongitude, setCurrentLongitude] = useState("69.3451") // Default: Lahore, Pakistan

  const handleSearch = async () => {
    if (!location || !dateRange?.from || !dateRange?.to) {
      setError("Please enter a location and select a date range.")
      return
    }

    setLoading(true)
    setError(null)
    setWeatherData(null)

    try {
      console.log("[v0] Attempting to geocode location:", location)
      const geocodeResponse = await fetch(`/api/geocode?location=${encodeURIComponent(location)}`)
      if (!geocodeResponse.ok) {
        throw new Error(`Geocoding failed with status: ${geocodeResponse.status}`)
      }
      const geocodeData = await geocodeResponse.json()
      console.log("[v0] Geocoding response:", geocodeData)

      if (!geocodeData.latitude || !geocodeData.longitude) {
        throw new Error("Could not get coordinates for the entered location.")
      }

      const latitude = geocodeData.latitude
      const longitude = geocodeData.longitude
      setCurrentLatitude(latitude)
      setCurrentLongitude(longitude)

      const formattedStartDate = format(dateRange.from, "yyyyMMdd")
      const formattedEndDate = format(dateRange.to, "yyyyMMdd")

      console.log(
        `[v0] Fetching weather data for Lat: ${latitude}, Lon: ${longitude}, Start: ${formattedStartDate}, End: ${formattedEndDate}`,
      )

      const response = await fetch(
        `/api/nasa-power?latitude=${latitude}&longitude=${longitude}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setWeatherData(data)
      console.log("[v0] Fetched weather data:", data)
    } catch (err: any) {
      console.error("[v0] Error fetching weather data:", err)
      setError(`Failed to fetch weather data: ${err.message}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadJson = () => {
    if (weatherData) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(weatherData, null, 2))
      const downloadAnchorNode = document.createElement("a")
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", "weather_data.json")
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    }
  }

  const handleDownloadCsv = () => {
    if (
      weatherData &&
      weatherData.weatherData &&
      Array.isArray(weatherData.weatherData) &&
      weatherData.weatherData.length > 0
    ) {
      const headers = Object.keys(weatherData.weatherData[0]).join(",")
      const csv = weatherData.weatherData.map((row: any) => Object.values(row).join(",")).join("\n")
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + "\n" + csv)
      const downloadAnchorNode = document.createElement("a")
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", "weather_data.csv")
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    } else if (weatherData && weatherData.weatherData && typeof weatherData.weatherData === "object") {
      const headers = Object.keys(weatherData.weatherData).join(",")
      const csv = Object.values(weatherData.weatherData).join(",")
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + "\n" + csv)
      const downloadAnchorNode = document.createElement("a")
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", "weather_data.csv")
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-balance">
        ClimaTrack – Personalized NASA Weather Insights Dashboard
      </h1>
      <p className="text-center text-lg text-muted-foreground mb-12 text-pretty">
        Explore Earth observation data from NASA to get personalized weather insights for any location and time.
      </p>

      {/* Location Input */}
      <section className="mb-12 p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-2xl font-semibold mb-4">Location Input</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            type="text"
            placeholder="Enter city, country, or coordinates"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search Location"}
          </Button>
        </div>
        <div className="h-64 bg-muted flex items-center justify-center rounded-md text-muted-foreground">
          <DynamicMapContainer
            center={[Number.parseFloat(currentLatitude), Number.parseFloat(currentLongitude)]}
            zoom={6}
            scrollWheelZoom={false}
            className="h-full w-full rounded-md"
          >
            <DynamicTileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DynamicMarker
              position={[Number.parseFloat(currentLatitude), Number.parseFloat(currentLongitude)]}
            ></DynamicMarker>
          </DynamicMapContainer>
        </div>
      </section>

      {/* Time Input */}
      <section className="mb-12 p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-2xl font-semibold mb-4">Time Input</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* Dashboard Widgets */}
      <section className="mb-12 p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-2xl font-semibold mb-4">Dashboard Widgets</h2>
        {error && <p className="text-red-500 mb-4">{"Error: " + error}</p>}
        {loading && <p className="text-muted-foreground mb-4">Fetching weather data...</p>}
       {weatherData && weatherData.weatherData && weatherData.weatherData.length > 0 ? (
  (() => {
    // 🧠 Filter valid data points (NASA sometimes returns -999)
    const validData = weatherData.weatherData.filter(
      (d: any) =>
        d.T2M !== -999 &&
        d.PRECTOT !== null &&
        d.WS10M !== -999
    );

    // 🧠 Safely access first valid entry
    const firstDay = validData[0] || weatherData.weatherData[0];

    return validData.length === 0 ? (
      <div className="text-center text-muted-foreground py-8">
        🚫 No valid weather data found for the selected date or location.
      </div>
    ) : (
      <>
        {/* Data Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {firstDay.T2M !== -999 ? `${firstDay.T2M}°C` : "No Data"}
              </div>
              <p className="text-xs text-muted-foreground">Temperature at 2m (first day)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precipitation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {firstDay.PRECTOT !== null ? `${firstDay.PRECTOT} mm` : "No Data"}
              </div>
              <p className="text-xs text-muted-foreground">Total precipitation (first day)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wind Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {firstDay.WS10M !== -999 ? `${firstDay.WS10M} m/s` : "No Data"}
              </div>
              <p className="text-xs text-muted-foreground">Wind speed at 10m (first day)</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <h3 className="text-xl font-semibold mb-4">Temperature Over Time</h3>
        <div className="h-[300px] w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={validData.map((d: any) => {
                const formattedDate =
                  d.date && d.date.length === 8
                    ? `${d.date.slice(0, 4)}-${d.date.slice(4, 6)}-${d.date.slice(6, 8)}`
                    : d.date;

                return {
                  date: format(new Date(formattedDate), "MMM dd"),
                  temperature: d.T2M !== -999 ? d.T2M : null,
                };
              })}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  })()
) : (
  <div className="text-center text-muted-foreground py-8">
    🔍 Enter a location and select a date range to see results.
  </div>
)}

      </section>

      {/* Download Options */}
      <section className="p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-2xl font-semibold mb-4">Download Options</h2>
        <div className="flex gap-4">
          <Button onClick={handleDownloadJson} disabled={!weatherData || weatherData.weatherData.length === 0}>
            Download JSON
          </Button>
          <Button onClick={handleDownloadCsv} disabled={!weatherData || weatherData.weatherData.length === 0}>
            Download CSV
          </Button>
        </div>
      </section>
    </div>
  )
}
