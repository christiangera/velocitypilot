"use client"

import { useState, useEffect } from "react"

export interface SentEmail {
  id: string
  to: string
  subject: string
  sentDate: Date
  originalThreadId: string
}

export function useSentEmails() {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSentEmails()
  }, [])

  const fetchSentEmails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/emails/sent", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response")
      }

      // Convert date strings back to Date objects
      const emailsWithDates = (data.sentEmails || []).map((email: any) => ({
        ...email,
        sentDate: new Date(email.sentDate),
      }))

      setSentEmails(emailsWithDates)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch sent emails"
      console.error("Error fetching sent emails:", err)
      setError(errorMessage)
      setSentEmails([])
    } finally {
      setLoading(false)
    }
  }

  return { sentEmails, loading, error, refetch: fetchSentEmails }
}
