import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    console.log("🔍 API: Starting sent emails fetch request...")

    const session = await getSession()

    if (!session) {
      console.error("❌ API: No session found")
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    if (!session.user?.accessToken) {
      console.error("❌ API: No access token found in session")
      return NextResponse.json({ error: "No access token found in session" }, { status: 401 })
    }

    // Fetch sent emails from Gmail
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=" +
        encodeURIComponent("in:sent newer_than:30d"),
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ API: Gmail sent emails fetch failed:", errorText)
      return NextResponse.json({ error: `Gmail API error: ${response.status} - ${errorText}` }, { status: 500 })
    }

    const sentData = await response.json()
    console.log(`📧 API: Retrieved ${sentData.messages?.length || 0} sent messages`)

    if (!sentData.messages || sentData.messages.length === 0) {
      return NextResponse.json({
        sentEmails: [],
        count: 0,
        success: true,
      })
    }

    // Fetch details for each sent message (limit to first 50)
    const sentDetails = await Promise.all(
      sentData.messages.slice(0, 50).map(async (message: { id: string }) => {
        try {
          const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
              "Content-Type": "application/json",
            },
          })

          if (!messageResponse.ok) {
            console.error(`❌ Failed to fetch sent message ${message.id}:`, messageResponse.status)
            return null
          }

          const messageData = await messageResponse.json()

          // Extract headers
          const headers = messageData.payload?.headers || []
          const to = headers.find((h: any) => h.name.toLowerCase() === "to")?.value || "Unknown"
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject"

          return {
            id: message.id,
            to,
            subject,
            sentDate: new Date(Number.parseInt(messageData.internalDate)).toISOString(),
            originalThreadId: messageData.threadId,
          }
        } catch (error) {
          console.error(`💥 Error fetching sent message ${message.id}:`, error)
          return null
        }
      }),
    )

    const validSentEmails = sentDetails.filter((email) => email !== null)
    console.log(`✅ API: Successfully processed ${validSentEmails.length} sent emails`)

    return NextResponse.json({
      sentEmails: validSentEmails,
      count: validSentEmails.length,
      success: true,
    })
  } catch (error) {
    console.error("💥 API: Error in sent emails fetch:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        error: `Failed to fetch sent emails: ${errorMessage}`,
        success: false,
      },
      { status: 500 },
    )
  }
}
