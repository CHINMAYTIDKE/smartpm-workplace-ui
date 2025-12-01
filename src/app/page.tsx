"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Simulate checking for authentication
    const isAuthenticated = true // In a real app, check auth state
    
    if (isAuthenticated) {
      // Redirect to workspaces after a brief moment
      const timer = setTimeout(() => {
        router.push("/workspaces")
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="flex flex-col items-center gap-8 text-center px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            smartPM
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-md">
          Your intelligent project management platform
        </p>
        <div className="flex gap-4 mt-4">
          <Button size="lg" onClick={() => router.push("/workspaces")}>
            Enter Workspace
          </Button>
        </div>
      </div>
    </div>
  )
}