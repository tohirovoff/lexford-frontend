// components/ui/StatCard.tsx
import { LucideIcon } from "lucide-react"
import CoinDisplay from "./coin-display"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  color: "red" | "blue" | "green" | "yellow"
  trend?: string
  isCoin?: boolean
  isText?: boolean
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  isCoin = false,
  isText = false,
}: StatCardProps) {
  const colorClasses = {
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/30",
    yellow: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-5 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm border ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-3 mt-1">
          {isCoin ? (
            <CoinDisplay coins={Number(value)} size="lg" showLabel={false} />
          ) : (
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{value}</p>
          )}
          {trend && (
            <span className="text-xs text-green-700 font-bold bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full shadow-sm">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}