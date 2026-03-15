"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Check, Trash2, Info, Award, AlertTriangle, Hammer, X } from "lucide-react"
import { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation, 
  useDeleteNotificationMutation 
} from "@/lib/api/notificationsApi"
import { formatDistanceToNow } from "date-fns"
import { uz } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { data: notificationsData, isLoading } = useGetNotificationsQuery(undefined, {
    pollingInterval: 10000, 
  })

  const notifications = Array.isArray(notificationsData) ? notificationsData : notificationsData?.data || []

  // Yangi xabarnoma kelganda toast chiqarish
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      if (!latest.is_read && latest.id !== lastNotificationId) {
        toast.info(latest.title, {
          description: latest.message,
          icon: getIcon(latest.type)
        })
        setLastNotificationId(latest.id)
      }
    }
  }, [notifications])
  
  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead] = useMarkAllAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'reward': return <Award className="w-5 h-5 text-green-500" />
      case 'penalty': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'auction': return <Hammer className="w-5 h-5 text-blue-500" />
      default: return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-white dark:border-gray-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Xabarnomalar</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead(undefined)}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Hammasini o'qildi qilish
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Hozircha xabarnomalar yo'q</p>
              </div>
            ) : (
              notifications.map((notification: any) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-4 border-b border-gray-50 dark:border-gray-800 flex gap-3 transition-colors relative group",
                    !notification.is_read ? "bg-red-50/30 dark:bg-red-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => !notification.is_read && markAsRead(notification.id)}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn(
                        "text-sm font-bold truncate pr-6",
                        !notification.is_read ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
                      )}>
                        {notification.title}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="absolute right-2 top-4 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className={cn(
                      "text-sm mb-1 leading-relaxed",
                      !notification.is_read ? "text-gray-800 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: uz })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="absolute right-2 bottom-4">
                      <div className="h-2 w-2 rounded-full bg-red-600"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">Oxirgi 50 ta xabarnoma ko'rsatilmoqda</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
