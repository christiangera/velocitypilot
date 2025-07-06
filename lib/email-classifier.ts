import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { ProcessedEmail } from "./email-automation"

export type EmailCategory =
  | "GENERAL_INQUIRY"
  | "PRODUCT_SERVICE_OVERVIEW"
  | "APPOINTMENT_SCHEDULING"
  | "GENERAL_FEEDBACK_SUGGESTIONS"
  | "UNRELATED"
  | "UNABLE_TO_CLASSIFY"

export interface ClassificationResult {
  category: EmailCategory
  confidence: number // Placeholder for future confidence score
}

export class EmailClassifier {
  private openaiApiKey: string

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey
  }

  async classifyEmail(email: ProcessedEmail): Promise<ClassificationResult> {
    try {
      const prompt = `You are an email classifier for a generic business. We have five possible categories for incoming emails:

GENERAL_INQUIRY
The user is asking a straightforward question about our offerings, operations, or capabilities.
(e.g., “Do you offer shipping to my region?” / “What services do you provide?”)

PRODUCT_SERVICE_OVERVIEW
The user is explicitly requesting a high‐level summary of our products or services.
(e.g., “Can you describe what you sell?” / “What packages do you offer?”)

APPOINTMENT_SCHEDULING
The user is requesting to book, schedule, or confirm a meeting, call, or consultation.
(e.g., “Can we arrange a time to meet next week?” / “How do I book a consultation?”)

GENERAL_FEEDBACK_SUGGESTIONS
The user is providing feedback, suggestions, comments, or ideas about our business.
(e.g., “I have a suggestion to improve your website.” / “Just wanted to share my thoughts on your service.”)\n
UNRELATED
If inbound email doesn't fit descriptions of other categories it goes here.

Important Instructions:

Read the entire email thread (all messages), not just the most recent message, before classifying.

Determine which single category best represents the user’s intent.

Return exactly one category name (all caps, with underscores). Do not include any extra text, punctuation, or explanation.

Retain the context so you don’t repeatedly ask for a spec if it’s already been given.

Email text: ${email.body}
Email subject: ${email.subject}`

      const { text: classification } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        temperature: 0,
        maxTokens: 50,
      })

      const category = classification.trim().toUpperCase() as EmailCategory

      if (Object.values(this.getValidCategories()).includes(category)) {
        return { category, confidence: 1.0 } // Placeholder confidence
      } else {
        return { category: "UNABLE_TO_CLASSIFY", confidence: 0.0 }
      }
    } catch (error) {
      console.error("Error classifying email with AI:", error)
      return { category: "UNABLE_TO_CLASSIFY", confidence: 0.0 }
    }
  }

  getValidCategories(): EmailCategory[] {
    return [
      "GENERAL_INQUIRY",
      "PRODUCT_SERVICE_OVERVIEW",
      "APPOINTMENT_SCHEDULING",
      "GENERAL_FEEDBACK_SUGGESTIONS",
      "UNRELATED",
    ]
  }
}
