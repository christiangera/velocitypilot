import { TopBar } from "@/components/top-bar"
import { DraftsList } from "@/components/drafts-list"

export default function DraftsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Draft Responses</h1>
            <p className="text-gray-600 mt-2">Review and manage AI-generated email drafts</p>
          </div>

          <DraftsList />
        </div>
      </div>
    </div>
  )
}
