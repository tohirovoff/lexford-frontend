import { Coins } from "lucide-react"

interface CoinDisplayProps {
  coins: number
  size?: "sm" | "md" | "lg" | "xl"
  showLabel?: boolean
  label?: string
  className?: string
}

export default function CoinDisplay({
  coins,
  size = "md",
  showLabel = true,
  label = "Coins",
  className = "",
}: CoinDisplayProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  }

  return (
    <div className={`inline-flex items-center gap-3 p-1.5 ${showLabel ? "pr-4" : "pr-3"} rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-100/50 dark:border-amber-900/30 shadow-sm hover:shadow-md transition-all duration-300 group ${className}`}>
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
        <Coins
          className={`${size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : size === "lg" ? "w-6 h-6" : "w-8 h-8"} text-white drop-shadow-sm`}
        />
      </div>
      <div>
        <p className={`${textSizes[size]} font-black text-gray-900 dark:text-gray-100 leading-none tracking-tight`}>
          {coins.toLocaleString()}
        </p>
        {showLabel && (
          <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 mt-0.5 tracking-widest leading-none">
            {label}
          </p>
        )}
      </div>
    </div>
  )
}

export { CoinDisplay }
