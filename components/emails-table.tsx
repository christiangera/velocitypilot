"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, FileText, Clock, RefreshCw } from "lucide-react"
import { useEmails } from "@/hooks/use-emails"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

// Enhanced classification function that matches the JSON configuration
function classifyEmail(subject: string, body: string) {
  const text = (subject + " " + body).toLowerCase()

  // APPOINTMENT_SCHEDULING
  if (
    text.includes("meeting") ||
    text.includes("schedule") ||
    text.includes("appointment") ||
    text.includes("book") ||
    text.includes("consultation") ||
    text.includes("call") ||
    text.includes("time to meet") ||
    text.includes("arrange") ||
    text.includes("demo")
  ) {
    return { category: "APPOINTMENT_SCHEDULING", confidence: 85 }
  }

  // PRODUCT_SERVICE_OVERVIEW
  if (
    text.includes("what do you sell") ||
    text.includes("describe") ||
    text.includes("packages") ||
    text.includes("services") ||
    text.includes("products") ||
    text.includes("offerings") ||
    text.includes("what you offer") ||
    text.includes("overview")
  ) {
    return { category: "PRODUCT_SERVICE_OVERVIEW", confidence: 80 }
  }

  // GENERAL_FEEDBACK_SUGGESTIONS
  if (
    text.includes("feedback") ||
    text.includes("suggestion") ||
    text.includes("improve") ||
    text.includes("thoughts") ||
    text.includes("idea") ||
    text.includes("recommend") ||
    text.includes("comment") ||
    text.includes("review")
  ) {
    return { category: "GENERAL_FEEDBACK_SUGGESTIONS", confidence: 75 }
  }

  // GENERAL_INQUIRY (default for business-related questions)
  if (
    text.includes("question") ||
    text.includes("help") ||
    text.includes("information") ||
    text.includes("shipping") ||
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("how") ||
    text.includes("what") ||
    text.includes("when") ||
    text.includes("where")
  ) {
    return { category: "GENERAL_INQUIRY", confidence: 70 }
  }

  // UNRELATED (fallback)
  return { category: "UNRELATED", confidence: 60 }
}

const categoryColors = {
  GENERAL_INQUIRY: "bg-purple-100 text-purple-700",
  PRODUCT_SERVICE_OVERVIEW: "bg-blue-100 text-blue-700",
  APPOINTMENT_SCHEDULING: "bg-green-100 text-green-700",
  GENERAL_FEEDBACK_SUGGESTIONS: "bg-yellow-100 text-yellow-700",
  UNRELATED: "bg-red-100 text-red-700",
}

const categoryDisplayNames = {
  GENERAL_INQUIRY: "General Inquiry",
  PRODUCT_SERVICE_OVERVIEW: "Product/Service Overview",
  APPOINTMENT_SCHEDULING: "Appointment Scheduling",
  GENERAL_FEEDBACK_SUGGESTIONS: "Feedback & Suggestions",
  UNRELATED: "Unrelated",
}

export function EmailsTable() {
  const { emails, loading, error, refetch } = useEmails()
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set())

  const handleViewEmail = (email: any) => {
    // Open email in a modal or navigate to detail view
    toast({
      title: "Email Details",
      description: `Viewing email: ${email.subject}`,
    })
  }

  const handleCreateDraft = async (email: any) => {
    if (processingEmails.has(email.id)) return

    setProcessingEmails((prev) => new Set(prev).add(email.id))

    try {
      const response = await fetch("/api/emails/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: {
            id: email.id,
            from: email.from,
            to: email.to,
            subject: email.subject,
            body: email.body,
            snippet: email.snippet,
            threadId: email.threadId,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create draft")
      }

      const result = await response.json()

      toast({
        title: "Draft Created Successfully",
        description: `Draft response created for "${email.subject}" and saved to Gmail drafts.`,
      })

      // Refresh emails to update read status
      refetch()
    } catch (error) {
      console.error("Error creating draft:", error)
      toast({
        title: "Error Creating Draft",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setProcessingEmails((prev) => {
        const newSet = new Set(prev)
        newSet.delete(email.id)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Your Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading your emails...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Your Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading emails: {error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">Your Recent Emails ({emails.length})</CardTitle>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No emails found in your inbox.</div>
          ) : (
            emails.slice(0, 10).map((email) => {
              const classification = classifyEmail(email.subject, email.body)
              const timeAgo = new Date().getTime() - email.date.getTime()
              const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60))
              const daysAgo = Math.floor(hoursAgo / 24)

              let timeDisplay = ""
              if (daysAgo > 0) {
                timeDisplay = `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`
              } else if (hoursAgo > 0) {
                timeDisplay = `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`
              } else {
                timeDisplay = "Less than an hour ago"
              }

              const isProcessing = processingEmails.has(email.id)
              const categoryDisplayName =
                categoryDisplayNames[classification.category as keyof typeof categoryDisplayNames] ||
                classification.category

              return (
                <div
                  key={email.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{email.subject}</h3>
                        <Badge className={categoryColors[classification.category as keyof typeof categoryColors]}>
                          {categoryDisplayName}
                        </Badge>
                        <Badge variant={email.isRead ? "secondary" : "default"}>
                          {email.isRead ? "Read" : "Unread"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">From: {email.from}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{email.snippet}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeDisplay}
                        </div>
                        <div>Confidence: {classification.confidence}%</div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleViewEmail(email)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateDraft(email)}
                        disabled={isProcessing}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {isProcessing ? "Creating..." : "Draft"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
