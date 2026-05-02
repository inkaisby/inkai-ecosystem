'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Trophy, 
  GraduationCap, 
  Users,
  MapPin,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.events.getAll();
        setEvents(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Calendar size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Manajemen Agenda</span>
          </div>
          <h2 className="text-3xl font-bold">Event & Kegiatan</h2>
          <p className="text-gray-500 mt-1">Kelola jadwal turnamen, ujian kenaikan tingkat, dan gashuku nasional.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={18} />
          Buat Event Baru
        </button>
      </div>

      {/* Categories Toggle */}
      <div className="flex gap-4 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        <button className="px-6 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all">Semua Event</button>
        <button className="px-6 py-2 text-gray-500 hover:text-white text-xs font-bold rounded-xl transition-all">Kejuaraan</button>
        <button className="px-6 py-2 text-gray-500 hover:text-white text-xs font-bold rounded-xl transition-all">Ujian Kenaikan</button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={48} />
          <p className="text-gray-500 text-sm">Memuat daftar event...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 glass-card">
          Error: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {events.map((event) => (
              <div key={event.id} className="glass-card flex items-center gap-6 group cursor-pointer hover:border-amber-500/30 transition-all">
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border border-white/5 ${
                  event.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500/10 text-blue-500' : 
                  event.title.toLowerCase().includes('ujian') ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {event.title.toLowerCase().includes('kejurnas') ? <Trophy size={28} /> : 
                   event.title.toLowerCase().includes('ujian') ? <GraduationCap size={28} /> : <Users size={28} />}
                  <span className="text-[8px] font-bold uppercase mt-2">
                    {event.title.toLowerCase().includes('kejurnas') ? 'Turnamen' : 
                     event.title.toLowerCase().includes('ujian') ? 'Ujian' : 'Kegiatan'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold group-hover:text-amber-500 transition-colors">{event.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-500/10 text-green-500`}>
                      Buka
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} /> 
                      {new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {event.location || 'Indonesia'}</span>
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <Users size={14} /> {event._count?.registrations || 0} Terdaftar
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="p-2 bg-white/5 rounded-lg hover:bg-amber-500 hover:text-black transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="py-20 text-center text-gray-500 glass-card">
                Belum ada agenda kegiatan yang terdaftar.
              </div>
            )}
          </div>

          {/* Quick Stats & Filters */}
          <div className="space-y-6">
            <div className="glass-card">
              <h3 className="font-bold mb-4">Cari Agenda</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Nama event..." 
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                Terapkan Filter
              </button>
            </div>

            <div className="glass-card bg-amber-500/5 border-amber-500/20">
              <h3 className="font-bold text-amber-500 mb-2">Statistik Tahun Ini</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Total Event Aktif</span>
                  <span className="text-lg font-bold text-white">{events.length}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-amber-500 h-full w-1/4 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
