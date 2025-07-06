"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Mail, FileText, Send, RefreshCw } from "lucide-react"
import { useEmails } from "@/hooks/use-emails"
import { useDrafts } from "@/hooks/use-drafts"
import { useSentEmails } from "@/hooks/use-sent-emails"
import { useMemo, useState } from "react"
import { toast } from "@/hooks/use-toast"

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " year" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " month" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " day" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hour" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minute" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  return Math.floor(seconds) + " second" + (Math.floor(seconds) === 1 ? "" : "s") + " ago"
}

export function RecentActivity() {
  const { emails, loading: emailsLoading, refetch: refetchEmails } = useEmails()
  const { drafts, loading: draftsLoading, refetch: refetchDrafts } = useDrafts()
  const { sentEmails, loading: sentEmailsLoading, refetch: refetchSent } = useSentEmails()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      console.log("🔄 Refreshing recent activity...")
      await Promise.all([refetchEmails(), refetchDrafts(), refetchSent()])
      toast({
        title: "✅ Activity Refreshed",
        description: "Recent activity has been updated with the latest data.",
      })
    } catch (error) {
      console.error("❌ Failed to refresh recent activity:", error)
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh recent activity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const activities = useMemo(() => {
    if (emailsLoading || draftsLoading || sentEmailsLoading) return []

    const combinedActivities: any[] = []

    emails.slice(0, 20).forEach((email) => {
      const categoryName = email.classification?.category?.replace(/_/g, " ") || "Unknown"
      combinedActivities.push({
        id: `email-${email.id}`,
        type: "email_received",
        description: `Email received from ${email.from}: "${email.subject}"`,
        time: email.date,
        icon: Mail,
        status: email.isRead ? "processed" : "unread",
        category: categoryName,
      })
    })

    drafts.slice(0, 10).forEach((draft) => {
      combinedActivities.push({
        id: `draft-${draft.id}`,
        type: "draft_created",
        description: `AI draft created for "${draft.subject}" to ${draft.to}`,
        time: new Date(draft.created),
        icon: FileText,
        status: "ready_to_send",
        category: draft.category,
      })
    })

    sentEmails.slice(0, 10).forEach((sentEmail) => {
      combinedActivities.push({
        id: `sent-${sentEmail.id}`,
        type: "email_sent",
        description: `Email sent to ${sentEmail.to}: "${sentEmail.subject}"`,
        time: sentEmail.sentDate,
        icon: Send,
        status: "sent",
        category: "Response",
      })
    })

    return combinedActivities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20)
  }, [emails, drafts, sentEmails, emailsLoading, draftsLoading, sentEmailsLoading])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Sent</Badge>
      case "ready_to_send":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Ready to Send</Badge>
      case "processed":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Processed</Badge>
      case "unread":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Unread</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Unknown</Badge>
    }
  }

  const loading = emailsLoading || draftsLoading || sentEmailsLoading || isRefreshing

  if (loading && activities.length === 0) {
    return (
      <Card className="border-gray-200/60 shadow-sm h-fit">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
          <Button disabled variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading recent activity...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/60 shadow-sm h-fit">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity (Last 20)</CardTitle>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No recent activity found.</div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 flex-shrink-0">
                <activity.icon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 leading-relaxed">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</span>
                  {getStatusBadge(activity.status)}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && activities.length > 0 && (
          <div className="text-center py-2">
            <div className="inline-flex items-center text-sm text-gray-500">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Refreshing...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
