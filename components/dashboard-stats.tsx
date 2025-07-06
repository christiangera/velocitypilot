"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Send, RefreshCw, Circle, Inbox, Loader2 } from "lucide-react"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

interface DashboardStatsProps {
  isAutomationRunning: boolean
  isAutomationStopping?: boolean
  onToggleAutomation: (checked: boolean) => void
}

export function DashboardStats({
  isAutomationRunning,
  isAutomationStopping = false,
  onToggleAutomation,
}: DashboardStatsProps) {
  const { stats, loading, error, refetch } = useDashboardStats()
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const handleRefresh = async () => {
    setIsManualRefreshing(true)
    try {
      console.log("🔄 Manual FRESH refresh triggered...")
      await refetch()
      setLastRefresh(new Date())
      toast({
        title: "✅ Stats Refreshed",
        description: "Dashboard updated with fresh Gmail data. Changes should be reflected immediately.",
      })
    } catch (error) {
      console.error("❌ Failed to refresh dashboard stats:", error)
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh dashboard statistics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsManualRefreshing(false)
    }
  }

  const isRefreshing = loading || isManualRefreshing

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Email Statistics</h2>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Retry"}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-red-200/60 shadow-sm col-span-full">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">Error loading dashboard statistics: {error}</p>
                <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Retry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const dashboardStats = stats
    ? [
        {
          title: "Total Emails (7 Days)",
          value: stats.totalEmails.toString(),
          change: "Total emails received in your inbox over the past 7 days",
          icon: Inbox,
        },
        {
          title: "Unread Emails (7 Days)",
          value: stats.unreadEmails.toString(),
          change: "Unread emails in your inbox from the past 7 days",
          icon: Mail,
        },
        {
          title: "Emails Sent (7 Days)",
          value: stats.sentEmails.toString(),
          change: "Total emails you have sent in the past 7 days",
          icon: Send,
        },
      ]
    : []

  // Determine automation status display
  const getAutomationStatus = () => {
    if (isAutomationStopping) {
      return {
        text: "Stopping...",
        color: "text-yellow-500",
        description: "Finishing current cycle, then stopping",
      }
    } else if (isAutomationRunning) {
      return {
        text: "Running",
        color: "text-green-500",
        description: "Processing emails continuously",
      }
    } else {
      return {
        text: "Stopped",
        color: "text-red-500",
        description: "Toggle on to start automation",
      }
    }
  }

  const automationStatus = getAutomationStatus()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Real-time Gmail Statistics</h2>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-1">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>
          )}
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Stats"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Email Statistics Cards */}
        {isRefreshing && !stats
          ? // Loading skeleton
            [1, 2, 3].map((i) => (
              <Card key={i} className="border-gray-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          : dashboardStats.map((stat) => (
              <Card key={stat.title} className="border-gray-200/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
                  {isRefreshing && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full bg-purple-600 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

        {/* Automation Control Card */}
        <Card className="border-gray-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Automation Control</CardTitle>
            {isAutomationStopping ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            ) : (
              <Circle className={`h-4 w-4 fill-current ${automationStatus.color}`} />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl font-bold text-gray-900">{automationStatus.text}</div>
              <Switch
                checked={isAutomationRunning}
                onCheckedChange={onToggleAutomation}
                disabled={isAutomationStopping}
                aria-label="Toggle continuous automation"
              />
            </div>
            <p className="text-xs text-gray-600">{automationStatus.description}</p>
            {isRefreshing && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-purple-600 animate-pulse"></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
