"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, MoreVertical, Loader2, Users } from "lucide-react"
import { useParams } from "next/navigation"
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

export default function MembersPage() {
  const params = useParams()
  const workspaceId = params.id as string

  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (workspaceId) {
      fetchMembers()
    }
  }, [workspaceId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetchWithAuth(`/api/workspaces/${workspaceId}/members`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch members")
      }

      setMembers(data.members || [])
    } catch (err: any) {
      console.error("Error fetching members:", err)
      setError(err.message || "Failed to load members")
      toast.error(err.message || "Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRelativeJoinDate = (joinedAt: Date) => {
    const date = new Date(joinedAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Calculate stats from actual members
  const totalMembers = members.length
  const onlineMembers = 0 // We don't track online status yet
  const adminMembers = members.filter(m => m.role === "admin" || m.role === "owner").length
  const recentJoins = members.filter(m => {
    const joinDate = new Date(m.joinedAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return joinDate > thirtyDaysAgo
  }).length

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchMembers} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team Members</h1>
          <p className="text-muted-foreground">Manage your workplace team and permissions</p>
        </div>

        <Button className="gap-2" disabled>
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Joined This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentJoins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Members List */}
      <Card>
        <CardContent className="p-0">
          {filteredMembers.length > 0 ? (
            <div className="divide-y">
              {filteredMembers.map((member) => (
                <div key={member.id} className="p-4 hover:bg-accent/50 transition-colors flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.photoURL || undefined} alt={member.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background bg-gray-400`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      <Badge variant={
                        member.role === "owner" ? "default" :
                          member.role === "admin" ? "secondary" : "outline"
                      } className="text-xs capitalize">
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Joined {getRelativeJoinDate(member.joinedAt)}
                  </div>

                  <Button variant="ghost" size="icon" disabled>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {searchQuery
                  ? "No members found matching your search"
                  : "No members in this workspace yet"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
