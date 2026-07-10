"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import TopBar from "@/components/admin/TopBar";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useAuth } from "@/context/AuthContext";

import Sidebar from "@/components/admin/Sidebar";

const ADMIN_LOGIN = "/admin/login";

function normalizePathname(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();

  const normalized = normalizePathname(pathname ?? "/admin");
  const isLoginRoute = normalized === ADMIN_LOGIN;

  useEffect(() => {
    if (isLoginRoute) {
      if (!isAuthLoading && user && isAdmin) {
        router.replace("/admin");
      }
      return;
    }
    if (!isAuthLoading && !user) {
      router.replace(ADMIN_LOGIN);
      return;
    }
    if (!isAuthLoading && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isLoginRoute, isAuthLoading, user, isAdmin, router]);

  const shellClass =
    "min-h-screen bg-[var(--background-dark)] text-[var(--text-light)] flex flex-col min-w-0 w-full";

  if (isLoginRoute) {
    return (
      <div data-admin-shell className={shellClass}>
        <main className="relative min-w-0 flex-1 flex flex-col p-0 w-full">
          {children}
        </main>
      </div>
    );
  }

  if (isAuthLoading || !user || !isAdmin) {
    return (
      <div
        data-admin-shell
        className={`${shellClass} items-center justify-center`}
      >
        <Loader2
          className="animate-spin text-amber-500"
          size={40}
          aria-label="Memuat…"
        />
      </div>
    );
  }

  return (
    <div data-admin-shell className={shellClass}>
      <div className="flex w-full min-h-screen">
        {/* Sidebar on desktop/tablet */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Content Panel */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64 w-full">
          <div className="admin-topbar-spacer" aria-hidden />
          <TopBar />
          <main className="relative min-w-0 flex-1 flex flex-col px-4 md:px-8 pt-4 pb-32 lg:pb-8 max-w-[1600px] mx-auto w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Nav on mobile/tablet */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
