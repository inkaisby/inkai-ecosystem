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
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', slug: 'dashboard' },
  { icon: Users, label: 'Anggota', href: '/admin/members', slug: 'members' },
  { icon: Map, label: 'Organisasi', href: '/admin/organization', slug: 'organization' },
  { icon: ShieldCheck, label: 'Verifikasi', href: '/admin/verification', slug: 'verification' },
  { icon: Calendar, label: 'Event', href: '/admin/events', slug: 'events' },
  { icon: Store, label: 'Store', href: '#', slug: 'store' },
  { icon: BookOpen, label: 'Library', href: '#', slug: 'library' },
  { icon: MessageSquare, label: 'Broadcast', href: '/admin/broadcast', slug: 'broadcast' },
  { icon: Settings, label: 'Settings', href: '/admin/settings', slug: 'settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const { logout } = useAuth();

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return true; // Show all until user is loaded
    // If no permissions array, default to all for now (backward compatibility)
    if (!user.permissions) return true;
    return user.permissions.includes(item.slug);
  });

  return (
    <aside className="sidebar-aside flex flex-col">
      <div className="sidebar-logo flex items-center">
        <div className="sidebar-logo-icon flex items-center justify-center">
          I
        </div>
        <div className="sidebar-logo-text">
          <h1>INKAI</h1>
          <p>Admin Portal</p>
        </div>
      </div>

      <nav className="sidebar-nav flex-1">
        {filteredMenuItems.map((item) => {
          if (item.href === '#') return null; // skip inactive menu entries if any
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={handleLogout}
          className="sidebar-item logout-btn flex items-center w-full"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
