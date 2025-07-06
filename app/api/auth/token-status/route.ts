import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({
        hasSession: false,
        message: "No session found",
      })
    }

    const now = Date.now()
    const tokenExpiry = session.user?.tokenExpiry || 0
    const timeUntilExpiry = tokenExpiry - now

    return NextResponse.json({
      hasSession: true,
      hasAccessToken: !!session.user?.accessToken,
      hasRefreshToken: !!session.user?.refreshToken,
      tokenExpiry: session.user?.tokenExpiry ? new Date(session.user.tokenExpiry).toISOString() : null,
      timeUntilExpiryMinutes: Math.floor(timeUntilExpiry / (1000 * 60)),
      isTokenExpired: timeUntilExpiry <= 0,
      userEmail: session.user?.email,
    })
  } catch (error) {
    console.error("💥 Error checking token status:", error)
    return NextResponse.json({ error: "Failed to check token status" }, { status: 500 })
  }
}
