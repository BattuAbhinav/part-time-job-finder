import { supabase } from "./supabase"

export interface WalletData {
  id: string
  userId: string
  balance: number
  totalEarned: number
  pendingAmount: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  jobId?: string
  type: "earning" | "withdrawal" | "refund" | "fee"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  description: string
  createdAt: string
  completedAt?: string
  metadata?: Record<string, any>
  jobTitle?: string | null
}

export interface WithdrawalHistory {
  id: string
  userId: string
  amount: number
  upiId?: string
  bankName?: string
  bankAccountNo?: string
  status: "pending" | "completed" | "failed"
  createdAt: string
  completedAt?: string
  transactionId?: string
}

export interface JobCompletion {
  id: string
  jobId: string
  finderId: string
  posterId: string
  finalAmount: number
  completionDate: string
  paymentStatus: "pending" | "paid" | "disputed"
  finderRating?: number
  posterRating?: number
  completionNotes?: string
}

export class WalletService {
  static async getWallet(userId: string): Promise<WalletData | null> {
    try {
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", userId).single()

      if (error) {
        console.error("Error fetching wallet:", error)
        return null
      }

      return {
        id: data.id,
        userId: data.user_id,
        balance: data.balance,
        totalEarned: data.total_earned,
        pendingAmount: data.pending_amount,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    } catch (error) {
      console.error("Error in getWallet:", error)
      return null
    }
  }

  static async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
        *,
        jobs (
          id,
          title,
          description
        )
      `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching transactions:", error)
        return []
      }

      return data.map((transaction) => ({
        id: transaction.id,
        userId: transaction.user_id,
        jobId: transaction.job_id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.created_at,
        completedAt: transaction.completed_at,
        metadata: transaction.metadata,
        jobTitle: transaction.jobs?.title || null,
      }))
    } catch (error) {
      console.error("Error in getTransactions:", error)
      return []
    }
  }

  static async getWithdrawalHistory(userId: string): Promise<WithdrawalHistory[]> {
    try {
      const { data, error } = await supabase
        .from("withdrawal_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching withdrawal history:", error)
        return []
      }

      return data.map((withdrawal) => ({
        id: withdrawal.id,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        upiId: withdrawal.upi_id,
        bankName: withdrawal.bank_name,
        bankAccountNo: withdrawal.bank_account_no,
        status: withdrawal.status,
        createdAt: withdrawal.created_at,
        completedAt: withdrawal.completed_at,
        transactionId: withdrawal.transaction_id,
      }))
    } catch (error) {
      console.error("Error in getWithdrawalHistory:", error)
      return []
    }
  }

  static async completeJob(
    jobId: string,
    finderId: string,
    posterId: string,
    finalAmount: number,
    completionNotes?: string,
  ): Promise<boolean> {
    try {
      // Check if job completion already exists
      const { data: existingCompletion, error: checkError } = await supabase
        .from("job_completions")
        .select("id")
        .eq("job_id", jobId)
        .eq("finder_id", finderId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error checking existing completion:", checkError)
        return false
      }

      // If completion already exists, return success (job already completed)
      if (existingCompletion) {
        console.log("Job already completed")
        return true
      }

      // Check if job is already marked as completed
      const { data: jobData, error: jobCheckError } = await supabase
        .from("jobs")
        .select("status")
        .eq("id", jobId)
        .single()

      if (jobCheckError) {
        console.error("Error checking job status:", jobCheckError)
        return false
      }

      if (jobData.status === "completed") {
        console.log("Job already marked as completed")
        return true
      }

      // Create job completion record
      const { data: completion, error: completionError } = await supabase
        .from("job_completions")
        .insert([
          {
            job_id: jobId,
            finder_id: finderId,
            poster_id: posterId,
            final_amount: finalAmount,
            completion_notes: completionNotes,
          },
        ])
        .select()
        .single()

      if (completionError) {
        console.error("Error creating job completion:", completionError)
        return false
      }

      // Check if earning transaction already exists for this job
      const { data: existingTransaction, error: transactionCheckError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", finderId)
        .eq("job_id", jobId)
        .eq("type", "earning")
        .eq("status", "completed")
        .single()

      if (transactionCheckError && transactionCheckError.code !== "PGRST116") {
        console.error("Error checking existing transaction:", transactionCheckError)
        return false
      }

      // Only create transaction if it doesn't exist
      if (!existingTransaction) {
        // Get job title for better description
        const { data: jobData, error: jobTitleError } = await supabase
          .from("jobs")
          .select("title")
          .eq("id", jobId)
          .single()

        const jobTitle = jobData?.title || "job"

        const { error: transactionError } = await supabase.from("transactions").insert([
          {
            user_id: finderId,
            job_id: jobId,
            type: "earning",
            amount: finalAmount,
            status: "completed",
            description: `Payment received for ${jobTitle}`,
            completed_at: new Date().toISOString(),
            metadata: { completion_id: completion.id },
          },
        ])

        if (transactionError) {
          console.error("Error creating transaction:", transactionError)
          return false
        }

        // Manually update wallet to ensure total_earned is updated
        const { error: walletUpdateError } = await supabase.rpc("update_wallet_on_completion", {
          p_user_id: finderId,
          p_amount: finalAmount,
        })

        if (walletUpdateError) {
          console.error("Error updating wallet:", walletUpdateError)
          // Try manual update as fallback
          const { data: currentWallet } = await supabase
            .from("wallets")
            .select("balance, total_earned, pending_amount")
            .eq("user_id", finderId)
            .single()

          if (currentWallet) {
            await supabase
              .from("wallets")
              .update({
                balance: currentWallet.balance + finalAmount,
                total_earned: currentWallet.total_earned + finalAmount,
                pending_amount: Math.max(currentWallet.pending_amount - finalAmount, 0),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", finderId)
          }
        }
      }

      // Update job status to completed
      const { error: jobError } = await supabase.from("jobs").update({ status: "completed" }).eq("id", jobId)

      if (jobError) {
        console.error("Error updating job status:", jobError)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in completeJob:", error)
      return false
    }
  }

  static async withdrawFunds(
    userId: string,
    amount: number,
    upiId?: string,
    bankName?: string,
    bankAccountNo?: string,
  ): Promise<boolean> {
    try {
      // Check if user has sufficient balance
      const wallet = await this.getWallet(userId)
      if (!wallet || wallet.balance < amount) {
        console.error("Insufficient balance")
        return false
      }

      // Create withdrawal history record
      const { data: withdrawalRecord, error: withdrawalError } = await supabase
        .from("withdrawal_history")
        .insert([
          {
            user_id: userId,
            amount: amount,
            upi_id: upiId,
            bank_name: bankName,
            bank_account_no: bankAccountNo,
            status: "completed",
            completed_at: new Date().toISOString(),
            transaction_id: `WD${Date.now()}`,
          },
        ])
        .select()
        .single()

      if (withdrawalError) {
        console.error("Error creating withdrawal record:", withdrawalError)
        return false
      }

      // Create withdrawal transaction
      const { error } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          type: "withdrawal",
          amount: amount,
          status: "completed",
          description: `Withdrawal from Part Time Job Finder wallet to ${upiId ? `UPI: ${upiId}` : `Bank: ${bankName}`}`,
          completed_at: new Date().toISOString(),
          metadata: {
            withdrawal_id: withdrawalRecord.id,
            upi_id: upiId,
            bank_name: bankName,
            bank_account_no: bankAccountNo,
          },
        },
      ])

      if (error) {
        console.error("Error creating withdrawal transaction:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in withdrawFunds:", error)
      return false
    }
  }

  static async getCompletedJobs(userId: string): Promise<JobCompletion[]> {
    try {
      const { data, error } = await supabase
        .from("job_completions")
        .select("*")
        .or(`finder_id.eq.${userId},poster_id.eq.${userId}`)
        .order("completion_date", { ascending: false })

      if (error) {
        console.error("Error fetching completed jobs:", error)
        return []
      }

      return data.map((completion) => ({
        id: completion.id,
        jobId: completion.job_id,
        finderId: completion.finder_id,
        posterId: completion.poster_id,
        finalAmount: completion.final_amount,
        completionDate: completion.completion_date,
        paymentStatus: completion.payment_status,
        finderRating: completion.finder_rating,
        posterRating: completion.poster_rating,
        completionNotes: completion.completion_notes,
      }))
    } catch (error) {
      console.error("Error in getCompletedJobs:", error)
      return []
    }
  }

  static async addPendingPayment(userId: string, amount: number, jobId: string): Promise<boolean> {
    try {
      // Check if pending transaction already exists for this job
      const { data: existingTransaction, error: checkError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("job_id", jobId)
        .eq("type", "earning")
        .eq("status", "pending")
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking existing pending transaction:", checkError)
        return false
      }

      // If pending transaction already exists, return success
      if (existingTransaction) {
        console.log("Pending payment already exists for this job")
        return true
      }

      // Update pending amount in wallet
      const { data: currentWallet, error: fetchError } = await supabase
        .from("wallets")
        .select("pending_amount")
        .eq("user_id", userId)
        .single()

      if (fetchError) {
        console.error("Error fetching current wallet:", fetchError)
        return false
      }

      const newPendingAmount = currentWallet.pending_amount + amount

      const { error: walletError } = await supabase
        .from("wallets")
        .update({
          pending_amount: newPendingAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (walletError) {
        console.error("Error updating pending amount:", walletError)
        return false
      }

      // Create pending transaction
      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          job_id: jobId,
          type: "earning",
          amount: amount,
          status: "pending",
          description: `Pending payment for job approval`,
          metadata: { job_id: jobId },
        },
      ])

      if (transactionError) {
        console.error("Error creating pending transaction:", transactionError)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in addPendingPayment:", error)
      return false
    }
  }

  static async isJobCompleted(jobId: string, finderId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("job_completions")
        .select("id")
        .eq("job_id", jobId)
        .eq("finder_id", finderId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking job completion:", error)
        return false
      }

      return !!data
    } catch (error) {
      console.error("Error in isJobCompleted:", error)
      return false
    }
  }
}
