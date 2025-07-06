"use client"

import { DashboardStats } from "@/components/dashboard-stats"
import { CategoryChart } from "@/components/category-chart"
import { RecentActivity } from "@/components/recent-activity"
import { EmailOverviewChart } from "@/components/email-overview-chart"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { useAutomation } from "@/hooks/use-automation"
import { toast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats()

  // The automation hook now includes isStopping state
  const {
    isRunning: isAutomationRunning,
    isStopping: isAutomationStopping,
    start: startAutomation,
    stop: stopAutomation,
  } = useAutomation(refetchStats)

  const handleToggleAutomation = (checked: boolean) => {
    if (checked) {
      startAutomation()
      toast({
        title: "🚀 Automation Started",
        description: "Processing emails continuously every 45 seconds.",
      })
    } else {
      stopAutomation()
      // Toast is now handled inside the stop function
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your email automation performance</p>
      </div>

      {/* Pass the stopping state to the dashboard stats */}
      <DashboardStats
        isAutomationRunning={isAutomationRunning}
        isAutomationStopping={isAutomationStopping}
        onToggleAutomation={handleToggleAutomation}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EmailOverviewChart />
        </div>
        <div>
          <CategoryChart stats={stats} loading={statsLoading} error={statsError} />
        </div>
      </div>

      {/* Recent Activity - full width */}
      <div className="w-full">
        <RecentActivity />
      </div>
    </div>
  )
}
