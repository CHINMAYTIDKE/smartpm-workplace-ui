"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Zap, ArrowRight, Clock, Users, Mail, MessageSquare, CheckCircle2 } from "lucide-react"

const workflows = [
  {
    id: 1,
    name: "Auto-assign new tasks",
    description: "Automatically assign tasks to team members based on workload",
    trigger: "When task is created",
    action: "Assign to least busy member",
    isActive: true,
    runs: 234
  },
  {
    id: 2,
    name: "Daily standup reminder",
    description: "Send reminder to team for daily standup meeting",
    trigger: "Every weekday at 9:00 AM",
    action: "Send Slack notification",
    isActive: true,
    runs: 156
  },
  {
    id: 3,
    name: "Overdue task alerts",
    description: "Notify assignees when tasks become overdue",
    trigger: "When task is overdue",
    action: "Send email notification",
    isActive: true,
    runs: 89
  },
  {
    id: 4,
    name: "Weekly progress report",
    description: "Generate and send weekly progress reports to stakeholders",
    trigger: "Every Friday at 5:00 PM",
    action: "Generate report and email",
    isActive: false,
    runs: 24
  },
]

const triggerTypes = [
  { icon: Clock, label: "Schedule", description: "Run at specific times" },
  { icon: CheckCircle2, label: "Task Event", description: "When tasks change status" },
  { icon: Users, label: "Team Event", description: "When team members join/leave" },
  { icon: MessageSquare, label: "Comment Added", description: "When someone comments" },
]

const actionTypes = [
  { icon: Mail, label: "Send Email", description: "Send email notifications" },
  { icon: MessageSquare, label: "Slack Message", description: "Post to Slack channel" },
  { icon: Users, label: "Assign Task", description: "Auto-assign to team member" },
  { icon: Zap, label: "Webhook", description: "Trigger external service" },
]

export default function WorkflowPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    trigger: "",
    action: ""
  })

  const handleToggleWorkflow = (id: number) => {
    console.log("Toggling workflow:", id)
  }

  const handleCreateWorkflow = () => {
    console.log("Creating workflow:", newWorkflow)
    setCreateDialogOpen(false)
    setNewWorkflow({ name: "", trigger: "", action: "" })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflow Manager</h1>
          <p className="text-muted-foreground">Automate your team's processes and save time</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Set up automation rules to streamline your team's work
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  placeholder="e.g., Auto-assign urgent tasks"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Select
                  value={newWorkflow.trigger}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}
                >
                  <SelectTrigger id="trigger">
                    <SelectValue placeholder="Select a trigger..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task-created">When task is created</SelectItem>
                    <SelectItem value="task-completed">When task is completed</SelectItem>
                    <SelectItem value="task-overdue">When task becomes overdue</SelectItem>
                    <SelectItem value="schedule-daily">Every day</SelectItem>
                    <SelectItem value="schedule-weekly">Every week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={newWorkflow.action}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, action: value })}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Select an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send-email">Send email notification</SelectItem>
                    <SelectItem value="send-slack">Send Slack message</SelectItem>
                    <SelectItem value="assign-task">Assign task</SelectItem>
                    <SelectItem value="create-task">Create new task</SelectItem>
                    <SelectItem value="webhook">Call webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">503</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Start Templates</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Task Due Date Reminders</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatically remind team members about upcoming deadlines
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Schedule</Badge>
                    <ArrowRight className="w-3 h-3" />
                    <Badge variant="outline">Email</Badge>
                  </div>
                </div>
                <Button size="sm">Use Template</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Smart Task Assignment</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Auto-assign tasks based on team capacity and expertise
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Task Created</Badge>
                    <ArrowRight className="w-3 h-3" />
                    <Badge variant="outline">Assign</Badge>
                  </div>
                </div>
                <Button size="sm">Use Template</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Workflows */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Workflows</h2>
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 ml-13">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">{workflow.trigger}</Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="secondary">{workflow.action}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {workflow.runs} runs
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.isActive}
                        onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                      />
                      <Label className="text-sm">
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
