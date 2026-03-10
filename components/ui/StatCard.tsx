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
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-5 border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all duration-300">
      <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-sm ${colorClasses[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <div className="flex items-center gap-3 mt-2">
          {isCoin ? (
            // CoinDisplay komponentingizni import qiling
            <CoinDisplay coins={Number(value)} size="md" showLabel={false} />
          ) : isText ? (
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          ) : (
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          )}
          {trend && (
            <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full shadow-sm">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}