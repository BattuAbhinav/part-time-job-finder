"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, DollarSign, Briefcase } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  email: string
  name: string
  role: "finder" | "poster"
}

interface Notification {
  id: string
  type:
    | "application_approved"
    | "application_rejected"
    | "negotiation_accepted"
    | "negotiation_rejected"
    | "job_completed"
    | "payment_received"
  title: string
  message: string
  createdAt: string
  read: boolean
  jobId?: string
  amount?: number
}

interface NotificationsProps {
  user: User
}

export default function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    loadNotifications()
  }, [user.id])

  const loadNotifications = async () => {
    // This is a mock implementation - in a real app, you'd have a notifications table
    const mockNotifications: Notification[] = []

    if (user.role === "finder") {
      // Load recent applications and negotiations to generate notifications
      const { data: applications } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("finder_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(10)

      const { data: negotiations } = await supabase
        .from("negotiations")
        .select("*, jobs(*)")
        .eq("finder_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      // Generate notifications for approved/rejected applications
      applications?.forEach((app) => {
        if (app.status === "approved") {
          mockNotifications.push({
            id: `app-${app.id}`,
            type: "application_approved",
            title: "Application Approved!",
            message: `Your application for "${app.jobs.title}" has been approved.`,
            createdAt: app.applied_at,
            read: false,
            jobId: app.job_id,
            amount: app.jobs.budget,
          })
        } else if (app.status === "rejected") {
          mockNotifications.push({
            id: `app-${app.id}`,
            type: "application_rejected",
            title: "Application Rejected",
            message: `Your application for "${app.jobs.title}" was not accepted.`,
            createdAt: app.applied_at,
            read: false,
            jobId: app.job_id,
          })
        }
      })

      // Generate notifications for accepted/rejected negotiations
      negotiations?.forEach((neg) => {
        if (neg.status === "accepted") {
          mockNotifications.push({
            id: `neg-${neg.id}`,
            type: "negotiation_accepted",
            title: "Negotiation Accepted!",
            message: `Your price proposal of $${neg.proposed_amount} for "${neg.jobs.title}" was accepted.`,
            createdAt: neg.created_at,
            read: false,
            jobId: neg.job_id,
            amount: neg.proposed_amount,
          })
        } else if (neg.status === "rejected") {
          mockNotifications.push({
            id: `neg-${neg.id}`,
            type: "negotiation_rejected",
            title: "Negotiation Rejected",
            message: `Your price proposal for "${neg.jobs.title}" was not accepted.`,
            createdAt: neg.created_at,
            read: false,
            jobId: neg.job_id,
          })
        }
      })
    }

    // Sort by date
    mockNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setNotifications(mockNotifications)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application_approved":
      case "negotiation_accepted":
        return <Check className="h-5 w-5 text-green-600" />
      case "application_rejected":
      case "negotiation_rejected":
        return <X className="h-5 w-5 text-red-600" />
      case "job_completed":
        return <Briefcase className="h-5 w-5 text-blue-600" />
      case "payment_received":
        return <DollarSign className="h-5 w-5 text-green-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "application_approved":
      case "negotiation_accepted":
      case "payment_received":
        return "border-green-200 bg-green-50"
      case "application_rejected":
      case "negotiation_rejected":
        return "border-red-200 bg-red-50"
      case "job_completed":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">You'll see updates here when they arrive</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id} className={`rounded-lg border ${getNotificationColor(notification.type)}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                  {notification.amount && (
                    <div className="mt-2">
                      <Badge variant="outline" className="rounded-full">
                        ${notification.amount.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
