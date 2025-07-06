"use client"

import { useState, useEffect } from "react"

export interface Draft {
  id: string
  to: string
  subject: string
  content: string
  created: string
  status: string
  category: string
}

export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    try {
      console.log("🔍 Hook: Starting drafts fetch...")
      setLoading(true)
      setError(null)

      const response = await fetch("/api/drafts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📡 Hook: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("❌ Hook: API error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📦 Hook: Received data:", {
        success: data.success,
        draftCount: data.drafts?.length || 0,
        hasDrafts: !!data.drafts,
      })

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response")
      }

      if (!data.drafts || !Array.isArray(data.drafts)) {
        throw new Error("Invalid draft data received from API")
      }

      console.log(`✅ Hook: Successfully processed ${data.drafts.length} drafts`)
      setDrafts(data.drafts)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch drafts"
      console.error("💥 Hook: Error fetching drafts:", err)
      setError(errorMessage)
      setDrafts([]) // Clear drafts on error
    } finally {
      setLoading(false)
    }
  }

  return { drafts, loading, error, refetch: fetchDrafts }
}
