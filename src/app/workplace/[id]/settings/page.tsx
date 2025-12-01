"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useParams } from "next/navigation"

export default function SettingsPage() {
  const params = useParams()
  const workplaceId = params.id as string

  const workplace = {
    name: workplaceId === "1" ? "Acme Corporation" : workplaceId === "2" ? "Marketing Team" : "Design Studio",
    description: "Main company workspace for all product development teams"
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Workplace Settings</h1>
        <p className="text-muted-foreground">Manage your workplace preferences and configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workplace Information</CardTitle>
              <CardDescription>Update your workplace details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workplace Name</Label>
                <Input id="name" defaultValue={workplace.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" defaultValue={workplace.description} rows={3} />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Workplace</p>
                  <p className="text-sm text-muted-foreground">Permanently delete this workplace and all its data</p>
                </div>
                <Button variant="destructive">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Permissions</CardTitle>
              <CardDescription>Configure default permissions for new members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="create-projects">Can create projects</Label>
                <Switch id="create-projects" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="invite-members">Can invite new members</Label>
                <Switch id="invite-members" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="delete-tasks">Can delete tasks</Label>
                <Switch id="delete-tasks" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-assigned">Task assigned to me</Label>
                <Switch id="task-assigned" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="task-completed">Task completed</Label>
                <Switch id="task-completed" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="comments">New comments</Label>
                <Switch id="comments" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="mentions">Mentions</Label>
                <Switch id="mentions" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>Integrate with external tools and services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <span className="text-xl">S</span>
                  </div>
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <span className="text-xl">G</span>
                  </div>
                  <div>
                    <p className="font-medium">Google Drive</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
