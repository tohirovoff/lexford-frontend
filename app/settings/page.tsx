"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
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
import { Lock, Settings, Bell, Moon, Globe, LogOut } from "lucide-react"

export default function SettingsPage() {
  // Redux & State
  const { user } = useSelector((state: any) => state.auth)
  const dispatch = useDispatch()
  const [updateUserMutation, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || "",
    username: user?.username || "",
    bio: user?.bio || "",
  })

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
      await updateUserMutation({ id: user.id, ...profileData }).unwrap()
      dispatch(updateUser(profileData))
      toast.success("Profil muvaffaqiyatli yangilandi")
    } catch (err) {
      toast.error("Xatolik yuz berdi")
      console.error(err)
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
        userId: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }).unwrap()
      toast.success("Parol muvaffaqiyatli o'zgartirildi")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      toast.error("Parolni o'zgartirishda xatolik (Eski parol noto'g'ri bo'lishi mumkin)")
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sozlamalar</h1>
        <p className="text-gray-500">Profil va xavfsizlik sozlamalarini boshqaring</p>
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
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.profile_picture} />
                  <AvatarFallback className="bg-red-100 text-red-600 text-2xl font-bold">
                    {user?.fullname?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline">Rasmni o'zgartirish</Button>
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
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Usernameni o'zgartirib bo'lmaydi</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio (Qisqacha o'zingiz haqingizda)</Label>
                  <Input 
                    id="bio" 
                    value={profileData.bio} 
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Men haqimda..."
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
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Moon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Tungi rejim</p>
                    <p className="text-sm text-gray-500">Ilova interfeysini qorong'u rangga o'tkazish</p>
                  </div>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Til</p>
                    <p className="text-sm text-gray-500">Ilova tilini tanlang</p>
                  </div>
                </div>
                <Button variant="outline" disabled>O'zbekcha</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Xabarnomalar</p>
                    <p className="text-sm text-gray-500">Bildirishnomalarni boshqarish</p>
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
