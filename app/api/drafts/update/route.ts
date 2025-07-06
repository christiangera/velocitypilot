import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GmailService } from "@/lib/gmail-service"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized: No valid session found" }, { status: 401 })
    }

    const { draftId, newContent, originalEmailDetails } = await request.json()
    if (!draftId || !newContent || !originalEmailDetails) {
      return NextResponse.json({ error: "Bad Request: Missing required fields" }, { status: 400 })
    }

    const gmailService = new GmailService(session.user.accessToken)
    await gmailService.updateDraft(draftId, newContent, originalEmailDetails)

    return NextResponse.json({ success: true, message: "Draft updated successfully." })
  } catch (error) {
    console.error("Error updating draft:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to update draft", details: errorMessage }, { status: 500 })
  }
}
