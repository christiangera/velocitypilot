import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { EmailAutomationService, type EmailData } from "@/lib/email-automation"
import { GmailService } from "@/lib/gmail-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized: No valid session found" }, { status: 401 })
    }

    const { email }: { email: EmailData } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Bad Request: Email data is missing" }, { status: 400 })
    }

    const automationService = new EmailAutomationService(process.env.OPENAI_API_KEY || "")
    const gmailService = new GmailService(session.user.accessToken)

    // 1. Classify the email
    const classification = await automationService.classifyEmail(email)

    // 2. Generate the draft response
    const draftResponse = await automationService.generateDraftResponse(email, classification)

    // 3. Create the draft in Gmail
    const draftId = await gmailService.createDraft(email, draftResponse.content)

    // 4. Mark the original email as read
    await gmailService.markAsRead(email.id)

    // In a real implementation, you would also save the draft/classification to your database here.

    return NextResponse.json({
      success: true,
      message: "Email processed and draft created successfully.",
      classification,
      draftResponse,
      draftId,
    })
  } catch (error) {
    console.error("Email classification and drafting error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to process email", details: errorMessage }, { status: 500 })
  }
}
