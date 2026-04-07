"use client"

import { useGetSuspiciousActivityQuery } from "@/lib/api/coinsApi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { ShieldAlert, Users, Trophy, Repeat, AlertTriangle } from "lucide-react"
import { useSelector } from "react-redux"
import { redirect } from "next/navigation"

export default function SuspiciousActivityPage() {
  const { user: currentUser } = useSelector((state: any) => state.auth)
  const isAdmin = currentUser?.role === "admin"

  if (!isAdmin && currentUser) {
    redirect("/dashboard")
  }

  const { data: suspiciousData, isLoading } = useGetSuspiciousActivityQuery(undefined, {
    pollingInterval: 60000, // Har daqiqada yangilanadi
  })

  if (isLoading) return <LoadingSpinner fullScreen />

  const { topGivers = [], topReceivers = [], repeatedTransactions = [] } = suspiciousData || {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-4 md:pt-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Audit va Shubhali Harakatlar
          </h1>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">
            Tizimdagi noodatiy yoki katta hajmdagi tranzaksiyalarni kuzatish. Ma'lumotlar bugungi kun hisobidan olinadi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Shubhali Takroriy Tranzaksiyalar */}
        <Card className="col-span-1 border-l-4 border-l-red-500 shadow-sm sm:col-span-1 lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Repeat className="w-5 h-5" />
              Shubhali Takrorlanishlar (Spam)
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Bugun bitta o'qituvchi bitta o'quvchiga 3 va undan ortiq marta tanga bergan holatlar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {repeatedTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <AlertTriangle className="w-12 h-12 text-green-500/50 mb-3" />
                <p>Ayni vaqtda shubhali takrorlanishlar aniqlanmadi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kuzatuv (O'qituvchi)</TableHead>
                      <TableHead>Qabul qiluvchi (O'quvchi)</TableHead>
                      <TableHead className="text-center">Martalar (Bugun)</TableHead>
                      <TableHead className="text-right">Umumiy Summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repeatedTransactions.map((trx: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-foreground">
                          {trx.giver?.fullname || trx.giver?.username}
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">
                          {trx.receiver?.fullname || trx.receiver?.username}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive" className="font-bold">
                            {trx.transfer_count} marta
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-amber-600">{trx.total_amount}</span> tanga
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eng ko'p ulashganlar */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
              Eng ko'p tanga ulashganlar (Bugun)
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Ushbu ro'yxat bugun jami qancha tanga va nechta o'quvchiga mukofot berilganini ko'rsatadi.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topGivers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Bugun hich kim tanga ulashmagan.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>O'qituvchi</TableHead>
                      <TableHead className="text-center">Tranzaksiyalar soni</TableHead>
                      <TableHead className="text-right">Jami ulashildi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topGivers.map((giver: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">
                          {giver.giver?.fullname || giver.giver?.username || "Noma'lum"}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground font-medium">
                          {giver.transaction_count} ta
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-amber-600">{giver.total_given}</span> tanga
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eng ko'p yig'ganlar */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-green-50/50 dark:bg-green-950/20 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Trophy className="w-5 h-5" />
              Eng ko'p yig'gan o'quvchilar (Bugun)
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Bugun ichida juda ko'p miqdorda tanga to'plaganlar. Shu hisob qanday kelganini tekshirib ko'rishingiz mumkin.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topReceivers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Hech kim tanga yig'magan.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead className="text-right">Jami qo'shilgan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topReceivers.map((receiver: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">
                          {receiver.receiver?.fullname || receiver.receiver?.username || "Noma'lum"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-amber-600">+{receiver.total_received}</span> tanga
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
