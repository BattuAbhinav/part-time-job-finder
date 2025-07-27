"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  FileText,
  Handshake,
  Wallet,
  Bell,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Send,
  Star,
  History,
  CreditCard,
  Building,
  Smartphone,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  WalletService,
  type WalletData,
  type Transaction as WalletTransaction,
  type WithdrawalHistory,
} from "@/lib/wallet-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Add import for wallet components at the top
import { WithdrawButtonComponent, TransactionCardComponent, WithdrawalHistoryComponent } from "./wallet-components"
import Notifications from "./notifications"

interface User {
  id: string
  email: string
  name: string
  role: "finder" | "poster"
}

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
  proposedAmount: number
  message: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  studentEmail?: string
  studentContact?: string
  studentDistance?: string
  studentTimeToReach?: string
}

interface FinderDashboardProps {
  user: User
}

export default function FinderDashboard({ user }: FinderDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [confirmedJobs, setConfirmedJobs] = useState<(Application | Negotiation)[]>([])
  const [pastJobs, setPastJobs] = useState<(Application | Negotiation)[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([])
  const [completedJobsCount, setCompletedJobsCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load all active jobs first
      const { data: allJobs, error: jobsError } = await supabase.from("jobs").select("*").eq("status", "active")

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

      // Filter out jobs that user has already applied to or negotiated
      const userApplicationJobIds = userApplications?.map((app) => app.job_id) || []
      const userNegotiationJobIds = userNegotiations?.map((neg) => neg.job_id) || []
      const excludedJobIds = [...userApplicationJobIds, ...userNegotiationJobIds]

      // Only show jobs that are active and user hasn't interacted with
      const availableJobs = allJobs?.filter((job) => !excludedJobIds.includes(job.id)) || []

      // Transform data to match component interface
      const transformedJobs = availableJobs.map((job) => ({
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
      }))

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
          studentEmail: app.student_email,
          studentContact: app.student_contact,
          studentDistance: app.student_distance,
          studentTimeToReach: app.student_time_to_reach,
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
          studentEmail: neg.student_email,
          studentContact: neg.student_contact,
          studentDistance: neg.student_distance,
          studentTimeToReach: neg.student_time_to_reach,
        })) || []

      // Separate confirmed jobs (approved applications and accepted negotiations)
      const confirmedApps = transformedApplications.filter(
        (app) => app.status === "approved" && app.job.status !== "completed",
      )
      const confirmedNegs = transformedNegotiations.filter(
        (neg) => neg.status === "accepted" && neg.job.status !== "completed",
      )

      // Past jobs (completed jobs) - should include all statuses when job is completed
      const pastApps = transformedApplications.filter((app) => app.job.status === "completed")
      const pastNegs = transformedNegotiations.filter((neg) => neg.job.status === "completed")

      // Load wallet data
      const wallet = await WalletService.getWallet(user.id)
      const userTransactions = await WalletService.getTransactions(user.id)
      const userWithdrawalHistory = await WalletService.getWithdrawalHistory(user.id)
      const completedJobs = await WalletService.getCompletedJobs(user.id)

      setWalletData(wallet)
      setTransactions(userTransactions)
      setWithdrawalHistory(userWithdrawalHistory)
      setCompletedJobsCount(completedJobs.filter((job) => job.finderId === user.id).length)

      setJobs(transformedJobs)
      setApplications(
        transformedApplications.filter((app) => app.status === "pending" && app.job.status !== "completed"),
      )
      setNegotiations(
        transformedNegotiations.filter((neg) => neg.status === "pending" && neg.job.status !== "completed"),
      )
      setConfirmedJobs([...confirmedApps, ...confirmedNegs])
      setPastJobs([...pastApps, ...pastNegs])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleApply = async (job: Job, message: string, studentEmail: string, studentContact: string) => {
    try {
      const { error } = await supabase.from("applications").insert([
        {
          job_id: job.id,
          finder_id: user.id,
          finder_name: user.name,
          message: message || null,
          student_email: studentEmail,
          student_contact: studentContact,
          student_distance: "5 km", // default value
          student_time_to_reach: "30 mins", // default value
        },
      ])

      if (error) {
        console.error("Error creating application:", error)
        return
      }

      loadData() // Refresh data
    } catch (error) {
      console.error("Error applying to job:", error)
    }
  }

  const handleNegotiate = async (
    job: Job,
    proposedAmount: number,
    message: string,
    studentEmail: string,
    studentContact: string,
  ) => {
    try {
      const { error } = await supabase.from("negotiations").insert([
        {
          job_id: job.id,
          finder_id: user.id,
          finder_name: user.name,
          proposed_amount: proposedAmount,
          message,
          student_email: studentEmail,
          student_contact: studentContact,
          student_distance: "5 km", // default value
          student_time_to_reach: "30 mins", // default value
        },
      ])

      if (error) {
        console.error("Error creating negotiation:", error)
        return
      }

      loadData() // Refresh data
    } catch (error) {
      console.error("Error negotiating job:", error)
    }
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Finder Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="rounded-full">
            {jobs.length} Available Jobs
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 rounded-xl bg-white p-1 shadow-sm border">
          <TabsTrigger
            value="browse"
            className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs sm:text-sm"
          >
            <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Browse Jobs</span>
            <span className="sm:hidden">Browse</span>
          </TabsTrigger>
          <TabsTrigger
            value="applied"
            className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700 text-xs sm:text-sm"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Applied Jobs</span>
            <span className="sm:hidden">Applied</span>
          </TabsTrigger>
          <TabsTrigger
            value="negotiations"
            className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm"
          >
            <Handshake className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden lg:inline">Negotiations</span>
            <span className="lg:hidden">Negotiate</span>
          </TabsTrigger>
          <TabsTrigger
            value="confirmed"
            className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700 text-xs sm:text-sm"
          >
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Confirmed Jobs</span>
            <span className="sm:hidden">Confirmed</span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs sm:text-sm"
          >
            <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Past Jobs</span>
            <span className="sm:hidden">Past</span>
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs sm:text-sm"
          >
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Wallet</span>
            <span className="sm:hidden">Wallet</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 text-xs sm:text-sm"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Browse Available Jobs</CardTitle>
                  <CardDescription>Find your next opportunity</CardDescription>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-lg"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                  <p className="text-gray-500">Check back later for new opportunities</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} onApply={handleApply} onNegotiate={handleNegotiate} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applied" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Applied Jobs</CardTitle>
              <CardDescription>Track your job applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-500">Start applying to jobs to see them here</p>
                </div>
              ) : (
                applications.map((application) => <ApplicationCard key={application.id} application={application} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negotiations" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">My Negotiations</CardTitle>
              <CardDescription>Track your negotiation requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {negotiations.length === 0 ? (
                <div className="text-center py-12">
                  <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No negotiations yet</h3>
                  <p className="text-gray-500">Start negotiating on jobs to see them here</p>
                </div>
              ) : (
                negotiations.map((negotiation) => <NegotiationCard key={negotiation.id} negotiation={negotiation} />)
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
                confirmedJobs.map((item) => <ConfirmedJobCard key={item.id} item={item} onRefresh={loadData} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Past Jobs</CardTitle>
              <CardDescription>Completed jobs and earnings history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastJobs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No past jobs yet</h3>
                  <p className="text-gray-500">Completed jobs will appear here</p>
                </div>
              ) : (
                pastJobs.map((item) => <PastJobCard key={item.id} item={item} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4 sm:space-y-6">
          {/* Balance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-green-600">Total Earnings</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-700">
                      ₹{walletData?.totalEarned.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-orange-600">Pending Payments</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-700">
                      ₹{walletData?.pendingAmount.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-600">Available Balance</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700">
                      ₹{walletData?.balance.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Summary */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Balance Summary</CardTitle>
              <CardDescription className="text-sm">Overview of your earnings and withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-700 text-sm sm:text-base">Total Earnings</span>
                  <span className="text-lg sm:text-xl font-bold text-green-700">
                    ₹{walletData?.totalEarned.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-700 text-sm sm:text-base">Total Withdrawals</span>
                  <span className="text-lg sm:text-xl font-bold text-red-700">
                    ₹
                    {withdrawalHistory
                      .reduce((sum, w) => sum + (w.status === "completed" ? w.amount : 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="font-medium text-blue-700 text-sm sm:text-base">Available Balance</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-700">
                    ₹{walletData?.balance.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Available Balance</CardTitle>
                  <CardDescription className="text-sm">Ready for withdrawal</CardDescription>
                </div>
                <WithdrawButtonComponent
                  balance={walletData?.balance || 0}
                  onWithdraw={() => loadData()}
                  userId={user.id}
                />
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 sm:py-8">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                    ₹{walletData?.balance.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {completedJobsCount} completed job{completedJobsCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
                <CardDescription className="text-sm">Your recent transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                    <p className="text-gray-500 text-sm">Complete jobs to start earning</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <TransactionCardComponent key={transaction.id} transaction={transaction} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Past Withdrawals Section */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Past Withdrawals</CardTitle>
              <CardDescription className="text-sm">Your withdrawal history with status tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {withdrawalHistory.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No withdrawals yet</h3>
                  <p className="text-gray-500 text-sm">Your withdrawal history will appear here</p>
                </div>
              ) : (
                withdrawalHistory.map((withdrawal) => (
                  <WithdrawalHistoryComponent key={withdrawal.id} withdrawal={withdrawal} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Notifications</CardTitle>
              <CardDescription>Stay updated on your applications and jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <Notifications user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JobCard({
  job,
  onApply,
  onNegotiate,
}: {
  job: Job
  onApply: (job: Job, message: string, studentEmail: string, studentContact: string) => void
  onNegotiate: (job: Job, proposedAmount: number, message: string, studentEmail: string, studentContact: string) => void
}) {
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [showNegotiateDialog, setShowNegotiateDialog] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [negotiationAmount, setNegotiationAmount] = useState("")
  const [negotiationMessage, setNegotiationMessage] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [studentContact, setStudentContact] = useState("")

  const handleApply = () => {
    onApply(job, applicationMessage, studentEmail, studentContact)
    setShowApplyDialog(false)
    setApplicationMessage("")
    setStudentEmail("")
    setStudentContact("")
  }

  const handleNegotiate = () => {
    const amount = Number.parseFloat(negotiationAmount)
    if (amount > 0) {
      onNegotiate(job, amount, negotiationMessage, studentEmail, studentContact)
      setShowNegotiateDialog(false)
      setNegotiationAmount("")
      setNegotiationMessage("")
      setStudentEmail("")
      setStudentContact("")
    }
  }

  return (
    <Card className="rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
            {job.rolesResponsibilities && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Roles & Responsibilities:</h4>
                <p className="text-sm text-gray-600">{job.rolesResponsibilities}</p>
              </div>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
              <span>By {job.posterName}</span>
              <span>•</span>
              <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              <Badge variant="outline" className="rounded-full">
                {job.category}
              </Badge>
            </div>
            {(job.startDate || job.endDate || job.startTime || job.endTime) && (
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {job.startDate && <span>Start: {job.startDate}</span>}
                {job.endDate && <span>End: {job.endDate}</span>}
                {job.startTime && <span>Time: {job.startTime}</span>}
                {job.endTime && <span>- {job.endTime}</span>}
              </div>
            )}
          </div>
          <div className="text-right ml-6">
            <div className="text-2xl font-bold text-green-600 mb-2">₹{job.budget.toLocaleString()}</div>
            <div className="flex space-x-2">
              <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-lg">
                    Apply Now
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Apply for Job</DialogTitle>
                    <DialogDescription>Send your application for "{job.title}"</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="studentEmail">Email *</Label>
                        <Input
                          id="studentEmail"
                          type="email"
                          placeholder="Your email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          className="rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="studentContact">Contact Number *</Label>
                        <Input
                          id="studentContact"
                          placeholder="Your contact number"
                          value={studentContact}
                          onChange={(e) => setStudentContact(e.target.value)}
                          className="rounded-lg"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Application Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell the poster why you're perfect for this job..."
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleApply}
                        className="flex-1 rounded-lg"
                        disabled={!studentEmail || !studentContact}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Application
                      </Button>
                      <Button variant="outline" onClick={() => setShowApplyDialog(false)} className="rounded-lg">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showNegotiateDialog} onOpenChange={setShowNegotiateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                    Negotiate
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Negotiate Price</DialogTitle>
                    <DialogDescription>Propose a different amount for "{job.title}"</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="studentEmailNeg">Email *</Label>
                        <Input
                          id="studentEmailNeg"
                          type="email"
                          placeholder="Your email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          className="rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="studentContactNeg">Contact Number *</Label>
                        <Input
                          id="studentContactNeg"
                          placeholder="Your contact number"
                          value={studentContact}
                          onChange={(e) => setStudentContact(e.target.value)}
                          className="rounded-lg"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="amount">Proposed Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter your proposed amount"
                        value={negotiationAmount}
                        onChange={(e) => setNegotiationAmount(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="negotiation-message">Message</Label>
                      <Textarea
                        id="negotiation-message"
                        placeholder="Explain your proposed amount..."
                        value={negotiationMessage}
                        onChange={(e) => setNegotiationMessage(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleNegotiate}
                        className="flex-1 rounded-lg"
                        disabled={
                          !negotiationAmount ||
                          Number.parseFloat(negotiationAmount) <= 0 ||
                          !studentEmail ||
                          !studentContact
                        }
                      >
                        <Handshake className="h-4 w-4 mr-2" />
                        Send Proposal
                      </Button>
                      <Button variant="outline" onClick={() => setShowNegotiateDialog(false)} className="rounded-lg">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationCard({ application }: { application: Application }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
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
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Rate this job</span>
              </div>
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
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
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
                Proposed: ₹{negotiation.proposedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>Sent {new Date(negotiation.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Rate this negotiation</span>
              </div>
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

function ConfirmedJobCard({ item, onRefresh }: { item: Application | Negotiation; onRefresh?: () => void }) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const isNegotiation = "proposedAmount" in item
  const finalAmount = isNegotiation ? item.proposedAmount : item.job.budget

  const handleCompletePayment = async () => {
    if (!selectedPaymentMethod) return

    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Complete the job in the database using WalletService
      const success = await WalletService.completeJob(
        item.jobId,
        item.finderId,
        item.job.postedBy,
        finalAmount,
        `Job completed with ${selectedPaymentMethod} payment`,
      )

      if (success) {
        setShowPaymentDialog(false)
        setSelectedPaymentMethod("")

        // Refresh the data to update the UI
        if (onRefresh) {
          onRefresh()
        }

        alert(`Payment completed successfully via ${selectedPaymentMethod}!`)
      } else {
        throw new Error("Failed to complete job")
      }
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
            {isNegotiation && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <span>Original: ₹{item.job.budget.toLocaleString()}</span>
                <span>→</span>
                <span>Negotiated: ₹{item.proposedAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Payment Action Button */}
            <div className="mt-4">
              <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete and Make Payment
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

            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-3">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Rate this job</span>
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
    <Card className="rounded-lg border border-gray-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.job.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>Completed</span>
              <span>•</span>
              <span className="font-semibold text-green-600">Earned: ₹{finalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <Star className="h-4 w-4 text-yellow-500" />
                <Star className="h-4 w-4 text-yellow-500" />
                <Star className="h-4 w-4 text-yellow-500" />
                <Star className="h-4 w-4 text-gray-300" />
                <span>4.0 rating</span>
              </div>
            </div>
          </div>
          <div className="ml-6">
            <Badge className="rounded-full bg-blue-100 text-blue-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
