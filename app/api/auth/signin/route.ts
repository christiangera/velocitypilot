import { NextResponse } from "next/server"

export async function GET() {
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

  googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!)
  googleAuthUrl.searchParams.set("redirect_uri", `${process.env.NEXTAUTH_URL}/api/auth/callback`)
  googleAuthUrl.searchParams.set("response_type", "code")
  googleAuthUrl.searchParams.set(
    "scope",
    "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify",
  )
  googleAuthUrl.searchParams.set("access_type", "offline") // This is crucial for refresh tokens
  googleAuthUrl.searchParams.set("prompt", "consent") // This forces Google to show consent screen and provide refresh token
  googleAuthUrl.searchParams.set("include_granted_scopes", "true") // Include previously granted scopes

  console.log("🔐 Redirecting to Google OAuth with URL:", googleAuthUrl.toString())

  return NextResponse.redirect(googleAuthUrl.toString())
}
