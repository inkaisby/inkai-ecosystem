'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminMenu from '@/components/admin/AdminMenu';
import TopBar from '@/components/admin/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white overflow-x-hidden flex flex-col">
      {!isLoginPage && <TopBar />}
      <main className={`flex-1 flex flex-col ${isLoginPage ? 'p-0' : 'px-5 pt-4 pb-32'}`}>
        {children}
      </main>
      {!isLoginPage && <BottomNav />}
    </div>
  );
}
