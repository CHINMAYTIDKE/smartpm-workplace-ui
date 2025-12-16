"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"
import { fetchWithAuth } from "@/lib/utils/api"
import { toast } from "sonner"

interface Workspace {
  id: string
  name: string
  description: string
  role: "owner" | "admin" | "member"
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workplaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    fetchWorkspace()
  }, [workplaceId])

  const fetchWorkspace = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth(`/api/workspaces/${workplaceId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workspace")
      }

      setWorkspace(data.workspace)
      setName(data.workspace.name)
      setDescription(data.workspace.description || "")
    } catch (error: any) {
      console.error("Error fetching workspace:", error)
      toast.error(error.message || "Failed to load workspace")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Workspace name is required")
      return
    }

    try {
      setSaving(true)
      const response = await fetchWithAuth(`/api/workspaces/${workplaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update workspace")
      }

      toast.success("Workspace updated successfully!")

      // Update local state
      if (workspace) {
        setWorkspace({ ...workspace, name, description })
      }

      // Trigger a page reload to update sidebar
      window.location.reload()
    } catch (error: any) {
      console.error("Error updating workspace:", error)
      toast.error(error.message || "Failed to update workspace")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetchWithAuth(`/api/workspaces/${workplaceId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete workspace")
      }

      toast.success("Workspace deleted successfully")

      // Redirect to workspaces page
      router.push("/workspaces")
    } catch (error: any) {
      console.error("Error deleting workspace:", error)
      toast.error(error.message || "Failed to delete workspace")
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load workspace settings</AlertDescription>
        </Alert>
      </div>
    )
  }

  const canEdit = workspace.role === "owner" || workspace.role === "admin"
  const canDelete = workspace.role === "owner"

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Workplace Settings</h1>
        <p className="text-muted-foreground">Manage your workplace preferences and configuration</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Workplace Information</CardTitle>
            <CardDescription>
              {canEdit
                ? "Update your workplace details"
                : "View workspace details (editing requires owner or admin role)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workplace Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={!canEdit}
              />
            </div>
            {canEdit && (
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {canDelete && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Workplace</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this workplace and all its data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workplace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workplace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All projects, tasks, files, and data associated with <strong>{workspace.name}</strong> will be permanently deleted.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
