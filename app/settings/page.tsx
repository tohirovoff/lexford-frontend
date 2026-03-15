"use client"

import { useState, useRef, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUpdateUserMutation, useChangePasswordMutation } from "@/lib/api/usersApi"
import { updateUser } from "@/lib/store"
import { toast } from "sonner"
import { Lock, Settings, Bell, Moon, Globe, LogOut, Camera } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

export default function SettingsPage() {
  // Redux & State
  const { user } = useSelector((state: any) => state.auth)
  const dispatch = useDispatch()
  const [updateUserMutation, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || "",
    username: user?.username || "",
    bio: user?.bio || "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Handlers
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append("fullname", profileData.fullname)
      if (profileData.bio) formData.append("bio", profileData.bio)
      
      const file = fileInputRef.current?.files?.[0]
      if (file) {
        formData.append("profile_picture", file)
      }

      const result = await updateUserMutation({ id: user.id, formData }).unwrap()
      dispatch(updateUser(result.data || result))
      toast.success("Profil muvaffaqiyatli yangilandi")
      setImagePreview(null)
    } catch (err) {
      toast.error("Xatolik yuz berdi")
      console.error(err)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Parollar mos kelmadi")
      return
    }
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }).unwrap()
      toast.success("Parol muvaffaqiyatli o'zgartirildi")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      toast.error(err?.data?.message || "Parolni o'zgartirishda xatolik yuz berdi")
    }
  }

  const isDark = mounted ? resolvedTheme === "dark" : false

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sozlamalar</h1>
        <p className="text-gray-500 dark:text-gray-400">Profil va xavfsizlik sozlamalarini boshqaring</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Xavfsizlik</TabsTrigger>
          <TabsTrigger value="app">Ilova</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil ma'lumotlari</CardTitle>
              <CardDescription>Shaxsiy ma'lumotlaringizni yangilang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-950 flex items-center justify-center">
                    {imagePreview || getImageUrl(user?.profile_picture) ? (
                      <img 
                        src={imagePreview || getImageUrl(user?.profile_picture) || ""} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "";
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-bold text-2xl uppercase">
                        {user?.fullname?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors z-10"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 leading-none">Profil rasmi</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Kvadrat rasm (1:1) tavsiya etiladi. Maksimum 5MB.</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-8"
                    >
                      Boshqa tanlash
                    </Button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <form id="profile-form" onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullname">To'liq ism</Label>
                  <Input 
                    id="fullname" 
                    value={profileData.fullname} 
                    onChange={(e) => setProfileData({...profileData, fullname: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={profileData.username} 
                    disabled 
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Usernameni o'zgartirib bo'lmaydi</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input 
                    id="bio" 
                    value={profileData.bio} 
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Qisqacha o'zingiz haqingizda..."
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="profile-form" disabled={isUpdating} className="bg-red-600 hover:bg-red-700">
                {isUpdating ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parolni o'zgartirish</CardTitle>
              <CardDescription>Hisobingiz xavfsizligini ta'minlash uchun parolni yangilang</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="password-form" onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current">Eski parol</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="current" 
                      type="password" 
                      className="pl-10"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new">Yangi parol</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="new" 
                      type="password" 
                      className="pl-10"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Yangi parolni tasdiqlang</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="confirm" 
                      type="password" 
                      className="pl-10"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="password-form" disabled={isChangingPassword} className="bg-red-600 hover:bg-red-700">
                {isChangingPassword ? "O'zgartirilmoqda..." : "Parolni yangilash"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* App Settings Tab */}
        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ilova sozlamalari</CardTitle>
              <CardDescription>Ilova ko'rinishi va tilini sozlang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-100">Tungi rejim</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ilova interfeysini qorong'u rangga o'tkazish</p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Globe className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-100">Til</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ilova tilini tanlang</p>
                  </div>
                </div>
                <Button variant="outline" disabled>O'zbekcha</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-100">Xabarnomalar</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bildirishnomalarni boshqarish</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

