"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, XCircle } from "lucide-react";
import { useLoginMutation } from "@/lib/api/authApi";
import { decodeToken } from "@/lib/auth";
import { setCredentials } from "@/lib/store";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Foydalanuvchi nomi kiritilishi shart"),
  password: z.string().min(1, "Parol kiritilishi shart"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError("");
      const result = await login(data).unwrap();

      if (!result.access_token) {
        setServerError("Token olinmadi. Iltimos qayta urinib ko'ring.");
        return;
      }

      const decoded = decodeToken(result.access_token);

      if (!decoded) {
        setServerError("Token noto'g'ri. Iltimos qayta urinib ko'ring.");
        return;
      }

      dispatch(
        setCredentials({
          token: result.access_token,
          user: {
            id: decoded.sub,
            username: decoded.username,
            role: decoded.role,
            ...(result.user || {}),
          },
        })
      );

      toast.success("Tizimga muvaffaqiyatli kirdingiz!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err?.data?.message ||
        err?.error ||
        "Login muvaffaqiyatsiz. Iltimos qayta urinib ko'ring.";
      setServerError(errorMessage);
      toast.error(errorMessage, {
        description: "Foydalanuvchi nomi yoki parol noto'g'ri bo'lishi mumkin.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background dark:bg-background p-4 overflow-x-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -ml-48 -mb-48 transition-colors duration-500" />
      <div className="w-full max-w-md py-8">
        {/* Logo va sarlavha */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-2">
            <img src="/logo.png" alt="Lexford Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground dark:text-foreground tracking-tight">Lexford</h1>
          <p className="text-muted-foreground mt-1 font-medium">Maktab boshqaruvi tizimi</p>
        </div>

        {/* Login kartasi */}
        <div className="bg-card dark:bg-card rounded-3xl shadow-2xl p-8 md:p-10 border border-border dark:border-border relative z-10">
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground mb-1 tracking-tight">
            Tizimga kirish
          </h2>
          <p className="text-muted-foreground text-sm mb-8 font-medium">
            Hisobingizga kirish uchun ma'lumotlarni kiriting
          </p>

          {/* Server xatosi - Prominent Error Display */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800">Xatolik yuz berdi</h3>
                  <p className="text-xs text-red-700 mt-1">{serverError}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2 px-1">
                Foydalanuvchi nomi
              </label>
              <input
                type="text"
                autoComplete="off"
                {...register("username")}
                className={`w-full px-4 py-3.5 rounded-xl border bg-background/50 dark:bg-background/50 ${
                  errors.username ? "border-red-500" : "border-border"
                } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium`}
                placeholder="Foydalanuvchi nomini kiriting"
              />
              {errors.username && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2 px-1">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password")}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-background/50 dark:bg-background/50 pr-11 ${
                    errors.password ? "border-red-500" : "border-border"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium`}
                  placeholder="Parolni kiriting"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit tugmasi */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl
                         transition-all duration-300 flex items-center justify-center gap-2
                         disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:shadow-xl hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Kirilmoqda...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Kirish
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
