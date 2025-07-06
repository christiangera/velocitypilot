import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🔄 Revoking current session...")

    const cookieStore = await cookies()

    // Delete the session cookie
    cookieStore.delete("session-token")

    console.log("✅ Session revoked successfully")

    return NextResponse.json({ success: true, message: "Session revoked" })
  } catch (error) {
    console.error("💥 Error revoking session:", error)
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 })
  }
}
