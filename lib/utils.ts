import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_BASE_URL } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined) {
  if (!path) return "/placeholder.svg"
  if (path.startsWith("http")) return path
  // Handle paths like "/uploads/..." or "uploads/..."
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
