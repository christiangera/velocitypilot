import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    console.log("🔍 API: Starting drafts fetch request...")

    const session = await getSession()

    console.log("🔐 API: Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.user?.accessToken,
      userEmail: session?.user?.email,
    })

    if (!session) {
      console.error("❌ API: No session found")
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    if (!session.user?.accessToken) {
      console.error("❌ API: No access token found in session")
      return NextResponse.json({ error: "No access token found in session" }, { status: 401 })
    }

    console.log("🔑 API: Using access token:", session.user.accessToken.substring(0, 20) + "...")

    // Fetch drafts from Gmail
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=50", {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ API: Gmail drafts fetch failed:", errorText)
      return NextResponse.json({ error: `Gmail API error: ${response.status} - ${errorText}` }, { status: 500 })
    }

    const draftsData = await response.json()
    console.log(`📧 API: Retrieved ${draftsData.drafts?.length || 0} drafts`)

    if (!draftsData.drafts || draftsData.drafts.length === 0) {
      return NextResponse.json({
        drafts: [],
        count: 0,
        success: true,
      })
    }

    // Fetch details for each draft (limit to first 50)
    const draftDetails = await Promise.all(
      draftsData.drafts.slice(0, 50).map(async (draft: { id: string }) => {
        try {
          const draftResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draft.id}`, {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
              "Content-Type": "application/json",
            },
          })

          if (!draftResponse.ok) {
            console.error(`❌ Failed to fetch draft ${draft.id}:`, draftResponse.status)
            return null
          }

          const draftData = await draftResponse.json()

          // Extract headers and content
          const headers = draftData.message?.payload?.headers || []
          const to = headers.find((h: any) => h.name.toLowerCase() === "to")?.value || "Unknown"
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject"

          // Extract body content
          let content = ""
          if (draftData.message?.payload?.body?.data) {
            content = Buffer.from(
              draftData.message.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"),
              "base64",
            ).toString("utf-8")
          } else if (draftData.message?.payload?.parts) {
            const textPart = draftData.message.payload.parts.find((part: any) => part.mimeType === "text/plain")
            if (textPart?.body?.data) {
              content = Buffer.from(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
                "utf-8",
              )
            }
          }

          return {
            id: draft.id,
            to,
            subject,
            content: content.substring(0, 300), // Limit content length
            created: new Date().toISOString(), // Gmail doesn't provide creation time for drafts
            status: "Ready to Send",
            category: "General Inquiry", // Default category
          }
        } catch (error) {
          console.error(`💥 Error fetching draft ${draft.id}:`, error)
          return null
        }
      }),
    )

    const validDrafts = draftDetails.filter((draft) => draft !== null)
    console.log(`✅ API: Successfully processed ${validDrafts.length} drafts`)

    return NextResponse.json({
      drafts: validDrafts,
      count: validDrafts.length,
      success: true,
    })
  } catch (error) {
    console.error("💥 API: Error in drafts fetch:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorDetails = error instanceof Error ? error.stack : "No stack trace available"

    console.error("💥 API: Error details:", {
      message: errorMessage,
      stack: errorDetails,
    })

    return NextResponse.json(
      {
        error: `Failed to fetch drafts: ${errorMessage}`,
        details: errorDetails,
        success: false,
      },
      { status: 500 },
    )
  }
}
