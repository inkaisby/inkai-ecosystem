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
  ChevronLeft,
  Trash2,
  Loader2,
  X,
  Clock
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-500">
              <Calendar size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Manajemen Agenda</span>
            </div>
            <h2 className="text-xl font-black uppercase text-white leading-tight">Event & Kegiatan</h2>
          </div>
        </div>
        
        <p className="text-[11px] text-gray-500 leading-relaxed">Kelola jadwal turnamen, ujian kenaikan tingkat, dan gashuku nasional.</p>
        
        <button 
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-amber-500/20"
        >
          <Plus size={20} />
          Buat Event Baru
        </button>
      </div>

      {/* Categories Toggle */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide no-scrollbar">
        {['Semua Event', 'Kejuaraan', 'Ujian Kenaikan', 'Lain-lain'].map((cat) => (
          <button 
            key={cat}
            onClick={() => setFilter(cat === 'Semua Event' ? 'Semua' : cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
              (filter === 'Semua' && cat === 'Semua Event') || filter === cat
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'bg-white/5 text-gray-500 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={48} />
          <p className="text-gray-500 text-sm">Memuat daftar event...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center modal-gradient rounded-3xl border border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h3 className="text-lg font-bold text-red-500 mb-2 uppercase">Gagal Memuat Data</h3>
          <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto mb-6 leading-relaxed">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => {
                  setSelectedEvent(event);
                  setShowDetailModal(true);
                }}
                className="modal-gradient p-5 rounded-2xl border border-white/5 flex gap-4 items-center group active:scale-[0.98] transition-all"
              >
                <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                  event.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500/10 text-blue-500' : 
                  event.title.toLowerCase().includes('ujian') ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {event.title.toLowerCase().includes('kejurnas') ? <Trophy size={24} /> : 
                   event.title.toLowerCase().includes('ujian') ? <GraduationCap size={24} /> : <Users size={24} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate mb-1">{event.title}</h3>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <Calendar size={12} /> 
                      {new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 truncate">
                      <MapPin size={12} /> {event.location || 'Indonesia'}
                    </span>
                  </div>
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
            <div className="modal-gradient p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Cari Agenda</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama event..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500/50 transition-all text-white"
                />
              </div>
              <button 
                onClick={() => setSearch('')}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl transition-all active:scale-95"
              >
                Reset Filter
              </button>
            </div>

            <div className="modal-gradient p-5 rounded-2xl border border-white/5 bg-amber-500/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Statistik Tahun Ini</h3>
              <div className="flex justify-between items-end">
                <span className="text-[11px] text-gray-500 uppercase font-bold">Total Event Aktif</span>
                <span className="text-3xl font-black text-white leading-none">{events.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-in slide-in-from-right duration-300">
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="h-48 bg-gradient-to-r from-amber-500 to-amber-700 relative">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-6 left-6 p-2.5 bg-black/40 text-white rounded-xl transition-all z-20 active:scale-90"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="absolute -bottom-10 left-6">
                <div className="w-24 h-24 rounded-2xl bg-[#1e1e24] p-1 border-4 border-[#0A0A0C] shadow-2xl">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center font-bold text-black ${
                    selectedEvent.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500' : 
                    selectedEvent.title.toLowerCase().includes('ujian') ? 'bg-amber-500' : 'bg-green-500'
                  }`}>
                    {selectedEvent.title.toLowerCase().includes('kejurnas') ? <Trophy size={40} /> : 
                     selectedEvent.title.toLowerCase().includes('ujian') ? <GraduationCap size={40} /> : <Users size={40} />}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-6 space-y-8">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2 leading-tight">{selectedEvent.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                    selectedEvent.title.toLowerCase().includes('kejurnas') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                    selectedEvent.title.toLowerCase().includes('ujian') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}>
                    {selectedEvent.title.toLowerCase().includes('kejurnas') ? 'Kejuaraan' : 
                     selectedEvent.title.toLowerCase().includes('ujian') ? 'Ujian Kenaikan' : 'Kegiatan Umum'}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-gray-400">
                    <MapPin size={12} className="text-amber-500" />
                    <span className="uppercase tracking-widest">{selectedEvent.location || 'Indonesia'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-500 mb-4">
                    <Calendar size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Waktu Pelaksanaan</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="modal-gradient p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-black">Tanggal Mulai</p>
                          <p className="text-sm font-bold text-white">
                            {new Date(selectedEvent.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="modal-gradient p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-black">Tanggal Selesai</p>
                          <p className="text-sm font-bold text-white">
                            {new Date(selectedEvent.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-amber-500 mb-4">
                    <Users size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Informasi Peserta</h4>
                  </div>
                  <div className="modal-gradient p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Pendaftar Saat Ini</span>
                      <span className="text-2xl font-black text-amber-500">{selectedEvent._count?.registrations || 0}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">Deskripsi Agenda</p>
                      <p className="text-xs text-gray-300 leading-relaxed italic">
                        "{selectedEvent.description || 'Tidak ada deskripsi tambahan untuk agenda ini.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C] to-transparent pt-12">
            <button 
              onClick={() => {
                setShowDetailModal(false);
                router.push(`/events/${selectedEvent.id}/participants`);
              }}
              className="w-full py-4 rounded-2xl bg-amber-500 text-black text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              Kelola Peserta
            </button>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-in fade-in duration-300">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-in fade-in duration-300">
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
