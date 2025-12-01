"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Image as ImageIcon,
  File,
  Folder,
  Upload,
  Download,
  MoreVertical,
  Search,
  Grid3x3,
  List,
  FolderPlus
} from "lucide-react"

const files = [
  { id: 1, name: "Project Proposal.pdf", type: "pdf", size: "2.4 MB", modified: "2 hours ago", folder: "Documents" },
  { id: 2, name: "Design Mockups.fig", type: "figma", size: "12.8 MB", modified: "1 day ago", folder: "Design" },
  { id: 3, name: "API Documentation.md", type: "markdown", size: "156 KB", modified: "3 days ago", folder: "Documents" },
  { id: 4, name: "Screenshot_2024.png", type: "image", size: "4.2 MB", modified: "1 week ago", folder: "Images" },
  { id: 5, name: "Meeting Notes.docx", type: "word", size: "89 KB", modified: "2 weeks ago", folder: "Documents" },
  { id: 6, name: "Budget_Q2.xlsx", type: "excel", size: "245 KB", modified: "1 month ago", folder: "Finance" },
]

const folders = [
  { id: 1, name: "Documents", count: 24 },
  { id: 2, name: "Design", count: 18 },
  { id: 3, name: "Images", count: 45 },
  { id: 4, name: "Finance", count: 12 },
]

export default function FilesPage() {
  const [view, setView] = useState<"grid" | "list">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "word":
      case "markdown":
        return FileText
      case "image":
        return ImageIcon
      default:
        return File
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Files</h1>
          <p className="text-muted-foreground">Store and manage your team's documents and assets</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Organize your files with a new folder
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input id="folder-name" placeholder="e.g., Project Files" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setCreateFolderDialogOpen(false)}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Choose files to upload to your workplace
                </DialogDescription>
              </DialogHeader>
              <div className="py-8">
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, PNG, JPG up to 50MB</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setUploadDialogOpen(false)}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
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

      {/* Folders */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Folders</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {folders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">{folder.count} files</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Files */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Files</h2>
        
        {view === "list" ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.type)
                  return (
                    <div key={file.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{file.folder}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">{file.size}</div>
                      <div className="text-sm text-muted-foreground">{file.modified}</div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.type)
              return (
                <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-3">
                      <Icon className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm truncate mb-1">{file.name}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{file.size}</span>
                      <span>{file.modified}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
