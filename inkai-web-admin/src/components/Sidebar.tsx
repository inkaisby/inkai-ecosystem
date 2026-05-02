'use client';
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  ShieldCheck,
  Store,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Anggota', href: '/members' },
  { icon: Map, label: 'Organisasi', href: '/organization' },
  { icon: ShieldCheck, label: 'Verifikasi', href: '/verification' },
  { icon: Calendar, label: 'Event', href: '/events' },
  { icon: Store, label: 'Store', href: '#' },
  { icon: BookOpen, label: 'Library', href: '#' },
  { icon: MessageSquare, label: 'Broadcast', href: '/broadcast' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[#0f0f12] border-r border-white/5 flex flex-col p-4 fixed left-0 top-0">
      <div className="flex items-center gap-3 px-4 py-8">
        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-xl">
          I
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none">INKAI</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/5">
        <button className="sidebar-item w-full text-red-500 hover:bg-red-500/10">
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
