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
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <div className={`${sizeClasses[size]} rounded-lg bg-yellow-100 flex items-center justify-center shadow-sm`}>
          <Coins
            className={`w-${size === "sm" ? "4" : size === "md" ? "5" : size === "lg" ? "6" : "8"} h-${size === "sm" ? "4" : size === "md" ? "5" : size === "lg" ? "6" : "8"} text-yellow-600`}
          />
        </div>
        <div>
          <p className={`${textSizes[size]} font-semibold text-gray-900`}>{coins.toLocaleString()}</p>
          {showLabel && <p className="text-xs text-gray-600">{label}</p>}
        </div>
      </div>
    </div>
  )
}

export { CoinDisplay }
