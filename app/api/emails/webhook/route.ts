import { type NextRequest, NextResponse } from "next/server"
import { EmailAutomationService } from "@/lib/email-automation"

// Gmail webhook endpoint for new email notifications
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Decode the Gmail push notification
    const emailData = JSON.parse(Buffer.from(message.data, "base64").toString())

    const automationService = new EmailAutomationService(
      process.env.OPENAI_API_KEY || "",
      process.env.GMAIL_API_KEY || "",
    )

    // Process the email through the automation pipeline
    const classification = await automationService.classifyEmail(emailData)
    const draftResponse = await automationService.generateDraftResponse(emailData, classification)

    if (classification.category !== "UNRELATED") {
      await automationService.createGmailDraft(emailData, draftResponse)
    }

    await automationService.markEmailAsRead(emailData.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
