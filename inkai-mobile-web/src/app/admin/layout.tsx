'use client';

import React from 'react';
import AdminMenu from '@/components/admin/AdminMenu';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white overflow-x-hidden">
      <main className="flex-1 px-5 pt-8 pb-32">
        {children}
      </main>
      <AdminMenu />
    </div>
  );
}
