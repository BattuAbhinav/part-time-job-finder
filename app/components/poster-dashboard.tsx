"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Briefcase,
  Users,
  Handshake,
  CheckCircle,
  Eye,
  Check,
  X,
  Clock,
  Bell,
  User,
  Mail,
  Phone,
  MapPin,
  Timer,
  DollarSign,
  Building,
  Smartphone,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { WalletService } from "@/lib/wallet-service"
import Notifications from "./notifications"

interface Job {
  id: string
  title: string
  description: string
  budget: number
  postedBy: string
  posterName: string
  createdAt: string
  status: "active" | "completed" | "cancelled"
  category: string
  rolesResponsibilities?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
}

interface Application {
  id: string
  jobId: string
  job: Job
  finderId: string
  finderName?: string
  status: "pending" | "approved" | "rejected"
  appliedAt: string
  message?: string
  studentEmail?: string
  studentContact?: string
  studentDistance?: string
  studentTimeToReach?: string
}

interface Negotiation {
  id: string
  jobId: string
  job: Job
  finderId: string
  finderName?: string
  proposedAmount: number
  message: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  studentEmail?: string
  studentContact?: string
  studentDistance?: string
  studentTimeToReach?: string
}

interface PosterDashboardProps {
  user: any
}

export default function PosterDashboard({ user }: PosterDashboardProps) {
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [negotiations, setNegotiations] = useState<any[]>([])
  const [confirmedJobs, setConfirmedJobs] = useState<(any | any)[]>([])
  const [completingJobs, setCompletingJobs] = useState<Set<string>>(new Set())
  const [showJobPostedDialog, setShowJobPostedDialog] = useState(false)
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null)
  const [showJobDetailsDialog, setShowJobDetailsDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load poster's jobs
      const { data: posterJobs, error: jobsError } = await supabase.from("jobs").select("*").eq("posted_by", user.id)

      if (jobsError) {
        console.error("Error loading jobs:", jobsError)
        return
      }

      const posterJobIds = posterJobs?.map((job) => job.id) || []

      // Load applications for poster's jobs
      const { data: jobApplications, error: appsError } = await supabase
        .from("applications")
        .select(`
        *,
        jobs (*)
      `)
        .in("job_id", posterJobIds)

      if (appsError) {
        console.error("Error loading applications:", appsError)
        return
      }

      // Load negotiations for poster's jobs
      const { data: jobNegotiations, error: negsError } = await supabase
        .from("negotiations")
        .select(`
        *,
        jobs (*)
      `)
        .in("job_id", posterJobIds)

      if (negsError) {
        console.error("Error loading negotiations:", negsError)
        return
      }

      // Transform data to match component interface
      const transformedJobs =
        posterJobs?.map((job) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          postedBy: job.posted_by,
          posterName: job.poster_name,
          createdAt: job.created_at,
          status: job.status as "active" | "completed" | "cancelled",
          category: job.category,
          rolesResponsibilities: job.roles_responsibilities,
          startDate: job.start_date,
          endDate: job.end_date,
          startTime: job.start_time,
          endTime: job.end_time,
        })) || []

      const transformedApplications =
        jobApplications?.map((app) => ({
          id: app.id,
          jobId: app.job_id,
          job: {
            id: app.jobs.id,
            title: app.jobs.title,
            description: app.jobs.description,
            budget: app.jobs.budget,
            postedBy: app.jobs.posted_by,
            posterName: app.jobs.poster_name,
            createdAt: app.jobs.created_at,
            status: app.jobs.status as "active" | "completed" | "cancelled",
            category: app.jobs.category,
            rolesResponsibilities: app.jobs.roles_responsibilities,
            startDate: app.jobs.start_date,
            endDate: app.jobs.end_date,
            startTime: app.jobs.start_time,
            endTime: app.jobs.end_time,
          },
          finderId: app.finder_id,
          finderName: app.finder_name,
          status: app.status as "pending" | "approved" | "rejected",
          appliedAt: app.applied_at,
          message: app.message,
          studentEmail: app.student_email,
          studentContact: app.student_contact,
          studentDistance: app.student_distance,
          studentTimeToReach: app.student_time_to_reach,
        })) || []

      const transformedNegotiations =
        jobNegotiations?.map((neg) => ({
          id: neg.id,
          jobId: neg.job_id,
          job: {
            id: neg.jobs.id,
            title: neg.jobs.title,
            description: neg.jobs.description,
            budget: neg.jobs.budget,
            postedBy: neg.jobs.posted_by,
            posterName: neg.jobs.poster_name,
            createdAt: neg.jobs.created_at,
            status: neg.jobs.status as "active" | "completed" | "cancelled",
            category: neg.jobs.category,
            rolesResponsibilities: neg.jobs.roles_responsibilities,
            startDate: neg.jobs.start_date,
            endDate: neg.jobs.end_date,
            startTime: neg.jobs.start_time,
            endTime: neg.jobs.end_time,
          },
          finderId: neg.finder_id,
          finderName: neg.finder_name,
          proposedAmount: neg.proposed_amount,
          message: neg.message,
          status: neg.status as "pending" | "accepted" | "rejected",
          createdAt: neg.created_at,
          studentEmail: neg.student_email,
          studentContact: neg.student_contact,
          studentDistance: neg.student_distance,
          studentTimeToReach: neg.student_time_to_reach,
        })) || []

      // Get confirmed jobs (approved applications and accepted negotiations) - exclude completed jobs
      const confirmedApps = transformedApplications.filter(
        (app) => app.status === "approved" && app.job.status !== "completed",
      )
      const confirmedNegs = transformedNegotiations.filter(
        (neg) => neg.status === "accepted" && neg.job.status !== "completed",
      )

      setJobs(transformedJobs)
      setApplications(transformedApplications.filter((app) => app.status === "pending"))
      setNegotiations(transformedNegotiations.filter((neg) => neg.status === "pending"))
      setConfirmedJobs([...confirmedApps, ...confirmedNegs])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleCreateJob = async (jobData: Omit<any, "id" | "postedBy" | "posterName" | "createdAt" | "status">) => {
    try {
      const { error } = await supabase.from("jobs").insert([
        {
          title: jobData.title,
          description: jobData.description,
          budget: jobData.budget,
          posted_by: user.id,
          poster_name: user.name,
          category: jobData.category,
          roles_responsibilities: jobData.rolesResponsibilities,
          start_date: jobData.startDate,
          end_date: jobData.endDate,
          start_time: jobData.startTime,
          end_time: jobData.endTime,
        },
      ])

      if (error) {
        console.error("Error creating job:", error)
        return
      }

      setShowJobPostedDialog(true)
      loadData()
    } catch (error) {
      console.error("Error creating job:", error)
    }
  }

  const handleApplicationAction = async (applicationId: string, action: "approve" | "reject") => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", applicationId)

      if (error) {
        console.error("Error updating application:", error)
        return
      }

      // If approved, add pending payment to finder's wallet
      if (action === "approve") {
        const application = applications.find((app) => app.id === applicationId)
        if (application) {
          await WalletService.addPendingPayment(application.finderId, application.job.budget, application.jobId)
        }
      }

      loadData()
    } catch (error) {
      console.error("Error updating application:", error)
    }
  }

  const handleNegotiationAction = async (negotiationId: string, action: "accept" | "reject") => {
    try {
      const { error: negError } = await supabase
        .from("negotiations")
        .update({ status: action === "accept" ? "accepted" : "rejected" })
        .eq("id", negotiationId)

      if (negError) {
        console.error("Error updating negotiation:", negError)
        return
      }

      // If accepted, update the job budget and add pending payment
      if (action === "accept") {
        const { data: negotiation, error: fetchError } = await supabase
          .from("negotiations")
          .select("job_id, proposed_amount, finder_id")
          .eq("id", negotiationId)
          .single()

        if (fetchError) {
          console.error("Error fetching negotiation:", fetchError)
          return
        }

        // Update job budget
        const { error: jobError } = await supabase
          .from("jobs")
          .update({ budget: negotiation.proposed_amount })
          .eq("id", negotiation.job_id)

        if (jobError) {
          console.error("Error updating job budget:", jobError)
          return
        }

        // Add pending payment
        await WalletService.addPendingPayment(negotiation.finder_id, negotiation.proposed_amount, negotiation.job_id)
      }

      loadData()
    } catch (error) {
      console.error("Error updating negotiation:", error)
    }
  }

  const handleCompleteJob = async (jobId: string, finderId: string, finalAmount: number, paymentMethod: string) => {
    // Prevent multiple completion attempts
    if (completingJobs.has(jobId)) {
      return
    }

    setCompletingJobs((prev) => new Set(prev).add(jobId))

    try {
      // Check if job is already completed
      const isCompleted = await WalletService.isJobCompleted(jobId, finderId)
      if (isCompleted) {
        console.log("Job already completed")
        loadData()
        return
      }

      const success = await WalletService.completeJob(
        jobId,
        finderId,
        user.id,
        finalAmount,
        `Job completed with ${paymentMethod} payment`,
      )
      if (success) {
        alert(`Payment completed successfully via ${paymentMethod}!`)
        loadData() // Refresh data
      } else {
        console.error("Failed to complete job")
        alert("Failed to complete job. Please try again.")
      }
    } catch (error) {
      console.error("Error completing job:", error)
      alert("Error completing job. Please try again.")
    } finally {
      setCompletingJobs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleViewJobDetails = (job: any) => {
    setSelectedJobDetails(job)
    setShowJobDetailsDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Poster Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="rounded-full">
            {jobs.length} Active Jobs
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="post" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 rounded-xl bg-white p-1 shadow-sm border">
          <TabsTrigger
            value="post"
            className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Job
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Manage Jobs
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger
            value="negotiations"
            className="rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <Handshake className="h-4 w-4 mr-2" />
            Negotiations
          </TabsTrigger>
          <TabsTrigger
            value="confirmed"
            className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmed
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="post" className="space-y-6">
          <PostJobForm onCreateJob={handleCreateJob} />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Manage Your Jobs</CardTitle>
              <CardDescription>View and manage all your posted jobs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                  <p className="text-gray-500">Create your first job posting to get started</p>
                </div>
              ) : (
                jobs.map((job) => <JobManagementCard key={job.id} job={job} onViewDetails={handleViewJobDetails} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Job Applications</CardTitle>
              <CardDescription>Review and respond to applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
                  <p className="text-gray-500">Applications will appear here when finders apply to your jobs</p>
                </div>
              ) : (
                applications.map((application) => (
                  <ApplicationReviewCard
                    key={application.id}
                    application={application}
                    onAction={handleApplicationAction}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negotiations" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Negotiation Requests</CardTitle>
              <CardDescription>Review and respond to price negotiations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {negotiations.length === 0 ? (
                <div className="text-center py-12">
                  <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending negotiations</h3>
                  <p className="text-gray-500">
                    Negotiation requests will appear here when finders propose different amounts
                  </p>
                </div>
              ) : (
                negotiations.map((negotiation) => (
                  <NegotiationReviewCard
                    key={negotiation.id}
                    negotiation={negotiation}
                    onAction={handleNegotiationAction}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Confirmed Engagements</CardTitle>
              <CardDescription>Jobs that have been approved or accepted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {confirmedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No confirmed jobs yet</h3>
                  <p className="text-gray-500">Approved applications and accepted negotiations will appear here</p>
                </div>
              ) : (
                confirmedJobs.map((item) => (
                  <ConfirmedJobCard
                    key={item.id}
                    item={item}
                    onComplete={handleCompleteJob}
                    isCompleting={completingJobs.has(item.jobId)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Notifications</CardTitle>
              <CardDescription>Stay updated on applications and job status</CardDescription>
            </CardHeader>
            <CardContent>
              <Notifications user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Posted Confirmation Dialog */}
      <Dialog open={showJobPostedDialog} onOpenChange={setShowJobPostedDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-green-600">Job Posted Successfully!</DialogTitle>
            <DialogDescription>
              Your job has been posted and is now visible to finders. You'll receive notifications when someone applies.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowJobPostedDialog(false)} className="rounded-lg">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={showJobDetailsDialog} onOpenChange={setShowJobDetailsDialog}>
        <DialogContent className="rounded-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJobDetails && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedJobDetails.title}</h3>
                <Badge variant="outline" className="rounded-full mt-1">
                  {selectedJobDetails.category}
                </Badge>
              </div>

              <div>
                <Label className="font-medium">Description:</Label>
                <p className="text-gray-700 mt-1">{selectedJobDetails.description}</p>
              </div>

              {selectedJobDetails.rolesResponsibilities && (
                <div>
                  <Label className="font-medium">Roles & Responsibilities:</Label>
                  <p className="text-gray-700 mt-1">{selectedJobDetails.rolesResponsibilities}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Budget:</Label>
                  <p className="text-green-600 font-semibold">₹{selectedJobDetails.budget.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-medium">Status:</Label>
                  <Badge
                    variant={selectedJobDetails.status === "active" ? "default" : "secondary"}
                    className="rounded-full ml-2"
                  >
                    {selectedJobDetails.status}
                  </Badge>
                </div>
              </div>

              {(selectedJobDetails.startDate || selectedJobDetails.endDate) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Start Date:</Label>
                    <p className="text-gray-700">{selectedJobDetails.startDate || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="font-medium">End Date:</Label>
                    <p className="text-gray-700">{selectedJobDetails.endDate || "Not specified"}</p>
                  </div>
                </div>
              )}

              {(selectedJobDetails.startTime || selectedJobDetails.endTime) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Start Time:</Label>
                    <p className="text-gray-700">{selectedJobDetails.startTime || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="font-medium">End Time:</Label>
                    <p className="text-gray-700">{selectedJobDetails.endTime || "Not specified"}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="font-medium">Posted:</Label>
                <p className="text-gray-700">{new Date(selectedJobDetails.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PostJobForm({
  onCreateJob,
}: { onCreateJob: (job: Omit<any, "id" | "postedBy" | "posterName" | "createdAt" | "status">) => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [category, setCategory] = useState("")
  const [rolesResponsibilities, setRolesResponsibilities] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !budget || !category) return

    onCreateJob({
      title,
      description,
      budget: Number.parseFloat(budget),
      category,
      rolesResponsibilities,
      startDate,
      endDate,
      startTime,
      endTime,
    })

    // Reset form
    setTitle("")
    setDescription("")
    setBudget("")
    setCategory("")
    setRolesResponsibilities("")
    setStartDate("")
    setEndDate("")
    setStartTime("")
    setEndTime("")
  }

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Create New Job Posting</CardTitle>
        <CardDescription>Post a new job to find the right talent</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Math Tutor Required"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="hotel-care">Hotel Care</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the job requirements, deliverables, and any specific skills needed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg min-h-[120px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roles">Roles & Responsibilities</Label>
            <Textarea
              id="roles"
              placeholder="List the specific roles and responsibilities for this position..."
              value={rolesResponsibilities}
              onChange={(e) => setRolesResponsibilities(e.target.value)}
              className="rounded-lg min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (₹) *</Label>
            <Input
              id="budget"
              type="number"
              placeholder="e.g. 15000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="rounded-lg"
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>

          <Button type="submit" className="w-full rounded-lg" disabled={!title || !description || !budget || !category}>
            <Plus className="h-4 w-4 mr-2" />
            Post Job
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function JobManagementCard({ job, onViewDetails }: { job: any; onViewDetails: (job: any) => void }) {
  return (
    <Card className="rounded-lg border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <Badge variant="outline" className="rounded-full">
                {job.category}
              </Badge>
              <span>•</span>
              <Badge variant={job.status === "active" ? "default" : "secondary"} className="rounded-full">
                {job.status}
              </Badge>
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="text-2xl font-bold text-green-600 mb-2">₹{job.budget.toLocaleString()}</div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg bg-transparent"
              onClick={() => onViewDetails(job)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationReviewCard({
  application,
  onAction,
}: {
  application: any
  onAction: (id: string, action: "approve" | "reject") => void
}) {
  return (
    <Card className="rounded-lg border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{application.job.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>Applied by {application.finderName}</span>
              <span>•</span>
              <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Budget: ₹{application.job.budget.toLocaleString()}</span>
            </div>

            {/* Student Details Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Student Details:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{application.studentEmail || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{application.studentContact || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{application.studentDistance || "5 km"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span>{application.studentTimeToReach || "30 mins"}</span>
                </div>
              </div>
            </div>

            {application.message && (
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <p className="text-sm text-gray-700">"{application.message}"</p>
              </div>
            )}
            <div className="flex space-x-2">
              <Button
                onClick={() => onAction(application.id, "approve")}
                size="sm"
                className="rounded-lg bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onAction(application.id, "reject")}
                variant="outline"
                size="sm"
                className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
          <div className="ml-6">
            <Badge className="rounded-full bg-yellow-100 text-yellow-800">
              <Clock className="h-4 w-4 mr-1" />
              Pending Review
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NegotiationReviewCard({
  negotiation,
  onAction,
}: {
  negotiation: any
  onAction: (id: string, action: "accept" | "reject") => void
}) {
  return (
    <Card className="rounded-lg border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{negotiation.job.title}</h3>
            <div className="flex items-center space-x-4 mb-3">
              <span className="text-sm text-gray-500">Your Budget: ₹{negotiation.job.budget.toLocaleString()}</span>
              <span className="text-sm text-gray-400">→</span>
              <span className="text-lg font-semibold text-blue-600">
                Proposed: ₹{negotiation.proposedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>By {negotiation.finderName}</span>
              <span>•</span>
              <span>{new Date(negotiation.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Student Details Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Student Details:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{negotiation.studentEmail || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{negotiation.studentContact || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{negotiation.studentDistance || "5 km"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span>{negotiation.studentTimeToReach || "30 mins"}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-700">"{negotiation.message}"</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => onAction(negotiation.id, "accept")}
                size="sm"
                className="rounded-lg bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Proposal
              </Button>
              <Button
                onClick={() => onAction(negotiation.id, "reject")}
                variant="outline"
                size="sm"
                className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
          <div className="ml-6">
            <Badge className="rounded-full bg-yellow-100 text-yellow-800">
              <Clock className="h-4 w-4 mr-1" />
              Pending Review
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ConfirmedJobCard({
  item,
  onComplete,
  isCompleting = false,
}: {
  item: Application | Negotiation
  onComplete?: (jobId: string, finderId: string, finalAmount: number, paymentMethod: string) => void
  isCompleting?: boolean
}) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const isNegotiation = "proposedAmount" in item
  const finalAmount = isNegotiation ? item.proposedAmount : item.job.budget

  const handleCompletePayment = async () => {
    if (!selectedPaymentMethod || !onComplete) return

    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Call the completion handler with payment method
      onComplete(item.job.id, item.finderId, finalAmount, selectedPaymentMethod)

      setShowPaymentDialog(false)
      setSelectedPaymentMethod("")
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="rounded-lg border border-gray-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.job.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>
                {isNegotiation ? "Negotiation accepted" : "Application approved"} on{" "}
                {new Date(isNegotiation ? item.createdAt : item.appliedAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="font-semibold text-green-600">Final Amount: ₹{finalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>Assigned to: {item.finderName}</span>
            </div>
            {isNegotiation && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <span>Original: ₹{item.job.budget.toLocaleString()}</span>
                <span>→</span>
                <span>Negotiated: ₹{item.proposedAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Student Details Section */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Student Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{item.finderName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{item.studentEmail || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{item.studentContact || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{item.studentDistance || "5 km"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span>{item.studentTimeToReach || "30 mins"}</span>
                </div>
              </div>
            </div>

            {/* Payment Action Button */}
            {onComplete && (
              <div className="mt-4">
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="rounded-lg bg-blue-600 hover:bg-blue-700"
                      disabled={isCompleting || isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isCompleting || isProcessing ? "Processing..." : "Mark as Complete and Make Payment"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-xl max-w-md">
                    <DialogHeader>
                      <DialogTitle>Complete Job & Make Payment</DialogTitle>
                      <DialogDescription>Complete "{item.job.title}" and process payment</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Payment Amount Display */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-center">
                          <p className="text-sm text-green-600 mb-1">Payment Amount</p>
                          <p className="text-3xl font-bold text-green-700">₹{finalAmount.toLocaleString()}</p>
                          <p className="text-xs text-green-600 mt-1">
                            {isNegotiation ? "Negotiated Amount" : "Original Job Amount"}
                          </p>
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Select Payment Method</Label>

                        <div className="space-y-2">
                          <Button
                            variant={selectedPaymentMethod === "cash" ? "default" : "outline"}
                            className="w-full justify-start h-12 rounded-lg"
                            onClick={() => setSelectedPaymentMethod("cash")}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-100 rounded-full">
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium">Cash Payment</div>
                                <div className="text-xs text-gray-500">Pay in cash directly</div>
                              </div>
                            </div>
                          </Button>

                          <Button
                            variant={selectedPaymentMethod === "upi" ? "default" : "outline"}
                            className="w-full justify-start h-12 rounded-lg"
                            onClick={() => setSelectedPaymentMethod("upi")}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <Smartphone className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium">UPI Payment</div>
                                <div className="text-xs text-gray-500">Pay via UPI apps</div>
                              </div>
                            </div>
                          </Button>

                          <Button
                            variant={selectedPaymentMethod === "bank" ? "default" : "outline"}
                            className="w-full justify-start h-12 rounded-lg"
                            onClick={() => setSelectedPaymentMethod("bank")}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-100 rounded-full">
                                <Building className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium">Bank Transfer</div>
                                <div className="text-xs text-gray-500">Direct bank transfer</div>
                              </div>
                            </div>
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleCompletePayment}
                          className="flex-1 rounded-lg"
                          disabled={!selectedPaymentMethod || isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete & Pay
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPaymentDialog(false)
                            setSelectedPaymentMethod("")
                          }}
                          className="rounded-lg"
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>

                      {selectedPaymentMethod && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700">
                            <strong>Note:</strong> By completing this job, you confirm that the work has been finished
                            satisfactorily and you're ready to process payment via {selectedPaymentMethod}.
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          <div className="ml-6">
            <Badge className="rounded-full bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmed
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
