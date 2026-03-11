"use client"

import { useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { 
  useGetAllAuctionsQuery, 
  useGetAuctionItemsQuery, 
  useCreateAuctionMutation, 
  usePlaceBidMutation 
} from "@/lib/api/auctionsApi"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import CoinDisplay from "@/components/ui/coin-display"
import { Gavel, Clock, CheckCircle, XCircle, Package, Calendar, Search, Plus, Trophy, User } from "lucide-react"
import { toast } from "sonner"

export default function AuctionPage() {
  const { user } = useSelector((state: any) => state.auth)
  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin"
  const isAdmin = user?.role === "admin"
  
  const [statusFilter, setStatusFilter] = useState("active")
  const [selectedAuction, setSelectedAuction] = useState<any>(null)
  
  // Create Auction State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newAuctionData, setNewAuctionData] = useState({ title: "", description: "", startDate: "", endDate: "" })
  
  // Bid State
  const [bidItem, setBidItem] = useState<any>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // API Hooks
  const { data: auctionsResponse, isLoading: auctionsLoading } = useGetAllAuctionsQuery(undefined)
  const auctions = Array.isArray(auctionsResponse) ? auctionsResponse : auctionsResponse?.data || []
  
  const { data: itemsResponse, isLoading: itemsLoading } = useGetAuctionItemsQuery(selectedAuction?.id, {
    skip: !selectedAuction?.id,
  })
  const items = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse?.data || []

  const [createAuction, { isLoading: isCreating }] = useCreateAuctionMutation()
  const [placeBid, { isLoading: isBidding }] = usePlaceBidMutation()

  const filteredAuctions = useMemo(() => {
    if (!auctions) return []
    if (statusFilter === "all") return auctions
    return auctions.filter((auction: any) => auction.status === statusFilter)
  }, [auctions, statusFilter])

  const handleCreateAuction = async () => {
    if (!newAuctionData.title || !newAuctionData.startDate || !newAuctionData.endDate) {
      toast?.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      const payload = {
        title: newAuctionData.title,
        start_date: new Date(newAuctionData.startDate).toISOString(),
        end_date: new Date(newAuctionData.endDate).toISOString(),
        status: "planned"
      }
      await createAuction(payload).unwrap()
      setIsCreateOpen(false)
      setNewAuctionData({ title: "", description: "", startDate: "", endDate: "" })
      toast?.success("Auksion muvaffaqiyatli yaratildi!")
    } catch (err: any) {
      console.error("Failed to create auction", err)
      toast?.error(err?.data?.message || err?.data?.error || "Auksion yaratishda xatolik yuz berdi")
    }
  }

  const handlePlaceBid = async () => {
    if (!bidItem || !bidAmount) return
    setErrorMsg(null)
    setSuccessMsg(null)

    const amount = Number(bidAmount)
    const minBid = (bidItem.currentBid || bidItem.startingBid || 0) + 1

    if (amount < minBid) {
      setErrorMsg(`Minimal taklif: ${minBid} tanga`)
      return
    }

    if (amount > (user?.coinBalance || 0)) {
      setErrorMsg("Hisobingizda yetarli tanga mavjud emas")
      return
    }

    try {
      await placeBid({ itemId: bidItem.id || bidItem._id, amount }).unwrap()
      setSuccessMsg("Taklifingiz muvaffaqiyatli qabul qilindi!")
      setTimeout(() => {
        setBidItem(null)
        setBidAmount("")
        setSuccessMsg(null)
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.data?.message || "Xatolik yuz berdi")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Faol</Badge>
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Clock className="h-3 w-3 mr-1" /> Tez orada</Badge>
      case "ended":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200"><XCircle className="h-3 w-3 mr-1" /> Yakunlangan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (auctionsLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-20 pt-20 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-6 border-b border-gray-100 pb-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[400px] rounded-2xl shadow-sm border border-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 pt-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Gavel className="h-8 w-8 text-amber-600" />
            Auksionlar
          </h1>
          <p className="text-gray-500 mt-1">Noyob buyumlar uchun savdolarda qatnashing</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isAdmin && (
            <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Yangi Auksion
            </Button>
          )}
          {!isTeacherOrAdmin && (
            <div className="bg-white p-2 rounded-lg border shadow-sm flex items-center gap-2">
               <span className="text-sm font-medium text-gray-500">Mening balansim:</span>
               <CoinDisplay coins={user?.coinBalance || 0} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards (Optional - can be simpler) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-100 shadow-sm">
           <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white p-2 rounded-full text-green-600"><CheckCircle className="h-5 w-5"/></div>
              <div>
                 <p className="text-2xl font-bold text-green-700">{auctions.filter((a:any) => a.status === 'active').length}</p>
                 <p className="text-xs text-green-600 font-medium">Faol Auksionlar</p>
              </div>
           </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100 shadow-sm">
           <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white p-2 rounded-full text-blue-600"><Clock className="h-5 w-5"/></div>
              <div>
                 <p className="text-2xl font-bold text-blue-700">{auctions.filter((a:any) => a.status === 'upcoming').length}</p>
                 <p className="text-xs text-blue-600 font-medium">Kutilayotgan</p>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center md:justify-start border-b border-gray-200">
         <div className="flex gap-6">
            <button 
              onClick={() => setStatusFilter("active")} 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${statusFilter === "active" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Faol
            </button>
            <button 
              onClick={() => setStatusFilter("upcoming")} 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${statusFilter === "upcoming" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Kutilayotgan
            </button>
            <button 
              onClick={() => setStatusFilter("ended")} 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${statusFilter === "ended" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Yakunlangan
            </button>
            <button 
              onClick={() => setStatusFilter("all")} 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${statusFilter === "all" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Barchasi
            </button>
         </div>
      </div>

      {/* Auctions Grid */}
      {filteredAuctions.length === 0 ? (
           <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <Gavel className="h-16 w-16 mx-auto mb-4 text-gray-300" />
             <h3 className="text-lg font-medium text-gray-900">Auksionlar topilmadi</h3>
             <p className="text-gray-500">Hozircha tanlangan toifada auksionlar mavjud emas</p>
           </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction: any) => (
            <Card 
              key={auction.id || auction._id} 
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-gray-200 cursor-pointer flex flex-col h-full"
              onClick={() => setSelectedAuction(auction)}
            >
              <div className="h-40 bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center relative">
                 <Gavel className="h-16 w-16 text-amber-500/50 group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute top-3 right-3">
                   {getStatusBadge(auction.status)}
                 </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1 text-lg">{auction.name || auction.title}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                   <Calendar className="w-3 h-3" />
                   {new Date(auction.startDate).toLocaleDateString("uz-UZ")} - {new Date(auction.endDate).toLocaleDateString("uz-UZ")}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-gray-600 line-clamp-3 mb-4">{auction.description || "Tavsif yo'q"}</p>
                 <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-500">Lotalar soni:</span>
                    <Badge variant="secondary" className="bg-white">{auction.itemCount || 0}</Badge>
                 </div>
              </CardContent>
              <CardFooter className="pt-0">
                 <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white group-hover:translate-y-0 transition-all">
                    Ko'rish
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Auction Dialog */}
      <Dialog open={!!selectedAuction} onOpenChange={() => {setSelectedAuction(null); setBidItem(null)}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
               {selectedAuction?.name || selectedAuction?.title}
               {selectedAuction && getStatusBadge(selectedAuction.status)}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {selectedAuction?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
               <Package className="h-5 w-5 text-amber-600" /> 
               Auksion Lotlari
            </h3>
            
            {itemsLoading ? (
               <div className="py-10 text-center"><LoadingSpinner /></div>
            ) : items?.length === 0 ? (
               <div className="text-center py-10 bg-gray-50 rounded-lg">
                 <p className="text-gray-500">Ushbu auksionda hozircha lotlar yo'q</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items?.map((item: any) => (
                    <div key={item.id || item._id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-amber-200 transition-colors bg-white">
                       <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                          </div>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">
                             #{item.id || "ID"}
                          </Badge>
                       </div>
                       
                       <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-3">
                             <div className="text-sm">
                                <p className="text-gray-500 text-xs">Joriy narx</p>
                                <CoinDisplay coins={item.currentBid || item.startingBid || 0} size="md" />
                             </div>
                             {item.lastBidder && (
                                <div className="text-right text-sm">
                                   <p className="text-gray-500 text-xs">Oxirgi taklif</p>
                                   <div className="flex items-center gap-1 justify-end">
                                      <User className="w-3 h-3 text-gray-400" />
                                      <span className="font-medium text-gray-700">{item.lastBidder.username || "Foydalanuvchi"}</span>
                                   </div>
                                </div>
                             )}
                          </div>
                          
                          {selectedAuction?.status === 'active' && !isTeacherOrAdmin && (
                             <Button 
                               onClick={() => setBidItem(item)} 
                               className="w-full bg-green-600 hover:bg-green-700 text-white h-9"
                             >
                               Taklif berish
                             </Button>
                          )}
                          {selectedAuction?.status === 'active' && isTeacherOrAdmin && (
                             <div className="text-center text-xs text-gray-400 italic">O'qituvchilar ishtirok eta olmaydi</div>
                          )}
                          {selectedAuction?.status !== 'active' && (
                             <Button disabled variant="secondary" className="w-full h-9">Savdo yopilgan</Button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bid Dialog */}
      <Dialog open={!!bidItem} onOpenChange={() => {setBidItem(null); setSuccessMsg(null); setErrorMsg(null)}}>
        <DialogContent className="max-w-sm">
           <DialogHeader>
              <DialogTitle>Taklif kiritish</DialogTitle>
              <DialogDescription>
                 "{bidItem?.name}" uchun narx taklif qiling
              </DialogDescription>
           </DialogHeader>

           <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                 <span className="text-sm text-gray-600">Joriy narx:</span>
                 <CoinDisplay coins={bidItem?.currentBid || bidItem?.startingBid || 0} />
              </div>
              
              <div className="space-y-2">
                 <Label>Sizning taklifingiz (tanga)</Label>
                 <Input 
                    type="number" 
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`${(bidItem?.currentBid || bidItem?.startingBid || 0) + 1} dan yuqori`}
                    className="text-lg font-medium"
                 />
                 <p className="text-xs text-gray-500 text-right">Balansingiz: {user?.coinBalance || 0}</p>
              </div>

              {errorMsg && (
                 <div className="bg-red-50 text-red-600 text-xs p-2 rounded flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> {errorMsg}
                 </div>
              )}
              {successMsg && (
                 <div className="bg-green-50 text-green-600 text-xs p-2 rounded flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {successMsg}
                 </div>
              )}
           </div>

           <DialogFooter>
              <Button onClick={() => setBidItem(null)} variant="outline">Bekor qilish</Button>
              <Button onClick={handlePlaceBid} disabled={isBidding || !!successMsg} className="bg-green-600 hover:bg-green-700">
                 {isBidding ? <LoadingSpinner size="sm" /> : "Tasdiqlash"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Auction Dialog (Simplified) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
           <DialogHeader>
              <DialogTitle>Yangi Auksion Yaratish</DialogTitle>
           </DialogHeader>
           <div className="space-y-3">
              <div>
                 <Label>Nomi</Label>
                 <Input 
                   value={newAuctionData.title} 
                   onChange={e => setNewAuctionData({...newAuctionData, title: e.target.value})} 
                   placeholder="Masalan: Hafta Auksioni"
                 />
              </div>
              <div>
                 <Label>Tavsif</Label>
                 <Textarea 
                   value={newAuctionData.description} 
                   onChange={e => setNewAuctionData({...newAuctionData, description: e.target.value})} 
                 />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <Label>Boshlanish</Label>
                    <Input 
                      type="date"
                      value={newAuctionData.startDate} 
                      onChange={e => setNewAuctionData({...newAuctionData, startDate: e.target.value})} 
                    />
                 </div>
                 <div>
                    <Label>Tugash</Label>
                    <Input 
                      type="date"
                      value={newAuctionData.endDate} 
                      onChange={e => setNewAuctionData({...newAuctionData, endDate: e.target.value})} 
                    />
                 </div>
              </div>
              <Button onClick={handleCreateAuction} disabled={isCreating} className="w-full mt-2">
                 {isCreating ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
