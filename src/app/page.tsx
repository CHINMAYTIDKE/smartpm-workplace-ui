"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to workspaces
        router.push("/workspaces")
      } else {
        // Redirect unauthenticated users to login
        router.push("/login")
      }
    }
  }, [user, loading, router])

  // Show loading state while checking auth
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    </div>
  )
}