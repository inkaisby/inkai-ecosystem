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
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    category: 'Kegiatan Umum'
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.events.getAll();
      setEvents(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus agenda');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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

  const filteredEvents = events.filter(event => {
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
        <button 
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          Buat Event Baru
        </button>
      </div>

      {/* Categories Toggle */}
      <div className="flex gap-4 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        <button 
          onClick={() => setFilter('Semua')}
          className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${filter === 'Semua' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          Semua Event
        </button>
        <button 
          onClick={() => setFilter('Kejuaraan')}
          className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${filter === 'Kejuaraan' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          Kejuaraan
        </button>
        <button 
          onClick={() => setFilter('Ujian Kenaikan')}
          className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${filter === 'Ujian Kenaikan' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          Ujian Kenaikan
        </button>
        <button 
          onClick={() => setFilter('Lain-lain')}
          className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${filter === 'Lain-lain' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          Lain-lain
        </button>
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
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => {
                  setSelectedEvent(event);
                  setShowDetailModal(true);
                }}
                className="glass-card flex items-center gap-6 group cursor-pointer hover:border-amber-500/30 transition-all"
              >
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

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDeleteEvent(event.id, e)}
                    className="p-2 bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Hapus Agenda"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="p-2 bg-white/5 rounded-lg hover:bg-amber-500 hover:text-black transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredEvents.length === 0 && (
              <div className="py-20 text-center text-gray-500 glass-card">
                Belum ada agenda kegiatan yang sesuai dengan filter.
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama event..." 
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button 
                onClick={() => setSearch('')}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
              >
                Reset Filter
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

      {/* Event Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-700 relative">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-2xl bg-[#1e1e24] p-1 border-4 border-[#1e1e24] shadow-xl">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center font-bold text-black text-3xl ${
                    selectedEvent.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500' : 
                    selectedEvent.title.toLowerCase().includes('ujian') ? 'bg-amber-500' : 'bg-green-500'
                  }`}>
                    {selectedEvent.title.toLowerCase().includes('kejurnas') ? <Trophy size={40} /> : 
                     selectedEvent.title.toLowerCase().includes('ujian') ? <GraduationCap size={40} /> : <Users size={40} />}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-1">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      selectedEvent.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                      selectedEvent.title.toLowerCase().includes('ujian') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                      {selectedEvent.title.toLowerCase().includes('kejurnas') ? 'Kejuaraan' : 
                       selectedEvent.title.toLowerCase().includes('ujian') ? 'Ujian Kenaikan' : 'Kegiatan Umum'}
                    </span>
                    <span className="text-gray-500 text-xs font-mono flex items-center gap-1">
                      <MapPin size={12} /> {selectedEvent.location || 'Indonesia'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3">Waktu Pelaksanaan</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="p-2 bg-white/5 rounded-lg"><Calendar size={16} className="text-amber-500" /></div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Tanggal Mulai</p>
                          <p className="text-sm font-medium">
                            {new Date(selectedEvent.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="p-2 bg-white/5 rounded-lg"><Calendar size={16} className="text-amber-500" /></div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Tanggal Selesai</p>
                          <p className="text-sm font-medium">
                            {new Date(selectedEvent.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3">Informasi Lainnya</p>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Pendaftar</p>
                        <p className="text-sm font-bold text-white">{selectedEvent._count?.registrations || 0} Anggota Terdaftar</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Deskripsi</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{selectedEvent.description || 'Tidak ada deskripsi tambahan.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-all text-gray-400"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    // Navigate to members page with event filter if possible, 
                    // or just navigate to a dedicated participants page (placeholder)
                    router.push(`/events/${selectedEvent.id}/participants`);
                  }}
                  className="flex-[2] py-3 rounded-xl bg-amber-500 text-black text-sm font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                >
                  Kelola Peserta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-lg p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold uppercase tracking-tight">Buat Agenda Baru</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                // Prepend keyword based on category choice to satisfy current filtering logic
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
              } catch (err: any) {
                toast.error(err.message || 'Gagal membuat agenda');
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Kategori Agenda</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    onInvalid={(e) => (e.target as HTMLSelectElement).setCustomValidity('Harap pilih kategori agenda')}
                    onInput={(e) => (e.target as HTMLSelectElement).setCustomValidity('')}
                    className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="Kegiatan Umum">Kegiatan Umum (Lain-lain)</option>
                    <option value="Kejuaraan">Kejuaraan / Turnamen</option>
                    <option value="Ujian Kenaikan">Ujian Kenaikan Tingkat</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Nama Event / Agenda</label>
                  <div className="relative">
                    <select 
                      required
                      onInvalid={(e) => (e.target as HTMLSelectElement).setCustomValidity('Harap pilih salah satu item dari daftar')}
                      onInput={(e) => (e.target as HTMLSelectElement).setCustomValidity('')}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
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
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Lokasi</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      required
                      onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Harap isi lokasi kegiatan')}
                      onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Gedung Olahraga, Kota..."
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Tanggal Mulai</label>
                    <input 
                      type="date" 
                      required
                      onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Harap isi tanggal mulai')}
                      onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Tanggal Selesai</label>
                    <input 
                      type="date" 
                      required
                      onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Harap isi tanggal selesai')}
                      onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Deskripsi Singkat</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan detail kegiatan..."
                    className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-all text-gray-400"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl bg-amber-500 text-black text-sm font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </form>
          </div>
        </div>
      )}

      {/* Elegant Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-300 border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/5">
              <Trash2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Hapus Agenda?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Semua data pendaftaran terkait juga akan dihapus.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setEventToDelete(null);
                }}
                className="flex-1 py-3 bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
