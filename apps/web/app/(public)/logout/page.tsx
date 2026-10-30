"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    logout().finally(() => {
      router.replace("/");
    });
  }, [logout, router]);

  return (
    <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-400 text-sm">Signing you out securely...</p>
    </div>
  );
}
