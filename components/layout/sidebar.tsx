"use client"

import { useSelector, useDispatch } from "react-redux"
import { logout } from "@/lib/store"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  Coins,
  Gavel,
  Settings,
  LogOut,
  X,
  ShoppingBag,
  Calendar,
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const dispatch = useDispatch()
  const { user } = useSelector((state: any) => state.auth)
  const pathname = usePathname()

  const navItems = [
    {
      href: "/dashboard",
      label: "Boshqaruv",
      icon: LayoutDashboard,
      roles: ["admin", "teacher", "student"],
    },
    {
      href: "/users",
      label: "Foydalanuvchilar",
      icon: Users,
      roles: ["admin"],
    },
    {
      href: "/classes",
      label: "Sinflar",
      icon: GraduationCap,
      roles: ["admin", "teacher", "student"],
    },
    {
      href: "/attendance",
      label: "Davomat",
      icon: ClipboardCheck,
      roles: ["admin", "teacher"],
    },
    {
      href: "/schedule",
      label: "Dars jadvali",
      icon: Calendar,
      roles: ["admin", "teacher", "student"],
    },
    {
      href: "/coins",
      label: "Tangalar",
      icon: Coins,
      roles: ["admin", "teacher", "student"],
    },
    {
      href: "/shop",
      label: "Do'kon",
      icon: ShoppingBag,
      roles: ["admin", "teacher", "student"],
    },
    {
      href: "/settings",
      label: "Sozlamalar",
      icon: Settings,
      roles: ["admin", "teacher", "student"],
    },
  ].filter((item) => item.roles.includes(user?.role || ""))

  const isActive = (href: string) => 
    pathname === href || pathname.startsWith(`${href}/`)

  const getRoleLabel = (role: string) => {
    switch(role) {
       case 'admin': return 'Admin';
       case 'teacher': return "O'qituvchi";
       case 'student': return "O'quvchi";
       default: return role || "Foydalanuvchi";
    }
  }

  return (
    <>
      {/* Mobile overlay - faqat sidebar ochiq bo'lganda */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card dark:bg-card border-r border-border dark:border-border shadow-2xl
          transform transition-all duration-300 ease-in-out xl:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo + Close button */}
        <div className="p-6 border-b border-border dark:border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Lexford Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lexford</span>
          </Link>

          <button
            onClick={onClose}
            className="xl:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 pt-6 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose} // mobil qurilmada yopilishi uchun
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base transition-all duration-200
                    ${
                      isActive(item.href)
                        ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-foreground dark:hover:text-foreground"
                    }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom section: Role badge + Logout */}
        <div className="p-6 border-t border-border dark:border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm
                  ${
                    user?.role === "admin"
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : user?.role === "teacher"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                      : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                  }`}
              >
                {getRoleLabel(user?.role)}
              </div>

              {user?.class_name && (
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden lg:block">
                  {user.class_name}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                dispatch(logout())
                onClose() // mobil qurilmada yopilishi uchun
              }}
              className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors hover:shadow-sm"
              title="Chiqish"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}