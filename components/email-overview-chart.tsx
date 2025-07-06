"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useEmails } from "@/hooks/use-emails"
import { useDrafts } from "@/hooks/use-drafts"
import { useMemo } from "react"

export function EmailOverviewChart() {
  const { emails, loading: emailsLoading } = useEmails()
  const { drafts, loading: draftsLoading } = useDrafts()

  const chartData = useMemo(() => {
    if (emailsLoading || draftsLoading) return []

    const dataMap = new Map<string, { received: number; processed: number; drafts: number }>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Initialize data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dayKey = date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "numeric" }) // Include date for uniqueness
      dataMap.set(dayKey, { received: 0, processed: 0, drafts: 0 })
    }

    // Process emails
    emails.forEach((email) => {
      const emailDate = new Date(email.date)
      emailDate.setHours(0, 0, 0, 0)
      const dayKey = emailDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "numeric" })

      if (dataMap.has(dayKey)) {
        const current = dataMap.get(dayKey)!
        current.received += 1
        if (email.isRead) {
          current.processed += 1
        }
        dataMap.set(dayKey, current)
      }
    })

    // Process drafts
    drafts.forEach((draft) => {
      const draftDate = new Date(draft.created)
      draftDate.setHours(0, 0, 0, 0)
      const dayKey = draftDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "numeric" })

      if (dataMap.has(dayKey)) {
        const current = dataMap.get(dayKey)!
        current.drafts += 1
        dataMap.set(dayKey, current)
      }
    })

    // Convert map to array and sort by date
    return Array.from(dataMap.entries())
      .map(([dayLabel, values]) => ({
        day: dayLabel.split(",")[0], // Use only weekday for XAxis label
        fullDate: dayLabel, // Keep full date for sorting
        ...values,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }, [emails, drafts, emailsLoading, draftsLoading])

  if (emailsLoading || draftsLoading) {
    return (
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Email Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center justify-center h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading chart data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Email Activity (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartContainer
          config={{
            received: { label: "Received", color: "#8b5cf6" },
            processed: { label: "Processed", color: "#3b82f6" },
            drafts: { label: "Drafts Created", color: "#10b981" },
          }}
          className="h-[280px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="received"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="processed"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="drafts"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
