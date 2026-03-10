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
    red: "bg-red-50 hover:bg-red-100 text-red-700 border-red-100",
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100",
    green: "bg-green-50 hover:bg-green-100 text-green-700 border-green-100",
    yellow: "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-100",
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