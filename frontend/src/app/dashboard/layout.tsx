"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex bg-paper min-h-screen">
      <Sidebar />
      <main className="flex-1 px-10 py-8 max-w-6xl">{children}</main>
    </div>
  );
}