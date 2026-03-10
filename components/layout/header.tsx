"use client"

import { useDispatch, useSelector } from "react-redux"
import { logout } from "@/lib/store"
import CoinDisplay from "@/components/ui/coin-display"
import { Menu, UserCircle, LogOut, ChevronDown } from "lucide-react"
import { getImageUrl } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"

interface HeaderProps {
  onMenuClick: () => void  // Sidebar ochish uchun (mobil)
}

export default function Header({ onMenuClick }: HeaderProps) {
  const dispatch = useDispatch()
  const { user } = useSelector((state: any) => state.auth)

  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    setUserDropdownOpen(false)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrator"
      case "teacher": return "O'qituvchi"
      case "student": return "O'quvchi"
      default: return role
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 shadow-sm backdrop-blur-sm bg-opacity-90">
      <div className="flex items-center justify-between h-full px-4 md:px-8 max-w-screen-2xl mx-auto">
        {/* Left: Logo + Hamburger (mobil uchun) */}
        <div className="flex items-center gap-5">
          {/* Hamburger - faqat mobil */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-7 h-7 text-gray-700" />
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-extrabold text-2xl">L</span>
            </div>
            <span className="text-2xl font-extrabold text-gray-900 hidden md:block">Lexford</span>
          </Link>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Coin Display - faqat student uchun */}
          {user?.role === "student" && (
            <div className="hidden sm:block">
              <CoinDisplay coins={user?.coins || 0} size="lg" showLabel />
            </div>
          )}

          {/* User Dropdown */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-md">
                  {user?.profile_picture ? (
                    <img
                      src={getImageUrl(user.profile_picture)}
                      alt={user.fullname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-600">
                      <UserCircle className="w-7 h-7" />
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                    {user?.fullname || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-fade-in">
                  {/* User Info */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="font-semibold text-lg text-gray-900">{user?.fullname}</p>
                    <p className="text-sm text-gray-600">@{user?.username}</p>
                  </div>

                  {/* Menu Items */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-4 px-6 py-4 text-gray-800 hover:bg-gray-50 transition-colors"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <UserCircle className="w-5 h-5" />
                    Shaxsiy kabinet
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout()
                      setUserDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Chiqish
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium shadow-md"
            >
              Kirish
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}