"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useGetUserTransactionsQuery, useCreateTransactionMutation, useCreatePenaltyMutation, useCreateManyTransactionsMutation, coinsApi } from "@/lib/api/coinsApi"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Coins, TrendingUp, TrendingDown, History, ArrowUpCircle, ArrowDownCircle, Gift, AlertCircle, CheckCircle2, User, ArrowRight, Loader2, PlusCircle, MinusCircle } from "lucide-react"
import { toast } from "sonner"

const getTypeStyles = (type: string) => {
  switch(type) {
    case 'reward': return { label: "Mukofot", class: "bg-green-600 text-white shadow-sm" }
    case 'penalty': return { label: "Jarima", class: "bg-red-600/10 text-red-600 dark:text-red-400" }
    case 'attendance': return { label: "Davomat", class: "bg-blue-500/10 text-blue-600 dark:text-blue-400" }
    case 'purchase': return { label: "Xarid", class: "bg-purple-500/10 text-purple-600 dark:text-purple-400" }
    case 'auction_spent': return { label: "Auksion", class: "bg-red-600/10 text-red-600 dark:text-red-400" }
    case 'bid_refund': return { label: "Qaytarildi", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" }
    default: return { label: type, class: "bg-muted text-muted-foreground" }
  }
}

export default function CoinsPage() {
  const dispatch = useDispatch()
  const { user: sessionUser } = useSelector((state: any) => state.auth)
  const isTeacherOrAdmin = sessionUser?.role === "teacher" || sessionUser?.role === "admin"

  // Fresh user data for balance display
  const { data: userProfileResponse } = useGetUserQuery(sessionUser?.id, { skip: !sessionUser?.id })
  const user = userProfileResponse?.data || sessionUser

  // State for Give Coins form
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [amount, setAmount] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [transactionType, setTransactionType] = useState<"reward" | "penalty">("reward")
  const [filterType, setFilterType] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Always use User-specific transactions for everyone (Admin/Teacher/Student)
  const { 
    data: transactionsResponse, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useGetUserTransactionsQuery({ userId: user?.id, page: currentPage, limit: pageSize }, { skip: !user?.id })

  const rawTransactions = Array.isArray(transactionsResponse) 
    ? transactionsResponse 
    : transactionsResponse?.data || []
  const totalPages = transactionsResponse?.totalPages || 1

  const filteredTransactions = (rawTransactions || []).filter((tx: any) => {
    const amt = Number(tx.amount)
    if (filterType === "income") return amt > 0
    if (filterType === "expense") return amt < 0
    return true
  })

  const { data: classesResponse } = useGetAllClassesQuery(undefined, { skip: !isTeacherOrAdmin })
  
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []
  
  // Get students of selected class
  const selectedClass = classes.find((c: any) => (c._id || c.id).toString() === selectedClassId)
  const students = selectedClass?.students || []

  // Mutation
  const [createTransaction, { isLoading: isSubmittingTransaction }] = useCreateTransactionMutation()
  const [createPenalty, { isLoading: isSubmittingPenalty }] = useCreatePenaltyMutation()
  const [createManyTransactions, { isLoading: isSubmittingMany }] = useCreateManyTransactionsMutation()
  const isSubmitting = isSubmittingTransaction || isSubmittingPenalty || isSubmittingMany

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

    if (selectedStudentIds.length === 0 || !amount || !reason) {
      toast?.error("Barcha maydonlarni to'ldiring")
      return
    }

    if (Number(amount) < 1) {
      toast?.error("Kamida 1 ta tanga kiritish kerak")
      return
    }

    try {
      const finalAmount = transactionType === "penalty" ? -Math.abs(Number(amount)) : Math.abs(Number(amount))
      
      const payloads = selectedStudentIds.map(studentId => ({
        user_id: Number(studentId),
        amount: finalAmount,
        type: transactionType,
        reason: reason,
        created_by: Number(user?.id) || 0
      }))

      await createManyTransactions(payloads).unwrap()
      
      // Invalidate tags
      dispatch(usersApi.util.invalidateTags(['Users']))
      dispatch(classesApi.util.invalidateTags(['Classes']))
      dispatch(coinsApi.util.invalidateTags(['Transactions', 'Balance']))

      toast?.success(`Muvaffaqiyatli: ${amount} tangadan ${selectedStudentIds.length} o'quvchiga ${transactionType === 'reward' ? 'berildi' : 'jarima qilindi'}`)
      
      setAmount("")
      setReason("")
      setSelectedStudentIds([])
      
    } catch (err: any) {
      console.error("Transaction failed", err)
      const msg = err.data?.message || err.data?.error || "Xatolik yuz berdi"
      toast?.error(msg)
    }
  }

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(students.map((s: any) => (s._id || s.id).toString()))
    }
  }

  if (transactionsLoading) return <LoadingSpinner fullScreen />

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto pt-4 md:pt-6 px-4 md:px-0 pb-10">
      {/* Header & Balance Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-red-600/10 rounded-xl">
              <Coins className="h-6 w-6 md:h-8 md:w-8 text-red-600 animate-pulse" />
            </div>
            Tangalar Tizimi
          </h1>
          <p className="text-muted-foreground text-sm font-medium">O'z balansingiz va tranzaksiyalar tarixi</p>
        </div>
        
        {!isTeacherOrAdmin && (
          <Card className="w-full sm:w-auto bg-gradient-to-br from-red-600/10 via-red-600/5 to-transparent border-red-600/20 shadow-md backdrop-blur-md rounded-xl overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="bg-white/80 dark:bg-black/20 p-2.5 rounded-xl shadow-sm">
                 <Coins className="h-7 w-7 text-red-600" />
               </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600/70 dark:text-red-500/70">Joriy Balans</p>
                  <p className="text-2xl font-black text-foreground">{user?.coins || 0} <span className="text-xs font-bold text-muted-foreground uppercase ml-1">tanga</span></p>
                </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Form or Stats */}
        <div className="lg:col-span-1 space-y-6">
          {isTeacherOrAdmin ? (
            <Card className="border-t-4 border-t-red-600 shadow-lg rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-1.5 bg-red-600/10 rounded-lg">
                    <Gift className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  Tanga / Jarima
                </CardTitle>
                <CardDescription className="font-medium">O'quvchilarni rag'batlantirish yoki jazolash</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form onSubmit={handleGiveCoins} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amal turi</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={transactionType === "reward" ? "default" : "outline"}
                        className={`rounded-xl h-11 font-bold transition-all ${transactionType === "reward" ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20" : "hover:bg-green-500/5 hover:text-green-600"}`}
                        onClick={() => setTransactionType("reward")}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Mukofot
                      </Button>
                      <Button
                        type="button"
                        variant={transactionType === "penalty" ? "default" : "outline"}
                        className={`rounded-xl h-11 font-bold transition-all ${transactionType === "penalty" ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20" : "hover:bg-red-500/5 hover:text-red-600"}`}
                        onClick={() => setTransactionType("penalty")}
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Jarima
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sinfni tanlang</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50">
                        <SelectValue placeholder="Sinf tanlanmagan" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {classes.map((cls: any) => (
                          <SelectItem key={cls._id || cls.id} value={(cls._id || cls.id).toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">O'quvchilar</Label>
                      {selectedClassId && students.length > 0 && (
                        <button 
                          type="button" 
                          onClick={handleSelectAll}
                          className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest hover:underline"
                        >
                          {selectedStudentIds.length === students.length ? "Bekor qilish" : "Barchasi"}
                        </button>
                      )}
                    </div>
                    
                    {!selectedClassId ? (
                      <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground/50 text-sm font-medium bg-muted/20">
                        Avval sinfni tanlang
                      </div>
                    ) : students.length === 0 ? (
                      <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground/50 text-sm font-medium bg-muted/20">
                        O'quvchilar topilmadi
                      </div>
                    ) : (
                      <ScrollArea className="h-[220px] w-full border border-border/50 rounded-xl bg-muted/10 p-2">
                        <div className="space-y-1">
                          {students.map((student: any) => {
                            const studentId = (student._id || student.id).toString()
                            const isSelected = selectedStudentIds.includes(studentId)
                            return (
                              <div 
                                key={studentId} 
                                className={`flex items-center space-x-3 p-2 rounded-lg transition-all ${
                                  isSelected 
                                    ? "bg-primary/5 border-primary/20" 
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <Checkbox
                                  id={`student-${studentId}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) setSelectedStudentIds(p => [...p, studentId])
                                    else setSelectedStudentIds(p => p.filter(id => id !== studentId))
                                  }}
                                  className="rounded-md"
                                />
                                <label 
                                  htmlFor={`student-${studentId}`}
                                  className="flex-1 flex justify-between items-center min-w-0 cursor-pointer"
                                >
                                  <span className="text-sm font-medium truncate">{student.fullname}</span>
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                    {student.coins || 0}
                                  </Badge>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tanga miqdori</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-11 rounded-xl pl-10 font-bold bg-background/50 border-border/50 focus:ring-red-600/20"
                        />
                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sabab</Label>
                      <Textarea
                        placeholder="Nima uchun?"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="rounded-xl resize-none min-h-[80px] bg-background/50 border-border/50 focus:ring-red-600/20"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || selectedStudentIds.length === 0} 
                    className="w-full h-12 rounded-lg font-black uppercase tracking-widest text-white shadow-md transition-colors bg-red-600 hover:bg-red-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        {transactionType === 'reward' ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
                        Saqlash
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl shadow-lg border-none bg-gradient-to-br from-red-600/10 to-red-900/10 backdrop-blur-md overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  Statistika
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card/40 dark:bg-black/20 p-5 rounded-xl flex items-center justify-between border border-border/50 group transition-colors hover:border-green-500/30">
                   <div className="flex items-center gap-4">
                     <div className="bg-green-500/10 p-3 rounded-lg text-green-600 shadow-sm"><TrendingUp className="h-6 w-6"/></div>
                     <span className="font-bold text-foreground">Ishlangan</span>
                   </div>
                   <span className="text-2xl font-black text-green-600">+{stats.earned}</span>
                </div>
                <div className="bg-card/40 dark:bg-black/20 p-5 rounded-xl flex items-center justify-between border border-border/50 group transition-colors hover:border-red-600/30">
                   <div className="flex items-center gap-4">
                     <div className="bg-red-600/10 p-3 rounded-lg text-red-600 shadow-sm"><TrendingDown className="h-6 w-6"/></div>
                     <span className="font-bold text-foreground">Sarflangan</span>
                   </div>
                   <span className="text-2xl font-black text-red-600">-{stats.spent}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <Card className="h-full border-none shadow-lg rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <div className="p-1.5 bg-muted rounded-lg">
                    <History className="h-5 w-5 text-muted-foreground" />
                  </div>
                  Tarix
                </CardTitle>
                
                <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
                  <TabsList className="bg-muted/50 p-1 rounded-xl h-10 w-full sm:w-auto grid grid-cols-3 sm:flex">
                    <TabsTrigger value="all" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Barchasi</TabsTrigger>
                    <TabsTrigger value="income" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Kirim</TabsTrigger>
                    <TabsTrigger value="expense" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Chiqim</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                {transactionsError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4">
                      <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <p className="font-bold text-lg text-foreground">Xatolik yuz berdi</p>
                    <p className="text-sm opacity-70">Ma'lumotlarni yuklashda muammo bor</p>
                  </div>
                ) : (!filteredTransactions || filteredTransactions.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="bg-muted p-5 rounded-full mb-4 opacity-50">
                      <History className="h-12 w-12" />
                    </div>
                    <p className="font-bold text-lg text-foreground/50 uppercase tracking-widest">Ma'lumotlar yo'q</p>
                    <p className="text-sm opacity-50 mt-1">Hozircha hech qanday tranzaksiya amalga oshirilmagan</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {filteredTransactions.map((tx: any) => {
                      const amountValue = Number(tx.amount)
                      const isPositive = amountValue > 0
                      const isGiverSelf = Number(tx.created_by) === Number(user?.id)
                      const isReceiverSelf = Number(tx.user_id) === Number(user?.id)
                      const typeStyle = getTypeStyles(tx.type)
                      
                      return (
                        <div key={tx._id || tx.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-all duration-300 group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className={`p-2.5 rounded-xl shrink-0 mt-1 shadow-sm ${
                                isPositive 
                                  ? 'bg-green-500/10 text-green-600' 
                                  : 'bg-red-600/10 text-red-600'
                              } transition-colors`}>
                                 {isPositive ? <ArrowUpCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : <ArrowDownCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge variant="outline" className={`text-[9px] h-4.5 font-black uppercase px-1.5 border-none ${typeStyle.class}`}>
                                    {typeStyle.label}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter" suppressHydrationWarning>
                                    {new Date(tx.createdAt || tx.created_at).toLocaleDateString("uz-UZ", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="font-bold text-foreground text-sm sm:text-base break-words leading-tight">
                                  {tx.reason || tx.description || "Izohsiz"}
                                </p>
                                
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
                                    <div className="w-4 h-4 rounded-full bg-red-600/20 flex items-center justify-center">
                                      <User className="h-2.5 w-2.5 text-red-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-foreground/80">
                                      {isGiverSelf ? "Siz" : (tx.giver?.fullname || tx.giver?.username || "Tizim")}
                                    </span>
                                  </div>
                                  
                                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-30 shrink-0" />
                                  
                                  <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
                                    <div className="w-4 h-4 rounded-full bg-red-600/20 flex items-center justify-center">
                                      <User className="h-2.5 w-2.5 text-red-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-foreground/80">
                                      {isReceiverSelf ? "Siz" : (tx.receiver?.fullname || tx.receiver?.username || tx.receiver?.username || "Noma'lum")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className={`text-right shrink-0 px-3 py-2 rounded-xl border transition-colors ${
                              isPositive 
                                ? 'bg-green-500/5 border-green-500/20 group-hover:bg-green-500/10' 
                                : 'bg-red-600/5 border-red-600/20 group-hover:bg-red-600/10'
                            }`}>
                              <span className={`text-base sm:text-lg font-black tracking-tight ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isPositive ? "+" : ""}{amountValue}
                              </span>
                              <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mt-0.5">tanga</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
            </CardContent>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border/50">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Sahifa <span className="text-foreground">{currentPage}</span> / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={currentPage === 1}
                    className="rounded-xl h-9 px-4 font-bold text-xs"
                  >
                    Oldingi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={currentPage === totalPages}
                    className="rounded-xl h-9 px-4 font-bold text-xs"
                  >
                    Keyingi
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
