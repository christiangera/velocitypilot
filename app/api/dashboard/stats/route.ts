import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { GmailStatsService } from "@/lib/gmail-stats-service"

export const maxDuration = 300

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET(request: Request) {
  try {
    const timestamp = Date.now()
    console.log(`📊 API: Starting FRESH Gmail statistics fetch at ${timestamp}...`)

    const session = await getSession()

    if (!session?.user?.accessToken) {
      console.error("❌ API: No access token found in session")
      return NextResponse.json({ error: "No access token found in session" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY is not set. AI classification for stats may be limited or fail.")
      // You might want to return an error or a default breakdown here if AI is critical
    }

    console.log("🔑 API: Creating Gmail Stats Service with fresh access token and OpenAI key")
    const statsService = new GmailStatsService(session.user.accessToken, process.env.OPENAI_API_KEY || "")

    console.log("📊 API: Fetching REAL-TIME email statistics from Gmail API...")
    const startTime = Date.now()
    const stats = await statsService.getEmailStatistics()
    const endTime = Date.now()

    console.log("✅ API: FRESH Gmail statistics collected successfully:", {
      totalEmails: stats.totalEmails,
      unreadEmails: stats.unreadEmails,
      sentEmails: stats.sentEmails,
      fetchTimeMs: endTime - startTime,
      timestamp: new Date().toISOString(),
      requestTimestamp: timestamp,
    })

    return NextResponse.json(
      {
        stats,
        success: true,
        timestamp: new Date().toISOString(),
        fetchTimeMs: endTime - startTime,
        requestId: timestamp,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
          Pragma: "no-cache",
          Expires: "0",
          "Last-Modified": new Date().toUTCString(),
          ETag: `"${timestamp}"`,
        },
      },
    )
  } catch (error) {
    console.error("💥 API: Error fetching FRESH Gmail statistics:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        error: `Failed to fetch fresh Gmail statistics: ${errorMessage}`,
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
