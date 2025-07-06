"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"

// Map the display names to colors correctly
const categoryColors: { [key: string]: string } = {
  "General Inquiry": "#8b5cf6", // Purple
  "Product/Service Overview": "#3b82f6", // Blue
  "Appointment Scheduling": "#10b981", // Green
  "Feedback & Suggestions": "#f59e0b", // Orange
  Unrelated: "#6b7280", // Gray
}

export function CategoryChart({
  stats,
  loading,
  error,
}: {
  stats: any
  loading: boolean
  error: string | null
}) {
  const categoryData = useMemo(() => {
    if (loading || !stats?.categoryBreakdown) {
      return []
    }

    console.log("🔄 CategoryChart: Processing category breakdown...")
    console.log("📊 CategoryChart: Category breakdown:", stats.categoryBreakdown)

    const data = Object.entries(stats.categoryBreakdown)
      .map(([category, count]) => ({
        name: category,
        value: count,
        color: categoryColors[category] || "#6b7280",
        category: category,
      }))
      .filter((item) => item.value > 0) // Only show categories with emails
      .sort((a, b) => b.value - a.value) // Sort by count descending

    console.log("📊 CategoryChart: Final chart data:", data)
    return data
  }, [stats, loading])

  const chartConfig = useMemo(() => {
    const config: { [key: string]: { label: string; color: string } } = {}
    Object.entries(categoryColors).forEach(([key, color]) => {
      config[key.toLowerCase().replace(/[^a-z0-9]/g, "-")] = {
        label: key,
        color: color,
      }
    })
    return config
  }, [])

  if (loading) {
    return (
      <Card className="border-gray-200/60 shadow-sm h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading categories...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-200/60 shadow-sm h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="text-center py-8 text-red-600">Error loading category data: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (categoryData.length === 0) {
    return (
      <Card className="border-gray-200/60 shadow-sm h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="text-center py-8 text-gray-500">No email data available for category breakdown.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/60 shadow-sm h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="name" />}
                formatter={(value: number, name: string) => [`${value} emails`, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
