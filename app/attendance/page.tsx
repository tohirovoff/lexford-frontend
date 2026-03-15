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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Check, X, Clock, CheckCircle2, XCircle, AlertCircle, Save, UserCircle } from "lucide-react"
import { toast } from "sonner" // Assuming sonner is installed or use default toast if available

type AttendanceStatus = "present" | "absent" | "late"

export default function AttendanceMarkingPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [activeTab, setActiveTab] = useState("mark")

  // API Calls
  const { data: classesResponse, isLoading: classesLoading } = useGetAllClassesQuery(undefined)
  const rawClasses = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []
  
  // Role based class filtering
  const { user } = useSelector((state: any) => state.auth)
  const isAdmin = user?.role === "admin"
  
  const classes = useMemo(() => {
    if (isAdmin) return rawClasses
    return rawClasses.filter((cls: any) => (cls.teacher_id === user?.id || cls.teacher?.id === user?.id))
  }, [rawClasses, isAdmin, user?.id])

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

  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [resultData, setResultData] = useState<{
    success: boolean;
    title: string;
    description: string;
    stats?: any
  } | null>(null)

  const handleSubmit = async () => {
    if (!selectedClassId) return
    // Separate IDs by status
    const presentIds: number[] = []
    const lateIds: number[] = []

    Object.entries(attendanceMap).forEach(([studentId, status]) => {
      const parsedId = parseInt(studentId)
      const id = isNaN(parsedId) ? studentId : parsedId
      
      if (status === "present") presentIds.push(id as any)
      else if (status === "late") lateIds.push(id as any)
    })

    if (presentIds.length === 0 && lateIds.length === 0 && Object.keys(attendanceMap).length === 0) {
      setResultData({
        success: false,
        title: "Eslatma",
        description: "Iltimos, kamida bitta o'quvchi davomatini belgilang"
      })
      setIsResultModalOpen(true)
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
      setResultData({
        success: true,
        title: "Muvaffaqiyatli!",
        description: stats 
          ? `Davomat muvaffaqiyatli saqlandi. Kelganlar: ${stats.present_count}, Kechikkanlar: ${stats.late_count}, Kelmaganlar: ${stats.absent_count}`
          : "Davomat muvaffaqiyatli saqlandi.",
        stats: stats
      })
      setIsResultModalOpen(true)
      
    } catch (err: any) {
      console.error("Attendance marking error caught:", err)
      
      let errorMsg = ""
      if (err.data) {
        if (Array.isArray(err.data.message)) {
          errorMsg = err.data.message.join(", ")
        } else if (typeof err.data.message === 'string') {
          errorMsg = err.data.message
        } else if (err.data.error) {
          errorMsg = err.data.error
        }
      }
      
      setResultData({
        success: false,
        title: "Xatolik yuz berdi",
        description: errorMsg || "Davomatni saqlashda kutilmagan xatolik yuz berdi"
      })
      setIsResultModalOpen(true)
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

  if (classesLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pt-4 md:pt-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <Card className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Skeleton className="h-[400px] rounded-xl" />
           <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-4 md:pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Davomat</h1>
          <p className="text-muted-foreground">O'quvchilar davomatini boshqarish</p>
        </div>
        <Badge variant="outline" className="text-sm py-1.5 px-3 bg-card shadow-sm self-start md:self-auto border-border">
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          {today}
        </Badge>
      </div>

      {/* Class Selection */}
      <Card className="border-t-4 border-t-red-600 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          {classes.length === 0 && !classesLoading ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-foreground">Sizga sinf biriktirilmagan</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Siz hozircha hech qanday sinfga rahbar qilib tayinlanmagansiz. 
                Iltimos, adminstratorga murojaat qiling.
              </p>
            </div>
          ) : (
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
                <div className="text-sm text-muted-foreground pb-1">
                  O'quvchilar soni: <span className="font-semibold text-foreground">{students.length}</span> nafar
                </div>
              )}
            </div>
          )}
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

               <Card className="shadow-sm bg-muted/20">
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
                      <div className="pt-2 mt-2 border-t border-border flex justify-between items-center font-medium">
                        <span>Jami</span>
                        <span>{stats.total}</span>
                      </div>
                   </div>
                 </CardContent>
               </Card>
            </div>

            {/* Students List */}
            <Card className="shadow-sm border-0 ring-1 ring-border">
              <CardContent className="p-0">
                {students.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-lg m-2">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p>Ushbu sinfda o'quvchilar ro'yxati bo'sh</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
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
                                <p className="font-semibold text-foreground">{student.fullname || "Ismsiz"}</p>
                                <p className="text-xs text-muted-foreground">@{student.username || "username"}</p>
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
          </TabsContent>          <TabsContent value="history">
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b">
                <CardTitle className="text-xl">Davomat tarixi</CardTitle>
                <p className="text-sm text-gray-500 font-normal">Oxirgi qayd etilgan davomatlar</p>
              </CardHeader>
              <CardContent className="p-6">
                {historyLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                    <LoadingSpinner />
                    <p className="text-sm text-gray-400">Tarix yuklanmoqda...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                     {history?.map((record: any, index: number) => {
                       const presentIds = (record.present_student_ids || []).map((id: any) => id.toString())
                       const lateIds = (record.late_student_ids || []).map((id: any) => id.toString())
                       
                       const presentStudents = getDataFromIds(presentIds)
                       const lateStudents = getDataFromIds(lateIds)
                       
                       const absentStudents = students.filter((s: any) => {
                         const id = (s._id || s.id).toString()
                         return !presentIds.includes(id) && !lateIds.includes(id)
                       })

                       const recordDate = new Date(record.createdAt || record.date)
                       const dateStr = recordDate.toLocaleDateString("uz-UZ", { day: 'numeric', month: 'long', year: 'numeric' })
                       const uzbekWeekdays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"]
                       const weekday = uzbekWeekdays[recordDate.getDay()]
                       const time = recordDate.toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })

                       return (
                       <div key={record._id || record.id || index} className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                          {/* Top bar with stats highlight */}
                          <div className="bg-gray-50/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center min-w-[60px]">
                                <span className="text-xs font-bold text-red-600 uppercase tracking-tighter">{recordDate.getDate()}</span>
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{uzbekWeekdays[recordDate.getDay()].substring(0, 3)}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 leading-tight">{dateStr}</h4>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{time}</span>
                                  <span className="text-gray-300 mx-1">•</span>
                                  <span>{record.subject || "Umumiy dars"}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                               <div className="flex -space-x-2 mr-2 overflow-hidden">
                                  {presentStudents.slice(0, 4).map((s: any) => (
                                    <Avatar key={s.id} className="h-7 w-7 border-2 border-white ring-1 ring-gray-100">
                                      <AvatarImage src={s.profilePicture} />
                                      <AvatarFallback className="bg-green-50 text-[10px] text-green-600">{s.fullname?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {presentStudents.length > 4 && (
                                    <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                      +{presentStudents.length - 4}
                                    </div>
                                  )}
                               </div>
                               <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100">
                                 <Check className="w-3 h-3" />
                                 {presentStudents.length}
                               </div>
                               <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100">
                                 <X className="w-3 h-3" />
                                 {absentStudents.length}
                               </div>
                            </div>
                          </div>

                          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Present List */}
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 ring-4 ring-green-100"></span>
                                Kelganlar
                              </h5>
                              <div className="space-y-2">
                                {presentStudents.length > 0 ? presentStudents.map((s: any) => (
                                  <div key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors group">
                                     <Avatar className="h-6 w-6 border-gray-100 group-hover:scale-110 transition-transform">
                                       <AvatarImage src={s.profilePicture} />
                                       <AvatarFallback className="bg-gray-50 text-[10px] font-bold">{s.fullname?.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                     <span className="text-xs font-medium text-gray-700 truncate">{s.fullname}</span>
                                  </div>
                                )) : (
                                  <p className="text-[10px] text-gray-400 italic py-2">Hali hech kim yo'q</p>
                                )}
                              </div>
                            </div>

                            {/* Late List */}
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-4 ring-amber-100"></span>
                                Kechikkanlar
                              </h5>
                              <div className="space-y-2">
                                {lateStudents.length > 0 ? lateStudents.map((s: any) => (
                                  <div key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors group">
                                     <Avatar className="h-6 w-6 border-gray-100 group-hover:scale-110 transition-transform">
                                       <AvatarImage src={s.profilePicture} />
                                       <AvatarFallback className="bg-gray-50 text-[10px] font-bold">{s.fullname?.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                     <span className="text-xs font-medium text-gray-700 truncate">{s.fullname}</span>
                                  </div>
                                )) : (
                                  <p className="text-[10px] text-gray-400 italic py-2">Kechikkanlar yo'q</p>
                                )}
                              </div>
                            </div>

                            {/* Absent List */}
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 ring-4 ring-red-100"></span>
                                Kelmaganlar
                              </h5>
                              <div className="space-y-2">
                                {absentStudents.length > 0 ? absentStudents.map((s: any) => (
                                  <div key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors group">
                                     <Avatar className="h-6 w-6 border-gray-100 group-hover:scale-110 transition-transform">
                                       <AvatarImage src={s.profilePicture} />
                                       <AvatarFallback className="bg-gray-50 text-[10px] font-bold">{s.fullname?.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                     <span className="text-xs font-medium text-gray-700 truncate">{s.fullname}</span>
                                  </div>
                                )) : (
                                  <p className="text-[10px] text-gray-400 italic py-2">Barakalla, hamma kelgan!</p>
                                )}
                              </div>
                            </div>
                          </div>
                       </div>
                    )
                    })}
                    
                    {(!history || history.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-200">
                           <Calendar className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Davomat tarixi topilmadi</h3>
                        <p className="text-gray-500 max-w-sm mb-8 text-sm">
                           Ushbu sinf uchun hali hech qanday davomat qayd etilmagan.
                        </p>
                        <Button onClick={() => setActiveTab("mark")} className="bg-red-600 hover:bg-red-700">
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
      {/* Result Modal */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-xl">
          <div className="p-8 text-center space-y-6">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
              resultData?.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {resultData?.success ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <AlertCircle className="w-10 h-10" />
              )}
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-gray-900">
                {resultData?.title}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                {resultData?.description}
              </DialogDescription>
            </div>

            {resultData?.success && resultData.stats && (
              <div className="grid grid-cols-3 gap-2 py-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keldi</p>
                  <p className="text-xl font-black text-green-600">{resultData.stats.present_count}</p>
                </div>
                <div className="space-y-1 border-x border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kechikdi</p>
                  <p className="text-xl font-black text-amber-500">{resultData.stats.late_count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelmadi</p>
                  <p className="text-xl font-black text-red-500">{resultData.stats.absent_count}</p>
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-center">
              <Button 
                onClick={() => setIsResultModalOpen(false)}
                className={`w-full h-12 rounded-2xl font-bold shadow-lg transition-all ${
                  resultData?.success ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Tushunarli
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
