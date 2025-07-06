import { cookies } from "next/headers"

export interface User {
  id: string
  email: string
  name: string
  picture: string
  accessToken: string
  refreshToken?: string
  tokenExpiry?: number
}

export interface AuthSession {
  user: User
  expires: string
}

// Simple JWT-like token encoding/decoding (for demo purposes)
export function encodeToken(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString("base64")
}

export function decodeToken(token: string): any {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString())
  } catch {
    return null
  }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    console.log("🔄 Attempting to refresh access token...")

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Token refresh failed:", errorText)
      return null
    }

    const data = await response.json()
    console.log("✅ Token refreshed successfully")
    return data
  } catch (error) {
    console.error("💥 Error refreshing token:", error)
    return null
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")

    console.log("🍪 Checking session cookie:", {
      hasCookie: !!sessionToken,
      cookieValue: sessionToken?.value ? "present" : "missing",
    })

    if (!sessionToken) {
      console.log("❌ No session token found")
      return null
    }

    const session = decodeToken(sessionToken.value)
    console.log("🔓 Decoded session:", {
      hasSession: !!session,
      expires: session?.expires,
      isExpired: session ? new Date(session.expires) <= new Date() : "no session",
      hasRefreshToken: !!session?.user?.refreshToken,
      tokenExpiry: session?.user?.tokenExpiry ? new Date(session.user.tokenExpiry) : "no expiry",
    })

    // Check if session is expired
    if (session && new Date(session.expires) > new Date()) {
      // Check if access token is expired and refresh if needed
      if (session.user?.tokenExpiry && session.user?.refreshToken) {
        const tokenExpiryTime = new Date(session.user.tokenExpiry)
        const now = new Date()

        // If token expires in less than 5 minutes, refresh it
        if (tokenExpiryTime.getTime() - now.getTime() < 5 * 60 * 1000) {
          console.log("🔄 Access token expiring soon, refreshing...")

          const newTokens = await refreshAccessToken(session.user.refreshToken)
          if (newTokens) {
            // Update the session with new tokens
            session.user.accessToken = newTokens.access_token
            session.user.tokenExpiry = Date.now() + newTokens.expires_in * 1000

            // Save updated session
            const newSessionToken = encodeToken(session)
            cookieStore.set("session-token", newSessionToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: "/",
            })

            console.log("✅ Session updated with new access token")
          } else {
            console.log("❌ Failed to refresh token, session may be invalid")
          }
        }
      }

      console.log("✅ Valid session found")
      return session
    }

    console.log("⏰ Session expired or invalid")
    return null
  } catch (error) {
    console.error("💥 Error getting session:", error)
    return null
  }
}

export async function createSession(user: User): Promise<string> {
  const expires = new Date()
  expires.setDate(expires.getDate() + 7) // 7 days from now

  const session: AuthSession = {
    user,
    expires: expires.toISOString(),
  }

  return encodeToken(session)
}

export async function exchangeCodeForTokens(code: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error("❌ Token exchange failed:", errorText)
    throw new Error("Failed to exchange code for tokens")
  }

  return tokenResponse.json()
}

export async function getUserInfo(accessToken: string) {
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!userResponse.ok) {
    throw new Error("Failed to get user info")
  }

  return userResponse.json()
}
