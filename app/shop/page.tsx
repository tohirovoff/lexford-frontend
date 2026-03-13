"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { 
  useGetActiveShopItemsQuery, 
  useGetShopItemsQuery, 
  useCreateShopItemMutation, 
  useUpdateShopItemMutation, 
  useDeleteShopItemMutation, 
  useBuyItemMutation, 
  useGetAllPurchasesQuery,
  useGetMyPurchasesQuery,
  useUpdatePurchaseStatusMutation,
  useDeletePurchaseMutation
} from "@/lib/api/shopApi"
import { useGetUserQuery } from "@/lib/api/usersApi"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Plus, 
  ShoppingBag, 
  Edit, 
  Trash2, 
  X, 
  Upload, 
  Coins, 
  Package,
  EyeOff,
  Star,
  History,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { cn, getImageUrl } from "@/lib/utils"

export default function Shop() {
  const { user } = useSelector((state: any) => state.auth)
  const isStudent = user?.role === "student"
  const isAdminOrTeacher = user?.role === "admin" || user?.role === "teacher"

  // User data for coins
  const { data: userProfileData, refetch: refetchUser } = useGetUserQuery(user?.id, { skip: !user?.id })
  const userProfile = userProfileData?.data || user

  // Separate queries to follow Hook rules
  const { data: adminItemsResponse, isLoading: adminLoading, refetch: refetchAdmin } = useGetShopItemsQuery(undefined, { skip: !isAdminOrTeacher })
  const { data: studentItemsResponse, isLoading: studentLoading, refetch: refetchStudent } = useGetActiveShopItemsQuery(undefined, { skip: isAdminOrTeacher })

  const isLoading = isAdminOrTeacher ? adminLoading : studentLoading
  const itemsResponse = isAdminOrTeacher ? adminItemsResponse : studentItemsResponse
  const refetchItems = isAdminOrTeacher ? refetchAdmin : refetchStudent
  const items = Array.isArray(itemsResponse) ? itemsResponse : (itemsResponse as any)?.data || []

  // Purchase related queries
  const { data: adminPurchasesResponse, refetch: refetchAllPurchases } = useGetAllPurchasesQuery(undefined, { skip: !isAdminOrTeacher })
  const { data: myPurchasesResponse, refetch: refetchMyPurchases } = useGetMyPurchasesQuery(undefined, { skip: !isStudent })

  const purchases = isAdminOrTeacher 
    ? (adminPurchasesResponse?.data || adminPurchasesResponse || []) 
    : (myPurchasesResponse?.data || myPurchasesResponse || [])

  // Mutations
  const [createItem, { isLoading: isCreating }] = useCreateShopItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateShopItemMutation()
  const [deleteItem] = useDeleteShopItemMutation()
  const [buyItem, { isLoading: isBuying }] = useBuyItemMutation()
  const [updatePurchaseStatus] = useUpdatePurchaseStatusMutation()
  const [deletePurchase] = useDeletePurchaseMutation()

  // UI State
  const [activeTab, setActiveTab] = useState("products")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [purchaseItem, setPurchaseItem] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_coins: "",
    item_type: "Virtual",
    stock: "",
    is_active: "true"
  })
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || "",
        price_coins: item.price_coins?.toString() || "",
        item_type: item.item_type || "Virtual",
        stock: (item.stock !== null && item.stock !== undefined) ? item.stock.toString() : "",
        is_active: item.is_active ? "true" : "false"
      })
      setImagePreview(getImageUrl(item.image_url))
    } else {
      setEditingItem(null)
      setFormData({
        name: "",
        description: "",
        price_coins: "",
        item_type: "Virtual",
        stock: "",
        is_active: "true"
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setImagePreview(null)
    setImageFile(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Rasm hajmi 5MB dan oshmasligi kerak")
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 800px
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG (0.8 quality) to ensure small file size
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              setImageFile(compressedFile);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = reader.result as string;
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price_coins) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring")
      return
    }

    try {
      const fd = new FormData()
      fd.append("name", formData.name)
      fd.append("description", formData.description)
      fd.append("price_coins", formData.price_coins)
      fd.append("item_type", formData.item_type)
      
      if (formData.stock && formData.stock !== "") {
        fd.append("stock", formData.stock)
      } else {
         fd.append("stock", "null")
      }
      
      fd.append("is_active", formData.is_active)
      if (imageFile) {
        fd.append("image", imageFile)
      }

      if (editingItem) {
        await updateItem({ id: editingItem.id, body: fd }).unwrap()
        toast.success("Mahsulot muvaffaqiyatli yangilandi")
      } else {
        await createItem(fd).unwrap()
        toast.success("Yangi mahsulot qo'shildi")
      }
      handleCloseModal()
      refetchItems()
    } catch (err: any) {
      toast.error(err?.data?.message || "Xatolik yuz berdi")
    }
  }

  const handleDelete = async (id: number) => {
    toast.promise(deleteItem(id).unwrap(), {
      loading: "O'chirilmoqda...",
      success: () => {
        refetchItems()
        return "Mahsulot o'chirildi"
      },
      error: "O'chirishda xatolik yuz berdi"
    })
  }

  const handleBuyClick = (item: any) => {
    if (!isStudent) return

    if ((userProfile?.coins || 0) < item.price_coins) {
       toast.error("Tangalaringiz yetarli emas!")
       return
    }
    
    setPurchaseItem(item)
    setIsPurchaseModalOpen(true)
  }

  const handleConfirmBuy = async () => {
    if (!purchaseItem) return

    try {
      await buyItem({ item_id: purchaseItem.id }).unwrap()
      toast.success("Xarid muvaffaqiyatli amalga oshirildi!", {
        description: `Siz ${purchaseItem.name} mahsulotini sotib oldingiz. Adminlar tez orada siz bilan bog'lanishadi.`
      })
      refetchUser()
      refetchItems()
      if (isStudent) refetchMyPurchases()
      if (isAdminOrTeacher) refetchAllPurchases()
      
      setIsPurchaseModalOpen(false)
      setTimeout(() => setPurchaseItem(null), 300)
    } catch (err: any) {
      // Backenddan array list shaklidagi xatolar kelganda ham to'g'ri o'qib olish:
      let errorMessage = "Xarid amalga oshmadi";
      
      if (err?.data?.message) {
        if (Array.isArray(err.data.message)) {
          errorMessage = err.data.message.join(', ');
        } else {
          errorMessage = err.data.message;
        }
      } else if (err?.error) {
         errorMessage = err.error;
      }
      
      toast.error(errorMessage)
    }
  }

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updatePurchaseStatus({ id, status }).unwrap()
      toast.success("Holat yangilandi")
      refetchAllPurchases()
    } catch (err: any) {
      toast.error("Xatolik yuz berdi")
    }
  }

  const handleDeletePurchase = async (id: number) => {
    if (!window.confirm("Ushbu xarid tarixini o'chirasizmi?")) return
    try {
      await deletePurchase(id).unwrap()
      toast.success("O'chirildi")
      refetchAllPurchases()
    } catch (err: any) {
      toast.error("Xatolik yuz berdi")
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Red Premium Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider uppercase">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              Eksklyuziv Do'kon
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Lexford <span className="text-red-200">Market</span>
            </h1>
            <p className="text-red-100/80 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
              Tangalaringiz yordamida noyob imtiyozlar va ajoyib sovg'alarni qo'lga kiriting. O'qishda davom eting va ko'proq jamg'aring!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isStudent && (
              <div className="group relative overflow-hidden px-8 py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg transition-all hover:bg-white/15">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-400/20 rounded-2xl">
                    <Coins className="w-8 h-8 text-yellow-400 animate-bounce-slow" />
                  </div>
                  <div>
                    <p className="text-red-200 text-xs font-bold uppercase tracking-widest">Sizning balansingiz</p>
                    <p className="text-3xl font-black text-white">{userProfile?.coins || 0} <span className="text-xl">🪙</span></p>
                  </div>
                </div>
              </div>
            )}

            {isAdminOrTeacher && (
              <Button 
                onClick={() => handleOpenModal()} 
                size="lg"
                className="rounded-2xl bg-white text-red-700 hover:bg-red-50 font-bold px-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" /> Mahsulot qo'shish
              </Button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-400/10 rounded-full -ml-48 -mb-48 blur-3xl" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "px-8 py-4 font-bold text-lg transition-all border-b-2",
            activeTab === "products" 
              ? "border-red-600 text-red-600" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Mahsulotlar
        </button>
        <button
          onClick={() => setActiveTab("purchases")}
          className={cn(
            "px-8 py-4 font-bold text-lg transition-all border-b-2 flex items-center gap-2",
            activeTab === "purchases" 
              ? "border-red-600 text-red-600" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <History className="w-5 h-5" />
          {isAdminOrTeacher ? "Sotuvlar tarixi" : "Mening xaridlarim"}
          {isAdminOrTeacher && purchases.filter((p: any) => p.status === 'pending').length > 0 && (
            <Badge className="bg-red-600 ml-1">{purchases.filter((p: any) => p.status === 'pending').length}</Badge>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "products" ? (
        isLoading ? (
          <div className="flex flex-col justify-center items-center py-32 space-y-4">
            <LoadingSpinner size="xl" />
            <p className="text-gray-500 font-medium animate-pulse">Do'kon rastalari tayyorlanmoqda...</p>
          </div>
        ) : items.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50 py-32 text-center">
            <CardContent className="flex flex-col items-center gap-4">
               <div className="p-6 bg-gray-100 rounded-full text-gray-400">
                  <Package className="w-16 h-16" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900">Hozircha bo'sh</h3>
               <p className="text-gray-500 max-w-sm mx-auto">Tez orada yangi mahsulotlar qo'shiladi. Bizni kuzatishda davom eting!</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((item: any) => {
             const canAfford = isStudent && (userProfile?.coins || 0) >= item.price_coins
             const isOutOfStock = item.stock !== null && item.stock <= 0
             
             return (
              <Card key={item.id} className="group relative border-none bg-white dark:bg-gray-900 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden flex flex-col h-full hover:-translate-y-2 border border-gray-100/50">
                {/* Badges Overlay */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                  {!item.is_active && isAdminOrTeacher && (
                    <Badge variant="destructive" className="rounded-full px-3 py-1 animate-in slide-in-from-right duration-300 shadow-sm">
                      <EyeOff className="w-3 h-3 mr-1" /> Nofaol
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="secondary" className="bg-gray-950 text-white rounded-full px-3 py-1 shadow-md">
                      Tugagan
                    </Badge>
                  )}
                  {item.item_type === "Imtiyoz" && (
                    <Badge className="bg-orange-500 text-white border-none rounded-full px-3 py-1 shadow-md">
                      Imtiyoz
                    </Badge>
                  )}
                </div>

                {/* Image Section */}
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  {item.image_url ? (
                     <img 
                       src={getImageUrl(item.image_url) ?? undefined} 
                       alt={item.name} 
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                       onError={(e) => {
                         console.log('Image load error for:', item.name, 'URL:', getImageUrl(item.image_url), 'Raw:', item.image_url);
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                         const fallbackEl = target.parentElement?.querySelector('.image-fallback');
                         if (fallbackEl) (fallbackEl as HTMLElement).style.display = 'flex';
                       }}
                     />
                  ) : null}
                  <div className={cn(
                    "w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-200 image-fallback",
                    item.image_url ? "absolute inset-0 hidden" : ""
                  )}>
                    <ShoppingBag className="w-20 h-20 opacity-20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                     <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">
                        {item.description || "Ushbu mahsulot haqida ma'lumot mavjud emas."}
                     </p>
                  </div>
                </div>
                
                {/* Content Section */}
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {item.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 pt-0 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-2xl border border-red-100 dark:border-red-800">
                       <Coins className="w-5 h-5 text-red-600 dark:text-red-400" />
                       <span className="font-black text-red-700 dark:text-red-300 text-lg">{item.price_coins}</span>
                    </div>
                    
                    <div className="text-right">
                       <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Qoldiq</p>
                       <p className={cn(
                         "text-sm font-bold",
                         item.stock === null ? "text-green-600" : item.stock <= 5 ? "text-orange-500" : "text-gray-700"
                       )}>
                         {item.stock === null ? "Cheksiz" : `${item.stock} ta`}
                       </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed h-10">
                    {item.description || "Tavsif yo'q"}
                  </p>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  {isAdminOrTeacher ? (
                    <div className="w-full grid grid-cols-2 gap-3">
                       <Button 
                         onClick={() => handleOpenModal(item)} 
                         variant="outline"
                         className="rounded-2xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                       >
                          <Edit className="w-4 h-4 mr-2" /> Tahrir
                       </Button>
                       <Button 
                         onClick={() => handleDelete(item.id)}
                         variant="destructive"
                         className="rounded-2xl shadow-md hover:shadow-red-500/20"
                       >
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleBuyClick(item)} 
                      disabled={!canAfford || isOutOfStock || isBuying}
                      className={cn(
                        "w-full py-6 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300",
                        isOutOfStock 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : canAfford 
                            ? "bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/25" 
                            : "bg-red-50 text-red-400 cursor-not-allowed border-red-100 border hover:bg-red-100"
                      )}
                    >
                      {isBuying ? (
                         <LoadingSpinner size="sm" />
                       ) : isOutOfStock ? (
                         "Sotuvda yo'q" 
                       ) : canAfford ? (
                         "Sotib olish" 
                       ) : (
                         "Tangangiz yetarli emas"
                       )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )) : (
        <div className="space-y-6">
          {purchases.length === 0 ? (
            <Card className="p-20 text-center border-dashed border-2">
              <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Hozircha hech qanday xaridlar mavjud emas.</p>
            </Card>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 font-bold text-gray-600">Mahsulot</th>
                    {isAdminOrTeacher && <th className="px-6 py-4 font-bold text-gray-600">O'quvchi</th>}
                    <th className="px-6 py-4 font-bold text-gray-600 text-center">Narxi</th>
                    <th className="px-6 py-4 font-bold text-gray-600 text-center">Sana</th>
                    <th className="px-6 py-4 font-bold text-gray-600 text-center">Holati</th>
                    {isAdminOrTeacher && <th className="px-6 py-4 font-bold text-gray-600 text-right">Amallar</th>}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase: any) => (
                    <tr key={purchase.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                             <img src={getImageUrl(purchase.item?.image_url) || "/placeholder.png"} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{purchase.item?.name}</p>
                            <p className="text-xs text-gray-400">{purchase.item?.item_type}</p>
                          </div>
                        </div>
                      </td>
                      {isAdminOrTeacher && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{purchase.user?.fullname}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-100">
                          {purchase.price_paid} 🪙
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {purchase.status === 'pending' && (
                          <Badge className="bg-orange-100 text-orange-600 border-none rounded-full flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" /> Kutilmoqda
                          </Badge>
                        )}
                        {purchase.status === 'completed' && (
                          <Badge className="bg-green-100 text-green-600 border-none rounded-full flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Yakunlandi
                          </Badge>
                        )}
                        {purchase.status === 'cancelled' && (
                          <Badge className="bg-red-100 text-red-600 border-none rounded-full flex items-center justify-center gap-1">
                            <X className="w-3 h-3" /> Bekor qilindi
                          </Badge>
                        )}
                      </td>
                      {isAdminOrTeacher && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             {purchase.status === 'pending' && (
                               <>
                                 <Button 
                                   size="sm" 
                                   onClick={() => handleStatusUpdate(purchase.id, 'completed')}
                                   className="bg-green-600 hover:bg-green-700 h-8 text-xs rounded-lg"
                                 >
                                    Tasdiqlash
                                 </Button>
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => handleStatusUpdate(purchase.id, 'cancelled')}
                                   className="h-8 text-xs rounded-lg text-red-600 border-red-100 hover:bg-red-50"
                                 >
                                    Bekor qilish
                                 </Button>
                               </>
                             )}
                             <Button 
                               size="sm" 
                               variant="ghost" 
                               onClick={() => handleDeletePurchase(purchase.id)}
                               className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                             >
                                <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modern Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white/95 backdrop-blur-xl">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-gray-900 border-b pb-4 border-gray-100">
                {editingItem ? "Mahsulotni yangilash" : "Yangi mahsulot"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                Do'konga o'quvchilar uchun qiziqarli yangilik qo'shing.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Sarlavha *</label>
                    <Input 
                      placeholder="Masalan: 1 kunlik kiyim tanlash" 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="rounded-2xl border-gray-100 bg-gray-50/50 h-12 focus:bg-white transition-all shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Narxi (Coin) *</label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        required 
                        min="0"
                        value={formData.price_coins} 
                        onChange={(e) => setFormData({...formData, price_coins: e.target.value})}
                        className="rounded-2xl border-gray-100 bg-gray-50/50 h-12 pl-10 focus:bg-white transition-all shadow-sm" 
                      />
                      <Coins className="absolute left-3.5 top-3.5 w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Tavsif</label>
                  <Textarea 
                    placeholder="Mahsulot haqida batafsil ma'lumot..." 
                    rows={3} 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all shadow-sm resize-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Miqdori (null=cheksiz)</label>
                     <Input 
                       type="number" 
                       min="0"
                       placeholder="Cheksiz"
                       value={formData.stock} 
                       onChange={(e) => setFormData({...formData, stock: e.target.value})}
                       className="rounded-2xl border-gray-100 bg-gray-50/50 h-12 focus:bg-white transition-all shadow-sm" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Turi</label>
                     <select 
                       value={formData.item_type} 
                       onChange={(e) => setFormData({...formData, item_type: e.target.value})}
                       className="w-full px-4 rounded-2xl border-gray-100 bg-gray-50/50 h-12 focus:bg-white transition-all shadow-sm text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                     >
                       <option value="Virtual">Virtual</option>
                       <option value="Jismoniy">Jismoniy</option>
                       <option value="Imtiyoz">Imtiyoz</option>
                     </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Aktiv holati</label>
                     <select 
                       value={formData.is_active} 
                       onChange={(e) => setFormData({...formData, is_active: e.target.value})}
                       className="w-full px-4 rounded-2xl border-gray-100 bg-gray-50/50 h-12 focus:bg-white transition-all shadow-sm text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                     >
                       <option value="true">Sotuvga chiqarish</option>
                       <option value="false">Hozircha yashirin</option>
                     </select>
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Rasm</label>
                     <div 
                        onClick={() => document.getElementById("file-upload")?.click()}
                        className="flex items-center gap-3 px-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 h-12 cursor-pointer hover:bg-gray-100 transition shadow-sm overflow-hidden"
                     >
                        <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500 truncate">{imageFile ? imageFile.name : "Rasm yuklang"}</span>
                        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                     </div>
                   </div>
                </div>

                {imagePreview && (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-100 group">
                    <img src={imagePreview || "/placeholder.jpg"} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => {setImagePreview(null); setImageFile(null);}} 
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-gray-100 flex gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleCloseModal}
                  className="rounded-2xl px-8 h-12 font-bold"
                >
                  Bekor qilish
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  className="rounded-2xl px-12 h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl shadow-red-500/20"
                >
                  {isCreating || isUpdating ? <LoadingSpinner size="sm" /> : editingItem ? "Yangilash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modern Purchase Confirmation Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={(open) => {
        setIsPurchaseModalOpen(open)
        if (!open) setTimeout(() => setPurchaseItem(null), 300)
      }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white/95 backdrop-blur-xl">
          {purchaseItem && (
            <div className="flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 w-full flex items-center justify-center overflow-hidden">
                {purchaseItem.image_url ? (
                  <img 
                    src={getImageUrl(purchaseItem.image_url) ?? undefined} 
                    alt={purchaseItem.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 scale-105" 
                  />
                ) : (
                   <ShoppingBag className="w-20 h-20 text-gray-400 opacity-20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                   <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">{purchaseItem.name}</h3>
                   <div className="flex items-center gap-2 mt-3">
                     <div className="bg-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-500/30 backdrop-blur-md inline-flex items-center gap-1.5 shadow-lg">
                       <Coins className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                       <span className="text-yellow-400 font-bold text-lg">{purchaseItem.price_coins}</span>
                     </div>
                   </div>
                </div>
              </div>
              
              <div className="p-8 space-y-8 bg-white/60">
                <div className="space-y-4">
                  <p className="text-gray-500 font-medium text-center text-lg">Bu mahsulotni haqiqatan ham xarid qilasizmi?</p>
                  
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-5 flex items-start gap-4 border border-red-100/50 shadow-inner">
                    <div className="bg-white p-3 rounded-full shadow-md">
                      <Coins className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-red-500/80 font-black uppercase tracking-widest">Xarid tafsiloti</p>
                      <p className="text-sm font-medium text-red-950">
                        Hisobingizdan <strong className="font-black text-red-600">{purchaseItem.price_coins} tanga</strong> yechib olinadi.
                      </p>
                      <div className="pt-2 mt-2 border-t border-red-200/50">
                        <p className="text-xs font-bold text-gray-500">
                          Xariddan keyingi qoldiq: <span className="text-red-600 font-black">{(userProfile?.coins || 0) - purchaseItem.price_coins} 🪙</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsPurchaseModalOpen(false)}
                    className="flex-1 rounded-2xl h-14 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200"
                  >
                    Bekor qilish
                  </Button>
                  <Button 
                    onClick={handleConfirmBuy}
                    disabled={isBuying}
                    className="flex-1 rounded-2xl h-14 bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl shadow-red-500/25 transition-all"
                  >
                    {isBuying ? <LoadingSpinner size="sm" /> : "Xaridni tasdiqlash"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
