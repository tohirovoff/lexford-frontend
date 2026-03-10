"use client"

import { useTranslation } from "react-i18next"

interface LoadingSpinnerProps {
  fullScreen?: boolean
  size?: "sm" | "md" | "lg"
}

function LoadingSpinner({ fullScreen = false, size = "md" }: LoadingSpinnerProps) {
  const { t } = useTranslation()

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-red-600 rounded-full animate-spin`} />
      <span className="text-gray-500 text-sm">Yuklanmoqda...</span>
    </div>
  )

  if (fullScreen) {
    return <div className="fixed inset-0 bg-white flex items-center justify-center z-50">{spinner}</div>
  }

  return <div className="flex items-center justify-center py-8">{spinner}</div>
}

export default LoadingSpinner
