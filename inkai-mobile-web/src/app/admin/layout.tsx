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
    <div
      data-admin-shell
      className="min-h-screen bg-[var(--background-dark)] text-[var(--text-light)] flex flex-col min-w-0"
    >
      {!isLoginPage && (
        <>
          <div className="admin-topbar-spacer" aria-hidden />
          <TopBar />
        </>
      )}
      <main className={`relative min-w-0 flex-1 flex flex-col ${isLoginPage ? 'p-0' : 'px-0 pt-4 pb-32'}`}>
        {children}
      </main>
      {!isLoginPage && <BottomNav />}
    </div>
  );
}
