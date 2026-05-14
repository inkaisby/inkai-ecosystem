'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  Plus, 
  Search, 
  Trophy, 
  GraduationCap, 
  Users,
  MapPin,
  ChevronRight,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  _count?: {
    registrations: number;
  };
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    category: 'Kegiatan Umum'
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.events.getAll();
      setEvents(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEventToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    setIsSubmitting(true);
    try {
      await api.events.delete(eventToDelete);
      toast.success('Agenda berhasil dihapus');
      fetchEvents();
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus agenda';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      category: 'Kegiatan Umum'
    });
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const isKejuaraan = event.title.toLowerCase().includes('kejurnas');
      const isUjian = event.title.toLowerCase().includes('ujian');
      const isOthers = !isKejuaraan && !isUjian;

      const matchesFilter = filter === 'Semua' || 
        (filter === 'Kejuaraan' && isKejuaraan) ||
        (filter === 'Ujian Kenaikan' && isUjian) ||
        (filter === 'Lain-lain' && isOthers);
      
      const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(search.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [events, filter, search]);

  return (
    <div className="w-full max-w-[480px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
      {/* Header — kolom tetap sempit seperti mobile; tidak memanjang ikut lebar jendela */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Calendar size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Manajemen Agenda</span>
          </div>
          <h2 className="text-2xl font-black uppercase text-white leading-tight">Event & Kegiatan</h2>
          <p className="text-[11px] text-gray-500">Kelola jadwal turnamen, ujian kenaikan tingkat, dan gashuku nasional.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-3"
        >
          <Plus size={18} />
          Buat Event Baru
        </button>
      </div>

      {/* Categories Toggle */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide no-scrollbar">
        {['Semua Event', 'Kejuaraan', 'Ujian Kenaikan', 'Lain-lain'].map((cat) => (
          <button 
            key={cat}
            onClick={() => setFilter(cat === 'Semua Event' ? 'Semua' : cat)}
            className={`whitespace-nowrap px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95 ${
              (filter === 'Semua' && cat === 'Semua Event') || filter === cat 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'bg-white/5 text-gray-500 border border-white/5 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={40} />
          <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Memuat daftar event...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 glass-card border-red-500/20">
          <p className="font-bold">Error: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => {
                  setSelectedEvent(event);
                  setShowDetailModal(true);
                }}
                className="glass-card flex flex-col gap-4 group cursor-pointer hover:border-amber-500/30 transition-all p-4"
              >
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border border-white/5 shrink-0 ${
                  event.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500/10 text-blue-500' : 
                  event.title.toLowerCase().includes('ujian') ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {event.title.toLowerCase().includes('kejurnas') ? <Trophy size={24} /> : 
                   event.title.toLowerCase().includes('ujian') ? <GraduationCap size={24} /> : <Users size={24} />}
                  <span className="text-[7px] font-black uppercase mt-1">
                    {event.title.toLowerCase().includes('kejurnas') ? 'Turnamen' : 
                     event.title.toLowerCase().includes('ujian') ? 'Ujian' : 'Kegiatan'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black uppercase group-hover:text-amber-500 transition-colors truncate">{event.title}</h3>
                    <span className="shrink-0 text-[8px] px-2 py-0.5 rounded-full font-black uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                      Buka
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={12} className="text-amber-500" /> 
                      {new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium truncate max-w-[150px]">
                      <MapPin size={12} className="text-amber-500" /> 
                      {event.location || 'Indonesia'}
                    </span>
                    <span className="flex items-center gap-1.5 font-black text-white">
                      <Users size={12} className="text-amber-500" /> 
                      {event._count?.registrations || 0} Terdaftar
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full mt-2 pt-3 border-t border-white/5">
                  <button 
                    onClick={(e) => handleDeleteEvent(event.id, e)}
                    className="flex-1 p-2.5 bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-white/5"
                    title="Hapus Agenda"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="flex-1 p-2.5 bg-white/5 rounded-xl hover:bg-amber-500 hover:text-black transition-all border border-white/5">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredEvents.length === 0 && (
              <div className="py-20 text-center text-gray-500 glass-card">
                <p className="text-xs font-bold uppercase tracking-widest">Belum ada agenda kegiatan.</p>
              </div>
            )}
          </div>

          {/* Quick Stats & Filters */}
          <div className="space-y-6">
            <div className="glass-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Cari Agenda</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama event..." 
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 text-white placeholder:text-gray-600"
                />
              </div>
              <button 
                onClick={() => setSearch('')}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-gray-400"
              >
                Reset Filter
              </button>
            </div>

            <div className="glass-card bg-amber-500/5 border-amber-500/20 relative overflow-hidden">
              <div className="absolute -left-4 -bottom-4 opacity-[0.1] text-white -rotate-12">
                <Trophy size={100} />
              </div>
              <div className="relative z-10 flex flex-col items-end text-right">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4">Statistik Tahun Ini</h3>
                <div className="space-y-2 w-full flex flex-col items-end">
                  <span className="text-4xl font-black text-white">{events.length}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Event Aktif</span>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                    <div className="bg-amber-500 h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000" style={{ width: `${Math.min((events.length / 10) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal — portal: avoid stacking under sticky TopBar (flex sibling z-40) */}
      {showDetailModal && selectedEvent &&
        createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden">
          <div className="flex-1 flex flex-col w-full max-w-[480px] h-full lg:h-auto lg:max-h-[90vh] mx-auto relative bg-[#0A0A0C] lg:rounded-[2.5rem] lg:border lg:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-48 lg:h-64 bg-gradient-to-br from-amber-400/20 via-amber-600/20 to-[#0A0A0C] relative flex items-center justify-center overflow-hidden border-b border-white/5">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-6 right-6 p-3 bg-black/40 hover:bg-black/60 text-white rounded-2xl backdrop-blur-md transition-all z-20 border border-white/10"
              >
                <X size={20} />
              </button>
              
              {/* Background Watermark */}
              <div className="absolute -right-12 -bottom-12 opacity-[0.03] rotate-12 text-white pointer-events-none">
                {selectedEvent.title.toLowerCase().includes('kejurnas') ? <Trophy size={280} /> : 
                 selectedEvent.title.toLowerCase().includes('ujian') ? <GraduationCap size={280} /> : <Users size={280} />}
              </div>

              <div className="relative z-10 text-center px-8">
                <div className={`w-20 h-20 rounded-[1.75rem] mx-auto mb-4 flex items-center justify-center shadow-2xl ${
                  selectedEvent.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500 text-white' : 
                  selectedEvent.title.toLowerCase().includes('ujian') ? 'bg-amber-500 text-black' : 'bg-green-500 text-white'
                }`}>
                  {selectedEvent.title.toLowerCase().includes('kejurnas') ? <Trophy size={32} /> : 
                   selectedEvent.title.toLowerCase().includes('ujian') ? <GraduationCap size={32} /> : <Users size={32} />}
                </div>
                <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-white leading-tight">{selectedEvent.title}</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${
                  selectedEvent.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                  selectedEvent.title.toLowerCase().includes('ujian') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                }`}>
                  {selectedEvent.title.toLowerCase().includes('kejurnas') ? 'Kejuaraan' : 
                   selectedEvent.title.toLowerCase().includes('ujian') ? 'Ujian Kenaikan' : 'Kegiatan Umum'}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold text-gray-400">
                  <MapPin size={10} className="text-amber-500" />
                  <span className="uppercase tracking-widest truncate max-w-[180px]">{selectedEvent.location || 'Indonesia'}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Calendar size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Waktu Pelaksanaan</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Mulai</p>
                      <p className="text-[11px] font-bold text-white">
                        {new Date(selectedEvent.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Selesai</p>
                      <p className="text-[11px] font-bold text-white">
                        {new Date(selectedEvent.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Users size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Informasi Peserta</h4>
                  </div>
                  <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Pendaftar Saat Ini</span>
                      <span className="text-2xl font-black text-amber-500">{selectedEvent._count?.registrations || 0}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">Deskripsi Agenda</p>
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                        &quot;{selectedEvent.description || 'Tidak ada deskripsi tambahan.'}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#0A0A0C] border-t border-white/5 mt-auto pb-[env(safe-area-inset-bottom,24px)] flex gap-3">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-4 rounded-2xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-all text-gray-400 uppercase tracking-widest"
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  router.push(`/events/${selectedEvent.id}/participants`);
                }}
                className="flex-[2] py-4 rounded-2xl bg-amber-500 text-black text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                Kelola Peserta
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Add Event Modal */}
      {showAddModal &&
        createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden">
          <div className="flex-1 flex flex-col w-full max-w-[480px] h-full lg:h-auto lg:max-h-[90vh] mx-auto relative bg-[#0A0A0C] lg:rounded-[2.5rem] lg:border lg:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 pt-[env(safe-area-inset-top,24px)] bg-[#0A0A0C]">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none mb-1">Buat Agenda</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lengkapi detail informasi</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-3 bg-white/5 text-gray-400 hover:text-white rounded-2xl border border-white/10 active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="addEventForm" onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  let finalTitle = formData.title;
                  if (formData.category === 'Kejuaraan' && !finalTitle.toLowerCase().includes('kejurnas')) {
                    finalTitle = `KEJURNAS: ${finalTitle}`;
                  } else if (formData.category === 'Ujian Kenaikan' && !finalTitle.toLowerCase().includes('ujian')) {
                    finalTitle = `UJIAN: ${finalTitle}`;
                  }

                  await api.events.create({
                    ...formData,
                    title: finalTitle,
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: new Date(formData.endDate).toISOString(),
                  });
                  toast.success('Agenda berhasil dibuat!');
                  setShowAddModal(false);
                  resetForm();
                  fetchEvents();
                } catch (err: unknown) {
                  const errorMessage = err instanceof Error ? err.message : 'Gagal membuat agenda';
                  toast.error(errorMessage);
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">Kategori Agenda</label>
                    <div className="relative">
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer text-white shadow-inner"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="Kegiatan Umum">Kegiatan Umum (Lain-lain)</option>
                        <option value="Kejuaraan">Kejuaraan / Turnamen</option>
                        <option value="Ujian Kenaikan">Ujian Kenaikan Tingkat</option>
                      </select>
                      <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">Nama Event / Agenda</label>
                    <div className="relative">
                      <select 
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer text-white shadow-inner"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Pilih salah satu item di daftar...</option>
                        {formData.category === 'Kejuaraan' && (
                          <>
                            <option value="KEJURNAS INKAI">KEJURNAS INKAI</option>
                            <option value="KEJURDA INKAI">KEJURDA INKAI</option>
                            <option value="OPEN TOURNAMENT">OPEN TOURNAMENT</option>
                            <option value="PIALA GUBERNUR">PIALA GUBERNUR</option>
                            <option value="PIALA WALIKOTA">PIALA WALIKOTA</option>
                          </>
                        )}
                        {formData.category === 'Ujian Kenaikan' && (
                          <>
                            <option value="UJIAN KENAIKAN TINGKAT (UKT)">UJIAN KENAIKAN TINGKAT (UKT)</option>
                            <option value="GASHUKU & UKT NASIONAL">GASHUKU & UKT NASIONAL</option>
                            <option value="UJIAN DAN (SABUK HITAM)">UJIAN DAN (SABUK HITAM)</option>
                          </>
                        )}
                        {formData.category === 'Kegiatan Umum' && (
                          <>
                            <option value="LATIHAN BERSAMA (GASHUKU)">LATIHAN BERSAMA (GASHUKU)</option>
                            <option value="RAPAT KERJA (RAKER)">RAPAT KERJA (RAKER)</option>
                            <option value="PELATIHAN PELATIH / WASIT">PELATIHAN PELATIH / WASIT</option>
                            <option value="KEGIATAN SOSIAL">KEGIATAN SOSIAL</option>
                          </>
                        )}
                      </select>
                      <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">Lokasi</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="text" 
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Gedung Olahraga, Kota..."
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-white placeholder:text-gray-600 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">Mulai</label>
                      <input 
                        type="date" 
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-white shadow-inner"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">Selesai</label>
                      <input 
                        type="date" 
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-white shadow-inner"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">Deskripsi Singkat</label>
                    <textarea 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Jelaskan detail kegiatan..."
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all resize-none text-white placeholder:text-gray-600 shadow-inner"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 bg-[#0A0A0C] border-t border-white/5 mt-auto pb-[env(safe-area-inset-bottom,24px)] flex gap-3">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 rounded-2xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-all text-gray-400 uppercase tracking-widest"
              >
                Batal
              </button>
              <button 
                form="addEventForm"
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-4 rounded-2xl bg-amber-500 text-black text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Simpan Agenda'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Elegant Delete Confirmation Modal */}
      {showDeleteModal &&
        createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-[360px] p-8 text-center rounded-[2.5rem] border border-white/10 shadow-2xl bg-[#1e1e24] relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
            
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/10 border border-red-500/20">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Hapus Agenda?</h3>
            <p className="text-gray-400 text-xs mb-8 leading-relaxed font-medium">
              Tindakan ini <span className="text-red-400 font-bold">permanen</span>. Semua data pendaftaran terkait akan ikut terhapus.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="w-full py-4 bg-red-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setEventToDelete(null);
                }}
                className="w-full py-4 bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-[0.2em] rounded-2xl border border-white/5 active:scale-95 transition-all"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
