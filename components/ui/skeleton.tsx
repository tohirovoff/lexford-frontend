import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800/50 rounded-md',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/20 after:dark:via-gray-700/20 after:to-transparent',
        'animate-pulse transition-opacity duration-300',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
