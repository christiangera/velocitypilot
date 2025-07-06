import type { ProcessedEmail } from "./email-automation"

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  labelIds?: string[]
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body?: { data?: string }
    }>
  }
  internalDate: string
}

export interface GmailDraft {
  id: string
  message: {
    id: string
    threadId: string
    labelIds?: string[]
    snippet: string
    payload: {
      headers: Array<{ name: string; value: string }>
      body?: { data?: string }
      parts?: Array<{
        mimeType: string
        body?: { data?: string }
      }>
    }
  }
}

export class GmailService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async testConnection(): Promise<{ success: boolean; error?: string; userEmail?: string }> {
    try {
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `Gmail API error: ${response.status} - ${errorText}` }
      }

      const profile = await response.json()
      return { success: true, userEmail: profile.emailAddress }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  async getMessagesByQuery(query: string, maxResults = 50): Promise<ProcessedEmail[]> {
    try {
      console.log(`🔍 Fetching up to ${maxResults} messages with query: "${query}"`)

      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`
      const listResponse = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!listResponse.ok) {
        throw new Error(`Failed to get message list: ${listResponse.status}`)
      }

      const listData = await listResponse.json()

      if (!listData.messages || listData.messages.length === 0) {
        return []
      }

      console.log(`📬 Found ${listData.messages.length} messages, fetching details...`)

      const messagePromises = listData.messages.map(async (msg: { id: string }) => {
        try {
          const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "application/json",
            },
          })

          if (!messageResponse.ok) {
            console.error(`❌ Failed to fetch message ${msg.id}`)
            return null
          }

          return await messageResponse.json()
        } catch (error) {
          console.error(`💥 Error fetching message ${msg.id}:`, error)
          return null
        }
      })

      const messages = await Promise.all(messagePromises)
      const validMessages = messages.filter((msg) => msg !== null) as GmailMessage[]

      return this.processMessages(validMessages)
    } catch (error) {
      console.error("💥 Error in getMessagesByQuery:", error)
      throw error
    }
  }

  async getUnreadMessages(maxResults = 1): Promise<GmailMessage[]> {
    try {
      console.log(`🔍 Fetching up to ${maxResults} unread messages`)

      const query = "is:unread newer_than:30d"
      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`
      const listResponse = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!listResponse.ok) {
        throw new Error(`Failed to get unread message list: ${listResponse.status}`)
      }

      const listData = await listResponse.json()

      if (!listData.messages || listData.messages.length === 0) {
        return []
      }

      console.log(`📬 Found ${listData.messages.length} unread messages, fetching details...`)

      const messagePromises = listData.messages.map(async (msg: { id: string }) => {
        try {
          const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "application/json",
            },
          })

          if (!messageResponse.ok) {
            console.error(`❌ Failed to fetch message ${msg.id}`)
            return null
          }

          return await messageResponse.json()
        } catch (error) {
          console.error(`💥 Error fetching message ${msg.id}:`, error)
          return null
        }
      })

      const messages = await Promise.all(messagePromises)
      return messages.filter((msg) => msg !== null) as GmailMessage[]
    } catch (error) {
      console.error("💥 Error in getUnreadMessages:", error)
      throw error
    }
  }

  async getAllMessages(maxResults = 100): Promise<ProcessedEmail[]> {
    return this.getMessagesByQuery("", maxResults)
  }

  async hasDraftForThread(threadId: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking for existing drafts in thread ${threadId}`)

      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=100`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.warn(`⚠️ Could not check drafts: ${response.status}`)
        return false
      }

      const data = await response.json()
      const drafts = data.drafts || []

      for (const draft of drafts) {
        if (draft.message && draft.message.threadId === threadId) {
          console.log(`🚫 Found existing draft for thread ${threadId}`)
          return true
        }
      }

      console.log(`✅ No existing drafts found for thread ${threadId}`)
      return false
    } catch (error) {
      console.error(`💥 Error checking drafts for thread ${threadId}:`, error)
      return false
    }
  }

  async getAllDrafts(): Promise<GmailDraft[]> {
    try {
      console.log("🔍 Fetching ALL existing drafts...")
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=500", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch drafts: ${response.status}`)
        return []
      }

      const data = await response.json()
      const drafts = data.drafts || []
      console.log(`📝 Retrieved ${drafts.length} total drafts`)

      // Fetch basic details for each draft to get thread IDs
      const draftsWithDetails = await Promise.all(
        drafts.slice(0, 100).map(async (draft: { id: string }) => {
          try {
            const draftResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draft.id}`, {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
              },
            })

            if (!draftResponse.ok) {
              return { id: draft.id, message: { threadId: null } }
            }

            const draftData = await draftResponse.json()
            return {
              id: draft.id,
              message: {
                threadId: draftData.message?.threadId || null,
                ...draftData.message,
              },
            }
          } catch (error) {
            console.error(`💥 Error fetching draft ${draft.id}:`, error)
            return { id: draft.id, message: { threadId: null } }
          }
        }),
      )

      return draftsWithDetails.filter((draft) => draft.message.threadId) as GmailDraft[]
    } catch (error) {
      console.error("💥 Error fetching all drafts:", error)
      return []
    }
  }

  async getDraftsForThread(threadId: string): Promise<GmailDraft[]> {
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts?q=thread:${threadId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`)
      }

      const data = await response.json()
      return data.drafts || []
    } catch (error) {
      console.error(`💥 Error fetching drafts for thread ${threadId}:`, error)
      throw error
    }
  }

  async createDraft(
    originalEmail: { from: string; subject: string; id: string; threadId: string },
    responseContent: string,
  ): Promise<string> {
    try {
      console.log(`📝 Creating draft for thread: ${originalEmail.threadId}`)

      // Get user's email
      const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      let userEmail = "me"
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        userEmail = profile.emailAddress
      }

      // Create email message exactly like Make.com
      const cleanSubject = originalEmail.subject.replace(/^Re:\s*/i, "")
      const rawMessage = [
        `In-Reply-To: ${originalEmail.id}`,
        `To: ${originalEmail.from}`,
        `Subject: Re: ${cleanSubject}`,
        `Content-Type: text/plain; charset="utf-8"`,
        "",
        responseContent,
      ].join("\r\n")

      // Encode message exactly like Make.com
      const encodedMessage = Buffer.from(rawMessage)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")

      // Create draft exactly like Make.com
      const draftPayload = {
        message: {
          threadId: originalEmail.threadId,
          "In-Reply-To": originalEmail.id,
          raw: encodedMessage,
        },
      }

      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create Gmail draft: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ Draft created successfully: ${result.id}`)
      return result.id
    } catch (error) {
      console.error("💥 Error creating draft:", error)
      throw error
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          removeLabelIds: ["UNREAD"],
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to mark email as read: ${response.status}`)
      }
    } catch (error) {
      console.error("💥 Error marking email as read:", error)
      throw error
    }
  }

  processMessages(messages: GmailMessage[]): ProcessedEmail[] {
    const processedEmails: ProcessedEmail[] = []

    for (const message of messages) {
      try {
        const headers = message.payload?.headers || []
        const from = headers.find((h) => h.name.toLowerCase() === "from")?.value || "Unknown"
        const to = headers.find((h) => h.name.toLowerCase() === "to")?.value || "Unknown"
        const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value || "No Subject"
        const messageIdHeader = headers.find((h) => h.name.toLowerCase() === "message-id")?.value
        const messageId = messageIdHeader ? messageIdHeader.replace(/[<>]/g, "") : message.id

        let date: Date
        try {
          date = new Date(Number.parseInt(message.internalDate))
          if (isNaN(date.getTime())) {
            date = new Date()
          }
        } catch {
          date = new Date()
        }

        let body = message.snippet || ""
        try {
          if (message.payload?.body?.data) {
            body = this.decodeBase64(message.payload.body.data)
          } else if (message.payload?.parts) {
            const textPart = message.payload.parts.find((part) => part.mimeType === "text/plain" && part.body?.data)
            if (textPart?.body?.data) {
              body = this.decodeBase64(textPart.body.data)
            }
          }
        } catch {
          body = message.snippet || ""
        }

        const isRead = !message.labelIds?.includes("UNREAD")

        const processedEmail: ProcessedEmail = {
          id: message.id,
          from: this.extractEmail(from),
          to: this.extractEmail(to),
          subject,
          snippet: message.snippet || "",
          body: body.substring(0, 500),
          date,
          isRead,
          threadId: message.threadId,
          messageId,
        }

        processedEmails.push(processedEmail)
      } catch (error) {
        console.error(`💥 Error processing message ${message.id}:`, error)
        continue
      }
    }

    return processedEmails
  }

  private decodeBase64(data: string): string {
    try {
      const base64 = data.replace(/-/g, "+").replace(/_/g, "/")
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
      return Buffer.from(padded, "base64").toString("utf-8")
    } catch (error) {
      return data
    }
  }

  private extractEmail(emailString: string): string {
    try {
      const match = emailString.match(/<(.+?)>/)
      if (match) {
        return match[1]
      }
      if (emailString.includes("@")) {
        return emailString.trim()
      }
      return emailString
    } catch (error) {
      return emailString || "Unknown"
    }
  }
}
