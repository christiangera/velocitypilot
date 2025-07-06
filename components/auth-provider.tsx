"use client"

import type React from "react"
import { SidebarProvider, SidebarInset, Sidebar } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar" // Renamed import
import { useAuth } from "@/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { TopBar } from "@/components/top-bar" // Import TopBar here

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  console.log("🏠 AuthProvider state:", {
    hasSession: !!session,
    loading,
    pathname,
    sessionData: session,
  })

  useEffect(() => {
    console.log("🔄 Auth effect triggered:", { loading, session: !!session, pathname })

    // If not loading, and no session, and not on the login page, redirect to login
    if (!loading && !session && pathname !== "/login") {
      console.log("🚀 Redirecting to login...")
      router.push("/login")
    }
  }, [session, loading, pathname, router])

  if (loading) {
    console.log("⏳ Showing loading state...")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // If there's no session and we are not on the login page, show loading while redirect happens
  if (!session && pathname !== "/login") {
    console.log("🔄 No session, not on login page - should redirect...")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // If we are on the login page, always render its children (the login form)
  if (pathname === "/login") {
    console.log("📝 Rendering login page...")
    return <div>{children}</div>
  }

  // If we have a session and are not on the login page, render the authenticated layout
  console.log("✅ Rendering authenticated layout...")
  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardSidebar />
      </Sidebar>
      <SidebarInset>
        <TopBar />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
