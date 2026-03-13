import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_BASE_URL } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined) {
  if (!path || path === "null" || path === "undefined" || path === "") return null
  if (path.startsWith("http") || path.startsWith("data:")) return path
  // Handle paths like "/uploads/..." or "uploads/..."
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

// Profile picture with default avatar fallback from server
export function getProfileImageUrl(path: string | null | undefined) {
  const url = getImageUrl(path)
  if (url) return url
  return `${API_BASE_URL}/uploads/default-avatar.png`
}
