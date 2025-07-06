import { GmailService } from "./gmail-service"
import { EmailAutomationService, type ProcessedEmail } from "./email-automation" // Import EmailAutomationService and ProcessedEmail

export interface EmailStats {
  totalEmails: number
  unreadEmails: number
  sentEmails: number
  last7Days: {
    received: number
    sent: number
  }
  last30Days: {
    received: number
    sent: number
  }
  categoryBreakdown: {
    [category: string]: number
  }
}

export class GmailStatsService {
  private gmailService: GmailService
  private automationService: EmailAutomationService // Add automation service

  constructor(accessToken: string, openaiApiKey: string) {
    // Accept openaiApiKey
    this.gmailService = new GmailService(accessToken)
    this.automationService = new EmailAutomationService(openaiApiKey, accessToken) // Initialize automation service
  }

  async getEmailStatistics(): Promise<EmailStats> {
    try {
      console.log("📊 GmailStatsService: Starting REAL-TIME Gmail statistics collection...")

      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      const sevenDaysQuery = this.formatDateForGmail(sevenDaysAgo)
      const fourteenDaysQuery = this.formatDateForGmail(fourteenDaysAgo)

      console.log("📊 Date ranges:", {
        sevenDaysAgo: sevenDaysAgo.toISOString(),
        fourteenDaysAgo: fourteenDaysAgo.toISOString(),
        sevenDaysQuery,
        fourteenDaysQuery,
      })

      console.log("📊 Fetching ACCURATE Gmail counts by actually counting messages...")
      const timestamp = Date.now()

      // Get ACCURATE email counts by actually fetching and counting the messages
      const [totalInboxLast7Days, unreadEmails, sentEmailsLast7Days, receivedLast14Days, sentLast14Days] =
        await Promise.all([
          this.getAccurateEmailCountByFetching(
            `in:inbox after:${sevenDaysQuery}`,
            "Total inbox emails (7 days)",
            timestamp,
          ),
          this.getAccurateEmailCountByFetching(
            `in:inbox is:unread after:${sevenDaysQuery}`,
            "Unread emails (7 days)",
            timestamp,
          ),
          this.getAccurateEmailCountByFetching(`in:sent after:${sevenDaysQuery}`, "Sent emails (7 days)", timestamp),
          this.getAccurateEmailCountByFetching(
            `in:inbox after:${fourteenDaysQuery}`,
            "Received emails (14 days)",
            timestamp,
          ),
          this.getAccurateEmailCountByFetching(
            `in:sent after:${fourteenDaysQuery}`,
            "Sent emails (14 days)",
            timestamp,
          ),
        ])

      console.log("📊 ACCURATE Gmail API Results:", {
        totalInboxLast7Days,
        unreadEmails,
        sentEmailsLast7Days,
        receivedLast14Days,
        sentLast14Days,
        timestamp,
      })

      // Create basic stats object first
      const stats: EmailStats = {
        totalEmails: totalInboxLast7Days,
        unreadEmails: unreadEmails,
        sentEmails: sentEmailsLast7Days,
        last7Days: {
          received: totalInboxLast7Days,
          sent: sentEmailsLast7Days,
        },
        last30Days: {
          received: receivedLast14Days,
          sent: sentLast14Days,
        },
        categoryBreakdown: {
          "General Inquiry": 0,
          "Product/Service Overview": 0,
          "Appointment Scheduling": 0,
          "Feedback & Suggestions": 0,
          Unrelated: 0,
        },
      }

      // Try to get category breakdown, but don't let it block the main stats
      try {
        console.log("📊 Attempting to get AI-powered category breakdown...")
        const categoryBreakdown = await Promise.race([
          this.getCategoryBreakdown(sevenDaysQuery, timestamp),
          new Promise<{ [category: string]: number }>(
            (_, reject) => setTimeout(() => reject(new Error("Category breakdown timeout")), 15000), // 15 second timeout
          ),
        ])
        stats.categoryBreakdown = categoryBreakdown
        console.log("📊 Successfully got AI category breakdown")
      } catch (error) {
        console.warn("⚠️ Category breakdown failed or timed out, using default:", error)
        // Keep the default empty breakdown
      }

      console.log("📊 GmailStatsService: FINAL ACCURATE statistics:", stats)
      return stats
    } catch (error) {
      console.error("💥 GmailStatsService: Error collecting statistics:", error)
      throw error
    }
  }

