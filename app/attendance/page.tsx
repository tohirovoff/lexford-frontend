"use client"

import { useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { useGetAllClassesQuery } from "@/lib/api/classesApi"
import {
  useCreateAttendanceMutation,
  useGetAttendanceHistoryQuery,
} from "@/lib/api/attendanceApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Calendar, Check, X, Clock, CheckCircle2, XCircle, AlertCircle, Save, UserCircle } from "lucide-react"
import { toast } from "sonner" // Assuming sonner is installed or use default toast if available

type AttendanceStatus = "present" | "absent" | "late"

export default function AttendanceMarkingPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [activeTab, setActiveTab] = useState("mark")

  // API Calls
  const { data: classesResponse, isLoading: classesLoading } = useGetAllClassesQuery(undefined)
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []

  const selectedClass = classes?.find((cls: any) => (cls._id || cls.id).toString() === selectedClassId)
  const students = selectedClass?.students || []
  
  // Fix: Pass object to query as expected by attendanceApi definitions
  const { data: historyResponse, isLoading: historyLoading } = useGetAttendanceHistoryQuery(
    { classId: parseInt(selectedClassId) }, 
    { skip: !selectedClassId }
  )
  const history = Array.isArray(historyResponse) ? historyResponse : historyResponse?.data || []

  const [markAttendance, { isLoading: isMarking }] = useCreateAttendanceMutation()

  const today = new Date().toLocaleDateString("uz-UZ", { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const apiDate = new Date().toISOString().split('T')[0] // Format for API: YYYY-MM-DD

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!students.length) return
    const newMap: Record<string, AttendanceStatus> = {}
    students.forEach((student: any) => {
      newMap[student._id || student.id] = status
    })
    setAttendanceMap(newMap)
  }

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Get current user for teacher_id
  const { user } = useSelector((state: any) => state.auth)

  const handleSubmit = async () => {
    if (!selectedClassId) return
    setSuccessMessage(null)
    setErrorMessage(null)

    // Separate IDs by status
    const presentIds: number[] = []
    const lateIds: number[] = []

    Object.entries(attendanceMap).forEach(([studentId, status]) => {
      // Use number if possible, otherwise keep as string
      const parsedId = parseInt(studentId)
      const id = isNaN(parsedId) ? studentId : parsedId
      
      if (status === "present") presentIds.push(id as any)
      else if (status === "late") lateIds.push(id as any)
    })

    if (presentIds.length === 0 && lateIds.length === 0 && Object.keys(attendanceMap).length === 0) {
      setErrorMessage("Iltimos, kamida bitta o'quvchi davomatini belgilang")
      return
    }

    const parsedClassId = parseInt(selectedClassId)
    const teacherId = parseInt(user?.id)
    
    const payload = {
      class_id: isNaN(parsedClassId) ? selectedClassId : parsedClassId,
      teacher_id: isNaN(teacherId) ? user?.id : teacherId,
      date: apiDate,
      subject: selectedClass?.name || "Umumiy",
      present_student_ids: presentIds,
      late_student_ids: lateIds
    }

    console.log("Attendance submission started. Payload:", JSON.stringify(payload, null, 2))

    try {
      const result = await markAttendance(payload).unwrap()
      console.log("Attendance submission success:", result)
      
      setAttendanceMap({})
      
      const stats = result?.stats
      if (stats) {
        setSuccessMessage(
          `Davomat saqlandi! Keldi: ${stats.present_count}, Kechikdi: ${stats.late_count}, Kelmadi: ${stats.absent_count}`
        )
      } else {
        setSuccessMessage("Davomat muvaffaqiyatli saqlandi")
      }
      
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      console.error("Attendance marking error caught:", err)
      console.log("Error data:", err.data)
      
      // Handle different error message formats
      let errorMsg = ""
      if (err.data) {
        // If message is an array (validation errors), join them
        if (Array.isArray(err.data.message)) {
          errorMsg = err.data.message.join(", ")
        } else if (typeof err.data.message === 'string') {
          errorMsg = err.data.message
        } else if (err.data.error) {
          errorMsg = err.data.error
        } else {
          errorMsg = JSON.stringify(err.data)
        }
      }
      
      const statusInfo = err.status ? ` (Status: ${err.status})` : ""
      setErrorMessage(errorMsg || `Davomatni saqlashda xatolik yuz berdi${statusInfo}`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
            <Check className="h-3 w-3 mr-1" />
            Keldi
          </Badge>
        )
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
            <X className="h-3 w-3 mr-1" />
            Kelmadi
          </Badge>
        )
      case "late":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Kechikdi
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || "—"}</Badge>
    }
  }

  const stats = useMemo(() => {
    const values = Object.values(attendanceMap)
    return {
      present: values.filter((s) => s === "present").length,
      absent: values.filter((s) => s === "absent").length,
      late: values.filter((s) => s === "late").length,
      total: students.length,
    }
  }, [attendanceMap, students])

  // Helper to get student details from IDs
  const getDataFromIds = (ids: string[]) => {
    if (!ids || !Array.isArray(ids) || !students) return []
    // IDs convert to strings for comparison
    const strIds = ids.map(id => id.toString())
    return students.filter((s:any) => strIds.includes((s._id || s.id).toString()))
  }

  if (classesLoading) return <LoadingSpinner fullScreen />

  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-4 md:pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Davomat</h1>
          <p className="text-gray-500">O'quvchilar davomatini boshqarish</p>
        </div>
        <Badge variant="outline" className="text-sm py-1.5 px-3 bg-white shadow-sm self-start md:self-auto">
          <Calendar className="h-4 w-4 mr-2 text-red-600" />
          {today}
        </Badge>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Class Selection */}
      <Card className="border-t-4 border-t-red-600 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="w-full md:w-64 space-y-2">
              <label className="text-sm font-medium text-gray-700">Sinfni tanlang</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sinf tanlanmagan" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls._id || cls.id} value={(cls._id || cls.id).toString()}>
                      {cls.name} ({cls.grade || "Sinf"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedClassId && (
               <div className="text-sm text-gray-500 pb-1">
                 O'quvchilar soni: <span className="font-semibold text-gray-900">{students.length}</span> nafar
               </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClassId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="mark">Davomat qilish</TabsTrigger>
            <TabsTrigger value="history">Davomat tarixi</TabsTrigger>
          </TabsList>

          <TabsContent value="mark" className="space-y-6">
            {/* Quick Actions & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="lg:col-span-2 shadow-sm">
                 <CardHeader className="pb-3">
                   <CardTitle className="text-lg">Tezkor harakatlar</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                        onClick={() => handleMarkAll("present")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Hammasi keldi
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                        onClick={() => handleMarkAll("absent")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Hammasi kelmadi
                      </Button>
                   </div>
                 </CardContent>
               </Card>

               <Card className="shadow-sm bg-gray-50/50">
                 <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Joriy statistika</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center text-green-700"><Check className="w-4 h-4 mr-2"/> Keldi</span>
                        <Badge className="bg-green-100 text-green-700">{stats.present}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center text-red-700"><X className="w-4 h-4 mr-2"/> Kelmadi</span>
                        <Badge className="bg-red-100 text-red-700">{stats.absent}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center text-amber-700"><Clock className="w-4 h-4 mr-2"/> Kechikdi</span>
                        <Badge className="bg-amber-100 text-amber-700">{stats.late}</Badge>
                      </div>
                      <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center font-medium">
                        <span>Jami</span>
                        <span>{stats.total}</span>
                      </div>
                   </div>
                 </CardContent>
               </Card>
            </div>

            {/* Students List */}
            <Card className="shadow-sm border-0 ring-1 ring-gray-200">
              <CardContent className="p-0">
                {students.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-lg m-2">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p>Ushbu sinfda o'quvchilar ro'yxati bo'sh</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/80">
                      <TableRow>
                        <TableHead className="w-[300px]">O'quvchi</TableHead>
                        <TableHead className="text-center w-[150px]">Status</TableHead>
                        <TableHead className="text-right">Harakat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student: any) => {
                         const sId = (student._id || student.id).toString()
                         const currentStatus = attendanceMap[sId]
                         
                         return (
                        <TableRow key={sId} className={currentStatus ? "bg-gray-50/30" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-gray-100">
                                <AvatarImage src={student.profilePicture || "/placeholder.svg"} />
                                <AvatarFallback className="bg-gradient-to-br from-red-100 to-orange-100 text-red-700 font-medium">
                                  {student.fullname?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-gray-900">{student.fullname || "Ismsiz"}</p>
                                <p className="text-xs text-gray-500">@{student.username || "username"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {currentStatus ? getStatusBadge(currentStatus) : <span className="text-gray-400 text-sm">—</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-9 w-9 p-0 rounded-full transition-all ${
                                  currentStatus === "present"
                                    ? "bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-2"
                                    : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                                }`}
                                onClick={() => handleStatusChange(sId, "present")}
                                title="Keldi"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-9 w-9 p-0 rounded-full transition-all ${
                                  currentStatus === "late"
                                    ? "bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-offset-2"
                                    : "text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                                }`}
                                onClick={() => handleStatusChange(sId, "late")}
                                title="Kechikdi"
                              >
                                <Clock className="h-5 w-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-9 w-9 p-0 rounded-full transition-all ${
                                  currentStatus === "absent"
                                    ? "bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-2"
                                    : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                                }`}
                                onClick={() => handleStatusChange(sId, "absent")}
                                title="Kelmadi"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="sticky bottom-6 flex justify-end">
              <Button
                className="w-full md:w-auto min-w-[200px] bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
                onClick={handleSubmit}
                disabled={isMarking || Object.keys(attendanceMap).length === 0}
              >
                {isMarking ? (
                  <>
                     <LoadingSpinner size="sm" />
                     Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Davomatni saqlash
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Davomat tarixi</CardTitle>
                <p className="text-sm text-gray-500">Ushbu sinf uchun oxirgi qayd etilgan davomatlar (sanalar bo'yicha)</p>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                     {history?.map((record: any, index: number) => {
                       const presentStudents = getDataFromIds(record.present_student_ids || [])
                       const lateStudents = getDataFromIds(record.late_student_ids || [])
                       
                       // Calculate absent students
                       const presentIds = (record.present_student_ids || []).map((id: any) => id.toString())
                       const lateIds = (record.late_student_ids || []).map((id: any) => id.toString())
                       
                       const absentStudents = students.filter((s: any) => {
                         const id = (s._id || s.id).toString()
                         return !presentIds.includes(id) && !lateIds.includes(id)
                       })

                       const recordStats = record.stats || {}
                       
                       const recordDate = new Date(record.createdAt || record.date)
                       const dayStr = recordDate.getDate().toString().padStart(2, '0')
                       const monthStr = (recordDate.getMonth() + 1).toString().padStart(2, '0')
                       const yearStr = recordDate.getFullYear()
                       const dateDisplay = `${dayStr}-${monthStr}-${yearStr}`
                       
                       const uzbekWeekdays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"]
                       const weekday = uzbekWeekdays[recordDate.getDay()]
                       const time = recordDate.toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit', second: '2-digit' })

                       return (
                      <div key={record._id || record.id || index} className="group p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                          <div className="flex items-start gap-4">
                             {/* Date Box */}
                             <div className="flex flex-col items-center justify-center bg-blue-50 w-24 h-16 rounded-xl border border-blue-100 text-blue-700 shadow-sm px-2">
                               <span className="text-xl font-bold leading-none">{dateDisplay}</span>
                             </div>

                             <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <h3 className="font-bold text-gray-900 text-lg capitalize">{weekday}</h3>
                                 <Badge variant="outline" className="text-xs font-normal text-gray-500 bg-gray-50">
                                   <Clock className="w-3 h-3 mr-1" />
                                   {time}
                                 </Badge>
                               </div>
                               <p className="text-sm text-gray-500 font-medium">
                                 {record.subject || "Fan ko'rsatilmagan"} • {selectedClass?.grade ?? "Sinf"}
                               </p>
                             </div>
                          </div>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
                             <div className="flex flex-col items-center p-2 rounded-lg bg-green-50 border border-green-100">
                               <span className="text-xs text-green-600 font-medium mb-1">Keldi</span>
                               <span className="text-lg font-bold text-green-700">{presentStudents.length}</span>
                             </div>
                             <div className="flex flex-col items-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                               <span className="text-xs text-amber-600 font-medium mb-1">Kechikdi</span>
                               <span className="text-lg font-bold text-amber-700">{lateStudents.length}</span>
                             </div>
                             <div className="flex flex-col items-center p-2 rounded-lg bg-red-50 border border-red-100">
                               <span className="text-xs text-red-600 font-medium mb-1">Kelmadi</span>
                               <span className="text-lg font-bold text-red-700">{absentStudents.length}</span>
                             </div>
                             <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                               <span className="text-xs text-gray-500 font-medium mb-1">Jami</span>
                               <span className="text-lg font-bold text-gray-700">{recordStats.total_students ?? students.length}</span>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          {/* Kelgan o'quvchilar */}
                          {presentStudents.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                                Kelgan o'quvchilar ({presentStudents.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {presentStudents.map((s: any) => (
                                  <div key={s._id || s.id} className="group/student flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:border-green-300 hover:shadow-green-100 transition-all">
                                    <Avatar className="h-6 w-6 border border-gray-100">
                                      <AvatarImage src={s.profilePicture} />
                                      <AvatarFallback className="bg-gray-50 text-gray-400">
                                        <UserCircle className="w-full h-full p-0.5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-700 group-hover/student:text-green-700 transition-colors">{s.fullname}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Kechikkan o'quvchilar */}
                          {lateStudents.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                                Kechikkan o'quvchilar ({lateStudents.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {lateStudents.map((s: any) => (
                                  <div key={s._id || s.id} className="group/student flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:border-amber-300 hover:shadow-amber-100 transition-all">
                                    <Avatar className="h-6 w-6 border border-gray-100">
                                      <AvatarImage src={s.profilePicture} />
                                      <AvatarFallback className="bg-gray-50 text-gray-400">
                                        <UserCircle className="w-full h-full p-0.5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-700 group-hover/student:text-amber-700 transition-colors">{s.fullname}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Kelmagan o'quvchilar */}
                          {absentStudents.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-3 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                                Kelmagan o'quvchilar ({absentStudents.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {absentStudents.map((s: any) => (
                                  <div key={s._id || s.id} className="group/student flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:border-red-300 hover:shadow-red-100 transition-all">
                                    <Avatar className="h-6 w-6 border border-gray-100">
                                      <AvatarImage src={s.profilePicture} />
                                      <AvatarFallback className="bg-gray-50 text-gray-400">
                                        <UserCircle className="w-full h-full p-0.5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-700 group-hover/student:text-red-700 transition-colors">{s.fullname}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {presentStudents.length === 0 && lateStudents.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                               <XCircle className="w-8 h-8 text-gray-300 mb-2" />
                               <p className="text-sm font-medium text-gray-500">Hech kim qatnashmagan</p>
                               <span className="text-xs text-gray-400">Barcha o'quvchilar darsga kelmagan deb belgilangan</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                    })}
                    
                    {(!history || history.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                           <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Davomat tarixi topilmadi</h3>
                        <p className="text-gray-500 max-w-sm mb-6">
                           Ushbu sinf uchun hali hech qanday davomat qayd etilmagan.
                        </p>
                        <Button variant="outline" onClick={() => setActiveTab("mark")} className="gap-2">
                           <CheckCircle2 className="w-4 h-4" />
                           Davomat qilishga o'tish
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        !classesLoading && (
          <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
            <CardContent className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-red-100">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sinf tanlanmagan</h3>
              <p className="text-gray-500 max-w-sm">
                Davomat qilish yoki tarixni ko'rish uchun yuqoridagi ro'yxatdan sinfni tanlang
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
