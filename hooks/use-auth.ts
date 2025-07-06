"use client"

import { useState, useEffect } from "react"
import type { AuthSession } from "@/lib/auth"

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      console.log("🔍 Fetching session...")
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      console.log("📦 Session data received:", data)
      console.log("📦 Full session object:", JSON.stringify(data.session, null, 2))
      setSession(data.session)
    } catch (error) {
      console.error("❌ Failed to fetch session:", error)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = () => {
    console.log("🔐 Attempting to sign in...")
    window.location.href = "/api/auth/signin"
  }

  const signOut = async () => {
    try {
      console.log("🚪 Signing out...")
      await fetch("/api/auth/signout", { method: "POST" })
      setSession(null)
      window.location.href = "/login"
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  console.log("🔒 Auth state:", { session: !!session, loading, sessionData: session })

  return {
    session,
    loading,
    signIn,
    signOut,
  }
}
