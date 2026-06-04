"use client"

interface LoadingSpinnerProps {
  fullScreen?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

function LoadingSpinner({ fullScreen = false, size = "md" }: LoadingSpinnerProps) {
  if (fullScreen) {
    return <div className="route-progress" />
  }

  const dimensions: Record<string, string> = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  }

  const borderWidth: Record<string, string> = {
    sm: "border-[1.5px]",
    md: "border-2",
    lg: "border-2",
    xl: "border-[2.5px]",
  }

  return (
    <div className="flex items-center justify-center py-8 w-full">
      <div
        className={`${dimensions[size]} ${borderWidth[size]} rounded-full border-muted-foreground/20 border-t-primary animate-spin`}
      />
    </div>
  )
}

export default LoadingSpinner
