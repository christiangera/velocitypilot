"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Edit, Trash2, Clock, RefreshCw } from "lucide-react"
import { useDrafts } from "@/hooks/use-drafts"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const categoryColors = {
  "General Inquiry": "bg-purple-100 text-purple-700",
  "Product/Service Overview": "bg-blue-100 text-blue-700",
  "Appointment Scheduling": "bg-green-100 text-green-700",
  "Feedback & Suggestions": "bg-yellow-100 text-yellow-700",
}

const statusColors = {
  "Ready to Send": "bg-green-100 text-green-700",
  "Needs Review": "bg-yellow-100 text-yellow-700",
  "Needs Customization": "bg-orange-100 text-orange-700",
}

export function DraftsList() {
  const { drafts, loading, error, refetch } = useDrafts()
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentEditingDraft, setCurrentEditingDraft] = useState<any>(null)
  const [editedContent, setEditedContent] = useState("")

  const handleEdit = (draft: any) => {
    setCurrentEditingDraft(draft)
    setEditedContent(draft.content)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!currentEditingDraft || actionLoading.has(currentEditingDraft.id)) return

    setActionLoading((prev) => new Set(prev).add(currentEditingDraft.id))

    try {
      const response = await fetch("/api/drafts/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftId: currentEditingDraft.id,
          newContent: editedContent,
          originalEmailDetails: {
            from: currentEditingDraft.to, // 'To' of draft is 'From' of original email
            subject: currentEditingDraft.subject.replace("Re: ", ""), // Remove "Re: " for original subject
            threadId: currentEditingDraft.threadId, // Assuming threadId is available in draft object
            id: currentEditingDraft.originalMessageId, // Assuming originalMessageId is available
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save draft edits")
      }

      toast({
        title: "Draft Saved",
        description: `Draft "${currentEditingDraft.subject}" has been updated.`,
      })
      setIsEditDialogOpen(false)
      refetch() // Refresh the drafts list
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error Saving Draft",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentEditingDraft.id)
        return newSet
      })
    }
  }

  const handleSend = async (draft: any) => {
    if (actionLoading.has(draft.id)) return

    setActionLoading((prev) => new Set(prev).add(draft.id))

    try {
      const response = await fetch("/api/drafts/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draftId: draft.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send draft")
      }

      toast({
        title: "Draft Sent",
        description: `Draft "${draft.subject}" has been sent successfully.`,
      })

      refetch() // Refresh the drafts list to remove the sent draft
    } catch (error) {
      console.error("Error sending draft:", error)
      toast({
        title: "Error Sending Draft",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => {
        const newSet = new Set(prev)
        newSet.delete(draft.id)
        return newSet
      })
    }
  }

  const handleDelete = async (draft: any) => {
    if (actionLoading.has(draft.id)) return

    setActionLoading((prev) => new Set(prev).add(draft.id))

    try {
      const response = await fetch("/api/drafts/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draftId: draft.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete draft")
      }

      toast({
        title: "Draft Deleted",
        description: `Draft "${draft.subject}" has been discarded.`,
      })

      refetch() // Refresh the drafts list
    } catch (error) {
      console.error("Error deleting draft:", error)
      toast({
        title: "Error Deleting Draft",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => {
        const newSet = new Set(prev)
        newSet.delete(draft.id)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Drafts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading your drafts...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Drafts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading drafts: {error}</p>
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
    <>
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Drafts ({drafts.length})</CardTitle>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No drafts found. Create some drafts from the Incoming Emails page.
              </div>
            ) : (
              drafts.map((draft) => {
                const isLoading = actionLoading.has(draft.id)

                return (
                  <div
                    key={draft.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900 truncate">{draft.subject}</h3>
                          <Badge
                            className={
                              categoryColors[draft.category as keyof typeof categoryColors] ||
                              "bg-gray-100 text-gray-700"
                            }
                          >
                            {draft.category}
                          </Badge>
                          <Badge
                            className={
                              statusColors[draft.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700"
                            }
                          >
                            {draft.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">To: {draft.to}</p>
                        <p className="text-sm text-gray-500 line-clamp-3">{draft.content}</p>
                        <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          Created {new Date(draft.created).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(draft)} disabled={isLoading}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleSend(draft)} disabled={isLoading}>
                          <Send className="h-4 w-4 mr-1" />
                          {isLoading ? "Sending..." : "Send"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(draft)} disabled={isLoading}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Draft Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Draft</DialogTitle>
            <DialogDescription>Make changes to your AI-generated draft response.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading.has(currentEditingDraft?.id)}>
              {actionLoading.has(currentEditingDraft?.id) ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
