"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Users, FolderKanban, Plus, Settings, ChevronRight, Clock, LogOut, Loader2, Copy, Check, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchWithAuth } from "@/lib/utils/api"
import { toast } from "sonner"

interface Workspace {
  id: string
  name: string
  description: string
  role: "owner" | "admin" | "member"
  memberCount: number
  projectCount: number
  lastActive: string | null
  lastAccessed: string
  inviteCode?: string
}

export default function WorkspacesPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rememberWorkspace, setRememberWorkspace] = useState(false)

  // Create workspace dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "" })
  const [creating, setCreating] = useState(false)
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Join workspace dialog
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)

  // Protect route - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Fetch workspaces
  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  const fetchWorkspaces = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetchWithAuth("/api/workspaces")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workspaces")
      }

      setWorkspaces(data.workspaces || [])
    } catch (err: any) {
      console.error("Error fetching workspaces:", err)
      setError(err.message || "Failed to load workspaces")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkplace = async () => {
    if (!newWorkspace.name.trim()) {
      toast.error("Please enter a workspace name")
      return
    }

    try {
      setCreating(true)

      const response = await fetchWithAuth("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(newWorkspace),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace")
      }

      // Show invite code
      setCreatedInviteCode(data.workspace.inviteCode)

      // Refresh workspaces
      await fetchWorkspaces()

      // Reset form
      setNewWorkspace({ name: "", description: "" })

      toast.success("Workspace created successfully!")
    } catch (err: any) {
      console.error("Error creating workspace:", err)
      toast.error(err.message || "Failed to create workspace")
    } finally {
      setCreating(false)
    }
  }

  const handleJoinWorkspace = async () => {
    if (!joinCode.trim()) {
      toast.error("Please enter an invite code")
      return
    }

    try {
      setJoining(true)

      const response = await fetchWithAuth("/api/workspaces/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: joinCode.toUpperCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join workspace")
      }

      // Refresh workspaces
      await fetchWorkspaces()

      // Reset form and close dialog
      setJoinCode("")
      setJoinDialogOpen(false)

      toast.success(`Joined ${data.workspace.name} successfully!`)
    } catch (err: any) {
      console.error("Error joining workspace:", err)
      toast.error(err.message || "Failed to join workspace")
    } finally {
      setJoining(false)
    }
  }

  const handleOpenWorkplace = (id: string) => {
    if (rememberWorkspace) {
      localStorage.setItem("lastWorkplaceId", id)
    }
    router.push(`/workplace/${id}`)
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast.success("Invite code copied!")
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setCreatedInviteCode(null)
    setNewWorkspace({ name: "", description: "" })
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <h1 className="text-3xl font-bold">FlowTrack</h1>
            </div>

            {/* User Info & Sign Out */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Select Your Workplace</h2>
          <p className="text-muted-foreground">Choose a workplace to access your projects, teams, and tools</p>
        </div>

        {/* Settings Bar */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Switch
              id="remember"
              checked={rememberWorkspace}
              onCheckedChange={setRememberWorkspace}
            />
            <Label htmlFor="remember" className="cursor-pointer">
              Remember my last workplace
            </Label>
          </div>

          <div className="flex gap-2">
            {/* Join Workspace Dialog */}
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Join Workplace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Workplace</DialogTitle>
                  <DialogDescription>
                    Enter the invite code to join an existing workplace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      placeholder="e.g., ABC123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="uppercase font-mono text-lg tracking-wider text-center"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ask the workspace owner for the 6-character invite code
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJoinDialogOpen(false)} disabled={joining}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoinWorkspace} disabled={joining || !joinCode.trim()}>
                    {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Join Workspace
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create Workspace Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Workplace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workplace</DialogTitle>
                  <DialogDescription>
                    Set up a new team workplace with its own projects, boards, and tools
                  </DialogDescription>
                </DialogHeader>

                {!createdInviteCode ? (
                  <>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Workplace Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Engineering Team"
                          value={newWorkspace.name}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of this workplace..."
                          value={newWorkspace.description}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateWorkplace} disabled={creating}>
                        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Workplace
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="space-y-4 py-4">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold">Workplace Created!</h3>
                        <p className="text-sm text-muted-foreground">
                          Share this invite code with your team members
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <Label className="text-xs">Invite Code</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 font-mono text-2xl font-bold text-center tracking-widest p-3 bg-background rounded border-2 border-primary">
                            {createdInviteCode}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyInviteCode(createdInviteCode)}
                          >
                            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This code can be used multiple times to invite team members
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={closeCreateDialog} className="w-full">
                        Done
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <Building2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Workspaces</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchWorkspaces} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Workplaces Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first workplace or join an existing one to get started
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setJoinDialogOpen(true)} variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Join Workplace
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Workplace
              </Button>
            </div>
          </div>
        )}

        {/* Workplace Cards */}
        {!loading && !error && workspaces.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workplace) => (
              <Card key={workplace.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workplace.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {workplace.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-3">
                    {workplace.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Last Active Project */}
                  {workplace.lastActive && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="truncate">{workplace.lastActive}</span>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="flex gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <FolderKanban className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{workplace.projectCount}</span>
                      <span className="text-muted-foreground">projects</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{workplace.memberCount}</span>
                      <span className="text-muted-foreground">members</span>
                    </div>
                  </div>

                  {/* Invite Code for Owners/Admins */}
                  {workplace.inviteCode && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Invite Code:</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-semibold">{workplace.inviteCode}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyInviteCode(workplace.inviteCode!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleOpenWorkplace(workplace.id)}
                    >
                      Open Workplace
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {(workplace.role === "owner" || workplace.role === "admin") && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/workplace/${workplace.id}/settings`)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    Last accessed {workplace.lastAccessed}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
