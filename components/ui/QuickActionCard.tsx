// components/ui/QuickActionCard.tsx
import Link from "next/link"
import { LucideIcon } from "lucide-react"

interface QuickActionProps {
  href: string
  icon: LucideIcon
  label: string
  color: "red" | "blue" | "green" | "yellow"
}

export default function QuickActionCard({ href, icon: Icon, label, color }: QuickActionProps) {
  const colorClasses = {
    red: "bg-red-50 hover:bg-red-100 text-red-700 border-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-900/30",
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30",
    green: "bg-green-50 hover:bg-green-100 text-green-700 border-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20 dark:text-green-400 dark:border-green-900/30",
    yellow: "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-100 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30",
  }

  return (
    <Link
      href={href}
      className={`p-5 rounded-xl border flex flex-col items-center gap-3 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${colorClasses[color]}`}
    >
      <Icon className="w-10 h-10" />
      <span className="text-sm font-semibold text-center">{label}</span>
    </Link>
  )
}