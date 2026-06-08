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
  BookOpen,
  Projector
} from 'lucide-react';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', slug: 'dashboard' },
  { icon: Users, label: 'Anggota', href: '/members', slug: 'members' },
  { icon: Map, label: 'Organisasi', href: '/organization', slug: 'organization' },
  { icon: ShieldCheck, label: 'Antrean Kerja', href: '/verification', slug: 'verification' },
  { icon: Calendar, label: 'Event', href: '/events', slug: 'events' },
  { icon: Store, label: 'Store', href: '#', slug: 'store' },
  { icon: BookOpen, label: 'Library', href: '#', slug: 'library' },
  { icon: MessageSquare, label: 'Broadcast', href: '/broadcast', slug: 'broadcast' },
  { icon: Settings, label: 'Settings', href: '/settings', slug: 'settings' },
  { icon: Projector, label: 'Presentasi', href: '/presentasi', slug: 'presentation' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return true; // Show all until user is loaded
    // If no permissions array, default to all for now (backward compatibility)
    if (!user.permissions) return true;
    if (item.slug === 'presentation') return true;
    return user.permissions.includes(item.slug);
  });

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
        {filteredMenuItems.map((item) => {
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
        <button 
          onClick={handleLogout}
          className="sidebar-item w-full text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
