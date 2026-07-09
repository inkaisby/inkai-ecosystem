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
  ChevronDown,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

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
  const [events, setEvents] = React.useState<any[]>([]);
  const [eventsExpanded, setEventsExpanded] = React.useState(true);
  const { logout } = useAuth();

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch events for sub-menu
    api.events.getAll()
      .then((res: any) => {
        let rawEvents: any[] = [];
        if (res && res.status === 'success' && Array.isArray(res.data)) {
          rawEvents = res.data;
        } else if (Array.isArray(res)) {
          rawEvents = res;
        }

        // Sort events by startDate (descending to show latest/upcoming first) and slice to top 5
        const sortedAndFiltered = [...rawEvents]
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .slice(0, 5);

        setEvents(sortedAndFiltered);
      })
      .catch((err) => console.error('Failed to load events in Sidebar', err));
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
        <div className="sidebar-logo-icon flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Logo INKAI" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
        </div>
        <div className="sidebar-logo-text">
          <h1>INKAI</h1>
          <p>Admin Portal</p>
        </div>
      </div>

      <nav className="sidebar-nav flex-1 overflow-y-auto pr-1">
        {filteredMenuItems.map((item) => {
          if (item.href === '#') return null; // skip inactive menu entries if any
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href) && !pathname?.includes('/participants'));
          
          if (item.slug === 'events') {
            return (
              <div key={item.label} className="flex flex-col">
                <div 
                  className={`sidebar-item flex items-center justify-between cursor-pointer ${isActive ? 'active' : ''}`}
                  onClick={() => setEventsExpanded(!eventsExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {eventsExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </div>

                {eventsExpanded && events.length > 0 && (
                  <div className="pl-6 ml-3 border-l border-white/10 flex flex-col gap-1 mt-1 mb-2">
                    <Link 
                      href="/admin/events"
                      className={`text-[11px] py-1.5 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all ${pathname === '/admin/events' ? 'text-amber-500 font-bold bg-amber-500/10' : ''}`}
                    >
                      Semua Event ({events.length})
                    </Link>
                    {events.map((evt) => {
                      const participantPath = `/admin/events/${evt.id}/participants`;
                      const isSubActive = pathname === participantPath;
                      return (
                        <Link
                          key={evt.id}
                          href={participantPath}
                          className={`text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-2 truncate text-gray-400 hover:text-white hover:bg-white/5 transition-all ${
                            isSubActive ? 'text-amber-500 font-bold bg-amber-500/10' : ''
                          }`}
                          title={`Pendaftar ${evt.title}`}
                        >
                          <UserCheck size={12} className="shrink-0" />
                          <span className="truncate">{evt.title.replace('KEJURNAS: ', '').replace('UJIAN: ', '')}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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

