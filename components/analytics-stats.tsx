"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Mail, Bot, Clock, CheckCircle } from "lucide-react"

export function AnalyticsStats() {
  // Mock data - in real implementation, fetch from your analytics API
  const stats = [
    {
      title: "Total Emails Processed",
      value: "1,247",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Mail,
    },
    {
      title: "AI Responses Generated",
      value: "1,089",
      change: "+8.3%",
      changeType: "positive" as const,
      icon: Bot,
    },
    {
      title: "Avg Response Time",
      value: "2.3 min",
      change: "-15.2%",
      changeType: "positive" as const,
      icon: Clock,
    },
    {
      title: "Success Rate",
      value: "97.2%",
      change: "+2.1%",
      changeType: "positive" as const,
      icon: CheckCircle,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-gray-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="flex items-center mt-1">
              {stat.changeType === "positive" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                {stat.change} from last month
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
