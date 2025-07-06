import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 })
    }

    console.log("🔍 Testing Gmail API directly...")
    console.log("🔑 Using token:", session.user.accessToken.substring(0, 20) + "...")

    // Test Gmail API profile endpoint
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Gmail API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Gmail API error:", errorText)
      return NextResponse.json(
        {
          error: "Gmail API failed",
          status: response.status,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const profile = await response.json()
    console.log("✅ Gmail API success:", profile)

    return NextResponse.json({
      success: true,
      profile,
      message: "Gmail API connection successful",
    })
  } catch (error) {
    console.error("💥 Error testing Gmail API:", error)
    return NextResponse.json(
      {
        error: "Failed to test Gmail API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
