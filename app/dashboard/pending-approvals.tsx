"use client"

import { useGetPendingTransactionsQuery, useApproveTransactionMutation, useRejectTransactionMutation } from "@/lib/api/coinsApi"
import { Check, X, Clock, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { uz } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function PendingApprovals() {
  const { data: pendingResponse, isLoading } = useGetPendingTransactionsQuery(undefined, { pollingInterval: 15000 })
  const pendingTransactions = Array.isArray(pendingResponse) ? pendingResponse : pendingResponse?.data || []

  const [approveTx, { isLoading: isApproving }] = useApproveTransactionMutation()
  const [rejectTx, { isLoading: isRejecting }] = useRejectTransactionMutation()

  if (isLoading) return null
  if (pendingTransactions.length === 0) return null

  const handleApprove = async (id: number) => {
    try {
      await approveTx(id).unwrap()
      toast.success("Tanga qo'shish tasdiqlandi")
    } catch (err: any) {
      toast.error(err?.data?.message || "Xatolik yuz berdi")
    }
  }

  const handleReject = async (id: number) => {
    try {
      await rejectTx(id).unwrap()
      toast.success("Tanga qo'shish rad etildi")
    } catch (err: any) {
      toast.error(err?.data?.message || "Xatolik yuz berdi")
    }
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-800 p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-xl">
          <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Kutilayotgan tasdiqlar</h2>
          <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
            10 tadan ortiq tanga qo'shish so'rovlari
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {pendingTransactions.map((tx: any) => (
          <div key={tx.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900 dark:text-gray-100">{tx.giver?.fullname || tx.giver?.username || "O'qituvchi"}</span>
                <span className="text-gray-500">→</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{tx.receiver?.fullname || tx.receiver?.username || "O'quvchi"}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Miqdor: <span className="font-bold text-green-600">+{tx.amount} tanga</span>
              </p>
              <p className="text-sm text-gray-500 italic mt-0.5">
                Sabab: {tx.reason || "Kiritilmagan"}
              </p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(tx.createdAt || tx.created_at || new Date()), { addSuffix: true, locale: uz })}
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <Button 
                onClick={() => handleReject(tx.id)} 
                disabled={isApproving || isRejecting}
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full md:w-auto"
              >
                <X className="w-4 h-4 mr-1" /> Rad etish
              </Button>
              <Button 
                onClick={() => handleApprove(tx.id)} 
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
              >
                <Check className="w-4 h-4 mr-1" /> Tasdiqlash
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
