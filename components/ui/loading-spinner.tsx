"use client"

import { useTranslation } from "react-i18next"
import { Coins } from "lucide-react"

interface LoadingSpinnerProps {
  fullScreen?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

function LoadingSpinner({ fullScreen = false, size = "md" }: LoadingSpinnerProps) {
  const { t } = useTranslation()

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  }

  const iconSizes = {
    sm: 14,
    md: 24,
    lg: 40,
    xl: 64,
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-8 relative select-none">
      <div className="relative flex items-center justify-center">
        {/* Animated outer rings */}
        <div className={`absolute ${sizeClasses[size]} rounded-full border-[3px] border-red-600/10 dark:border-red-500/5`} />
        <div className={`absolute ${sizeClasses[size]} rounded-full border-[3px] border-transparent border-t-red-600 border-r-red-600/40 animate-spin duration-1000`} />
        <div className={`absolute ${sizeClasses[size]} scale-90 rounded-full border-[2px] border-transparent border-b-red-500/30 border-l-red-500/10 animate-reverse-spin`} />
        
        {/* Inner pulsing icon container */}
        <div className={`relative flex items-center justify-center ${sizeClasses[size]} bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-900 rounded-full shadow-inner`}>
          <div className="animate-pulse flex items-center justify-center text-red-600 drop-shadow-sm">
             <Coins size={iconSizes[size]} strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Floating particles effect (simulated with dots) */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-ping delay-75" />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-red-300 rounded-full animate-ping delay-300" />
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <span className="text-gray-900 dark:text-gray-100 font-semibold tracking-wide text-sm md:text-base animate-pulse">
            {t("common.loading", "Yuklanmoqda...")}
        </span>
        
        {/* Modern progress bar */}
        <div className="h-1.5 w-32 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden relative border border-gray-200/50 dark:border-gray-700/30">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/40 via-red-600 to-red-600/40 animate-shimmer w-[200%] -translate-x-1/2" />
        </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-xl flex items-center justify-center z-[9999] transition-all duration-500">
        <div className="p-16 rounded-[2.5rem] bg-white/40 dark:bg-gray-950/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/60 dark:border-gray-800/40 backdrop-saturate-150 transform transition-all">
          {spinner}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-16 w-full animate-in fade-in duration-700">
      {spinner}
    </div>
  )
}

export default LoadingSpinner
