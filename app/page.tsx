"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, Provider } from "react-redux"
import { store } from "@/lib/store"
import LoadingSpinner from "@/components/ui/loading-spinner"

function HomeContent() {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: any) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [isAuthenticated, router])

  return <LoadingSpinner fullScreen />
}

export default function Page() {
  return <HomeContent />
}
