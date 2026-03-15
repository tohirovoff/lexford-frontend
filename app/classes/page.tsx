"use client"

import { useState, useMemo } from "react"
import { useGetAllClassesQuery, useGetClassLeaderboardQuery, useCreateClassMutation, useDeleteClassMutation } from "@/lib/api/classesApi"
import { useGetAllUsersQuery } from "@/lib/api/usersApi"
import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Search, Users, GraduationCap, Trophy, Medal, CheckCircle2, XCircle, AlertCircle, Clock, Plus, Loader2 } from "lucide-react"
import { getImageUrl, getProfileImageUrl } from "@/lib/utils"
import { toast } from "sonner"

export default function ClassListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newClass, setNewClass] = useState({ name: "", grade: "", teacher_id: "" })

  const user = useSelector((state: any) => state.auth.user)
  const isAdmin = user?.role?.toLowerCase() === "admin"

  const { data: classesResponse, isLoading } = useGetAllClassesQuery(undefined)
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []

  const { data: usersResponse, isLoading: isLoadingUsers, isError: isErrorUsers } = useGetAllUsersQuery(undefined, {
    skip: !isAdmin
  })

  const teachers = useMemo(() => {
    // Backend'dan kelayotgan barcha formatlarni tekshiramiz
    const rawData = usersResponse?.data || usersResponse?.users || (Array.isArray(usersResponse) ? usersResponse : [])
    
    return rawData.filter((u: any) => 
      u.role?.toLowerCase() === "teacher"
    )
  }, [usersResponse])

  const [createClass, { isLoading: isCreating }] = useCreateClassMutation()

  const { data: leaderboardResponse } = useGetClassLeaderboardQuery(selectedClass?.id || selectedClass?._id, {
    skip: !(selectedClass?.id || selectedClass?._id),
  })
  const [deleteClass, { isLoading: isDeletingClass }] = useDeleteClassMutation()

  const handleDeleteClass = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation()
    if (window.confirm("Haqiqatan ham ushbu sinfni o'chirib tashlamoqchimisiz?")) {
      try {
        await deleteClass(id).unwrap()
        toast.success("Sinf muvaffaqiyatli o'chirildi")
      } catch (err: any) {
        toast.error(err?.data?.message || "Sinfni o'chirishda xatolik yuz berdi")
      }
    }
  }

  const leaderboard = Array.isArray(leaderboardResponse) ? leaderboardResponse : leaderboardResponse?.data || []

  const filteredClasses = useMemo(() => {
    if (!classes) return []
    const term = searchTerm.toLowerCase()
    return classes.filter((cls: any) => {
      const nameMatch = (cls.name || "").toLowerCase().includes(term)
      const teacherName = cls.teacher?.fullname || cls.teacher?.username || (typeof cls.teacher === 'string' ? cls.teacher : "")
      const teacherMatch = (teacherName || "").toLowerCase().includes(term)
      return nameMatch || teacherMatch
    })
  }, [classes, searchTerm])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClass.name || !newClass.grade || !newClass.teacher_id) {
      toast.error("Barcha maydonlarni to'ldiring")
      return
    }

    try {
      await createClass({
        name: newClass.name,
        grade: newClass.grade,
        teacher_id: Number(newClass.teacher_id)
      }).unwrap()
      toast.success("Sinf muvaffaqiyatli qo'shildi")
      setIsAddDialogOpen(false)
      setNewClass({ name: "", grade: "", teacher_id: "" })
    } catch (err: any) {
      toast.error(err?.data?.message || "Sinf qo'shishda xatolik yuz berdi")
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-4 md:pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Sinflar</h1>
        
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                Sinf qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Yangi sinf qo'shish</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClass} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sinf nomi</Label>
                  <Input
                    id="name"
                    placeholder="Masalan: 10-A"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Sinf darajasi (Grade)</Label>
                  <Input
                    id="grade"
                    placeholder="Masalan: 10"
                    value={newClass.grade}
                    onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>O'qituvchi</Label>
                  <Select
                    value={newClass.teacher_id}
                    onValueChange={(value) => setNewClass({ ...newClass, teacher_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingUsers ? "Yuklanmoqda..." : 
                        isErrorUsers ? "Xatolik yuz berdi" :
                        teachers.length === 0 ? "O'qituvchilar topilmadi" :
                        "O'qituvchini tanlang"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">Yuklanmoqda...</span>
                        </div>
                      ) : isErrorUsers ? (
                        <div className="p-4 text-center text-sm text-red-500">
                          Ro'yxatni yuklashda xatolik
                        </div>
                      ) : teachers.length > 0 ? (
                        teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id || teacher._id} value={String(teacher.id || teacher._id)}>
                            {teacher.fullname || teacher.username}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          O'qituvchilar topilmadi
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      "Qo'shish"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sinf nomi yoki o'qituvchi bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls: any) => (
          <Card
            key={cls._id || cls.id}
            className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-red-500 relative group"
            onClick={() => setSelectedClass(cls)}
          >
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteClass(e, cls.id || cls._id)}
                disabled={isDeletingClass}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg pr-8 text-foreground">{cls.name}</CardTitle>
                <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                  {cls.grade || "Sinf"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-sm">
                    {cls.teacher?.fullname || (typeof cls.teacher === 'string' ? "O'qituvchi tayinlanmagan" : (cls.teacher?.username || "O'qituvchi yo'q"))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {cls.studentCount || cls.students?.length || 0} o'quvchi
                  </span>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {cls.totalCoins || 0} tanga
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                   {(() => {
                     const today = new Date().toISOString().split('T')[0]
                     const todayAttendance = cls.attendances?.find((a: any) => {
                       const aDate = new Date(a.date || a.createdAt).toISOString().split('T')[0]
                       return aDate === today
                     })

                     if (todayAttendance) {
                       const presentCount = (todayAttendance.present_student_ids || []).length
                       const total = cls.studentCount || cls.students?.length || 0
                       return (
                         <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 text-green-700">
                               <CheckCircle2 className="h-4 w-4" />
                               <span className="text-xs font-bold uppercase tracking-tight">Bugun keldi</span>
                            </div>
                            <span className="text-sm font-black text-green-700">{presentCount}/{total}</span>
                         </div>
                       )
                     }

                     return (
                       <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">O'qituvchi hali davomat qilmadi</span>
                       </div>
                     )
                   })()}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedClass(cls)
                }}
              >
                Reytingni ko'rish
              </Button>
            </CardContent>
          </Card>
        ))}
        {filteredClasses.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Hozircha sinflar yo'q
          </div>
        )}
      </div>

      {/* Class Leaderboard Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              {selectedClass?.name} - Reyting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pt-2">
            {leaderboard?.map((student: any, index: number) => (
              <div
                key={student._id || student.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  index === 0
                    ? "bg-amber-50 border border-amber-200"
                    : index === 1
                      ? "bg-gray-100 border border-gray-200"
                      : index === 2
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-white border border-gray-100"
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {index < 3 ? (
                    <Medal
                      className={`h-6 w-6 ${
                        index === 0 ? "text-amber-500" : index === 1 ? "text-gray-400" : "text-orange-400"
                      }`}
                    />
                  ) : (
                    <span className="text-gray-500 font-medium">{index + 1}</span>
                  )}
                </div>
                <Avatar>
                  <AvatarImage src={getProfileImageUrl(student.profile_picture || student.profilePicture)} />
                  <AvatarFallback className="bg-red-100 text-red-700">{student.fullname?.charAt(0) || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{student.fullname || student.username}</p>
                  <p className="text-sm text-muted-foreground">@{student.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">{student.coinBalance || student.coins || 0}</p>
                  <p className="text-xs text-gray-500">tanga</p>
                </div>
              </div>
            ))}
            {(!leaderboard || leaderboard.length === 0) && (
              <p className="text-center py-8 text-gray-500">
                Ushbu sinfda o'quvchilar yo'q yoki reyting bo'sh
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
