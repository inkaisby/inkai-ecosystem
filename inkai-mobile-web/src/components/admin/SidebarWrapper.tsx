'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage =
    pathname === '/admin/login' || pathname?.endsWith('/admin/login');

  useEffect(() => {
    const token = localStorage.getItem('inkai_token') || localStorage.getItem('token');
    if (!token && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen bg-[#0a0a0c]">
        <TopBar />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
