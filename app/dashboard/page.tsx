"use client"

import { useSelector } from "react-redux"
import {
  useGetAllUsersQuery,
  useGetSchoolLeaderboardQuery,
  useGetUserQuery,
} from "@/lib/api/usersApi"
import { useGetAllClassesQuery } from "@/lib/api/classesApi"
import { useGetUserTransactionsQuery, useGetWeeklyChangeQuery, useGetWeeklyTopGainersQuery } from "@/lib/api/coinsApi"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import CoinDisplay from "@/components/ui/coin-display"
import StatCard from "@/components/ui/StatCard"
import QuickActionCard from "@/components/ui/QuickActionCard"
import {
  Users,
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  Coins,
  ShoppingBag,
  ArrowRight,
  Calendar as CalendarIcon,
  Flame,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { user } = useSelector((state: any) => state.auth)

  // Fresh user data for coins
  const { data: userProfileResponse } = useGetUserQuery(user?.id, { skip: !user?.id })
  const userProfile = userProfileResponse?.data || user

  const isAdmin = user?.role === "admin"
  const isTeacher = user?.role === "teacher"
  const isStudent = user?.role === "student"

  // Leaderboard
  const { data: leaderboardResponse, isLoading: loadingLeaderboard } = useGetSchoolLeaderboardQuery(undefined)
  const leaderboardRaw = leaderboardResponse?.data || leaderboardResponse || []
  const leaderboard = Array.isArray(leaderboardRaw) ? leaderboardRaw.slice(0, 10) : []

  // Qolgan ma'lumotlar
  const { data: usersResponse, isLoading: loadingUsers } = useGetAllUsersQuery(undefined)
  const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.data || []

  const { data: classesResponse, isLoading: loadingClasses } = useGetAllClassesQuery(undefined)
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []
  
  const { data: transactionsResponse, isLoading: loadingTransactions } = useGetUserTransactionsQuery(user?.id, { skip: !user?.id })
  const transactionsData = Array.isArray(transactionsResponse) ? transactionsResponse : transactionsResponse?.data || []

  const recentTransactions = Array.isArray(transactionsData) ? transactionsData.slice(0, 5) : []

  // Haftalik o'zgarish (student uchun)
  const { data: weeklyChangeData } = useGetWeeklyChangeQuery(user?.id, { skip: !user?.id })
  
  // Haftalik top 10 (admin/teacher uchun)
  const { data: weeklyTopGainersResponse } = useGetWeeklyTopGainersQuery(undefined, { skip: !isAdmin && !isTeacher })
  const topGainers = weeklyTopGainersResponse?.data || (Array.isArray(weeklyTopGainersResponse) ? weeklyTopGainersResponse : [])
  const weeklyPeriodStart = weeklyTopGainersResponse?.period_start
  const weeklyPeriodEnd = weeklyTopGainersResponse?.period_end
  const isCurrentWeek = weeklyTopGainersResponse?.is_current_week

  let studentsCount = Array.isArray(users) ? users.filter((u: any) => u.role === "student").length : 0
  let teachersCount = Array.isArray(users) ? users.filter((u: any) => u.role === "teacher").length : 0
  const classesCount = Array.isArray(classes) ? classes.length : 0

  // Fallback: Agar users bo'sh bo'lsa (masalan, o'qituvchi uchun 403 qilsa), 
  // o'quvchilar sonini sinflar ichidagi studentlar orqali hisoblaymiz.
  if (studentsCount === 0 && classes.length > 0) {
    studentsCount = classes.reduce((acc: number, c: any) => acc + (c.students?.length || 0), 0)
    // O'qituvchilarni sinf rahbarlaridan sanaymiz (taxminiy, uniq qilib)
    const uniqueTeachers = new Set()
    classes.forEach((c: any) => { if (c.teacher?.id) uniqueTeachers.add(c.teacher.id) })
    teachersCount = uniqueTeachers.size || 1
  }

  const isLoading = loadingUsers || loadingClasses || loadingLeaderboard || loadingTransactions

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-card/40 dark:bg-card/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-border/50 backdrop-blur-sm">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-10 w-[280px] md:w-[400px]" />
            <Skeleton className="h-5 w-[140px]" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl shadow-sm border border-border/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-100/50 p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-5 p-4 rounded-xl border border-gray-50/50 text-ellipsis">
                   <Skeleton className="h-12 w-12 rounded-lg" />
                   <div className="flex-1 space-y-2">
                     <Skeleton className="h-5 w-3/4" />
                     <Skeleton className="h-4 w-1/2" />
                   </div>
                   <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-100/50 p-6 lg:p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* Welcome Header */}
      <div className="bg-card dark:bg-card rounded-2xl shadow-md p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border border-border dark:border-border transition-all hover:shadow-lg">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Xush kelibsiz, <span className="text-red-600">{user?.fullname || user?.username}</span>!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {(() => {
              const d = new Date()
              const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"]
              return `${d.getFullYear()}-yil ${d.getDate()}-${months[d.getMonth()]}`
            })()}
          </p>
        </div>

        {(isStudent) && (
          <div className="flex-shrink-0">
            <CoinDisplay
              coins={userProfile?.coins || 0}
              size="lg"
              showLabel={true}
              label="Coins"
              className="shadow-sm hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </div>

      {/* Admin/Teacher Stats */}
      {(isAdmin || isTeacher) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon={Users} label="Umumiy o'quvchilar" value={studentsCount} color="red" />
          <StatCard icon={GraduationCap} label="Umumiy o'qituvchilar" value={teachersCount} color="blue" />
          <StatCard icon={Award} label="Sinflar soni" value={classesCount} color="green" />
        </div>
      )}

      {/* Student Personal Stats */}
      {isStudent && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard icon={Coins} label="Sizning tangalaringiz" value={userProfile?.coins || 0} color="yellow" isCoin />
            <StatCard icon={Award} label="Sinf" value={user?.class_name || "—"} color="blue" isText />
            <StatCard icon={TrendingUp} label="Baholar" value={user?.grade || "—"} color="green" isText />
          </div>

          {/* Haftalik O'zgarish Karti */}
          {weeklyChangeData && (
            <div className={`rounded-2xl shadow-sm border p-5 md:p-6 flex items-center gap-5 transition-all ${
              weeklyChangeData.weekly_change > 0
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800'
                : weeklyChangeData.weekly_change < 0
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-800'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 dark:from-gray-900/30 dark:to-slate-900/30 dark:border-gray-700'
            }`}>
              <div className={`p-3 rounded-xl shadow-sm ${
                weeklyChangeData.weekly_change > 0
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                  : weeklyChangeData.weekly_change < 0
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {weeklyChangeData.weekly_change > 0
                  ? <ArrowUpRight className="h-7 w-7" />
                  : weeklyChangeData.weekly_change < 0
                    ? <ArrowDownRight className="h-7 w-7" />
                    : <TrendingUp className="h-7 w-7" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">Haftalik o'zgarish</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-2xl font-extrabold ${
                    weeklyChangeData.weekly_change > 0 ? 'text-green-700 dark:text-green-400' 
                    : weeklyChangeData.weekly_change < 0 ? 'text-red-700 dark:text-red-400' 
                    : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {weeklyChangeData.weekly_change > 0 ? '+' : ''}{weeklyChangeData.weekly_change} tanga
                  </span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                    weeklyChangeData.percentage_change > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                    : weeklyChangeData.percentage_change < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {weeklyChangeData.percentage_change > 0 ? '+' : ''}{weeklyChangeData.percentage_change}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {weeklyChangeData.is_current_week ? "Joriy hafta" : "O'tgan hafta"}
                  {weeklyChangeData.period_start && weeklyChangeData.period_end && (
                    <span className="ml-1">
                      ({new Date(weeklyChangeData.period_start).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'short' })}
                      {" — "}
                      {new Date(weeklyChangeData.period_end).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'short' })})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        <div className="bg-card dark:bg-card rounded-2xl shadow-sm border border-border dark:border-border p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Reyting jadvali</h2>
            <Award className="w-8 h-8 text-yellow-600" />
          </div>

          {loadingLeaderboard ? (
            <div className="text-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Award className="w-20 h-20 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Hozircha reyting bo'sh</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {leaderboard.map((item: any, index: number) => (
                <div
                  key={item.user_id || index}
                  className="flex items-center gap-3 md:gap-5 p-3 md:p-4 rounded-xl hover:bg-accent dark:hover:bg-accent transition-all duration-300 border border-border dark:border-border shadow-sm hover:shadow-md"
                >
                  <div
                    className={`w-8 h-8 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-sm md:text-lg flex-shrink-0 shadow-sm
                      ${index === 0 ? "bg-yellow-500 text-white ring-2 ring-yellow-300" : ""}
                      ${index === 1 ? "bg-gray-300 text-gray-800" : ""}
                      ${index === 2 ? "bg-orange-500 text-white" : ""}
                      ${index > 2 ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : ""}`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100 break-words">
                      {item.fullname || item.username || "Noma'lum"}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.class_name || "Sinf yo'q"}
                    </p>
                  </div>

                  <CoinDisplay 
                    coins={item.coins || item.balance || 0} 
                    size="md" 
                    showLabel={false} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card dark:bg-card rounded-2xl shadow-sm border border-border dark:border-border p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Tezkor harakatlar</h2>

          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {(isAdmin || isTeacher) && (
              <>
                <QuickActionCard
                  href="/attendance"
                  icon={ClipboardCheck}
                  label="Davomat"
                  color="red"
                />
                <QuickActionCard href="/users" icon={Users} label="Foydalanuvchilar" color="blue" />
              </>
            )}
            <QuickActionCard href="/coins" icon={Coins} label="Tangalar" color="green" />
            <QuickActionCard href="/shop" icon={ShoppingBag} label="Do'kon" color="yellow" />
          </div>
        </div>
      </div>

      {/* Haftalik TOP 10 — Admin/Teacher uchun */}
      {(isAdmin || isTeacher) && topGainers.length > 0 && (
        <div className="bg-card dark:bg-card rounded-2xl shadow-sm border border-border dark:border-border p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <Flame className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Haftalik TOP 10</h2>
                <p className="text-sm text-muted-foreground">
                  {isCurrentWeek ? "Joriy hafta" : "O'tgan hafta"}
                  {weeklyPeriodStart && weeklyPeriodEnd && (
                    <span className="ml-1">
                      ({new Date(weeklyPeriodStart).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'short' })}
                      {" — "}
                      {new Date(weeklyPeriodEnd).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'short' })})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {topGainers.map((student: any, index: number) => (
              <div
                key={student.user_id || index}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-accent dark:hover:bg-accent transition-all duration-300 border border-border dark:border-border shadow-sm hover:shadow-md"
              >
                {/* Rank */}
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 shadow-sm
                    ${index === 0 ? "bg-yellow-500 text-white ring-2 ring-yellow-300" : ""}
                    ${index === 1 ? "bg-gray-300 text-gray-800" : ""}
                    ${index === 2 ? "bg-orange-500 text-white" : ""}
                    ${index > 2 ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : ""}`}
                >
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100 break-words">
                    {student.fullname || student.username || "Noma'lum"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hozirgi balans: {student.current_coins} tanga
                  </p>
                </div>

                {/* Weekly Earned */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-600 dark:text-green-400">
                      +{student.weekly_earned}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    student.percentage_change > 0 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {student.percentage_change > 0 ? '+' : ''}{student.percentage_change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {isStudent && recentTransactions.length > 0 && (
        <div className="bg-card dark:bg-card rounded-2xl shadow-sm border border-border dark:border-border p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">So'nggi harakatlar</h2>
            <Link
              href="/coins"
              className="text-red-600 hover:text-red-700 text-sm font-bold flex items-center gap-2 transition-colors"
            >
              Hammasini ko'rish <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-accent/50 dark:bg-accent/50 hover:bg-accent dark:hover:bg-accent transition-all duration-300 border border-border dark:border-border shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0
                      ${tx.amount > 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                  >
                    <Coins className={`w-4 h-4 md:w-6 md:h-6 ${tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 break-words">
                      {tx.reason || tx.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(tx.created_at).toLocaleString("uz-UZ", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm md:text-base flex-shrink-0 ml-2 ${tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}