"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Calendar
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

// Mock data
const stats = [
  { label: "Active Projects", value: "12", icon: FolderKanban, trend: "+2 this month", color: "text-blue-600" },
  { label: "Tasks Completed", value: "284", icon: CheckCircle2, trend: "+18% from last week", color: "text-green-600" },
  { label: "Team Members", value: "45", icon: Users, trend: "3 new members", color: "text-purple-600" },
  { label: "Pending Tasks", value: "67", icon: Clock, trend: "12 due this week", color: "text-orange-600" },
]

const activeProjects = [
  { id: 1, name: "Project Alpha", progress: 75, status: "On Track", tasks: 24, members: 8, dueDate: "Apr 15" },
  { id: 2, name: "Mobile App Redesign", progress: 45, status: "In Progress", tasks: 18, members: 5, dueDate: "Apr 30" },
  { id: 3, name: "Backend Infrastructure", progress: 90, status: "Nearly Complete", tasks: 12, members: 6, dueDate: "Apr 10" },
]

const recentActivity = [
  { user: "John Doe", action: "completed task", target: "API Integration", time: "5 min ago", avatar: "JD" },
  { user: "Sarah Smith", action: "commented on", target: "Design System v2", time: "1 hour ago", avatar: "SS" },
  { user: "Mike Johnson", action: "created project", target: "Q2 Marketing Campaign", time: "2 hours ago", avatar: "MJ" },
  { user: "Emily Brown", action: "uploaded file", target: "Wireframes.fig", time: "3 hours ago", avatar: "EB" },
]

const teamMembers = [
  { name: "John Doe", role: "Product Manager", avatar: "JD", status: "online" },
  { name: "Sarah Smith", role: "Lead Designer", avatar: "SS", status: "online" },
  { name: "Mike Johnson", role: "Developer", avatar: "MJ", status: "away" },
  { name: "Emily Brown", role: "UX Researcher", avatar: "EB", status: "offline" },
]

export default function WorkplaceDashboard() {
  const params = useParams()
  const router = useRouter()
  const workplaceId = params.id as string

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening in your workplace.</p>
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
        {/* Active Projects */}
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
                onClick={() => router.push(`/workplace/${workplaceId}/projects`)}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {project.tasks} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {project.members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {project.dueDate}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">{project.status}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Active team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{member.avatar}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                    member.status === "online" ? "bg-green-500" :
                    member.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => router.push(`/workplace/${workplaceId}/members`)}
            >
              View All Members
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
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
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">{activity.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
