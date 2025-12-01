"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, MoreHorizontal, Calendar, MessageSquare } from "lucide-react"

const initialTasks = {
  todo: [
    { id: 1, title: "Design new landing page", description: "Create mockups for the new landing page", priority: "High", assignee: "JD", comments: 3, dueDate: "Apr 15" },
    { id: 2, title: "Write API documentation", description: "Document all REST API endpoints", priority: "Medium", assignee: "SS", comments: 1, dueDate: "Apr 18" },
    { id: 3, title: "Setup CI/CD pipeline", description: "Configure automated deployment", priority: "High", assignee: "MJ", comments: 5, dueDate: "Apr 12" },
  ],
  inProgress: [
    { id: 4, title: "Implement user authentication", description: "Add OAuth2 support", priority: "High", assignee: "MJ", comments: 8, dueDate: "Apr 10" },
    { id: 5, title: "Database migration", description: "Migrate to PostgreSQL", priority: "Medium", assignee: "EB", comments: 2, dueDate: "Apr 14" },
  ],
  done: [
    { id: 6, title: "Create project wireframes", description: "Initial wireframes approved", priority: "Medium", assignee: "SS", comments: 12, dueDate: "Apr 5" },
    { id: 7, title: "Setup development environment", description: "Docker containers configured", priority: "Low", assignee: "JD", comments: 4, dueDate: "Apr 3" },
  ],
}

export default function BoardsPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    column: "todo"
  })

  const handleCreateTask = () => {
    console.log("Creating task:", newTask)
    setCreateDialogOpen(false)
    setNewTask({ title: "", description: "", priority: "medium", column: "todo" })
  }

  const columns = [
    { id: "todo", title: "To Do", tasks: tasks.todo, color: "bg-gray-100 dark:bg-gray-800" },
    { id: "inProgress", title: "In Progress", tasks: tasks.inProgress, color: "bg-blue-100 dark:bg-blue-900/20" },
    { id: "done", title: "Done", tasks: tasks.done, color: "bg-green-100 dark:bg-green-900/20" },
  ]

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kanban Board</h1>
          <p className="text-muted-foreground">Visualize and manage your team's workflow</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your board
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Implement login feature"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Task details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
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
                  <Label htmlFor="column">Column</Label>
                  <Select
                    value={newTask.column}
                    onValueChange={(value) => setNewTask({ ...newTask, column: value })}
                  >
                    <SelectTrigger id="column">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="inProgress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-1 min-w-[320px]">
            <Card className={column.color}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {column.tasks.length}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {column.tasks.map((task) => (
                  <Card key={task.id} className="bg-background hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm leading-tight flex-1">
                          {task.title}
                        </h4>
                        <Badge variant={
                          task.priority === "High" ? "destructive" :
                          task.priority === "Medium" ? "default" : "secondary"
                        } className="ml-2 text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{task.comments}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                        
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">{task.assignee}</AvatarFallback>
                        </Avatar>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