  private async getAccurateEmailCountByFetching(
    query: string,
    description: string,
    timestamp: number,
  ): Promise<number> {
    try {
      console.log(`📊 Getting ACCURATE count by fetching messages for: ${description} - Query: "${query}"`)

      // Fetch all message IDs first (this is more accurate than resultSizeEstimate)
      const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages")
      url.searchParams.set("maxResults", "500") // Fetch up to 500 to get accurate count
      url.searchParams.set("q", query)
      url.searchParams.set("_", timestamp.toString())
      url.searchParams.set("includeSpamTrash", "false")

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.gmailService["accessToken"]}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`⚠️ Failed to get count for ${description}: ${response.status} - ${errorText}`)
        return 0
      }

      const data = await response.json()

      // Count actual messages returned, not the estimate
      const actualCount = data.messages ? data.messages.length : 0

      // If we got exactly 500 results, there might be more, so we need to paginate
      if (actualCount === 500 && data.nextPageToken) {
        console.log(`📊 ${description}: Found 500+ emails, fetching more pages for accurate count...`)
        let totalCount = actualCount
        let nextPageToken = data.nextPageToken

        // Fetch additional pages to get the true count (limit to 5 pages max to avoid timeout)
        let pageCount = 1
        while (nextPageToken && pageCount < 5) {
          const pageUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages")
          pageUrl.searchParams.set("maxResults", "500")
          pageUrl.searchParams.set("q", query)
          pageUrl.searchParams.set("pageToken", nextPageToken)
          pageUrl.searchParams.set("includeSpamTrash", "false")

          const pageResponse = await fetch(pageUrl.toString(), {
            headers: {
              Authorization: `Bearer ${this.gmailService["accessToken"]}`,
              "Content-Type": "application/json",
            },
          })

          if (!pageResponse.ok) break

          const pageData = await pageResponse.json()
          const pageMessages = pageData.messages ? pageData.messages.length : 0
          totalCount += pageMessages
          nextPageToken = pageData.nextPageToken
          pageCount++

          console.log(`📊 Page ${pageCount}: Found ${pageMessages} more emails (Total so far: ${totalCount})`)

          // If we got less than 500 on this page, we've reached the end
          if (pageMessages < 500) break
        }

        console.log(`📊 ${description}: ${totalCount} emails (ACCURATE count from ${pageCount} pages)`)
        return totalCount
      }

      console.log(`📊 ${description}: ${actualCount} emails (ACCURATE count)`)
      return actualCount
    } catch (error) {
      console.error(`💥 Error getting accurate count for ${description}:`, error)
      return 0
    }
  }

  private async getCategoryBreakdown(
    sevenDaysQuery: string,
    timestamp: number,
  ): Promise<{ [category: string]: number }> {
    try {
      console.log("📊 Calculating category breakdown from recent emails using AI classification...")

      // Reduce sample size for faster processing
      const recentEmails = await this.gmailService.getMessagesByQuery(`in:inbox after:${sevenDaysQuery}`, 20) // Now using 7 days of data

      const breakdown: { [category: string]: number } = {
        "General Inquiry": 0,
        "Product/Service Overview": 0,
        "Appointment Scheduling": 0,
        "Feedback & Suggestions": 0,
        Unrelated: 0,
      }

      console.log(`📊 Analyzing ${recentEmails.length} emails for AI-driven category breakdown`)

      // Process emails in smaller batches to avoid overwhelming the API
      const batchSize = 5
      for (let i = 0; i < recentEmails.length; i += batchSize) {
        const batch = recentEmails.slice(i, i + batchSize)
        console.log(
          `📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recentEmails.length / batchSize)}`,
        )

        await Promise.all(
          batch.map(async (email) => {
            try {
              const classification = await this.automationService.classifyEmail(email as ProcessedEmail)
              const category = this.mapCategoryToDisplayName(classification.category)
              breakdown[category] = (breakdown[category] || 0) + 1
            } catch (aiError) {
              console.warn(
                `⚠️ Failed to classify email ${email.id}:`,
                aiError instanceof Error ? aiError.message : String(aiError),
              )
              breakdown["Unrelated"]++
            }
          }),
        )

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < recentEmails.length) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      console.log("📊 AI-driven category breakdown calculated:", breakdown)
      return breakdown
    } catch (error) {
      console.error("💥 Error calculating AI-driven category breakdown:", error)
      throw error
    }
  }

  private mapCategoryToDisplayName(category: string): string {
    const mapping: { [key: string]: string } = {
      GENERAL_INQUIRY: "General Inquiry",
      PRODUCT_SERVICE_OVERVIEW: "Product/Service Overview",
      APPOINTMENT_SCHEDULING: "Appointment Scheduling",
      GENERAL_FEEDBACK_SUGGESTIONS: "Feedback & Suggestions",
      UNRELATED: "Unrelated",
    }
    return mapping[category] || "Unrelated"
  }

  private formatDateForGmail(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}/${month}/${day}`
  }
}
