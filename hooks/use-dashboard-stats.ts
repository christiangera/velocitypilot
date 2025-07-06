"use client"

import { useState, useEffect, useCallback } from "react"

export interface DashboardStats {
  totalEmails: number
  unreadEmails: number
  sentEmails: number
  last7Days: {
    received: number
    sent: number
  }
  last30Days: {
    received: number
    sent: number
  }
  categoryBreakdown: {
    [category: string]: number
  }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const timestamp = Date.now()
      console.log(`📊 Hook: Fetching FRESH dashboard statistics at ${timestamp}...`)
      setLoading(true)
      setError(null)

      // Force fresh request with timestamp
      const url = new URL("/api/dashboard/stats", window.location.origin)
      url.searchParams.set("_", timestamp.toString())
      url.searchParams.set("fresh", "true")

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        cache: "no-store", // Force no caching
      })

      console.log("📡 Hook: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("❌ Hook: API error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📦 Hook: Received FRESH stats data:", {
        success: data.success,
        hasStats: !!data.stats,
        timestamp: data.timestamp,
        requestId: data.requestId,
        fetchTimeMs: data.fetchTimeMs,
      })

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response")
      }

      if (!data.stats) {
        throw new Error("Invalid stats data received from API")
      }

      console.log(`✅ Hook: Successfully processed FRESH dashboard stats:`, {
        totalEmails: data.stats.totalEmails,
        unreadEmails: data.stats.unreadEmails,
        sentEmails: data.stats.sentEmails,
        requestId: data.requestId,
      })

      setStats(data.stats)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch dashboard statistics"
      console.error("💥 Hook: Error fetching dashboard stats:", err)
      setError(errorMessage)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
