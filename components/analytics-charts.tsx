"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const emailVolumeData = [
  { month: "Jan", emails: 856, responses: 742 },
  { month: "Feb", emails: 923, responses: 834 },
  { month: "Mar", emails: 1047, responses: 967 },
  { month: "Apr", emails: 1156, responses: 1089 },
  { month: "May", emails: 1247, responses: 1156 },
]

const categoryData = [
  { name: "General Inquiry", value: 45, color: "#8b5cf6" },
  { name: "Product/Service", value: 25, color: "#3b82f6" },
  { name: "Appointment", value: 20, color: "#10b981" },
  { name: "Feedback", value: 8, color: "#f59e0b" },
  { name: "Unrelated", value: 2, color: "#ef4444" },
]

export function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Email Volume Trends</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <ChartContainer
            config={{
              emails: { label: "Emails Received", color: "#8b5cf6" },
              responses: { label: "AI Responses", color: "#3b82f6" },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emailVolumeData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="emails" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="responses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Email Categories</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <ChartContainer
            config={{
              category: { label: "Category Distribution" },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-gray-600">{data.value}% of emails</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
