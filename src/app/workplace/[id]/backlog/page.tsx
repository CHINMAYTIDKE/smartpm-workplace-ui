"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, GripVertical, Search, ArrowUp, Calendar, Tag } from "lucide-react"

const backlogItems = [
  { id: 1, title: "Implement dark mode toggle", description: "Add system-wide dark mode support", priority: "High", status: "Ready", points: 8, labels: ["Frontend", "UX"], assignee: "JD" },
  { id: 2, title: "Add export to PDF feature", description: "Allow users to export reports as PDF", priority: "Medium", status: "Ready", points: 5, labels: ["Feature"], assignee: "SS" },
  { id: 3, title: "Optimize database queries", description: "Improve query performance for analytics", priority: "High", status: "In Review", points: 13, labels: ["Backend", "Performance"], assignee: "MJ" },
  { id: 4, title: "Add email notifications", description: "Send notifications for task updates", priority: "Medium", status: "Ready", points: 8, labels: ["Feature", "Backend"], assignee: null },
  { id: 5, title: "Create onboarding tutorial", description: "Interactive guide for new users", priority: "Low", status: "Backlog", points: 5, labels: ["UX", "Documentation"], assignee: null },
  { id: 6, title: "Implement file versioning", description: "Track file history and allow rollback", priority: "High", status: "Backlog", points: 13, labels: ["Feature", "Backend"], assignee: null },
  { id: 7, title: "Add real-time collaboration", description: "Enable simultaneous editing", priority: "High", status: "Backlog", points: 21, labels: ["Feature", "Backend"], assignee: null },
  { id: 8, title: "Mobile app improvements", description: "Fix responsive issues on mobile", priority: "Medium", status: "Backlog", points: 8, labels: ["Mobile", "Bug"], assignee: null },
]

export default function BacklogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    priority: "medium",
    points: "5"
  })

  const filteredItems = backlogItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateItem = () => {
    console.log("Creating backlog item:", newItem)
    setCreateDialogOpen(false)
    setNewItem({ title: "", description: "", priority: "medium", points: "5" })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Backlog</h1>
          <p className="text-muted-foreground">Prioritize and manage your team's work items</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Backlog Item</DialogTitle>
              <DialogDescription>
                Add a new item to the backlog
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-title">Title</Label>
                <Input
                  id="item-title"
                  placeholder="e.g., Add search functionality"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  placeholder="Detailed description..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newItem.priority}
                    onValueChange={(value) => setNewItem({ ...newItem, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Story Points</Label>
                  <Select
                    value={newItem.points}
                    onValueChange={(value) => setNewItem({ ...newItem, points: value })}
                  >
                    <SelectTrigger id="points">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="13">13</SelectItem>
                      <SelectItem value="21">21</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem}>Create Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search backlog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" className="gap-2">
          <ArrowUp className="w-4 h-4" />
          Sort by Priority
        </Button>
      </div>

      {/* Backlog Items */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <Badge variant={
                          item.priority === "High" ? "destructive" :
                          item.priority === "Medium" ? "default" : "secondary"
                        }>
                          {item.priority}
                        </Badge>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <div className="flex gap-1">
                          {item.labels.map((label) => (
                            <Badge key={label} variant="secondary" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.points} points
                      </div>
                    </div>

                    {item.assignee ? (
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs">{item.assignee}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Button variant="outline" size="sm">Assign</Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
