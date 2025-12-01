"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserPlus, MoreVertical, Mail } from "lucide-react"

const members = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "owner", avatar: "JD", status: "online", joinedDate: "Jan 2023" },
  { id: 2, name: "Sarah Smith", email: "sarah@example.com", role: "admin", avatar: "SS", status: "online", joinedDate: "Feb 2023" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "member", avatar: "MJ", status: "away", joinedDate: "Mar 2023" },
  { id: 4, name: "Emily Brown", email: "emily@example.com", role: "member", avatar: "EB", status: "offline", joinedDate: "Apr 2023" },
  { id: 5, name: "David Lee", email: "david@example.com", role: "member", avatar: "DL", status: "online", joinedDate: "May 2023" },
  { id: 6, name: "Lisa Wang", email: "lisa@example.com", role: "admin", avatar: "LW", status: "online", joinedDate: "Jun 2023" },
]

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInviteMember = () => {
    console.log("Inviting:", inviteEmail, inviteRole)
    setInviteDialogOpen(false)
    setInviteEmail("")
    setInviteRole("member")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team Members</h1>
          <p className="text-muted-foreground">Manage your workplace team and permissions</p>
        </div>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your workplace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember}>
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.filter(m => m.status === "online").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.filter(m => m.role === "admin" || m.role === "owner").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Joined This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
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
          <div className="divide-y">
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-4 hover:bg-accent/50 transition-colors flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>{member.avatar}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                    member.status === "online" ? "bg-green-500" :
                    member.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    <Badge variant={
                      member.role === "owner" ? "default" :
                      member.role === "admin" ? "secondary" : "outline"
                    } className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  Joined {member.joinedDate}
                </div>

                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
