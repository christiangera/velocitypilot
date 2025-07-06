import { NextResponse } from "next/server"
import { automationStateManager } from "@/lib/automation-state"

export async function POST() {
  try {
    console.log("🛑 Stop request received for automation service")

    if (automationStateManager.hasActiveService()) {
      automationStateManager.requestStop()
      console.log("✅ Stop signal sent to automation service")

      return NextResponse.json({
        success: true,
        message: "Stop signal sent to automation service",
        timestamp: new Date().toISOString(),
      })
    } else {
      console.log("⚠️ No active automation service to stop")

      return NextResponse.json({
        success: false,
        message: "No active automation service found",
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("💥 Error sending stop signal:", error)

    return NextResponse.json(
      {
        error: `Failed to send stop signal: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
