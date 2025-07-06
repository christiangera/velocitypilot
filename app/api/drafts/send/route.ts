import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GmailService } from "@/lib/gmail-service"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized: No valid session found" }, { status: 401 })
    }

    const { draftId } = await request.json()
    if (!draftId) {
      return NextResponse.json({ error: "Bad Request: Draft ID is missing" }, { status: 400 })
    }

    const gmailService = new GmailService(session.user.accessToken)
    await gmailService.sendDraft(draftId)

    return NextResponse.json({ success: true, message: "Draft sent successfully." })
  } catch (error) {
    console.error("Error sending draft:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to send draft", details: errorMessage }, { status: 500 })
  }
}
