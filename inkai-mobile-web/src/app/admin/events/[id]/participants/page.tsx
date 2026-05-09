'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft, 
  Search, 
  Download, 
  UserCheck,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EventParticipantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  useEffect(() => {
    // This is a placeholder logic. 
    // You might need a specific API endpoint to get participants for an event.
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        // Assuming we can get event details which includes registrations
        // Or we might need a dedicated api.events.getParticipants(id)
        const response = await api.events.getDetail(id as string);
        if (response.status === 'success' && response.data.registrations) {
          setParticipants(response.data.registrations);
        }
      } catch (err: any) {
        toast.error('Gagal memuat daftar peserta');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [id]);

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.member?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.member?.nia?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show participants with an assigned category
    return matchesSearch && p.categoryId != null;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-sm">Kembali</span>
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all text-gray-400">
          <Download size={16} />
          Export Excel
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 text-amber-500 mb-2">
          <Users size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Manajemen Peserta</span>
        </div>
        <h2 className="text-3xl font-bold uppercase">Daftar Peserta Event</h2>
        <p className="text-gray-500 mt-1">Kelola data pendaftaran, verifikasi pembayaran, dan status kehadiran peserta.</p>
      </div>

      <div className="glass-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIA..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[10px] font-black uppercase text-amber-500 leading-none mb-1">Total Peserta</p>
              <p className="text-xl font-bold leading-none">
                {participants.filter(p => p.categoryId != null).length}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={48} />
            <p className="text-gray-500 text-sm">Memuat data peserta...</p>
          </div>
        ) : filteredParticipants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-4 pl-2">Peserta</th>
                  <th className="pb-4">Asal Dojo / Cabang</th>
                  <th className="pb-4">Kategori / Sabuk</th>
                  <th className="pb-4">Tgl Daftar</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredParticipants.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedParticipant(p)}
                    className="hover:bg-white/[0.04] cursor-pointer transition-all group"
                  >
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-amber-500/20 transition-all font-bold text-amber-500 uppercase">
                          {p.member?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{p.member?.fullName || 'Anonim'}</p>
                          <p className="text-[10px] text-gray-500">{p.member?.nia || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-white text-xs font-bold">{p.member?.dojo?.name || 'Pusat'}</p>
                      <p className="text-[10px] text-gray-500">{p.member?.dojo?.branch?.name || '-'}</p>
                    </td>
                    <td className="py-4">
                      <div className="px-2 py-1 bg-white/5 rounded-lg inline-block">
                        <p className="text-amber-500 text-[10px] font-black uppercase leading-none mb-1">
                          {p.category ? 'Kategori UKT' : 'Umum'}
                        </p>
                        <p className="text-white text-xs font-bold leading-none">
                          {p.category?.name || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${
                        p.status === 'APPROVED' || p.status === 'SUCCESS' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : p.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {p.status === 'APPROVED' || p.status === 'SUCCESS' ? 'Terverifikasi' : p.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                        <UserCheck size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            Belum ada peserta yang mendaftar untuk event ini.
          </div>
        )}
      </div>

      {/* Participant Detail Drawer */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedParticipant(null)}
          />
          <div className="relative w-full max-w-md bg-[#0A0A0B] border-l border-white/10 h-full overflow-y-auto animate-in slide-in-from-right duration-500 shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-amber-500">
                  <Users size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Detail Peserta</span>
                </div>
                <button 
                  onClick={() => setSelectedParticipant(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
                >
                  <ArrowLeft size={20} className="rotate-180" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-3xl font-black text-amber-500 mb-4 uppercase">
                  {selectedParticipant.member?.fullName?.charAt(0)}
                </div>
                <h3 className="text-2xl font-bold uppercase">{selectedParticipant.member?.fullName}</h3>
                <p className="text-amber-500 font-bold tracking-widest text-xs mt-1">{selectedParticipant.member?.nia || 'TANPA NIA'}</p>
              </div>

              <div className="space-y-6">
                <div className="glass-card !bg-white/5 border-none p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-3 tracking-widest">Informasi Pendaftaran</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Kategori / Sabuk</span>
                      <span className="text-xs font-bold text-white">{selectedParticipant.category?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Biaya Pendaftaran</span>
                      <span className="text-xs font-bold text-amber-500">
                        Rp {selectedParticipant.category?.fee?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Tanggal Daftar</span>
                      <span className="text-xs font-bold text-white">
                        {new Date(selectedParticipant.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Status</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border uppercase ${
                        selectedParticipant.status === 'APPROVED' || selectedParticipant.status === 'SUCCESS' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {selectedParticipant.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card !bg-white/5 border-none p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-3 tracking-widest">Organisasi</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Dojo</span>
                      <span className="text-xs font-bold text-white">{selectedParticipant.member?.dojo?.name || 'Pusat'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Pengcab (Cabang)</span>
                      <span className="text-xs font-bold text-white">{selectedParticipant.member?.dojo?.branch?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Pengprov (Provinsi)</span>
                      <span className="text-xs font-bold text-white">{selectedParticipant.member?.dojo?.branch?.province?.name || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20">
                    Verifikasi Pembayaran
                  </button>
                  <button className="w-full py-4 mt-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all">
                    Hubungi Anggota
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
