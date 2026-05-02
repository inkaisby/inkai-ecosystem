'use client';

import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useEffect } from 'react';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-[#0a0a0c] p-8">
        {children}
      </main>
    </div>
  );
}
