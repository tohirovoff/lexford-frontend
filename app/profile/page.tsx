"use client"

import { useState, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useUpdateUserMutation } from "@/lib/api/usersApi"
import { useGetUserTransactionsQuery, useGetAllPenaltiesQuery } from "@/lib/api/coinsApi"
import { updateUser } from "@/lib/store"
import LoadingSpinner from "@/components/ui/loading-spinner"
import CoinDisplay from "@/components/ui/coin-display"
import { User, Edit3, Camera, Save, X, Coins, AlertTriangle, TrendingUp, Calendar } from "lucide-react"
import { getImageUrl } from "@/lib/utils"
import { toast } from "sonner"

const profileSchema = z.object({
  fullname: z.string().min(2, "Ism kiritish shart"),
  class_name: z.string().optional(),
  grade: z.string().optional(),
})

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector((state: any) => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [updateUserMutation, { isLoading: isUpdating }] = useUpdateUserMutation()
  const { data: transactions, isLoading: loadingTransactions } = useGetUserTransactionsQuery(user?.id, {
    skip: !user?.id,
  })
  const { data: allPenalties } = useGetAllPenaltiesQuery(undefined)

  const userPenalties = allPenalties?.filter((p: any) => p.user_id === user?.id) || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullname: user?.fullname || "",
      class_name: user?.class_name || "",
      grade: user?.grade || "",
    },
  })

  const onProfileSubmit = async (data: any) => {
    try {
      const formData = new FormData()
      formData.append("fullname", data.fullname)
      if (data.class_name) formData.append("class_name", data.class_name)
      if (data.grade) formData.append("grade", data.grade)

      // Handle the file if selected
      const file = fileInputRef.current?.files?.[0]
      if (file) {
        formData.append("profile_picture", file)
      }

      const result = await updateUserMutation({ id: user.id, formData }).unwrap()
      
      // Update local storage/state with new data (backend returns user object directly without .data wrapper)
      dispatch(updateUser(result))
      
      setIsEditing(false)
      setImagePreview(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      toast?.success("Profil muvaffaqiyatli yangilandi!")
    } catch (err: any) {
      console.error("Update error:", err)
      toast?.error(err?.data?.message || "Profilni yangilashda xatolik yuz berdi")
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

  const recentTransactions = transactions?.slice(0, 5) || []
  const recentPenalties = userPenalties.slice(0, 3)

  const getRoleLabel = (role: string) => {
     switch(role) {
        case 'admin': return 'Admin';
        case 'teacher': return "O'qituvchi";
        case 'student': return "O'quvchi";
        default: return role;
     }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-4 md:pt-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
              {imagePreview || getImageUrl(user?.profile_picture) ? (
                <img
                  src={imagePreview || getImageUrl(user?.profile_picture) || ""}
                  alt={user?.fullname}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const icon = document.createElement('div');
                      icon.className = 'fallback-icon flex items-center justify-center w-full h-full';
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12 text-red-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                      parent.appendChild(icon);
                    }
                  }}
                />
              ) : (
                <User className="w-12 h-12 text-red-600" />
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-700"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{user?.fullname}</h1>
            <p className="text-gray-500">@{user?.username}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium
                ${user?.role === "admin" ? "bg-red-100 text-red-700" : user?.role === "teacher" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
              >
                {getRoleLabel(user?.role)}
              </span>
              {user?.class_name && <span className="text-sm text-gray-500">{user.class_name}</span>}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {user?.role === "student" && (
              <CoinDisplay coins={user?.coins || 0} size="lg" showLabel />
            )}
            {!isEditing && (
              <button
                onClick={() => {
                  setIsEditing(true)
                  reset({
                    fullname: user?.fullname || "",
                    class_name: user?.class_name || "",
                    grade: user?.grade || "",
                  })
                }}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center gap-2 text-sm"
              >
                <Edit3 className="w-4 h-4" />
                Profilni tahrirlash
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profilni tahrirlash</h2>
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ism</label>
                <input
                  type="text"
                  {...register("fullname")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={user?.username}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sinf</label>
                <input
                  type="text"
                  {...register("class_name")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daraja/Baho</label>
                <input
                  type="text"
                  {...register("grade")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Saqlash
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setImagePreview(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      )}

      {user?.role === "student" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <Coins className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tangalar</p>
              <p className="text-2xl font-bold text-gray-900">{user?.coins || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Jarimalar</p>
              <p className="text-2xl font-bold text-gray-900">{userPenalties.length}</p>
            </div>
          </div>
        </div>
      )}

      {user?.role === "student" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">So'nggi bitimlar</h2>
            {loadingTransactions ? (
              <LoadingSpinner size="sm" />
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-green-100" : "bg-red-100"}`}
                      >
                        <Coins className={`w-4 h-4 ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.reason}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">Bitimlar mavjud emas</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">So'nggi jarimalar</h2>
            {recentPenalties.length > 0 ? (
              <div className="space-y-3">
                {recentPenalties.map((penalty: any) => (
                  <div key={penalty.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{penalty.reason}</p>
                        <p className="text-xs text-gray-500">{new Date(penalty.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-red-600">-{penalty.coin_penalty}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-500 text-sm">Jarimalar yo'q! Ajoyib!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
