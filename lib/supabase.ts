import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://dksfansdocdricxuvhaa.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrc2ZhbnNkb2NkcmljeHV2aGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2Mjc3MzcsImV4cCI6MjA2OTIwMzczN30.150shczJkdXCW9gKtbaw-7jaswad7USkV_O_k0KuBj8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: "finder" | "poster"
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: "finder" | "poster"
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: "finder" | "poster"
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          budget: number
          posted_by: string
          poster_name: string
          created_at: string
          status: "active" | "completed" | "cancelled"
          category: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          budget: number
          posted_by: string
          poster_name: string
          created_at?: string
          status?: "active" | "completed" | "cancelled"
          category: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          budget?: number
          posted_by?: string
          poster_name?: string
          created_at?: string
          status?: "active" | "completed" | "cancelled"
          category?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          finder_id: string
          finder_name: string
          status: "pending" | "approved" | "rejected"
          applied_at: string
          message: string | null
        }
        Insert: {
          id?: string
          job_id: string
          finder_id: string
          finder_name: string
          status?: "pending" | "approved" | "rejected"
          applied_at?: string
          message?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          finder_id?: string
          finder_name?: string
          status?: "pending" | "approved" | "rejected"
          applied_at?: string
          message?: string | null
        }
      }
      negotiations: {
        Row: {
          id: string
          job_id: string
          finder_id: string
          finder_name: string
          proposed_amount: number
          message: string
          status: "pending" | "accepted" | "rejected"
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          finder_id: string
          finder_name: string
          proposed_amount: number
          message: string
          status?: "pending" | "accepted" | "rejected"
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          finder_id?: string
          finder_name?: string
          proposed_amount?: number
          message?: string
          status?: "pending" | "accepted" | "rejected"
          created_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_earned: number
          pending_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_earned?: number
          pending_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_earned?: number
          pending_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          job_id: string | null
          type: "earning" | "withdrawal" | "refund" | "fee"
          amount: number
          status: "pending" | "completed" | "failed" | "cancelled"
          description: string
          created_at: string
          completed_at: string | null
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          user_id: string
          job_id?: string | null
          type: "earning" | "withdrawal" | "refund" | "fee"
          amount: number
          status?: "pending" | "completed" | "failed" | "cancelled"
          description: string
          created_at?: string
          completed_at?: string | null
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string | null
          type?: "earning" | "withdrawal" | "refund" | "fee"
          amount?: number
          status?: "pending" | "completed" | "failed" | "cancelled"
          description?: string
          created_at?: string
          completed_at?: string | null
          metadata?: Record<string, any> | null
        }
      }
      job_completions: {
        Row: {
          id: string
          job_id: string
          finder_id: string
          poster_id: string
          final_amount: number
          completion_date: string
          payment_status: "pending" | "paid" | "disputed"
          finder_rating: number | null
          poster_rating: number | null
          completion_notes: string | null
        }
        Insert: {
          id?: string
          job_id: string
          finder_id: string
          poster_id: string
          final_amount: number
          completion_date?: string
          payment_status?: "pending" | "paid" | "disputed"
          finder_rating?: number | null
          poster_rating?: number | null
          completion_notes?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          finder_id?: string
          poster_id?: string
          final_amount?: number
          completion_date?: string
          payment_status?: "pending" | "paid" | "disputed"
          finder_rating?: number | null
          poster_rating?: number | null
          completion_notes?: string | null
        }
      }
    }
  }
}
