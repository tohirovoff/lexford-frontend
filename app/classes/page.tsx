"use client"

import { useState, useMemo } from "react"
import { useGetAllClassesQuery, useGetClassLeaderboardQuery } from "@/lib/api/classesApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Search, Users, GraduationCap, Trophy, Medal } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

export default function ClassListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<any>(null)

  const { data: classesResponse, isLoading } = useGetAllClassesQuery(undefined)
  const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []

  const { data: leaderboardResponse } = useGetClassLeaderboardQuery(selectedClass?.id || selectedClass?._id, {
    skip: !(selectedClass?.id || selectedClass?._id),
  })
  const leaderboard = Array.isArray(leaderboardResponse) ? leaderboardResponse : leaderboardResponse?.data || []

  const filteredClasses = useMemo(() => {
    if (!classes) return []
    return classes.filter(
      (cls: any) =>
        cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.teacher?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [classes, searchTerm])

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-4 md:pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sinflar</h1>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-red-500"
            onClick={() => setSelectedClass(cls)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {cls.grade || "Sinf"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-sm">
                    {cls.teacher?.fullname || (typeof cls.teacher === 'string' ? "O'qituvchi tayinlanmagan" : (cls.teacher?.username || "O'qituvchi yo'q"))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
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
          <div className="col-span-full text-center py-12 text-gray-500">
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
                  <AvatarImage src={getImageUrl(student.profile_picture || student.profilePicture)} />
                  <AvatarFallback className="bg-red-100 text-red-700">{student.fullname?.charAt(0) || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{student.fullname || student.username}</p>
                  <p className="text-sm text-gray-500">@{student.username}</p>
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
