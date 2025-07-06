import { AnalyticsCharts } from "@/components/analytics-charts"
import { AnalyticsStats } from "@/components/analytics-stats"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Detailed insights into your email automation performance</p>
      </div>

      <AnalyticsStats />
      <AnalyticsCharts />
    </div>
  )
}
