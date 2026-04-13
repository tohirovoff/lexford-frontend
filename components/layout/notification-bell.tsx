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
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { data: notificationsData, isLoading } = useGetNotificationsQuery(undefined, {
    pollingInterval: 10000, 
  })

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") {
        toast.success("Bildirishnomalar yoqildi!")
      }
    }
  }

  const notifications = Array.isArray(notificationsData) ? notificationsData : notificationsData?.data || []

  // Yangi xabarnoma kelganda toast va browser notification chiqarish
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      if (!latest.is_read && latest.id !== lastNotificationId) {
        // Sonner toast
        toast.info(latest.title, {
          description: latest.message,
          icon: getIcon(latest.type)
        })

        // Browser Native Notification (for phone/desktop background if tab is open/active)
        if (permission === "granted") {
          new Notification(latest.title, {
            body: latest.message,
            icon: '/icon.svg'
          })
        }
        
        setLastNotificationId(latest.id)
      }
    }
  }, [notifications, permission, lastNotificationId])
  
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
        <>
          {/* Overlay for mobile to close when clicking outside */}
          <div 
            className="md:hidden fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className={cn(
            "absolute right-[-60px] sm:right-0 top-full mt-3 w-[calc(100vw-32px)] sm:w-96 max-h-[80vh] md:max-h-[500px]",
            "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in duration-200",
            "flex flex-col"
          )}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Xabarnomalar</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead(undefined)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Hammasini o'qildi qilish
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {permission === "default" && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 font-medium">
                    Yangi xabarlardan birinchilardan bo'lib xabardor bo'ling!
                  </p>
                  <button 
                    onClick={requestPermission}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Bildirishnomalarni yoqish
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="p-8 text-center h-full flex flex-col items-center justify-center">
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
                          "text-sm font-bold truncate pr-8",
                          !notification.is_read ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
                        )}>
                          {notification.title}
                        </p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="absolute right-2 top-4 p-1 text-gray-400 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
        </>
      )}
    </div>
  )
}
