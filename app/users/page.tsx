"use client"

import { useState, useMemo } from "react"
import { useGetAllUsersQuery, useDeleteUserMutation, useUpdateUserMutation } from "@/lib/api/usersApi"
import { useGetAllClassesQuery } from "@/lib/api/classesApi"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Search, Trash2, Eye, Users, GraduationCap, UserCog } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

export default function UsersListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const { data: usersResponse, isLoading, error } = useGetAllUsersQuery(undefined)
  const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.data || []
  const { data: classesResponse } = useGetAllClassesQuery(undefined)
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter((user: any) => {
      const matchesSearch =
        user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, roleFilter])

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
      await updateUser({ id: selectedUser.id, classId: selectedClass }).unwrap()
      setUpdateSuccess(true)
      setTimeout(() => {
        setUpdateSuccess(false)
        setSelectedUser(null)
        setSelectedClass("")
      }, 2000)
    } catch (err) {
      console.error("Update error:", err)
    }
  }

  const handleUserDetailsOpen = (user: any) => {
    setSelectedUser(user)
    setSelectedClass(user.classId || "")
    setUpdateSuccess(false)
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
    <div className="space-y-6 max-w-7xl mx-auto pt-4 md:pt-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
           <p className="text-gray-500">Tizimdagi barcha foydalanuvchilar ro'yxati</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Jami</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCog className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-sm text-gray-500">Adminlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.teachers}</p>
                <p className="text-sm text-gray-500">O'qituvchilar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.students}</p>
                <p className="text-sm text-gray-500">O'quvchilar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Rol bo'yicha filtrlash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha rollar</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">O'qituvchi</SelectItem>
                <SelectItem value="student">O'quvchi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Tangalar</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={getImageUrl(user.profile_picture)} />
                        <AvatarFallback className="bg-red-100 text-red-700">
                          {user.fullname?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.fullname}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">@{user.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-amber-600">{user.coinBalance || 0}</span>
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
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Foydalanuvchilar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchi ma'lumotlari</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={getImageUrl(selectedUser.profile_picture)} />
                  <AvatarFallback className="bg-red-100 text-red-700 text-xl">
                    {selectedUser.fullname?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.fullname}</h3>
                  <p className="text-gray-500">@{selectedUser.username}</p>
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
                <div className="col-span-2">
                  <p className="text-gray-500 mb-2">Sinf</p>
                  {selectedUser.role === "student" ? (
                    <div className="space-y-2">
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sinfni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sinfsiz</SelectItem>
                          {classes.map((cls: any) => (
                            <SelectItem key={cls._id} value={cls._id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedClass !== (selectedUser.classId || "") && (
                        <Button 
                          onClick={handleClassAssignment} 
                          disabled={isUpdating}
                          className="w-full bg-red-600 hover:bg-red-700"
                          size="sm"
                        >
                          {isUpdating ? "Saqlanmoqda..." : "Sinfni saqlash"}
                        </Button>
                      )}
                      {updateSuccess && (
                        <p className="text-sm text-green-600">✓ Sinf muvaffaqiyatli o'zgartirildi!</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">{selectedUser.classId || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500">Davomat</p>
                  <p className="font-medium">
                    {selectedUser.attendanceStreak || 0} kun
                  </p>
                </div>
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
