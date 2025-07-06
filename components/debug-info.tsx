"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function DebugInfo() {
  const { session } = useAuth()
  const [testResult, setTestResult] = useState<string | null>(null)
  const [tokenStatus, setTokenStatus] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    checkTokenStatus()
  }, [session])

  const checkTokenStatus = async () => {
    try {
      const response = await fetch("/api/auth/token-status")
      const data = await response.json()
      setTokenStatus(data)
    } catch (error) {
      console.error("Failed to check token status:", error)
    }
  }

  const testGmailConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/emails")
      const data = await response.json()

      if (response.ok) {
        setTestResult(`✅ Success: Found ${data.emails?.length || 0} emails`)
      } else {
        setTestResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setTestResult(`💥 Failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setTesting(false)
    }
  }

  const forceReauth = async () => {
    try {
      // Revoke current session
      await fetch("/api/auth/revoke", { method: "POST" })

      // Redirect to fresh login
      window.location.href = "/api/auth/signin"
    } catch (error) {
      console.error("Failed to revoke session:", error)
      // Fallback: clear cookie manually
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      window.location.href = "/api/auth/signin"
    }
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm">Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Session:</strong> {session ? "✅ Valid" : "❌ Missing"}
        </div>
        <div>
          <strong>User:</strong> {session?.user?.email || "Not found"}
        </div>
        <div>
          <strong>Access Token:</strong>{" "}
          {session?.user?.accessToken ? `✅ Present (${session.user.accessToken.substring(0, 20)}...)` : "❌ Missing"}
        </div>
        <div>
          <strong>Refresh Token:</strong>{" "}
          {session?.user?.refreshToken ? `✅ Present (${session.user.refreshToken.substring(0, 20)}...)` : "❌ Missing"}
        </div>

        {tokenStatus && (
          <>
            <div>
              <strong>Token Expiry:</strong> {tokenStatus.tokenExpiry || "Unknown"}
            </div>
            <div>
              <strong>Time Until Expiry:</strong> {tokenStatus.timeUntilExpiryMinutes} minutes
            </div>
            <div>
              <strong>Token Expired:</strong> {tokenStatus.isTokenExpired ? "❌ Yes" : "✅ No"}
            </div>
          </>
        )}

        <div>
          <strong>Session Expires:</strong> {session?.expires || "Unknown"}
        </div>

        <div className="pt-2 space-x-2 space-y-2">
          <Button onClick={testGmailConnection} disabled={testing} size="sm" variant="outline">
            {testing ? "Testing..." : "Test Gmail Connection"}
          </Button>
          <Button onClick={forceReauth} size="sm" variant="destructive">
            Fresh Login (Get Refresh Token)
          </Button>
          <Button onClick={checkTokenStatus} size="sm" variant="outline">
            Refresh Token Status
          </Button>
        </div>

        {testResult && (
          <div className="mt-2 p-2 bg-white rounded border">
            <strong>Test Result:</strong> {testResult}
          </div>
        )}

        {!session?.user?.refreshToken && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <strong>⚠️ No Refresh Token:</strong> Click "Fresh Login" to get a refresh token for automatic token renewal.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
