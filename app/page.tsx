import { ClimaTrackDashboard } from "@/components/climatrack-dashboard"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12">
      <ClimaTrackDashboard />
    </main>
  )
}
