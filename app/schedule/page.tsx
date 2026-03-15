"use client"

import { useState, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useGetAllClassesQuery } from "@/lib/api/classesApi"
import { 
  useGetScheduleByClassQuery, 
  useSaveScheduleMutation 
} from "@/lib/api/schedulesApi"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Printer, 
  Save, 
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  Loader2,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import LoadingSpinner from "@/components/ui/loading-spinner"

const days = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"]

const shift1Slots = ["08:30 - 09:15", "09:25 - 10:10", "10:15 - 11:00", "11:05 - 11:50", "11:55 - 12:40", "13:00 - 13:45"]
const shift2Slots = ["14:00 - 14:40", "14:45 - 15:25", "15:35 - 16:10"]

const createEmptySchedule = (slots: string[]) => days.map((day) => ({
  day,
  lessons: slots.map((time) => ({ 
    time, 
    subject: "", 
  }))
}))

const lessonColors = [
  { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", printBg: "#fef2f2" },
]

export default function SchedulePage() {
  const { user } = useSelector((state: any) => state.auth)
  const isAdminOrTeacher = user?.role === "admin" || user?.role === "teacher"
  
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [activeShift, setActiveShift] = useState<1 | 2>(1)
  
  const [localSchedule, setLocalSchedule] = useState<{shift1: any[], shift2: any[]}>({
    shift1: createEmptySchedule(shift1Slots),
    shift2: createEmptySchedule(shift2Slots)
  })

  const { data: classesResponse, isLoading: classesLoading } = useGetAllClassesQuery(undefined, {
    skip: !isAdminOrTeacher
  })
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []

  const activeClassId = useMemo(() => {
    if (isAdminOrTeacher) return selectedClassId
    return user?.class_id || user?.classId || ""
  }, [isAdminOrTeacher, selectedClassId, user])

  const { data: remoteSchedule, isLoading: scheduleLoading, isFetching } = useGetScheduleByClassQuery(
    parseInt(activeClassId), 
    { skip: !activeClassId }
  )
  const [saveSchedule, { isLoading: isSaving }] = useSaveScheduleMutation()

  useEffect(() => {
    if (remoteSchedule?.data) {
      if (Array.isArray(remoteSchedule.data)) {
        setLocalSchedule({
            shift1: remoteSchedule.data,
            shift2: createEmptySchedule(shift2Slots)
        })
      } else {
        setLocalSchedule(remoteSchedule.data)
      }
    } else {
      setLocalSchedule({
        shift1: createEmptySchedule(shift1Slots),
        shift2: createEmptySchedule(shift2Slots)
      })
    }
  }, [remoteSchedule])

  const handleSave = async () => {
    if (!activeClassId) return
    try {
      await saveSchedule({ 
        classId: parseInt(activeClassId), 
        data: localSchedule 
      }).unwrap()
      toast.success("Jadval muvaffaqiyatli saqlandi!")
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err?.data?.message || "Saqlashda xatolik yuz berdi")
    }
  }

  const handleUpdateLesson = (shift: 1 | 2, dayIndex: number, lessonIndex: number, field: string, value: string) => {
    const newSchedule = JSON.parse(JSON.stringify(localSchedule))
    const shiftKey = shift === 1 ? 'shift1' : 'shift2'
    newSchedule[shiftKey][dayIndex].lessons[lessonIndex][field] = value
    setLocalSchedule(newSchedule)
  }

  const handlePrint = () => {
    window.print()
  }

  const selectedClassName = useMemo(() => {
    if (!isAdminOrTeacher) return user?.class_name || "Sinf nomi"
    const cls = classes.find((c: any) => (c.id || c._id).toString() === selectedClassId)
    return cls?.name || "Sinf nomi"
  }, [isAdminOrTeacher, classes, selectedClassId, user])

  if ((isAdminOrTeacher && classesLoading) || (activeClassId && scheduleLoading)) {
    return <LoadingSpinner fullScreen />
  }

  const renderSchedule = (shiftData: any[], shiftNumber: 1 | 2) => (
    <div className={cn(
      "bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 print:shadow-none print:p-0 print:border-none relative",
      `shift-container-${shiftNumber}`,
      activeShift !== shiftNumber && "print:block hidden",
      isFetching && "opacity-50 pointer-events-none"
    )}>
      {/* Watermark Logo for Print */}
      <div className="hidden print:flex absolute inset-0 items-center justify-center opacity-[0.05] pointer-events-none z-0">
         <img src="/logo.png" alt="Watermark" className="w-[500px] h-[500px] object-contain" />
      </div>

      {/* Ultra Minimalist Print Header */}
      <div className="hidden print:flex items-center justify-between mb-4 relative z-10">
         <div className="flex items-center gap-4">
            <div className="bg-red-600 text-white px-6 py-2 rounded-br-3xl font-black text-xl shadow-lg">
                Sinf: {selectedClassName}
            </div>
            <div className="bg-gray-800 text-white px-4 py-1 rounded-full text-xs font-bold">
                {shiftNumber}-SMENA
            </div>
         </div>
         <div className="text-right text-[10px] font-bold text-gray-400">
            2024-2025 o'quv yili
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 print:grid-cols-5 print:gap-3 grid-cols-5-print relative z-10">
        {shiftData.map((dayData, dayIndex) => (
          <div key={dayData.day} className="flex flex-col space-y-4 print:space-y-4 print:break-inside-avoid">
            <div className="bg-red-600 text-white py-3 px-4 rounded-2xl shadow-lg text-center font-black tracking-widest uppercase print:py-2 print:px-2 print:text-xs print:rounded-xl">
              {dayData.day}
            </div>
            
            <div className="space-y-4 print:space-y-3">
              {dayData.lessons.map((lesson: any, lessonIndex: number) => (
                <div 
                  key={lessonIndex} 
                  className={cn(
                    "p-4 rounded-3xl border transition-all duration-300 relative group",
                    lessonColors[0].bg,
                    lessonColors[0].border,
                    "hover:shadow-xl relative z-10",
                    isEditing && activeShift === shiftNumber && "ring-2 ring-red-100",
                    "print:shadow-none print:p-3 lesson-card-print"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter mb-2",
                    lessonColors[0].text,
                    "print:text-red-700"
                  )}>
                     <Clock className="w-3 h-3" />
                     {lesson.time}
                  </div>

                  {isEditing && activeShift === shiftNumber ? (
                    <div className="space-y-2">
                      <Input 
                        placeholder="Fan nomi" 
                        value={lesson.subject} 
                        onChange={(e) => handleUpdateLesson(shiftNumber, dayIndex, lessonIndex, 'subject', e.target.value)}
                        className="h-10 text-sm font-bold rounded-xl border-gray-200 bg-white/50"
                      />
                    </div>
                  ) : (
                    <div className="py-1">
                      <p className={cn(
                        "font-black text-lg print:text-base subject-text",
                        lessonColors[0].text
                      )}>
                        {lesson.subject || "..."}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <CalendarIcon className="w-8 h-8 text-red-600" />
            </div>
            Dars Jadvali {isAdminOrTeacher && "- Boshqaruv"}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {isAdminOrTeacher 
              ? "Barcha sinflar uchun dars jadvallarini boshqarish" 
              : `${selectedClassName} dars jadvali`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
             <button onClick={() => setActiveShift(1)} className={cn("px-4 py-2 rounded-xl text-sm font-bold", activeShift === 1 ? "bg-white text-red-600 shadow-sm" : "text-gray-500")}>1-Smena</button>
             <button onClick={() => setActiveShift(2)} className={cn("px-4 py-2 rounded-xl text-sm font-bold", activeShift === 2 ? "bg-white text-red-600 shadow-sm" : "text-gray-500")}>2-Smena</button>
          </div>

          {isAdminOrTeacher && (
            <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setIsEditing(false); }}>
              <SelectTrigger className="w-[200px] h-12 rounded-2xl border-gray-200 bg-white shadow-sm font-bold">
                <SelectValue placeholder="Sinfni tanlang" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id || cls._id} value={(cls.id || cls._id).toString()}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isAdminOrTeacher && activeClassId && (
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "destructive" : "outline"} className="rounded-2xl h-12 px-6 font-bold transition-all shadow-sm">
              {isEditing ? "Bekor qilish" : "Tahrirlash"}
            </Button>
          )}
          
          {isEditing && (
            <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 px-8 font-black shadow-lg shadow-green-500/20">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Saqlash
            </Button>
          )}

          {activeClassId && (
            <Button onClick={handlePrint} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 px-8 font-black shadow-lg shadow-red-500/20">
              <Printer className="w-5 h-5 mr-2" /> Hamma smenani chop etish
            </Button>
          )}
        </div>
      </div>

      {!activeClassId && !isAdminOrTeacher && (
        <Card className="bg-amber-50 border-amber-200 px-4">
          <CardContent className="p-12 text-center space-y-4 text-amber-900 border-none shadow-none">
            <AlertCircle className="w-12 h-12 mx-auto" />
            <h2 className="text-xl font-bold">Sizga sinf biriktirilmagan</h2>
          </CardContent>
        </Card>
      )}

      {activeClassId && (
        <div className="space-y-12">
           {renderSchedule(localSchedule.shift1, 1)}
           {renderSchedule(localSchedule.shift2, 2)}
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 0.5cm; }
          .shift-container-2 { page-break-before: always; margin-top: 2cm; }
          .sidebar-container, header, .print-hidden, footer, aside, nav, .mobile-header, .sticky-header, button, select, [role="combobox"] { 
            display: none !important; 
          }
          body, main { 
            background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; width: 100% !important;
          }
          .grid-cols-5-print { display: grid !important; grid-template-columns: repeat(5, 1fr) !important; gap: 15px !important; }
          .print-container * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          .print-container .bg-red-600 {
            background-color: #dc2626 !important;
            color: #ffffff !important;
            border: 1px solid #dc2626 !important; /* Fallback border */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            display: block !important;
            padding: 12px 10px !important;
            border-radius: 12px !important;
            font-weight: 900 !important;
            margin-bottom: 8px !important;
            text-transform: uppercase !important;
          }

          .print-container p.subject-text { 
            color: #dc2626 !important; 
            font-size: 13px !important; 
            font-weight: 900 !important;
          }
          
          .lesson-card-print {
            border: 1.5px solid #fee2e2 !important;
            padding: 12px !important;
            border-radius: 18px !important;
            background-color: #fff !important;
            break-inside: avoid !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
          }
        }
      `}</style>
    </div>
  )
}
