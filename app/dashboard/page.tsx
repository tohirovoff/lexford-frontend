"use client"

import { useSelector } from "react-redux"
import {
  useGetAllUsersQuery,
  useGetSchoolLeaderboardQuery,
  useGetUserQuery,
} from "@/lib/api/usersApi"
import { useGetAllClassesQuery } from "@/lib/api/classesApi"
import { useGetUserTransactionsQuery } from "@/lib/api/coinsApi"
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
  ClipboardCheck,
  Coins,
  Gavel,
  ArrowRight,
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

  const studentsCount = Array.isArray(users) ? users.filter((u: any) => u.role === "student").length : 0
  const teachersCount = Array.isArray(users) ? users.filter((u: any) => u.role === "teacher").length : 0
  const classesCount = Array.isArray(classes) ? classes.length : 0

  const isLoading = loadingUsers || loadingClasses || loadingLeaderboard || loadingTransactions

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Welcome Header Skeleton */}
        <div className="bg-white/40 dark:bg-gray-900/40 rounded-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-gray-100/50 backdrop-blur-sm">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-10 w-[280px] md:w-[400px]" />
            <Skeleton className="h-5 w-[140px]" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl shadow-sm border border-gray-100/50" />
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leaderboard Skeleton */}
          <div className="bg-white/40 dark:bg-gray-900/40 rounded-xl border border-gray-100/50 p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-5 p-4 rounded-lg border border-gray-50/50">
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

          {/* Quick Actions Skeleton */}
          <div className="bg-white/40 dark:bg-gray-900/40 rounded-xl border border-gray-100/50 p-6 lg:p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-gray-100">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
            Xush kelibsiz, {user?.fullname || user?.username}!
          </h1>
          <p className="text-gray-600 mt-2 text-sm font-medium">
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
              label="Tangalar"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={Coins} label="Sizning tangalaringiz" value={userProfile?.coins || 0} color="red" isCoin />
          <StatCard icon={Award} label="Sinf" value={user?.class_name || "—"} color="blue" isText />
          <StatCard icon={TrendingUp} label="Baholar" value={user?.grade || "—"} color="green" isText />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Reyting jadvali</h2>
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
            <div className="space-y-4">
              {leaderboard.map((item: any, index: number) => (
                <div
                  key={item.user_id || index}
                  className="flex items-center gap-5 p-4 rounded-lg hover:bg-gray-50 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-md"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold text-lg flex-shrink-0 shadow-sm
                      ${index === 0 ? "bg-yellow-500 text-white ring-2 ring-yellow-300" : ""}
                      ${index === 1 ? "bg-gray-300 text-gray-800" : ""}
                      ${index === 2 ? "bg-orange-500 text-white" : ""}
                      ${index > 2 ? "bg-gray-200 text-gray-700" : ""}`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base text-gray-900 truncate">
                      {item.fullname || item.username || "Noma'lum"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
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
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tezkor harakatlar</h2>

          <div className="grid grid-cols-2 gap-5">
            {(isAdmin || isTeacher) && (
              <>
                <QuickActionCard
                  href="/attendance"
                  icon={ClipboardCheck}
                  label="Davomat belgilash"
                  color="red"
                />
                <QuickActionCard href="/users" icon={Users} label="Foydalanuvchilar" color="blue" />
              </>
            )}
            <QuickActionCard href="/coins" icon={Coins} label="Tangalar" color="green" />
            <QuickActionCard href="/auctions" icon={Gavel} label="Auksionlar" color="yellow" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {(isStudent) && recentTransactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">So'nggi harakatlar</h2>
            <Link
              href="/coins"
              className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-2 hover:underline"
            >
              Hammasini ko'rish <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0
                      ${tx.amount > 0 ? "bg-green-100" : "bg-red-100"}`}
                  >
                    <Coins className={`w-6 h-6 ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{tx.reason || tx.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(tx.created_at).toLocaleString("uz-UZ", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold text-base ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
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