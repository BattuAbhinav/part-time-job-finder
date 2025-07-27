"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, X, CreditCard, Building, Smartphone } from "lucide-react"
import { WalletService, type Transaction, type WithdrawalHistory } from "@/lib/wallet-service"

interface WithdrawButtonProps {
  balance: number
  onWithdraw: () => void
  userId: string
}

export function WithdrawButtonComponent({ balance, onWithdraw, userId }: WithdrawButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [withdrawalMethod, setWithdrawalMethod] = useState("")
  const [upiId, setUpiId] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAccountNo, setBankAccountNo] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleWithdraw = async () => {
    const withdrawAmount = Number.parseFloat(amount)
    if (!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > balance) {
      return
    }

    if (!withdrawalMethod) {
      return
    }

    if (withdrawalMethod === "upi" && !upiId) {
      return
    }

    if (withdrawalMethod === "bank" && !bankName) {
      return
    }

    setIsLoading(true)
    try {
      const success = await WalletService.withdrawFunds(
        userId,
        withdrawAmount,
        withdrawalMethod === "upi" ? upiId : undefined,
        withdrawalMethod === "bank" ? bankName : undefined,
        withdrawalMethod === "bank" ? bankAccountNo : undefined,
      )
      if (success) {
        setIsOpen(false)
        setAmount("")
        setWithdrawalMethod("")
        setUpiId("")
        setBankName("")
        setBankAccountNo("")
        onWithdraw()
      }
    } catch (error) {
      console.error("Withdrawal error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-lg" disabled={balance <= 0}>
          <CreditCard className="h-4 w-4 mr-2" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>Withdraw money from your Part Time Job Finder wallet</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Available Balance:</span>
              <span className="font-semibold text-green-600">₹{balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg"
              max={balance}
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Withdrawal Method</Label>
            <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select withdrawal method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span>UPI</span>
                  </div>
                </SelectItem>
                <SelectItem value="bank">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {withdrawalMethod === "upi" && (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="Enter your UPI ID (e.g., user@paytm)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="rounded-lg"
              />
            </div>
          )}

          {withdrawalMethod === "bank" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="Enter your bank name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNo">Bank Account Number</Label>
                <Input
                  id="bankAccountNo"
                  placeholder="Enter your account number"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleWithdraw}
              className="flex-1 rounded-lg"
              disabled={
                !amount ||
                Number.parseFloat(amount) <= 0 ||
                Number.parseFloat(amount) > balance ||
                !withdrawalMethod ||
                (withdrawalMethod === "upi" && !upiId) ||
                (withdrawalMethod === "bank" && (!bankName || !bankAccountNo)) ||
                isLoading
              }
            >
              {isLoading ? "Processing..." : "Withdraw Funds"}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-lg">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TransactionCardProps {
  transaction: Transaction
}

export function TransactionCardComponent({ transaction }: TransactionCardProps) {
  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") return <Clock className="h-4 w-4" />
    if (status === "failed" || status === "cancelled") return <X className="h-4 w-4" />

    switch (type) {
      case "earning":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case "refund":
        return <ArrowDownLeft className="h-4 w-4 text-orange-600" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case "earning":
      case "refund":
        return "text-green-600"
      case "withdrawal":
      case "fee":
        return "text-red-600"
      default:
        return "text-gray-900"
    }
  }

  const formatAmount = (type: string, amount: number) => {
    const prefix = type === "earning" || type === "refund" ? "+" : "-"
    return `${prefix}₹${amount.toFixed(2)}`
  }

  return (
    <Card className="rounded-lg border border-gray-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
              {getTransactionIcon(transaction.type, transaction.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.description}</p>
              {transaction.jobTitle && transaction.type === "earning" && (
                <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">Job: {transaction.jobTitle}</p>
              )}
              <p className="text-xs sm:text-sm text-gray-500">
                {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                {new Date(transaction.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`font-semibold text-sm sm:text-base ${getAmountColor(transaction.type)}`}>
              {formatAmount(transaction.type, transaction.amount)}
            </p>
            <Badge className={`rounded-full text-xs ${getStatusColor(transaction.status)}`}>{transaction.status}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WithdrawalHistoryProps {
  withdrawal: WithdrawalHistory
}

export function WithdrawalHistoryComponent({ withdrawal }: WithdrawalHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "deposited":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Processed"
      case "deposited":
        return "Deposited"
      case "pending":
        return "Processing"
      case "failed":
        return "Failed"
      default:
        return status
    }
  }

  const getWithdrawalMethod = () => {
    if (withdrawal.upiId) {
      return (
        <div className="flex items-center space-x-2">
          <Smartphone className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-gray-600 truncate">UPI: {withdrawal.upiId}</span>
        </div>
      )
    }
    if (withdrawal.bankName) {
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 truncate">Bank: {withdrawal.bankName}</span>
          </div>
          {withdrawal.bankAccountNo && (
            <div className="text-xs text-gray-500 ml-6 truncate">A/C: ****{withdrawal.bankAccountNo.slice(-4)}</div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="rounded-lg border border-gray-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
              <ArrowUpRight className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Withdrawal</p>
              <div className="mt-1">{getWithdrawalMethod()}</div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {new Date(withdrawal.createdAt).toLocaleDateString()} at{" "}
                {new Date(withdrawal.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {withdrawal.transactionId && (
                <p className="text-xs text-gray-400 truncate">ID: {withdrawal.transactionId}</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-red-600 text-sm sm:text-base">-₹{withdrawal.amount.toFixed(2)}</p>
            <Badge className={`rounded-full text-xs ${getStatusColor(withdrawal.status)}`}>
              {getStatusText(withdrawal.status)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
