"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Search, Users, AlertCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Dashboard from "./dashboard"

type UserRole = "finder" | "poster"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export default function WorkHopApp() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("parttime_job_finder_user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("parttime_job_finder_user")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = async (email: string, password: string, role: UserRole, name?: string, isSignup?: boolean) => {
    try {
      if (isSignup) {
        // Create new user in database
        const { data, error } = await supabase
          .from("users")
          .insert([
            {
              email,
              name: name || email.split("@")[0],
              role,
            },
          ])
          .select()
          .single()

        if (error) {
          console.error("Error creating user:", error)
          alert("Error creating account. Please try again.")
          return
        }

        const newUser: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
        }

        setUser(newUser)
        localStorage.setItem("parttime_job_finder_user", JSON.stringify(newUser))
      } else {
        // Login existing user
        const { data, error } = await supabase.from("users").select("*").eq("email", email).eq("role", role).single()

        if (error || !data) {
          console.error("User not found:", error)
          alert("User not found. Please check your email and role, or sign up.")
          return
        }

        const existingUser: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
        }

        setUser(existingUser)
        localStorage.setItem("parttime_job_finder_user", JSON.stringify(existingUser))
      }
    } catch (error) {
      console.error("Authentication error:", error)
      alert("Authentication failed. Please try again.")
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("parttime_job_finder_user")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

function AuthPage({
  onLogin,
}: { onLogin: (email: string, password: string, role: UserRole, name?: string, isSignup?: boolean) => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (isSignup: boolean) => {
    setError("")

    if (!selectedRole || !email || !password) {
      setError("Please fill in all required fields")
      return
    }

    if (isSignup && !name) {
      setError("Please enter your full name")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    if (password.length < 3) {
      setError("Password must be at least 3 characters long")
      return
    }

    await onLogin(email, password, selectedRole, isSignup ? name : undefined, isSignup)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Part Time Job Finder</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Connect students with part-time opportunities</p>
        </div>

        {!selectedRole ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg sm:text-xl">Choose Your Role</CardTitle>
              <CardDescription className="text-sm">How will you be using WorkHop?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setSelectedRole("finder")}
                className="w-full h-14 sm:h-16 text-left justify-start space-x-4 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                variant="outline"
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                <div>
                  <div className="font-semibold text-sm sm:text-base">I'm a Job Finder</div>
                  <div className="text-xs sm:text-sm opacity-75">Looking for work opportunities</div>
                </div>
              </Button>

              <Button
                onClick={() => setSelectedRole("poster")}
                className="w-full h-14 sm:h-16 text-left justify-start space-x-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                variant="outline"
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                <div>
                  <div className="font-semibold text-sm sm:text-base">I'm a Job Poster</div>
                  <div className="text-xs sm:text-sm opacity-75">Looking to hire talent</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Welcome {selectedRole === "finder" ? "Job Finder" : "Job Poster"}!</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-lg pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubmit(false)}
                    className="w-full rounded-lg"
                    disabled={!email || !password}
                  >
                    Login as {selectedRole === "finder" ? "Job Finder" : "Job Poster"}
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-lg pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubmit(true)}
                    className="w-full rounded-lg"
                    disabled={!name || !email || !password}
                  >
                    Sign Up as {selectedRole === "finder" ? "Job Finder" : "Job Poster"}
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedRole(null)
                    setError("")
                    setEmail("")
                    setPassword("")
                    setName("")
                    setShowPassword(false)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Change Role
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
