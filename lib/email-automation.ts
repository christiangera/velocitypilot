import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { GmailService, type GmailMessage } from "./gmail-service"

export interface ProcessedEmail {
  id: string
  from: string
  to: string
  subject: string
  snippet: string
  body: string
  date: Date
  isRead: boolean
  threadId: string
  messageId: string
}

export interface EmailClassification {
  category: string
  confidence: number
}

export interface DraftResponse {
  content: string
  category: string
}

export class EmailAutomationService {
  private openaiApiKey: string
  private gmailAccessToken: string
  private processedInSession = new Set<string>()
  private rateLimitDelay = 2000
  private maxRetries = 3
  private shouldStop = false // Add stop flag

  constructor(openaiApiKey: string, gmailAccessToken: string) {
    this.openaiApiKey = openaiApiKey
    this.gmailAccessToken = gmailAccessToken
  }

  // Method to request stop
  requestStop(): void {
    console.log("🛑 Stop requested for email automation service")
    this.shouldStop = true
  }

  // Method to reset stop flag when starting
  resetStopFlag(): void {
    this.shouldStop = false
  }

  async processNewEmails(): Promise<{
    processed: number
    skipped: number
    failed: number
    errors: string[]
    stopped: boolean
  }> {
    console.log("🚀 Starting email automation process...")
    this.resetStopFlag() // Reset stop flag at start

    let processed = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []
    let stopped = false

    try {
      const gmailService = new GmailService(this.gmailAccessToken)
      const unreadMessages = await gmailService.getUnreadMessages(50) // Process more at once

      if (unreadMessages.length === 0) {
        console.log("📭 No unread emails found to process.")
        return { processed, skipped, failed, errors, stopped }
      }

      console.log(`📧 Found ${unreadMessages.length} unread emails. Processing...`)

      // Get all existing drafts once to avoid repeated API calls
      const existingDrafts = await gmailService.getAllDrafts()
      const draftThreadIds = new Set(existingDrafts.map((draft) => draft.message?.threadId).filter(Boolean))

      console.log(`📝 Found ${existingDrafts.length} existing drafts covering ${draftThreadIds.size} threads`)

      for (const message of unreadMessages) {
        // Check for stop request before processing each email
        if (this.shouldStop) {
          console.log("🛑 Stop requested. Ending email processing after current email.")
          stopped = true
          break
        }

        try {
          const emailData = this.parseEmailData(message)
          if (!emailData) {
            console.warn(`Skipping message ${message.id} due to parsing failure.`)
            skipped++
            continue
          }

          console.log(`\n--- PROCESSING EMAIL: "${emailData.subject}" ---`)
          console.log(`🆔 Email ID: ${emailData.id} | 🧵 Thread ID: ${emailData.threadId}`)

          // Skip if already processed in this session
          if (this.processedInSession.has(emailData.id)) {
            console.log(`⏩ SKIPPED: Already processed in this session.`)
            skipped++
            continue
          }

          // Skip if thread already has a draft (more efficient check)
          if (draftThreadIds.has(emailData.threadId)) {
            console.log(`⏩ SKIPPED: Draft already exists for thread ${emailData.threadId}.`)
            this.processedInSession.add(emailData.id)
            skipped++
            continue
          }

          // Step 1: Classify the email using exact Make.com prompt
          console.log(`[1/3] Classifying email...`)

          // Check for stop request before classification
          if (this.shouldStop) {
            console.log("🛑 Stop requested during classification. Ending processing.")
            stopped = true
            break
          }

          const classification = await this.classifyEmail(emailData)
          console.log(`   ✅ Classified as: ${classification.category}`)

          // Step 2: Generate response based on classification
          console.log(`[2/3] Generating draft response...`)

          // Check for stop request before response generation
          if (this.shouldStop) {
            console.log("🛑 Stop requested during response generation. Ending processing.")
            stopped = true
            break
          }

          const draftResponse = await this.generateDraftResponse(emailData, classification)
          console.log(`   ✅ Response generated.`)

          // Step 3: Create draft
          console.log(`[3/3] Creating Gmail draft...`)

          // Check for stop request before draft creation
          if (this.shouldStop) {
            console.log("🛑 Stop requested during draft creation. Ending processing.")
            stopped = true
            break
          }

          const draftId = await gmailService.createDraft(emailData, draftResponse.content)
          console.log(`   ✅ Draft created successfully with ID: ${draftId}`)

          // Add to processed set and update our local draft tracking
          this.processedInSession.add(emailData.id)
          draftThreadIds.add(emailData.threadId)
          console.log(`   ✅ Email processed (left as unread).`)

          processed++
          console.log(`--- FINISHED PROCESSING: "${emailData.subject}" ---`)

          // Check for stop request after completing this email
          if (this.shouldStop) {
            console.log("🛑 Stop requested after completing email. Ending processing gracefully.")
            stopped = true
            break
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          console.error(`❌ FAILED TO PROCESS EMAIL ${message.id}: ${errorMessage}`)
          errors.push(`Email ${message.id}: ${errorMessage}`)
          failed++

          // Check for stop request even after errors
          if (this.shouldStop) {
            console.log("🛑 Stop requested after error. Ending processing.")
            stopped = true
            break
          }
        }
      }

      console.log(`\n=== AUTOMATION SUMMARY ===`)
      console.log(`✅ Processed: ${processed}`)
      console.log(`⏩ Skipped: ${skipped}`)
      console.log(`❌ Failed: ${failed}`)
      console.log(`🛑 Stopped: ${stopped ? "Yes" : "No"}`)
      console.log(`📧 Note: Emails left as unread for manual review`)

      return { processed, skipped, failed, errors, stopped }
    } catch (error) {
      console.error("💥 CRITICAL ERROR in automation service:", error)
      errors.push(`Critical error: ${error instanceof Error ? error.message : "Unknown error"}`)
      return { processed, skipped, failed, errors, stopped }
    }
  }

  private async classifyEmail(email: ProcessedEmail): Promise<EmailClassification> {
    try {
      // Exact prompt from Make.com JSON
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `You are an email classifier for a generic business. We have five possible categories for incoming emails:

GENERAL_INQUIRY
The user is asking a straightforward question about our offerings, operations, or capabilities.
(e.g., "Do you offer shipping to my region?" / "What services do you provide?")

PRODUCT_SERVICE_OVERVIEW
The user is explicitly requesting a high‐level summary of our products or services.
(e.g., "Can you describe what you sell?" or "What packages do you offer?")

APPOINTMENT_SCHEDULING
The user is requesting to book, schedule, or confirm a meeting, call, or consultation.
(e.g., "Can we arrange a time to meet next week?" / "How do I book a consultation?")

GENERAL_FEEDBACK_SUGGESTIONS
The user is providing feedback, suggestions, comments, or ideas about our business.
(e.g., "I have a suggestion to improve your website." / "Just wanted to share my thoughts on your service.")

UNRELATED
If inbound email doesn't fit descriptions of other categories it goes here.

Important Instructions:

Read the entire email thread (all messages), not just the most recent message, before classifying.

Determine which single category best represents the user's intent.

Return exactly one category name (all caps, with underscores). Do not include any extra text, punctuation, or explanation.

Retain the context so you don't repeatedly ask for a spec if it's already been given.

Email text: ${email.body}
Email subject: ${email.subject}`,
        maxTokens: 50,
        temperature: 0,
      })

      return {
        category: text.trim(),
        confidence: 1,
      }
    } catch (error) {
      console.error("❌ Error classifying email:", error)
      throw error
    }
  }

  private async generateDraftResponse(
    email: ProcessedEmail,
    classification: EmailClassification,
  ): Promise<DraftResponse> {
    try {
      let prompt = ""

      switch (classification.category) {
        case "GENERAL_INQUIRY":
          prompt = `You are an AI assistant for a generic business. The customer has emailed asking a specific question about our offerings, operations, or capabilities (for example, "Do you offer shipping to my region?" or "What services do you provide?").

Please craft a friendly, human‐like reply that:

1. Opens with a warm greeting and uses the customer's name or email if available (e.g., "Hi Sam," or "Hello Alex,").
2. Acknowledges their specific question and answers it directly in 1–2 concise sentences.
3. Offers any relevant details or next steps (for example, "We ship to all 50 states; our cutoff for same‐day fulfillment is 2 PM EST").
4. Invites them to follow up with additional questions if needed (e.g., "Let me know if you need more information.").
5. Uses a natural, conversational tone (as if a helpful team member is replying), with short paragraphs—no bullet lists unless it clarifies a multi‐point answer.
6. Keeps the response concise and to the point—do not over‐explain or include irrelevant information.
7. Ends with a courteous sign‐off (e.g., "Best regards," "Thank you," "Sincerely,"), including our company name or team.

Do not include the subject line ("${email.subject}") in your answer. Do not alter text colors.
The customer's address is: ${email.from}
Our address is: ${email.to}

Email text: ${email.body}
Email subject: ${email.subject}

Please ALWAYS provide your response ensuring it is not cut off or truncated, even if it is a long email.

• Always close with a warm, human‐like sign-off (e.g., "Best regards," "Thank you," "Sincerely,").
• On the next line, include only: \`[Your Name]\`
• Do **not** copy or reuse the sender's name or signature.
• Do **not** reference or confuse the sender's business identity with ours.
• Use British English only
• Do **not** reference the sender's company name, domain, or branding as if it were ours. Always use our own company name or a generic placeholder.
• Whenever you need to reference customer-specific details—such as product names, service types, quantities, dates/times, booking links, or locations—insert a clear placeholder instead of real values.
  – Use square-bracketed labels like:
    • \`[PRODUCT_NAME]\`
    • \`[QUANTITY]\`
    • \`[DATE/TIME]\`
    • \`[BOOKING_LINK]\`
    • \`[LOCATION]\`
    • \`[ADDITIONAL_DETAILS]\`
• Do **not** populate these placeholders with any actual customer data; leave them for manual completion by a team member.
• Do **not** invent or list real service offerings.
• Whenever referencing a service, use ONLY these placeholders:
    • \`[SERVICE_TYPE]\`
    • \`[SERVICE_DESCRIPTION]\`
    • \`[SERVICE_NAME]\``
          break

        case "PRODUCT_SERVICE_OVERVIEW":
          prompt = `You are an AI assistant for a generic business. The customer has requested a high‐level summary of our products or services (for example, "Can you describe what you sell?" or "What packages do you offer?").

Please craft a friendly, human‐like reply that:

1. Opens with a warm greeting (e.g., "Hello," "Hi [Name],").
2. Introduces a brief one‐sentence overview of our core offerings in generic terms (e.g., "At [Company Name], we offer a range of solutions to meet different needs.").
3. Lists each major product or service category using placeholders, for example:
   1. **Insert Product/Service Category A**: Two‐line generic description (e.g., "Our [Category A] includes [brief benefit or feature].").
   2. **Insert Product/Service Category B**: Two‐line generic description (e.g., "Our [Category B] is designed for [target use case or audience].").
   3. **Insert Product/Service Category C**: Two‐line generic description (e.g., "Our [Category C] provides [key advantage].").
4. References where they can find more detailed information (e.g., "For pricing and full specs, please visit our website or let me know if you'd like me to send additional materials.").
5. Uses a polite, conversational tone, as if a helpful sales representative is speaking—avoid overly formal or robotic language.
6. Keeps the reply concise (no more than five short paragraphs, including greeting and sign-off).
7. Ends with a courteous closing (e.g., "Let me know if you have any questions," followed by "Best regards," and our company name or team).

Do not include the subject line ("${email.subject}") in your answer. Do not alter text colors.
The customer's address is: ${email.from}
Our address is: ${email.to}

Email text: ${email.body}
Email subject: ${email.subject}

Please ALWAYS provide your response ensuring it is not cut off or truncated, even if it is a long email.

• Always close with a warm, human‐like sign-off (e.g., "Best regards," "Thank you," "Sincerely,").
• On the next line, include only: \`[Your Name]\`
• Do **not** copy or reuse the sender's name or signature.
• Do **not** reference or confuse the sender's business identity with ours.
• Use British English only
• Do **not** reference the sender's company name, domain, or branding as if it were ours. Always use our own company name or a generic placeholder.
• Whenever you need to reference customer-specific details—such as product names, service types, quantities, dates/times, booking links, or locations—insert a clear placeholder instead of real values.
  – Use square-bracketed labels like:
    • \`[PRODUCT_NAME]\`
    • \`[QUANTITY]\`
    • \`[DATE/TIME]\`
    • \`[BOOKING_LINK]\`
    • \`[LOCATION]\`
    • \`[ADDITIONAL_DETAILS]\`
• Do **not** populate these placeholders with any actual customer data; leave them for manual completion by a team member.
• Do **not** invent or list real service offerings.
• Whenever referencing a service, use ONLY these placeholders:
    • \`[SERVICE_TYPE]\`
    • \`[SERVICE_DESCRIPTION]\`
    • \`[SERVICE_NAME]\``
          break

        case "APPOINTMENT_SCHEDULING":
          prompt = `You are an AI assistant for a generic business. The customer is requesting to book, schedule, confirm, or modify a meeting, call, or consultation (for example, "Can I schedule a meeting next Tuesday at 3 PM?" or "How do I book a demo?").

Please craft a friendly, human‐like reply that:

Opens with a warm greeting (e.g., "Hi [Name],").

Acknowledges their request to schedule ("Thank you for reaching out to book time with us.").

Prompts the employee to insert their available times or a placeholder for a scheduling link based on the context. For example:

If the customer proposes specific dates/times, respond:
"I'm available on [INSERT DAY AND TIME SLOT] and [INSERT ALTERNATE DAY AND TIME SLOT]. Please let me know which works for you, or suggest another time that's more convenient."

If the customer asks how to book in general, respond:
"To schedule a meeting, please choose a time that suits you and let me know. Alternatively, you can use our booking link: [INSERT BOOKING LINK]."

Uses a natural, conversational tone—write as a helpful team member would, avoiding overly formal or robotic phrasing.

Keeps the response concise (no more than four short paragraphs).

Ends with a courteous closing (e.g., "Looking forward to speaking with you," followed by "Best regards," and our team name).

Do not include the subject line ("${email.subject}") in your answer. Do not alter text colors.
The customer's address is: ${email.from}
Our address is: ${email.to}

Email text: ${email.body}
Email subject: ${email.subject}

Please ALWAYS provide your response ensuring it is not cut off or truncated, even if it is a long email.

• Always close with a warm, human‐like sign-off (e.g., "Best regards," "Thank you," "Sincerely,").
• On the next line, include only: \`[Your Name]\`
• Do **not** copy or reuse the sender's name or signature.
• Do **not** reference or confuse the sender's business identity with ours.
• Use British English only
• Do **not** reference the sender's company name, domain, or branding as if it were ours. Always use our own company name or a generic placeholder.
• Whenever you need to reference customer-specific details—such as product names, service types, quantities, dates/times, booking links, or locations—insert a clear placeholder instead of real values.
  – Use square-bracketed labels like:
    • \`[PRODUCT_NAME]\`
    • \`[QUANTITY]\`
    • \`[DATE/TIME]\`
    • \`[BOOKING_LINK]\`
    • \`[LOCATION]\`
    • \`[ADDITIONAL_DETAILS]\`
• Do **not** populate these placeholders with any actual customer data; leave them for manual completion by a team member.
• Do **not** invent or list real service offerings.
• Whenever referencing a service, use ONLY these placeholders:
    • \`[SERVICE_TYPE]\`
    • \`[SERVICE_DESCRIPTION]\`
    • \`[SERVICE_NAME]\``
          break

        case "GENERAL_FEEDBACK_SUGGESTIONS":
          prompt = `You are an AI assistant for a generic business. The customer is providing feedback, suggestions, comments, or ideas about our business, website, products, or processes (for example, "I have a suggestion to improve your website" or "Just wanted to share my thoughts on your service.").

Please craft a friendly, human-like reply that:

1. Opens with a warm greeting (e.g., "Hello [Name],").
2. Thank them sincerely for taking the time to share feedback (e.g., "Thank you for letting us know your thoughts.").
3. Acknowledge the specifics of their feedback ("I appreciate you pointing out that our checkout page could show shipping costs upfront.").
4. Assure them that their suggestions will be passed on to the appropriate team ("I'll forward your idea to our development team for review.").
5. If appropriate, invite any further details or questions ("If you have any more ideas or need assistance, please feel free to let me know.").
6. Use a natural, empathetic tone, as if a helpful colleague is responding—avoid sounding like a canned response.
7. Keep the reply concise (no more than four short paragraphs).
8. End with a courteous closing (e.g., "Thanks again for your input," followed by "Best regards," and our team name).

Do not include the subject line ("${email.subject}") in your answer. Do not alter text colors.
The customer's address is: ${email.from}
Our address is: ${email.to}

Email text: ${email.body}
Email subject: ${email.subject}

Please ALWAYS provide your response ensuring it is not cut off or truncated, even if it is a long email.

• Always close with a warm, human‐like sign-off (e.g., "Best regards," "Thank you," "Sincerely,").
• On the next line, include only: \`[Your Name]\`
• Do **not** copy or reuse the sender's name or signature.
• Do **not** reference or confuse the sender's business identity with ours.
• Use British English only
• Do **not** reference the sender's company name, domain, or branding as if it were ours. Always use our own company name or a generic placeholder.
• Whenever you need to reference customer-specific details—such as product names, service types, quantities, dates/times, booking links, or locations—insert a clear placeholder instead of real values.
  – Use square-bracketed labels like:
    • \`[PRODUCT_NAME]\`
    • \`[QUANTITY]\`
    • \`[DATE/TIME]\`
    • \`[BOOKING_LINK]\`
    • \`[LOCATION]\`
    • \`[ADDITIONAL_DETAILS]\`
• Do **not** populate these placeholders with any actual customer data; leave them for manual completion by a team member.
• Do **not** invent or list real service offerings.
• Whenever referencing a service, use ONLY these placeholders:
    • \`[SERVICE_TYPE]\`
    • \`[SERVICE_DESCRIPTION]\`
    • \`[SERVICE_NAME]\``
          break

        case "UNRELATED":
          prompt = `You are an AI assistant for a printing company. The user's request does not relate to any of the established printing or invoice queries.

For now, simply respond with: MANUALLY RESPOND

Don't include THE SUBJECT AKA "${email.subject}" in response.

Do not affect colours of text in response, keep as standard.

The customer is always: ${email.from}

Don't ever get the customer confused with the recipient (us): ${email.to}

Email text: ${email.body}

Email subject: ${email.subject}

Please provide your response ensuring it is not cut off or truncated.`
          break

        default:
          throw new Error(`Unknown category: ${classification.category}`)
      }

      const response = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        maxTokens: 250,
        temperature: 0.8,
      })

      return {
        content: response.text,
        category: classification.category,
      }
    } catch (error) {
      console.error("❌ Error generating draft response:", error)
      throw error
    }
  }

  private parseEmailData(message: GmailMessage): ProcessedEmail | null {
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

      return {
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
    } catch (error) {
      console.error(`💥 Error parsing message ${message.id}:`, error)
      return null
    }
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
