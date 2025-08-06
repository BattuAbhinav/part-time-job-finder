"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Search,
  MapPin,
  Clock,
  DollarSign,
  Send,
  Handshake,
  CheckCircle,
  Eye,
  Wallet,
  Bell,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Timer,
  User,
  Mail,
  Phone,
  Building,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { WalletService, type Transaction, type WithdrawalHistory } from "@/lib/wallet-service"
import {
  WithdrawButtonComponent,
  TransactionCardComponent,
  WithdrawalHistoryComponent,
} from "./wallet-components"
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
  status: "pending" | "approved" | "rejected"
  appliedAt: string
  message?: string
}

interface Negotiation {
  id: string
  jobId: string
  job: Job
  finderId: string
  proposedAmount: number
  message: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

interface FinderDashboardProps {
  user: any
}

export default function FinderDashboard({ user }: FinderDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [confirmedJobs, setConfirmedJobs] = useState<(Application | Negotiation)[]>([])
  const [pastJobs, setPastJobs] = useState<(Application | Negotiation)[]>([])
  const [walletData, setWalletData] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)

  useEffect(() => {
    loadData()
    loadWalletData()
  }, [])

  const loadData = async () => {
    try {
      // Load all active jobs
      const { data: allJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (jobsError) {
        console.error("Error loading jobs:", jobsError)
        return
      }

      // Load user's applications
      const { data: userApplications, error: appsError } = await supabase
        .from("applications")
        .select(`
        *,
        jobs (*)
      `)
        .eq("finder_id", user.id)

      if (appsError) {
        console.error("Error loading applications:", appsError)
        return
      }

      // Load user's negotiations
      const { data: userNegotiations, error: negsError } = await supabase
        .from("negotiations")
        .select(`
        *,
        jobs (*)
      `)
        .eq("finder_id", user.id)

      if (negsError) {
        console.error("Error loading negotiations:", negsError)
        return
      }

      // Transform data to match component interface
      const transformedJobs =
        allJobs?.map((job) => ({
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
        userApplications?.map((app) => ({
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
          status: app.status as "pending" | "approved" | "rejected",
          appliedAt: app.applied_at,
          message: app.message,
        })) || []

      const transformedNegotiations =
        userNegotiations?.map((neg) => ({
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
          proposedAmount: neg.proposed_amount,
          message: neg.message,
          status: neg.status as "pending" | "accepted" | "rejected",
          createdAt: neg.created_at,
        })) || []

      // Separate confirmed jobs (approved applications and accepted negotiations) from completed ones
      const confirmedApps = transformedApplications.filter(
        (app) => app.status === "approved" && app.job.status !== "completed",
      )
      const confirmedNegs = transformedNegotiations.filter(
        (neg) => neg.status === "accepted" && neg.job.status !== "completed",
      )

      // Past jobs are completed jobs
      const pastApps = transformedApplications.filter(
        (app) => app.status === "approved" && app.job.status === "completed",
      )
      const pastNegs = transformedNegotiations.filter(
        (neg) => neg.status === "accepted" && neg.job.status === "completed",
      )

      setJobs(transformedJobs)
      setApplications(transformedApplications.filter((app) => app.status === "pending"))
      setNegotiations(transformedNegotiations.filter((neg) => neg.status === "pending"))
      setConfirmedJobs([...confirmedApps, ...confirmedNegs])
      setPastJobs([...pastApps, ...pastNegs])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const loadWalletData = async () => {
    try {
      const wallet = await WalletService.getWallet(user.id)
      const transactionHistory = await WalletService.getTransactions(user.id)
      const withdrawals = await WalletService.getWithdrawalHistory(user.id)

      setWalletData(wallet)
      setTransactions(transactionHistory)
      setWithdrawalHistory(withdrawals)
    } catch (error) {
      console.error("Error loading wallet data:", error)
    }
  }

  const handleApplyToJob = async (jobId: string, message: string, studentDetails: any) => {
    try {
      const { error } = await supabase.from("applications").insert([
        {
          job_id: jobId,
          finder_id: user.id,
          finder_name: user.name,
          message,
          student_email: studentDetails.email,
          student_contact: studentDetails.contact,
          student_distance: studentDetails.distance,
          student_time_to_reach: studentDetails.timeToReach,
        },
      ])

      if (error) {
        console.error("Error applying to job:", error)
        return
      }

      loadData()
    } catch (error) {
      console.error("Error applying to job:", error)
    }
  }

  const handleNegotiate = async (
    jobId: string,
    proposedAmount: number,
    message: string,
    studentDetails: any,
  ) => {
    try {
      const { error } = await supabase.from("negotiations").insert([
        {
          job_id: jobId,
          finder_id: user.id,
          finder_name: user.name,
          proposed_amount: proposedAmount,
          message,
          student_email: studentDetails.email,
          student_contact: studentDetails.contact,
          student_distance: studentDetails.distance,
          student_time_to_reach: studentDetails.timeToReach,
        },
      ])

      if (error) {
        console.error("Error creating negotiation:", error)
        return
      }

      loadData()
    } catch (error) {
      console.error("Error creating negotiation:", error)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || job.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job)
    setShowJobDetails(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Finder Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="rounded-full">
            {applications.length} Pending Applications
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 rounded-xl bg-white p-1 shadow-sm border">
          <TabsTrigger
            value="browse"
            className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Browse Jobs</span>
            <span className="sm:hidden">Browse</span>
          </TabsTrigger>
          <TabsTrigger
            value="applied"
            className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
          >
            <Send className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Applied Jobs</span>
            <span className="sm:hidden">Applied</span>
          </TabsTrigger>
          <TabsTrigger
            value="negotiate"
            className="rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <Handshake className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Negotiate</span>
            <span className="sm:hidden">Negotiate</span>
          </TabsTrigger>
          <TabsTrigger
            value="confirmed"
            className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Confirmed Jobs</span>
            <span className="sm:hidden">Confirmed</span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-lg data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700"
          >
            <History className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Past Jobs</span>
            <span className="sm:hidden">Past</span>
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
          >
            <Wallet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Wallet</span>
            <span className="sm:hidden">Wallet</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 col-span-3 sm:col-span-1"
          >
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Browse Available Jobs</CardTitle>
              <CardDescription>Find part-time opportunities that match your skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search jobs by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48 rounded-lg">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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

              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={handleApplyToJob}
                      onNegotiate={handleNegotiate}
                      onViewDetails={handleViewJobDetails}
                      user={user}
                      hasApplied={applications.some((app) => app.jobId === job.id)}
                      hasNegotiated={negotiations.some((neg) => neg.jobId === job.id)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applied" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Your Applications</CardTitle>
              <CardDescription>Track the status of your job applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-500">Start applying to jobs to see them here</p>
                </div>
              ) : (
                applications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negotiate" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Your Negotiations</CardTitle>
              <CardDescription>Track your price negotiation requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {negotiations.length === 0 ? (
                <div className="text-center py-12">
                  <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No negotiations yet</h3>
                  <p className="text-gray-500">Start negotiating on jobs to see them here</p>
                </div>
              ) : (
                negotiations.map((negotiation) => (
                  <NegotiationCard key={negotiation.id} negotiation={negotiation} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Confirmed Jobs</CardTitle>
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
                confirmedJobs.map((item) => <ConfirmedJobCard key={item.id} item={item} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Past Jobs</CardTitle>
              <CardDescription>Your completed job history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastJobs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed jobs yet</h3>
                  <p className="text-gray-500">Completed jobs will appear here</p>
                </div>
              ) : (
                pastJobs.map((item) => <PastJobCard key={item.id} item={item} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6">
          <WalletSection
            walletData={walletData}
            transactions={transactions}
            withdrawalHistory={withdrawalHistory}
            onWithdraw={loadWalletData}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Notifications</CardTitle>
              <CardDescription>Stay updated on your applications and job status</CardDescription>
            </CardHeader>
            <CardContent>
              <Notifications user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details Dialog */}
      <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="rounded-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedJob.title}</h3>
                <Badge variant="outline" className="rounded-full mt-1">
                  {selectedJob.category}
                </Badge>
              </div>

              <div>
                <Label className="font-medium">Description:</Label>
                <p className="text-gray-700 mt-1">{selectedJob.description}</p>
              </div>

              {selectedJob.rolesResponsibilities && (
                <div>
                  <Label className="font-medium">Roles & Responsibilities:</Label>
                  <p className="text-gray-700 mt-1">{selectedJob.rolesResponsibilities}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Budget:</Label>
                  <p className="text-green-600 font-semibold">₹{selectedJob.budget.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-medium">Posted by:</Label>
                  <p className="text-gray-700">{selectedJob.posterName}</p>
                </div>
              </div>

              {(selectedJob.startDate || selectedJob.endDate) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Start Date:</Label>
                    <p className="text-gray-700">{selectedJob.startDate || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="font-medium">End Date:</Label>
                    <p className="text-gray-700">{selectedJob.endDate || "Not specified"}</p>
                  </div>
                </div>
              )}

              {(selectedJob.startTime || selectedJob.endTime) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Start Time:</Label>
                    <p className="text-gray-700">{selectedJob.startTime || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="font-medium">End Time:</Label>
                    <p className="text-gray-700">{selectedJob.endTime || "Not specified"}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="font-medium">Posted:</Label>
                <p className="text-gray-700">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function JobCard({
  job,
  onApply,
  onNegotiate,
  onViewDetails,
  user,
  hasApplied,
  hasNegotiated,
}: {
  job: Job
  onApply: (jobId: string, message: string, studentDetails: any) => void
  onNegotiate: (jobId: string, proposedAmount: number, message: string, studentDetails: any) => void
  onViewDetails: (job: Job) => void
  user: any
  hasApplied: boolean
  hasNegotiated: boolean
}) {
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [showNegotiateDialog, setShowNegotiateDialog] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [negotiationAmount, setNegotiationAmount] = useState("")
  const [negotiationMessage, setNegotiationMessage] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [studentContact, setStudentContact] = useState("")
  const [studentDistance, setStudentDistance] = useState("5 km")
  const [studentTimeToReach, setStudentTimeToReach] = useState("30 mins")

  const handleApply = () => {
    if (!applicationMessage.trim()) return

    const studentDetails = {
      email: studentEmail,
      contact: studentContact,
      distance: studentDistance,
      timeToReach: studentTimeToReach,
    }

    onApply(job.id, applicationMessage, studentDetails)
    setShowApplyDialog(false)
    setApplicationMessage("")
    setStudentEmail("")
    setStudentContact("")
    setStudentDistance("5 km")
    setStudentTimeToReach("30 mins")
  }

  const handleNegotiate = () => {
    const amount = Number.parseFloat(negotiationAmount)
    if (!amount || amount <= 0 || !negotiationMessage.trim()) return

    const studentDetails = {
      email: studentEmail,
      contact: studentContact,
      distance: studentDistance,
      timeToReach: studentTimeToReach,
    }

    onNegotiate(job.id, amount, negotiationMessage, studentDetails)
    setShowNegotiateDialog(false)
    setNegotiationAmount("")
    setNegotiationMessage("")
    setStudentEmail("")
    setStudentContact("")
    setStudentDistance("5 km")
    setStudentTimeToReach("30 mins")
  }

  return (
    <Card className="rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              <Badge variant="outline" className="rounded-full">
                {job.category}
              </Badge>
            </div>
            <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{job.posterName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              {job.startDate && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Starts {job.startDate}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(job)}
                className="rounded-lg bg-transparent"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              {!hasApplied && !hasNegotiated && (
                <>
                  <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-lg">
                        <Send className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-xl">
                      <DialogHeader>
                        <DialogTitle>Apply for Job</DialogTitle>
                        <DialogDescription>Submit your application for "{job.title}"</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              className="rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact">Contact Number</Label>
                            <Input
                              id="contact"
                              placeholder="+91 9876543210"
                              value={studentContact}
                              onChange={(e) => setStudentContact(e.target.value)}
                              className="rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="distance">Distance from Location</Label>
                            <Select value={studentDistance} onValueChange={setStudentDistance}>
                              <SelectTrigger className="rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1 km">1 km</SelectItem>
                                <SelectItem value="2 km">2 km</SelectItem>
                                <SelectItem value="5 km">5 km</SelectItem>
                                <SelectItem value="10 km">10 km</SelectItem>
                                <SelectItem value="15 km">15 km</SelectItem>
                                <SelectItem value="20+ km">20+ km</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timeToReach">Time to Reach</Label>
                            <Select value={studentTimeToReach} onValueChange={setStudentTimeToReach}>
                              <SelectTrigger className="rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15 mins">15 mins</SelectItem>
                                <SelectItem value="30 mins">30 mins</SelectItem>
                                <SelectItem value="45 mins">45 mins</SelectItem>
                                <SelectItem value="1 hour">1 hour</SelectItem>
                                <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                                <SelectItem value="2+ hours">2+ hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Cover Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Tell the employer why you're perfect for this job..."
                            value={applicationMessage}
                            onChange={(e) => setApplicationMessage(e.target.value)}
                            className="rounded-lg min-h-[100px]"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleApply}
                            className="flex-1 rounded-lg"
                            disabled={!applicationMessage.trim()}
                          >
                            Submit Application
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowApplyDialog(false)}
                            className="rounded-lg"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showNegotiateDialog} onOpenChange={setShowNegotiateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                        <Handshake className="h-4 w-4 mr-2" />
                        Negotiate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-xl">
                      <DialogHeader>
                        <DialogTitle>Negotiate Price</DialogTitle>
                        <DialogDescription>
                          Propose a different amount for "{job.title}" (Current: ₹{job.budget.toLocaleString()})
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              className="rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact">Contact Number</Label>
                            <Input
                              id="contact"
                              placeholder="+91 9876543210"
                              value={studentContact}
                              onChange={(e) => setStudentContact(e.target.value)}
                              className="rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="distance">Distance from Location</Label>
                            <Select value={studentDistance} onValueChange={setStudentDistance}>
                              <SelectTrigger className="rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1 km">1 km</SelectItem>
                                <SelectItem value="2 km">2 km</SelectItem>
                                <SelectItem value="5 km">5 km</SelectItem>
                                <SelectItem value="10 km">10 km</SelectItem>
                                <SelectItem value="15 km">15 km</SelectItem>
                                <SelectItem value="20+ km">20+ km</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timeToReach">Time to Reach</Label>
                            <Select value={studentTimeToReach} onValueChange={setStudentTimeToReach}>
                              <SelectTrigger className="rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15 mins">15 mins</SelectItem>
                                <SelectItem value="30 mins">30 mins</SelectItem>
                                <SelectItem value="45 mins">45 mins</SelectItem>
                                <SelectItem value="1 hour">1 hour</SelectItem>
                                <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                                <SelectItem value="2+ hours">2+ hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Proposed Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="Enter your proposed amount"
                            value={negotiationAmount}
                            onChange={(e) => setNegotiationAmount(e.target.value)}
                            className="rounded-lg"
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="negotiationMessage">Justification</Label>
                          <Textarea
                            id="negotiationMessage"
                            placeholder="Explain why you're proposing this amount..."
                            value={negotiationMessage}
                            onChange={(e) => setNegotiationMessage(e.target.value)}
                            className="rounded-lg min-h-[100px]"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleNegotiate}
                            className="flex-1 rounded-lg"
                            disabled={
                              !negotiationAmount ||
                              Number.parseFloat(negotiationAmount) <= 0 ||
                              !negotiationMessage.trim()
                            }
                          >
                            Submit Proposal
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowNegotiateDialog(false)}
                            className="rounded-lg"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {(hasApplied || hasNegotiated) && (
                <Badge className="rounded-full bg-blue-100 text-blue-800">
                  {hasApplied ? "Applied" : "Negotiated"}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="text-2xl font-bold text-green-600">₹{job.budget.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Budget</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationCard({ application }: { application: Application }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <X className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card className="rounded-lg border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{application.job.title}</h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{application.job.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Budget: ₹{application.job.budget.toLocaleString()}</span>
            </div>
            {application.message && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">"{application.message}"</p>
              </div>
            )}
          </div>
          <div className="ml-6">
            <Badge className={`rounded-full ${getStatusColor(application.status)}`}>
              {getStatusIcon(application.status)}
              <span className="ml-1 capitalize">{application.status}</span>
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NegotiationCard({ negotiation }: { negotiation: Negotiation }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <X className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card className="rounded-lg border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{negotiation.job.title}</h3>
            <div className="flex items-center space-x-4 mb-3">
              <span className="text-sm text-gray-500">Original: ₹{negotiation.job.budget.toLocaleString()}</span>
              <span className="text-sm text-gray-400">→</span>
              <span className="text-lg font-semibold text-blue-600">
                Your Offer: ₹{negotiation.proposedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>Proposed {new Date(negotiation.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">"{negotiation.message}"</p>
            </div>
          </div>
          <div className="ml-6">
            <Badge className={`rounded-full ${getStatusColor(negotiation.status)}`}>
              {getStatusIcon(negotiation.status)}
              <span className="ml-1 capitalize">{negotiation.status}</span>
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ConfirmedJobCard({ item }: { item: Application | Negotiation }) {
  const isNegotiation = "proposedAmount" in item
  const finalAmount = isNegotiation ? item.proposedAmount : item.job.budget

  return (
    <Card className="rounded-lg border border-gray-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.job.title}</h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{item.job.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>
                {isNegotiation ? "Negotiation accepted" : "Application approved"} on{" "}
                {new Date(isNegotiation ? item.createdAt : item.appliedAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="font-semibold text-green-600">Final Amount: ₹{finalAmount.toLocaleString()}</span>
            </div>
            {isNegotiation && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <span>Original: ₹{item.job.budget.toLocaleString()}</span>
                <span>→</span>
                <span>Negotiated: ₹{item.proposedAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Contact Information Section */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Poster: {item.job.posterName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>Category: {item.job.category}</span>
                </div>
                {item.job.startDate && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>Start: {item.job.startDate}</span>
                  </div>
                )}
                {item.job.startTime && (
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <span>Time: {item.job.startTime}</span>
                  </div>
                )}
              </div>
            </div>
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

function PastJobCard({ item }: { item: Application | Negotiation }) {
  const isNegotiation = "proposedAmount" in item
  const finalAmount = isNegotiation ? item.proposedAmount : item.job.budget

  return (
    <Card className="rounded-lg border border-gray-200 bg-gray-50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.job.title}</h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{item.job.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>Completed</span>
              <span>•</span>
              <span className="font-semibold text-green-600">Earned: ₹{finalAmount.toLocaleString()}</span>
            </div>
            {isNegotiation && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Original: ₹{item.job.budget.toLocaleString()}</span>
                <span>→</span>
                <span>Negotiated: ₹{item.proposedAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="ml-6">
            <Badge className="rounded-full bg-gray-100 text-gray-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WalletSection({
  walletData,
  transactions,
  withdrawalHistory,
  onWithdraw,
  userId,
}: {
  walletData: any
  transactions: Transaction[]
  withdrawalHistory: WithdrawalHistory[]
  onWithdraw: () => void
  userId: string
}) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">₹{walletData?.balance?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <WithdrawButtonComponent balance={walletData?.balance || 0} onWithdraw={onWithdraw} userId={userId} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-blue-600">₹{walletData?.totalEarned?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ArrowDownLeft className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600">₹{walletData?.pendingAmount?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Tabs */}
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Wallet Activity</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "overview" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("overview")}
                className="rounded-lg"
              >
                Transactions
              </Button>
              <Button
                variant={activeTab === "withdrawals" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("withdrawals")}
                className="rounded-lg"
              >
                Withdrawals
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "overview" && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500">Your transaction history will appear here</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <TransactionCardComponent key={transaction.id} transaction={transaction} />
                ))
              )}
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div className="space-y-4">
              {withdrawalHistory.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowUpRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals yet</h3>
                  <p className="text-gray-500">Your withdrawal history will appear here</p>
                </div>
              ) : (
                withdrawalHistory.map((withdrawal) => (
                  <WithdrawalHistoryComponent key={withdrawal.id} withdrawal={withdrawal} />
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}