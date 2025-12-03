"use client"

import { useState, useEffect } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  MessageSquare,
  FileText,
  Sparkles,
  Workflow,
  Building2,
  ChevronLeft,
  Settings,
  Users,
  Bell,
  Loader2
} from "lucide-react"
import { fetchWithAuth } from "@/lib/utils/api"

const navigation = [
  { name: "Dashboard", href: "", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Files", href: "/files", icon: FileText },
  { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { name: "Workflow Manager", href: "/workflow", icon: Workflow },
]

interface Workspace {
  id: string
  name: string
  description: string
  members: any[]
}

export default function WorkplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const workplaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkspace()
  }, [workplaceId])

  const fetchWorkspace = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth(`/api/workspaces/${workplaceId}`)
      const data = await response.json()

      if (response.ok) {
        setWorkspace(data.workspace)
      }
    } catch (error) {
      console.error("Error fetching workspace:", error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (href: string) => {
    const basePath = `/workplace/${workplaceId}`
    if (href === "") {
      return pathname === basePath
    }
    return pathname.startsWith(basePath + href)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        {/* Workplace Header */}
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 mb-3"
            onClick={() => router.push("/workspaces")}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Workspaces
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : workspace ? (
                <>
                  <h2 className="font-semibold text-sm truncate">{workspace.name}</h2>
                  <p className="text-xs text-muted-foreground">{workspace.members?.length || 0} members</p>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-sm truncate">Workspace</h2>
                  <p className="text-xs text-muted-foreground">-</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Button
                  key={item.name}
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => router.push(`/workplace/${workplaceId}${item.href}`)}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Button>
              )
            })}
          </nav>
        </ScrollArea>

        <Separator />

        {/* Bottom Actions */}
        <div className="p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3"
            onClick={() => router.push(`/workplace/${workplaceId}/members`)}
          >
            <Users className="w-4 h-4" />
            Team Members
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3"
            onClick={() => router.push(`/workplace/${workplaceId}/settings`)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 border-b bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="font-semibold text-lg">smartPM</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
