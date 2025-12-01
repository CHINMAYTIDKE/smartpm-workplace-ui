"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  TrendingUp,
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  FileText,
  Calendar,
  Loader2
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/utils/api"
import { toast } from "sonner"

interface WorkspaceMember {
  id: string
  name: string
  email: string
  photoURL: string | null
  role: "owner" | "admin" | "member"
  joinedAt: Date
  status: string
}

interface WorkspaceData {
  id: string
  name: string
  description: string
  memberCount: number
  projectCount: number
}

export default function WorkplaceDashboard() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceData()
    }
  }, [workspaceId])

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch workspace details
      const workspaceRes = await fetchWithAuth(`/api/workspaces/${workspaceId}`)
      const workspaceData = await workspaceRes.json()

      if (!workspaceRes.ok) {
        throw new Error(workspaceData.error || "Failed to fetch workspace")
      }

      // Fetch workspace members
      const membersRes = await fetchWithAuth(`/api/workspaces/${workspaceId}/members`)
      const membersData = await membersRes.json()

      if (!membersRes.ok) {
        throw new Error(membersData.error || "Failed to fetch members")
      }

      setWorkspace({
        id: workspaceData.workspace.id,
        name: workspaceData.workspace.name,
        description: workspaceData.workspace.description,
        memberCount: membersData.totalCount || 0,
        projectCount: workspaceData.workspace.projectCount || 0,
      })

      setMembers(membersData.members || [])
    } catch (err: any) {
      console.error("Error fetching workspace data:", err)
      setError(err.message || "Failed to load dashboard")
      toast.error(err.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || "Failed to load workspace"}</p>
            <Button onClick={fetchWorkspaceData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate stats from real data
  const stats = [
    {
      label: "Active Projects",
      value: workspace.projectCount.toString(),
      icon: FolderKanban,
      trend: workspace.projectCount > 0 ? "Live projects" : "No projects yet",
      color: "text-blue-600"
    },
    {
      label: "Tasks Completed",
      value: "0",
      icon: CheckCircle2,
      trend: "Coming soon",
      color: "text-green-600"
    },
    {
      label: "Team Members",
      value: workspace.memberCount.toString(),
      icon: Users,
      trend: `${members.filter(m => m.role === 'owner' || m.role === 'admin').length} admins`,
      color: "text-purple-600"
    },
    {
      label: "Pending Tasks",
      value: "0",
      icon: Clock,
      trend: "Coming soon",
      color: "text-orange-600"
    },
  ]

  // Show first 4 members for the dashboard
  const displayMembers = members.slice(0, 4)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to {workspace.name}! Here's what's happening in your workplace.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Track progress on ongoing projects</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/workplace/${workspaceId}/projects`)}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No projects yet. Create your first project to get started!</p>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>{workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.photoURL || undefined} alt={member.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background bg-gray-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{member.role}</p>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members found</p>
              </div>
            )}
            {members.length > 4 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => router.push(`/workplace/${workspaceId}/members`)}
              >
                View All Members ({workspace.memberCount})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity. Start collaborating to see updates here!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
