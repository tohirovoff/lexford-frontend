"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useGetUserTransactionsQuery, useCreateTransactionMutation, useCreatePenaltyMutation, coinsApi } from "@/lib/api/coinsApi"
import { useGetAllClassesQuery, classesApi } from "@/lib/api/classesApi"
import { useGetUserQuery, usersApi } from "@/lib/api/usersApi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import LoadingSpinner from "@/components/ui/loading-spinner"
import CoinDisplay from "@/components/ui/coin-display"
import { Coins, TrendingUp, TrendingDown, History, ArrowUpCircle, ArrowDownCircle, Gift, AlertCircle, CheckCircle2, User } from "lucide-react"
import { toast } from "sonner"

export default function CoinsPage() {
  const dispatch = useDispatch()
  const { user: sessionUser } = useSelector((state: any) => state.auth)
  const isTeacherOrAdmin = sessionUser?.role === "teacher" || sessionUser?.role === "admin"

  // Fresh user data for balance display
  const { data: userProfileResponse } = useGetUserQuery(sessionUser?.id, { skip: !sessionUser?.id })
  const user = userProfileResponse?.data || sessionUser

  // State for Give Coins form
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [transactionType, setTransactionType] = useState<"reward" | "penalty">("reward")
  const [filterType, setFilterType] = useState<string>("all")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Queries
  // Queries
  const { 
    data: rawTransactions, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useGetUserTransactionsQuery(user?.id, { skip: !user?.id })

  const filteredTransactions = (rawTransactions || []).filter((tx: any) => {
    const amt = Number(tx.amount)
    if (filterType === "income") return amt > 0
    if (filterType === "expense") return amt < 0
    return true
  })

  console.log("Transactions data:", rawTransactions)
  console.log("Transactions error:", transactionsError)
  const { data: classesResponse } = useGetAllClassesQuery(undefined, { skip: !isTeacherOrAdmin })
  
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []
  
  // Get students of selected class
  const selectedClass = classes.find((c: any) => (c._id || c.id).toString() === selectedClassId)
  const students = selectedClass?.students || []

  // Mutation
  const [createTransaction, { isLoading: isSubmittingTransaction }] = useCreateTransactionMutation()
  const [createPenalty, { isLoading: isSubmittingPenalty }] = useCreatePenaltyMutation()
  const isSubmitting = isSubmittingTransaction || isSubmittingPenalty

  // Stats calculation
  const stats = (rawTransactions || []).reduce(
    (acc: any, tx: any) => {
      const amt = Number(tx.amount)
      if (amt > 0) acc.earned += amt
      else acc.spent += Math.abs(amt)
      return acc
    },
    { earned: 0, spent: 0 }
  )

  const handleGiveCoins = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    if (!selectedStudentId || !amount || !reason) {
      toast?.error("Barcha maydonlarni to'ldiring")
      return
    }

    if (Number(amount) > 50) {
      toast?.error("Eng ko'pi bilan 50 ta tanga berish mumkin!")
      return
    }

    if (Number(amount) < 1) {
      toast?.error("Kamida 1 ta tanga kiritish kerak")
      return
    }

    try {
      // Backendda `createPenalty` qilish uchun `auction_id` majburiy (foreign key).
      // Bu erda esa oddiy jarima yozyapmiz (auksiondan tashqari), shuning uchun `transaction` jadvaliga
      // manfiy qiymat bilan `type="penalty"` qilib saqlaymiz.
      const finalAmount = transactionType === "penalty" ? -Math.abs(Number(amount)) : Math.abs(Number(amount))
      
      const payload = {
        user_id: Number(selectedStudentId),
        amount: finalAmount,
        type: transactionType, // "reward" yoki "penalty"
        reason: reason,
        created_by: Number(user?.id)
      }

      await createTransaction(payload).unwrap()
      
      // Boshqa API'larni refresh qilish
      dispatch(usersApi.util.invalidateTags(['Users', { type: 'Users', id: Number(selectedStudentId) }]))
      dispatch(classesApi.util.invalidateTags(['Classes']))
      dispatch(coinsApi.util.invalidateTags(['Transactions', 'Balance']))

      toast?.success(`Muvaffaqiyatli: ${amount} tanga ${transactionType === 'reward' ? 'berildi' : 'jarima qilindi'}`)
      
      // Reset form
      setAmount("")
      setReason("")
      // Don't reset student to allow quick multiple actions
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Transaction failed", err)
      const msg = err.data?.message || err.data?.error || "Xatolik yuz berdi"
      toast?.error(msg)
    }
  }

  if (transactionsLoading) return <LoadingSpinner fullScreen />

  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4 md:pt-6">
      {/* Header & Balance */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Coins className="h-8 w-8 text-yellow-500" />
            Tangalar Tizimi
          </h1>
          <p className="text-gray-500 mt-1">O'z balansingiz va tranzaksiyalar tarixi</p>
        </div>
        
        {!isTeacherOrAdmin && (
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="bg-white p-3 rounded-full shadow-sm">
                 <Coins className="h-8 w-8 text-yellow-500" />
               </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Joriy Balans</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.coins || 0} <span className="text-sm font-normal text-gray-500">tanga</span></p>
                </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Give Coins (Teacher/Admin) or Stats (Student) */}
        <div className="lg:col-span-1 space-y-6">
          {isTeacherOrAdmin ? (
            <Card className="border-t-4 border-t-indigo-500 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-indigo-600" />
                  Tanga berish / Jarima
                </CardTitle>
                <CardDescription>O'quvchilarni rag'batlantirish yoki jazolash</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGiveCoins} className="space-y-4">
                  {successMessage && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex gap-2 items-center">
                      <CheckCircle2 className="h-4 w-4" /> {successMessage}
                    </div>
                  )}
                  {errorMessage && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex gap-2 items-center">
                      <AlertCircle className="h-4 w-4" /> {errorMessage}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Amal turi</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={transactionType === "reward" ? "default" : "outline"}
                        className={transactionType === "reward" ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => setTransactionType("reward")}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Mukofot
                      </Button>
                      <Button
                        type="button"
                        variant={transactionType === "penalty" ? "default" : "outline"}
                        className={transactionType === "penalty" ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => setTransactionType("penalty")}
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Jarima
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sinfni tanlang</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sinf tanlanmagan" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls._id || cls.id} value={(cls._id || cls.id).toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>O'quvchi</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedClassId ? "O'quvchini tanlang" : "Avval sinfni tanlang"} />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student._id || student.id} value={(student._id || student.id).toString()}>
                            {student.fullname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStudentId && (
                      <p className="text-[10px] md:text-xs font-semibold text-indigo-600 mt-1.5 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md w-fit border border-indigo-100/50">
                        <CheckCircle2 className="h-3 w-3" />
                        Joriy balansi: {students.find((s: any) => (s._id || s.id).toString() === selectedStudentId)?.coins || 0} tanga
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Miqdor (tanga)</Label>
                    <Input 
                      type="number" 
                      placeholder="1 dan 50 gacha" 
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || Number(val) <= 50) {
                          setAmount(val)
                        }
                      }}
                      min="1"
                      max="50"
                    />
                    <p className="text-xs text-gray-500">Eng ko'pi bilan 50 ta tanga</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sabab</Label>
                    <Textarea 
                      placeholder="Nima uchun?" 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <div className="mr-2"><LoadingSpinner size="sm"/></div> : null}
                    {transactionType === "reward" ? "Mukofotlash" : "Jarima yozish"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
             // Student Stats
             <Card>
               <CardHeader>
                 <CardTitle>Statistika</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full text-green-600 shadow-sm"><TrendingUp className="h-5 w-5"/></div>
                      <span className="font-medium text-gray-700">Ishlangan</span>
                    </div>
                    <span className="text-xl font-bold text-green-700">+{stats.earned}</span>
                 </div>
                 <div className="bg-orange-50 p-4 rounded-lg flex items-center justify-between border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full text-orange-600 shadow-sm"><TrendingDown className="h-5 w-5"/></div>
                      <span className="font-medium text-gray-700">Sarflangan/Jarima</span>
                    </div>
                    <span className="text-xl font-bold text-orange-700">-{stats.spent}</span>
                 </div>
               </CardContent>
             </Card>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-sm">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-500" />
                  Tranzaksiyalar tarixi
                </CardTitle>
                <Tabs value={filterType} onValueChange={setFilterType} className="w-[300px]">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="all" className="text-xs">Barchasi</TabsTrigger>
                    <TabsTrigger value="income" className="text-xs">Kirim</TabsTrigger>
                    <TabsTrigger value="expense" className="text-xs">Chiqim</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
                {transactionsError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-red-500">
                    <AlertCircle className="h-8 w-8 mb-3" />
                    <p className="font-medium">Xatolik yuz berdi</p>
                    <p className="text-sm mt-1">{JSON.stringify(transactionsError)}</p>
                  </div>
                ) : (!filteredTransactions || filteredTransactions.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <History className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium">Tranzaksiyalar topilmadi</p>
                  </div>
                ) : (
                 <div className="divide-y divide-gray-100">
                   {filteredTransactions.map((tx: any) => {
                     const isPositive = Number(tx.amount) > 0
                     const isSelf = tx.user_id === user?.id
                     
                     return (
                       <div key={tx._id || tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                           <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {isPositive ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                           </div>
                           <div>
                             <p className="font-medium text-gray-900">{tx.reason || tx.description || "Izohsiz"}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                               <Badge variant="secondary" className="text-[10px] h-5">
                                 {tx.type === 'reward' ? "Mukofot" : tx.type === 'penalty' ? "Jarima" : tx.type === 'attendance' ? "Davomat" : tx.type}
                               </Badge>
                               <span className="text-[10px] font-medium text-gray-400 italic">
                                  {isSelf ? "Olingan" : `Yuborilgan (@${tx.receiver?.username || 'user'})`}
                               </span>
                               <span className="text-xs text-gray-500">
                                 {new Date(tx.createdAt || tx.created_at).toLocaleDateString("uz-UZ", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                           </div>
                         </div>
                         <span className={`font-bold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                           {isPositive ? "+" : ""}{tx.amount}
                         </span>
                       </div>
                     )
                   })}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
