"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Briefcase, Bell, LogOut } from "lucide-react"
import FinderDashboard from "./components/finder-dashboard"
import PosterDashboard from "./components/poster-dashboard"

interface User {
  id: string
  email: string
  name: string
  role: "finder" | "poster"
}

interface DashboardProps {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Part Time Job Finder</h1>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">
                    {user.role === "finder" ? "Find Your Next Opportunity" : "Hire Talented Students"}
                  </span>
                </div>
              </div>
              <Badge
                variant={user.role === "finder" ? "default" : "secondary"}
                className="rounded-full text-xs sm:text-sm"
              >
                {user.role === "finder" ? "Job Finder" : "Job Poster"}
              </Badge>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs sm:text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
              </div>

              <Button variant="ghost" size="sm" onClick={onLogout} className="p-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {user.role === "finder" ? <FinderDashboard user={user} /> : <PosterDashboard user={user} />}
      </main>
    </div>
  )
}
