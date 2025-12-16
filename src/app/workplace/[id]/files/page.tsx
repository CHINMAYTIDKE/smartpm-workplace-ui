"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  FolderPlus,
  Trash2
} from "lucide-react"
import { fetchWithAuth, fetchWithAuthFormData } from "@/lib/utils/api"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileData {
  id: string
  name: string
  type: string
  size: number
  folder: string | null
  storagePath: string
  url: string
  uploadedBy: string
  uploadedAt: string
}

interface FolderData {
  id: string
  name: string
  count: number
  createdBy: string
  createdAt: string
}

export default function FilesPage() {
  const params = useParams()
  const workspaceId = params.id as string

  const [view, setView] = useState<"grid" | "list">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [files, setFiles] = useState<FileData[]>([])
  const [folders, setFolders] = useState<FolderData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [newFolderName, setNewFolderName] = useState("")

  // Fetch files and folders
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch files
      const filesRes = await fetchWithAuth(`/api/workspaces/${workspaceId}/files`)
      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setFiles(filesData.files || [])
      }

      // Fetch folders
      const foldersRes = await fetchWithAuth(`/api/workspaces/${workspaceId}/folders`)
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json()
        setFolders(foldersData.folders || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch files and folders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      fetchData()
    }
  }, [workspaceId])

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileIcon = (type: string) => {
    if (type.includes("pdf") || type.includes("document") || type.includes("text")) {
      return FileText
    }
    if (type.includes("image")) {
      return ImageIcon
    }
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (date: string) => {
    const now = new Date()
    const fileDate = new Date(date)
    const diffMs = now.getTime() - fileDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (selectedFolder) {
        formData.append("folder", selectedFolder)
      }

      const response = await fetchWithAuthFormData(
        `/api/workspaces/${workspaceId}/files`,
        formData
      )

      if (response.ok) {
        toast.success("File uploaded successfully")
        setUploadDialogOpen(false)
        setSelectedFile(null)
        setSelectedFolder("")
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }

    try {
      const response = await fetchWithAuth(`/api/workspaces/${workspaceId}/folders`, {
        method: "POST",
        body: JSON.stringify({ name: newFolderName }),
      })

      if (response.ok) {
        toast.success("Folder created successfully")
        setCreateFolderDialogOpen(false)
        setNewFolderName("")
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create folder")
      }
    } catch (error) {
      console.error("Error creating folder:", error)
      toast.error("Failed to create folder")
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await fetchWithAuth(`/api/workspaces/${workspaceId}/files/${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("File deleted successfully")
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Failed to delete file")
    }
  }

  const handleDownloadFile = (url: string, name: string) => {
    window.open(url, "_blank")
    toast.success(`Downloading ${name}`)
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
                  <Input
                    id="folder-name"
                    placeholder="e.g., Project Files"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>Create</Button>
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
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file-input">Select File</Label>
                  <Input
                    id="file-input"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder-select">Folder (Optional)</Label>
                  <select
                    id="folder-select"
                    className="w-full p-2 border rounded-md"
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                  >
                    <option value="">No folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.name}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFileUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
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
      {folders.length > 0 && (
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
      )}

      {/* Files */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Files</h2>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading files...</p>
        ) : filteredFiles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No files found</p>
        ) : view === "list" ? (
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
                        <p className="text-sm text-muted-foreground">{file.folder || "Root"}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">{formatFileSize(file.size)}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(file.uploadedAt)}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownloadFile(file.url, file.name)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleDeleteFile(file.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadFile(file.url, file.name)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
