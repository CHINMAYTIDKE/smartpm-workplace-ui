"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Users, FolderKanban, Plus, Settings, ChevronRight, Clock } from "lucide-react"

// Mock data for workplaces
const mockWorkplaces = [
  {
    id: "1",
    name: "Acme Corporation",
    description: "Main company workspace for all product development teams",
    lastActive: "Project Alpha - Mobile App",
    projectCount: 12,
    memberCount: 45,
    role: "owner",
    lastAccessed: "2 hours ago"
  },
  {
    id: "2",
    name: "Marketing Team",
    description: "Marketing campaigns, content creation, and brand management",
    lastActive: "Q1 Campaign Launch",
    projectCount: 8,
    memberCount: 15,
    role: "admin",
    lastAccessed: "1 day ago"
  },
  {
    id: "3",
    name: "Design Studio",
    description: "Creative projects and design system development",
    lastActive: "Website Redesign",
    projectCount: 5,
    memberCount: 8,
    role: "member",
    lastAccessed: "3 days ago"
  }
]

export default function WorkspacesPage() {
  const router = useRouter()
  const [rememberWorkspace, setRememberWorkspace] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "" })

  const handleOpenWorkplace = (id: string) => {
    if (rememberWorkspace) {
      localStorage.setItem("lastWorkplaceId", id)
    }
    router.push(`/workplace/${id}`)
  }

  const handleCreateWorkplace = () => {
    // In a real app, this would create the workplace via API
    console.log("Creating workplace:", newWorkspace)
    setCreateDialogOpen(false)
    setNewWorkspace({ name: "", description: "" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <h1 className="text-3xl font-bold">smartPM</h1>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Select Your Workplace</h2>
          <p className="text-muted-foreground">Choose a workplace to access your projects, teams, and tools</p>
        </div>

        {/* Settings Bar */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
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
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkplace}>Create Workplace</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workplace Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockWorkplaces.map((workplace) => (
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
                  {workplace.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Last Active Project */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="truncate">{workplace.lastActive}</span>
                </div>

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
      </div>
    </div>
  )
}
