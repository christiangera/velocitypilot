import { TopBar } from "@/components/top-bar"
import { EmailFilters } from "@/components/email-filters"
import { EmailsTable } from "@/components/emails-table"
import { DebugInfo } from "@/components/debug-info"

export default function EmailsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incoming Emails</h1>
            <p className="text-gray-600 mt-2">Monitor and manage incoming email classifications</p>
          </div>

          <DebugInfo />
          <EmailFilters />
          <EmailsTable />
        </div>
      </div>
    </div>
  )
}
