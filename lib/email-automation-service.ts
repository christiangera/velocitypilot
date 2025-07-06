export type EmailClassification = {
  category:
    | "GENERAL_INQUIRY"
    | "PRODUCT_SERVICE_OVERVIEW"
    | "APPOINTMENT_SCHEDULING"
    | "GENERAL_FEEDBACK_SUGGESTIONS"
    | "UNRELATED"
  confidence: number
}

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
  classification?: EmailClassification
}

// This file is intentionally left blank. The EmailAutomationService class has been moved to lib/email-automation.ts
