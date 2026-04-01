"use client"

import { useState, useMemo } from "react"
import { useGetAllUsersQuery, useDeleteUserMutation, useUpdateUserMutation, useUpdateStudentClassMutation, useCreateUserMutation, useCreateManyUsersMutation, useAdminResetPasswordMutation } from "@/lib/api/usersApi"
import { useGetAllClassesQuery } from "@/lib/api/classesApi"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Search, Trash2, Eye, Users, GraduationCap, UserCog, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Copy, PlusCircle, Save, Coins } from "lucide-react"
import { getImageUrl, getProfileImageUrl } from "@/lib/utils"
import { useGetStudentStatsQuery } from "@/lib/api/attendanceApi"
import { Calendar } from "@/components/ui/calendar"
import { useSelector } from "react-redux"
import { toast } from "sonner"

function AttendanceCalendar({ studentId }: { studentId: number }) {
  const { data: stats, isLoading } = useGetStudentStatsQuery(studentId, { skip: !studentId })
  
  if (isLoading) return <div className="p-4 flex justify-center"><LoadingSpinner size="sm" /></div>
  if (!stats) return <p className="text-xs text-center text-gray-400 py-4">Ma'lumot topilmadi</p>

  const presentDays = (stats.recent_attendances || []).map((d: string) => new Date(d))
  const lateDays = (stats.recent_late_days || []).map((d: string) => new Date(d))
  const absentDays = (stats.recent_absent_days || []).map((d: string) => new Date(d))
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Kelgan
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Kechikkan
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Kelmagan
        </div>
      </div>
      
      <div className="border rounded-xl p-3 bg-white shadow-sm overflow-hidden flex justify-center pointer-events-none">
        <Calendar
          modifiers={{
            present: presentDays,
            late: lateDays,
            absent: absentDays,
          }}
          modifiersClassNames={{
            present: "bg-green-100! text-green-700! font-bold rounded-full",
            late: "bg-amber-100! text-amber-700! font-bold rounded-full",
            absent: "bg-red-100! text-red-700! font-bold rounded-full",
          }}
          className="p-0 border-0"
        />
      </div>
    </div>
  )
}

