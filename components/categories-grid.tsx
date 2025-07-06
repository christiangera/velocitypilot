import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, TrendingUp, Mail } from "lucide-react"

const categories = [
  {
    id: 1,
    name: "General Inquiry",
    description: "Straightforward questions about offerings, operations, or capabilities",
    count: 547,
    accuracy: 95,
    color: "bg-purple-100 text-purple-700",
    examples: ["Do you offer shipping to my region?", "What services do you provide?"],
  },
  {
    id: 2,
    name: "Product/Service Overview",
    description: "Requests for high-level summary of products or services",
    count: 312,
    accuracy: 88,
    color: "bg-blue-100 text-blue-700",
    examples: ["Can you describe what you sell?", "What packages do you offer?"],
  },
  {
    id: 3,
    name: "Appointment Scheduling",
    description: "Requests to book, schedule, or confirm meetings and consultations",
    count: 189,
    accuracy: 92,
    color: "bg-green-100 text-green-700",
    examples: ["Can we arrange a time to meet?", "How do I book a consultation?"],
  },
  {
    id: 4,
    name: "Feedback & Suggestions",
    description: "Customer feedback, suggestions, comments, or ideas about the business",
    count: 124,
    accuracy: 85,
    color: "bg-yellow-100 text-yellow-700",
    examples: ["I have a suggestion to improve your website", "Thoughts on your service"],
  },
  {
    id: 5,
    name: "Unrelated",
    description: "Emails that don't fit other categories or are outside business scope",
    count: 67,
    accuracy: 78,
    color: "bg-red-100 text-red-700",
    examples: ["Personal correspondence", "Spam", "Off-topic messages"],
  },
]

export function CategoriesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Card key={category.id} className="border-gray-200/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">{category.name}</CardTitle>
              <Badge className={category.color}>{category.count} emails</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{category.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{category.accuracy}% accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">{category.count} total</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Example emails:</p>
              {category.examples.map((example, index) => (
                <p key={index} className="text-xs text-gray-500 italic">
                  "{example}"
                </p>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              Configure Category
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
