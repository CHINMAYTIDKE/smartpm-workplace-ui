"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Grid3x3, List, Search, Users, Calendar, CheckCircle2, Clock } from "lucide-react"

const projects = [
  {
    id: 1,
    name: "Project Alpha",
    description: "Next-gen mobile application for customer engagement",
    status: "In Progress",
    progress: 75,
    tasks: { total: 24, completed: 18 },
    members: 8,
    dueDate: "Apr 15, 2024",
    priority: "High"
  },
  {
    id: 2,
    name: "Mobile App Redesign",
    description: "Complete UI/UX overhaul of existing mobile application",
    status: "In Progress",
    progress: 45,
    tasks: { total: 18, completed: 8 },
    members: 5,
    dueDate: "Apr 30, 2024",
    priority: "Medium"
  },
  {
    id: 3,
    name: "Backend Infrastructure",
    description: "Scalable backend architecture for new services",
    status: "Nearly Complete",
    progress: 90,
    tasks: { total: 12, completed: 11 },
    members: 6,
    dueDate: "Apr 10, 2024",
    priority: "High"
  },
  {
    id: 4,
    name: "Marketing Campaign Q2",
    description: "Strategic marketing initiatives for Q2 2024",
    status: "Planning",
    progress: 15,
    tasks: { total: 20, completed: 3 },
    members: 4,
    dueDate: "Jun 30, 2024",
    priority: "Low"
  },
]

export default function ProjectsPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    priority: "medium",
    dueDate: ""
  })

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProject = () => {
    console.log("Creating project:", newProject)
    setCreateDialogOpen(false)
    setNewProject({ name: "", description: "", priority: "medium", dueDate: "" })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your team projects</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new project for your team to collaborate on
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Website Redesign"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Brief description of the project..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newProject.priority}
                    onValueChange={(value) => setNewProject({ ...newProject, priority: value })}
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
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "list")}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <Grid3x3 className="w-4 h-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Projects Grid/List */}
      {view === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant={
                    project.priority === "High" ? "destructive" :
                    project.priority === "Medium" ? "default" : "secondary"
                  }>
                    {project.priority}
                  </Badge>
                </div>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{project.tasks.completed}/{project.tasks.total} tasks</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{project.members}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                  <Calendar className="w-4 h-4" />
                  <span>Due {project.dueDate}</span>
                </div>

                <Badge variant="outline" className="w-full justify-center">
                  {project.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <Badge variant={
                          project.priority === "High" ? "destructive" :
                          project.priority === "Medium" ? "default" : "secondary"
                        }>
                          {project.priority}
                        </Badge>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex-1 max-w-md">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{project.tasks.completed}/{project.tasks.total} tasks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{project.members} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Due {project.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