export default function UsersListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({
    key: 'fullname',
    direction: 'asc'
  })
  
  const { user: currentUser } = useSelector((state: any) => state.auth)
  const isAdmin = currentUser?.role === "admin"

  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    fullname: "",
    username: "",
    password: "",
    role: "student",
    class_id: "",
    class_name: "",
    grade: "",
  })
  
  const [bulkUsers, setBulkUsers] = useState<any[]>([
    { fullname: "", username: "", password: "", role: "student", class_id: "", class_name: "", grade: "" }
  ])

  const { data: usersResponse, isLoading, error } = useGetAllUsersQuery(undefined)
  const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.data || []
  const { data: classesResponse } = useGetAllClassesQuery(undefined)
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [updateStudentClass, { isLoading: isStatusUpdating }] = useUpdateStudentClassMutation()
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [createManyUsers, { isLoading: isBulkCreating }] = useCreateManyUsersMutation()
  const [adminResetPassword, { isLoading: isResettingPassword }] = useAdminResetPasswordMutation()
  const [adminNewPassword, setAdminNewPassword] = useState("")

  const handleAdminResetPassword = async () => {
    if (!adminNewPassword || adminNewPassword.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      return
    }
    try {
      await adminResetPassword({ id: selectedUser.id, newPassword: adminNewPassword }).unwrap()
      toast.success("Parol muvaffaqiyatli saqlandi")
      setAdminNewPassword("")
    } catch (err: any) {
        toast.error(err?.data?.message || err?.data?.error || "Xatolik yuz berdi")
    }
  }

  const filteredUsers = useMemo(() => {
    if (!users) return []
    
    // 1. Filter
    let result = users.filter((user: any) => {
      const matchesSearch =
        user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })

    // 2. Sort
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'coins') {
          const valA = Number(a.coins || a.coinBalance || 0)
          const valB = Number(b.coins || b.coinBalance || 0)
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA
        }

        if (sortConfig.key === 'class_name') {
          aValue = a.class?.name || a.class_name || (a.role === 'student' ? 'Z' : '')
          bValue = b.class?.name || b.class_name || (b.role === 'student' ? 'Z' : '')
        } else {
          aValue = a[sortConfig.key] || ""
          bValue = b[sortConfig.key] || ""
        }

        const strA = String(aValue).toLowerCase()
        const strB = String(bValue).toLowerCase()
        
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [users, searchTerm, roleFilter, sortConfig])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null
    }
    setSortConfig({ key, direction })
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
    if (sortConfig.direction === 'asc') return <ChevronUp className="ml-2 h-4 w-4" />
    if (sortConfig.direction === 'desc') return <ChevronDown className="ml-2 h-4 w-4" />
    return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
  }

  const handleDelete = async (userId: number) => {
    try {
      await deleteUser(userId).unwrap()
      setDeleteConfirm(null)
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  const handleClassAssignment = async () => {
    if (!selectedUser || !selectedClass) return
    try {
      await updateStudentClass({ id: selectedUser.id, class_id: selectedClass }).unwrap()
      toast.success("Sinf muvaffaqiyatli o'zgartirildi")
      setUpdateSuccess(true)
      setTimeout(() => {
        setUpdateSuccess(false)
        setSelectedUser(null)
        setSelectedClass("")
      }, 2000)
    } catch (err: any) {
      console.error("Update error:", err)
      toast.error(err?.data?.message || "Sinfni o'zgartirishda xatolik yuz berdi")
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.fullname || !newUser.username || !newUser.password || !newUser.role) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring")
      return
    }

    try {
      const payload: any = {
        fullname: newUser.fullname,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
      }

      if (newUser.role === "student") {
        payload.coins = 0
        if (newUser.class_id && newUser.class_id !== "none") {
          payload.class_id = parseInt(newUser.class_id)
        }
        if (newUser.class_name) {
          payload.class_name = newUser.class_name
        }
        if (newUser.grade) {
          payload.grade = String(newUser.grade)
        }
      }

      await createUser(payload).unwrap()
      toast.success("Foydalanuvchi muvaffaqiyatli qo'shildi")
      setIsAddUserOpen(false)
      setNewUser({ fullname: "", username: "", password: "", role: "student", class_id: "", class_name: "", grade: "" })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.data?.message || err?.data?.error || "Xatolik yuz berdi")
    }
  }

  const handleBulkCreate = async () => {
    const validUsers = bulkUsers.filter(u => u.fullname && u.username && u.password)
    if (validUsers.length === 0) {
      toast.error("Iltimos, kamida bitta foydalanuvchi ma'lumotlarini to'liq to'ldiring")
      return
    }

    try {
      const payload = validUsers.map(u => ({
        fullname: u.fullname,
        username: u.username,
        password: u.password,
        role: u.role,
        class_id: u.role === 'student' && u.class_id && u.class_id !== "none" ? parseInt(u.class_id) : null,
        class_name: u.role === 'student' ? u.class_name : null,
        grade: u.role === 'student' ? u.grade : null,
      }))

      await createManyUsers(payload).unwrap()
      toast.success(`${payload.length} ta foydalanuvchi muvaffaqiyatli qo'shildi`)
      setIsBulkAddOpen(false)
      setBulkUsers([{ fullname: "", username: "", password: "", role: "student", class_id: "", class_name: "", grade: "" }])
    } catch (err: any) {
      console.error(err)
      toast.error(err?.data?.message || "Ommaviy qo'shishda xatolik yuz berdi")
    }
  }

  const addBulkRow = () => {
    setBulkUsers([...bulkUsers, { fullname: "", username: "", password: "", role: "student", class_id: "", class_name: "", grade: "" }])
  }

  const updateBulkUser = (index: number, field: string, value: string) => {
    const newBulk = [...bulkUsers]
    newBulk[index][field] = value
    setBulkUsers(newBulk)
  }

  const removeBulkRow = (index: number) => {
    if (bulkUsers.length > 1) {
      setBulkUsers(bulkUsers.filter((_, i) => i !== index))
    }
  }

  const handleUserDetailsOpen = (user: any) => {
    setSelectedUser(user)
    setSelectedClass(user.class_id ? String(user.class_id) : (user.classId ? String(user.classId) : "none"))
    setUpdateSuccess(false)
    setAdminNewPassword("")
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 border-red-200"
      case "teacher":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-green-100 text-green-700 border-green-200"
    }
  }

  const stats = useMemo(() => {
    if (!users) return { total: 0, admins: 0, teachers: 0, students: 0 }
    return {
      total: users.length,
      admins: users.filter((u: any) => u.role === "admin").length,
      teachers: users.filter((u: any) => u.role === "teacher").length,
      students: users.filter((u: any) => u.role === "student").length,
    }
  }, [users])

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-4 md:pt-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
           <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Foydalanuvchilar</h1>
           <p className="text-muted-foreground font-medium text-sm sm:text-base">Tizimdagi barcha foydalanuvchilar ro'yxati</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 rounded-2xl h-10 sm:h-12 px-4 sm:px-6 font-bold shadow-sm transition-all hover:scale-105 text-sm sm:text-base">
                  <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Ommaviy
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] w-[95vw] max-w-full max-h-[85vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl font-bold">Ommaviy qo'shish</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">To'liq ism</TableHead>
                          <TableHead className="w-[150px]">Username</TableHead>
                          <TableHead className="w-[150px]">Parol</TableHead>
                          <TableHead className="w-[130px]">Rol</TableHead>
                          <TableHead className="w-[150px]">Sinf (Baza)</TableHead>
                          <TableHead className="w-[150px]">Sinf Nomi</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input 
                                placeholder="Ism Familiya"
                                value={user.fullname}
                                onChange={(e) => updateBulkUser(index, 'fullname', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                placeholder="username"
                                value={user.username}
                                onChange={(e) => updateBulkUser(index, 'username', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                placeholder="parol"
                                value={user.password}
                                onChange={(e) => updateBulkUser(index, 'password', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(val) => updateBulkUser(index, 'role', val)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[120]">
                                  <SelectItem value="student">O'quvchi</SelectItem>
                                  <SelectItem value="teacher">O'qituvchi</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {user.role === 'student' ? (
                                <Select
                                  value={user.class_id}
                                  onValueChange={(val) => updateBulkUser(index, 'class_id', val)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sinf" />
                                  </SelectTrigger>
                                  <SelectContent className="z-[120]">
                                    <SelectItem value="none">Yo'q</SelectItem>
                                    {classes.map((cls: any) => (
                                      <SelectItem key={cls.id || cls._id} value={String(cls.id || cls._id)}>
                                        {cls.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {user.role === 'student' ? (
                                <Input 
                                  placeholder="Masalan: 6-A"
                                  value={user.class_name}
                                  onChange={(e) => updateBulkUser(index, 'class_name', e.target.value)}
                                />
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeBulkRow(index)} className="text-gray-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button variant="outline" onClick={addBulkRow} className="w-full dashed border-2 border-dashed h-12 mt-2">
                    <Plus className="w-4 h-4 mr-2" /> Qator qo'shish
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>Bekor qilish</Button>
                  <Button onClick={handleBulkCreate} disabled={isBulkCreating} className="bg-red-600 hover:bg-red-700">
                    {isBulkCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Barchasini saqlash
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] w-[95vw] max-w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl font-bold">Yangi foydalanuvchi</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">To'liq ism</Label>
                    <Input
                      id="fullname"
                      placeholder="Falonchiyev Pistonchi"
                      value={newUser.fullname}
                      onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="username123"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Parol</Label>
                    <Input
                      id="password"
                      type="text"
                      placeholder="Parol kiriting"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Roli</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rolni tanlang" />
                      </SelectTrigger>
                      <SelectContent className="z-[110]">
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">O'qituvchi</SelectItem>
                        <SelectItem value="student">O'quvchi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newUser.role === "student" && (
                    <>
                      <div className="space-y-2">
                        <Label>Sinf (Ixtiyoriy)</Label>
                        <Select
                          value={newUser.class_id}
                          onValueChange={(val) => setNewUser({ ...newUser, class_id: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sinfni tanlang" />
                          </SelectTrigger>
                          <SelectContent className="z-[110]">
                            <SelectItem value="none">Sinfga qo'shmaslik</SelectItem>
                            {classes.map((cls: any) => (
                              <SelectItem key={cls.id || cls._id} value={String(cls.id || cls._id)}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class_name">Sinf nomi (Masalan: 6-A)</Label>
                        <Input
                          id="class_name"
                          placeholder="Sinf nomini kiriting"
                          value={newUser.class_name}
                          onChange={(e) => setNewUser({ ...newUser, class_name: e.target.value })}
                        />
                      </div>
                      {newUser.class_id === "none" && (
                        <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                          <Label htmlFor="grade">Daraja (Grade) - Ixtiyoriy</Label>
                          <Input
                            id="grade"
                            placeholder="Sinf darajasi (masalan: 10)"
                            value={newUser.grade}
                            onChange={(e) => setNewUser({ ...newUser, grade: e.target.value })}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <Button type="submit" disabled={isCreating} className="w-full bg-red-600 hover:bg-red-700">
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Qo'shilmoqda...
                      </>
                    ) : (
                      "Qo'shish"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500 dark:border-l-indigo-400 shadow-sm hover:shadow-md transition-shadow bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
                <Users className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Jami</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 dark:border-l-red-400 shadow-sm hover:shadow-md transition-shadow bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                <UserCog className="h-6 w-6 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Adminlar</p>
                <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-sm hover:shadow-md transition-shadow bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl">
                <GraduationCap className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">O'qituvchilar</p>
                <p className="text-2xl font-bold text-foreground">{stats.teachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400 shadow-sm hover:shadow-md transition-shadow bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-2xl">
                <Users className="h-6 w-6 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">O'quvchilar</p>
                <p className="text-2xl font-bold text-foreground">{stats.students}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border border-border/50 shadow-sm bg-card/30 backdrop-blur-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ism yoki username bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 h-11 sm:h-10 rounded-xl"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 rounded-xl bg-background/50">
                <SelectValue placeholder="Rol bo'yicha filtrlash" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Barcha rollar</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">O'qituvchi</SelectItem>
                <SelectItem value="student">O'quvchi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Sort Controls */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {[
          { key: 'fullname', label: 'Ism' },
          { key: 'role', label: 'Rol' },
          { key: 'coins', label: 'Tanga' },
          { key: 'class_name', label: 'Sinf' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => requestSort(item.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              sortConfig.key === item.key 
                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' 
                : 'bg-card text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            {item.label}
            {sortConfig.key === item.key && sortConfig.direction === 'asc' && <ChevronUp className="w-3 h-3" />}
            {sortConfig.key === item.key && sortConfig.direction === 'desc' && <ChevronDown className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {filteredUsers.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-center text-muted-foreground">
              Foydalanuvchilar topilmadi
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user: any) => (
            <Card 
              key={user.id} 
              className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-card/80"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="h-11 w-11 flex-shrink-0">
                    <AvatarImage src={getProfileImageUrl(user.profile_picture)} />
                    <AvatarFallback className="bg-red-100 text-red-700 font-bold">
                      {user.fullname?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-foreground text-sm break-words leading-tight">{user.fullname}</h3>
                      <Badge variant="outline" className={`${getRoleBadgeClass(user.role)} text-[10px] px-2 py-0.5 flex-shrink-0`}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">@{user.username}</p>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 mt-2.5">
                      {/* Class */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-foreground/70 font-medium">
                          {user.class?.name || user.class_name || (user.role === 'student' ? "Yo'q" : '—')}
                        </span>
                      </div>
                      {/* Coins */}
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-800">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-bold text-amber-600 text-xs">{user.coins || user.coinBalance || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleUserDetailsOpen(user)}
                    className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> Batafsil
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
                    onClick={() => setDeleteConfirm(user)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> O'chirish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="overflow-hidden border border-border/50 shadow-lg rounded-2xl bg-card/30 backdrop-blur-sm hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>
                  <button 
                    onClick={() => requestSort('fullname')} 
                    className="flex items-center hover:text-red-600 transition-colors font-bold uppercase text-[11px] tracking-wider"
                  >
                    Foydalanuvchi <SortIcon column="fullname" />
                  </button>
                </TableHead>
                <TableHead>
                  <button 
                    onClick={() => requestSort('username')} 
                    className="flex items-center hover:text-red-600 transition-colors font-bold uppercase text-[11px] tracking-wider"
                  >
                    Username <SortIcon column="username" />
                  </button>
                </TableHead>
                <TableHead>
                  <button 
                    onClick={() => requestSort('role')} 
                    className="flex items-center hover:text-red-600 transition-colors font-bold uppercase text-[11px] tracking-wider"
                  >
                    Rol <SortIcon column="role" />
                  </button>
                </TableHead>
                <TableHead>
                  <button 
                    onClick={() => requestSort('class_name')} 
                    className="flex items-center hover:text-red-600 transition-colors font-bold uppercase text-[11px] tracking-wider"
                  >
                    Sinf <SortIcon column="class_name" />
                  </button>
                </TableHead>
                <TableHead>
                   <button 
                     onClick={() => requestSort('coins')} 
                     className="flex items-center hover:text-red-600 transition-colors font-bold uppercase text-[11px] tracking-wider"
                   >
                     Tangalar <SortIcon column="coins" />
                   </button>
                 </TableHead>
                 <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Amallar</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={getProfileImageUrl(user.profile_picture)} />
                        <AvatarFallback className="bg-red-100 text-red-700">
                          {user.fullname?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground">{user.fullname}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">@{user.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground/70 font-semibold">
                       {user.class?.name || user.class_name || (user.role === 'student' ? "Sinf yo'q" : '—')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                       <span className="font-bold text-amber-600">{user.coins || user.coinBalance || 0}</span>
                       <span className="text-[10px] text-amber-500 uppercase font-bold">tanga</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleUserDetailsOpen(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setDeleteConfirm(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Foydalanuvchilar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] max-w-full sm:max-w-md rounded-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Foydalanuvchi ma'lumoti</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                  <AvatarImage src={getProfileImageUrl(selectedUser.profile_picture)} />
                  <AvatarFallback className="bg-red-100 text-red-700 text-lg sm:text-xl">
                    {selectedUser.fullname?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold break-words">{selectedUser.fullname}</h3>
                  <p className="text-gray-500 text-sm">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Rol</p>
                  <Badge variant="outline" className={getRoleBadgeClass(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Tangalar</p>
                  <p className="font-medium text-amber-600">{selectedUser.coinBalance || 0}</p>
                </div>
                {isAdmin && (
                  <div className="col-span-2 bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                     <Label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Parolni o'zgartirish (Admin)</Label>
                     <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                          placeholder="Yangi parol..." 
                          type="text"
                          value={adminNewPassword}
                          onChange={(e) => setAdminNewPassword(e.target.value)}
                          className="bg-white dark:bg-gray-800 rounded-xl h-11"
                        />
                        <Button 
                          onClick={handleAdminResetPassword} 
                          disabled={isResettingPassword || !adminNewPassword}
                          className="bg-red-600 hover:bg-red-700 h-11 px-6 rounded-xl font-bold w-full sm:w-auto"
                        >
                          {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
                        </Button>
                     </div>
                  </div>
                )}
                {selectedUser.role === "student" && (
                  <div className="col-span-2 space-y-4">
                     {isAdmin && (
                       <div className="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                         <Label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Sinfni o'zgartirish (Admin)</Label>
                         <div className="flex flex-col sm:flex-row gap-2">
                           <Select value={selectedClass} onValueChange={setSelectedClass}>
                             <SelectTrigger className="bg-white dark:bg-gray-800 rounded-xl h-11">
                               <SelectValue placeholder="Sinfni tanlang" />
                             </SelectTrigger>
                             <SelectContent className="z-[130]">
                               <SelectItem value="none">Sinf yo'q</SelectItem>
                               {classes.map((cls: any) => (
                                 <SelectItem key={cls.id || cls._id} value={String(cls.id || cls._id)}>
                                   {cls.name}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <Button 
                             onClick={handleClassAssignment} 
                             disabled={isStatusUpdating || selectedClass === (selectedUser.class_id ? String(selectedUser.class_id) : "none")}
                             className="bg-red-600 hover:bg-red-700 h-11 px-6 rounded-xl font-bold w-full sm:w-auto"
                           >
                             {isStatusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
                           </Button>
                         </div>
                         {updateSuccess && (
                           <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                             <CheckCircle2 className="w-3 h-3" /> Muvaffaqiyatli saqlandi!
                           </p>
                         )}
                       </div>
                     )}
                     
                     <div className="pt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Davomat kalendari</p>
                        <AttendanceCalendar studentId={selectedUser.id} />
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">{deleteConfirm?.fullname} ni tizimdan o'chirmoqchimisiz?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm?.id)} disabled={isDeleting}>
              {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
