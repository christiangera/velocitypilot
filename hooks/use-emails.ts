"use client"

import { useState, useEffect } from "react"
import type { EmailClassification } from "@/lib/email-automation-service"

export interface Email {
  id: string
  from: string
  to: string
  subject: string
  snippet: string
  body: string
  date: Date
  isRead: boolean
  threadId: string
  classification?: EmailClassification
}

export function useEmails() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      console.log("🔍 Hook: Starting email fetch...")
      setLoading(true)
      setError(null)

      const response = await fetch("/api/emails", {
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
        emailCount: data.emails?.length || 0,
        hasEmails: !!data.emails,
        categoryBreakdown: data.categoryBreakdown,
      })

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response")
      }

      if (!data.emails || !Array.isArray(data.emails)) {
        throw new Error("Invalid email data received from API")
      }

      // Convert date strings back to Date objects and ensure classifications exist
      const emailsWithDates = data.emails.map((email: any) => ({
        ...email,
        date: new Date(email.date),
        classification: email.classification || { category: "GENERAL_INQUIRY", confidence: 50 },
      }))

      console.log(`✅ Hook: Successfully processed ${emailsWithDates.length} emails`)

      // Log classification breakdown for debugging
      const classificationCounts: { [key: string]: number } = {}
      emailsWithDates.forEach((email: Email) => {
        const category = email.classification?.category || "UNKNOWN"
        classificationCounts[category] = (classificationCounts[category] || 0) + 1
      })
      console.log("📊 Hook: Classification breakdown:", classificationCounts)

      setEmails(emailsWithDates)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch emails"
      console.error("💥 Hook: Error fetching emails:", err)
      setError(errorMessage)
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  return { emails, loading, error, refetch: fetchEmails }
}
