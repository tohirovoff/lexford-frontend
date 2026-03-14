"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Toaster } from "sonner";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = pathname === "/login";

  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="flex min-h-screen">
          {/* Sidebar */}
          {!isAuthPage && (
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          )}

          <div className={`flex-1 flex flex-col ${!isAuthPage ? "xl:ml-72 pt-16" : ""}`}>
            {/* Header */}
            {!isAuthPage && <Header onMenuClick={() => setSidebarOpen(true)} />}

            <main className={`flex-1 ${!isAuthPage ? "p-4 md:p-8 lg:p-10 overflow-y-auto" : "flex flex-col"}`}>{children}</main>
          </div>
        </div>

        <Toaster position="top-right" richColors />
        <Analytics />
      </ThemeProvider>
    </Provider>
  );
}

