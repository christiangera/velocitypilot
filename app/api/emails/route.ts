import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { GmailService } from "@/lib/gmail-service"

export const maxDuration = 300

export async function GET() {
  try {
    console.log("🔍 API: Fetching emails for dashboard...")

    const session = await getSession()

    if (!session?.user?.accessToken) {
      console.error("❌ API: No access token found in session")
      return NextResponse.json({ error: "No access token found in session" }, { status: 401 })
    }

    const gmailService = new GmailService(session.user.accessToken)

    const connectionTest = await gmailService.testConnection()
    if (!connectionTest.success) {
      console.error("❌ API: Gmail connection failed:", connectionTest.error)
      return NextResponse.json({ error: `Gmail connection failed: ${connectionTest.error}` }, { status: 500 })
    }

    console.log("✅ API: Gmail connection successful, fetching recent messages for dashboard...")

    const allMessages = await gmailService.getMessagesByQuery("in:inbox newer_than:30d", 200)
    console.log(`📧 API: Retrieved ${allMessages.length} recent emails for the dashboard`)

    // Classification is removed from here to prevent rate-limiting and performance issues.
    // It will be handled exclusively by the automation process.

    return NextResponse.json({
      emails: allMessages,
      count: allMessages.length,
      success: true,
    })
  } catch (error) {
    console.error("💥 API: Error in email fetch:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        error: `Failed to fetch emails: ${errorMessage}`,
        success: false,
      },
      { status: 500 },
    )
  }
}
