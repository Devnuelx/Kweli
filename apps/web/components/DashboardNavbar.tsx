"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Shield,
  BarChart3,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Camera,
  Building,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DashboardNavbarProps {
  children: React.ReactNode;
}

export default function DashboardNavbar({ children }: DashboardNavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Scan Product", href: "/scan", icon: Camera },
    { name: "Products & Batches", href: "/dashboard/products", icon: Package },
    { name: "Settings & API Keys", href: "/dashboard/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const orgName =
    user?.memberships?.[0]?.organization?.tradingName ||
    user?.memberships?.[0]?.organization?.legalName ||
    "Brand Workspace";

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-[#070913] text-white">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#0a0e27] border-r border-white/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">Kweli</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Organization</p>
                <p className="text-sm font-semibold truncate text-white">{orgName}</p>
              </div>

              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center space-x-3 mb-4 px-2">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate text-white">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-[#0a0e27] lg:border-r lg:border-white/10 lg:p-6 lg:flex lg:flex-col lg:justify-between z-30">
        <div>
          <Link href="/" className="flex items-center space-x-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Kweli</span>
          </Link>

          <div className="mb-6 px-3 py-2.5 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Building className="w-3 h-3 text-blue-400" />
              Workspace
            </p>
            <p className="text-sm font-semibold truncate text-white mt-0.5">{orgName}</p>
          </div>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-white">
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#070913]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block text-sm text-gray-400">
            {orgName} • <span className="text-green-400 font-medium">Pilot Active</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white text-xs flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </Button>
            </Link>
            <Link href="/scan">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                Open Scanner
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
