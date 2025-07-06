import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { EmailAutomationService } from "@/lib/email-automation"
import { automationStateManager } from "@/lib/automation-state"

export const maxDuration = 300 // 5 minutes

export async function POST() {
  try {
    console.log("🚀 IMMEDIATE automation process starting...")

    const session = await getSession()

    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "No valid session found" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ No OpenAI API key - using fallback responses")
    }

    const automationService = new EmailAutomationService(process.env.OPENAI_API_KEY || "", session.user.accessToken)

    // Register service with state manager
    automationStateManager.setCurrentService(automationService)

    // Process emails immediately
    const { processed, skipped, failed, errors, stopped } = await automationService.processNewEmails()

    const message = `Automation complete. Processed: ${processed}, Skipped (draft exists): ${skipped}, Failed: ${failed}.`

    console.log(`✅ Automation run summary: ${message}`)

    // Clear service from state manager
    automationStateManager.clearService()

    return NextResponse.json({
      success: true,
      message,
      results: { processed, skipped, failed, errors, stopped },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 IMMEDIATE automation error:", error)

    // Clear service on error
    automationStateManager.clearService()

    return NextResponse.json(
      {
        error: `Automation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
