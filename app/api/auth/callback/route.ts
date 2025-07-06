import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, getUserInfo, createSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=no_code`)
  }

  try {
    console.log("🔄 Processing OAuth callback...")

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)
    console.log("🔑 Received tokens:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    })

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token)
    console.log("👤 Retrieved user info:", userInfo.email)

    // Create user object with refresh token and expiry
    const user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token, // Store refresh token
      tokenExpiry: Date.now() + tokens.expires_in * 1000, // Store expiry time
    }

    // Create session
    const sessionToken = await createSession(user)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("✅ Session created successfully")
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/`)
  } catch (error) {
    console.error("💥 Auth callback error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=callback_error`)
  }
}
