'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Users, 
  ChevronLeft, 
  Search, 
  Download, 
  UserCheck,
  Loader2,
  Filter,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Phone,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EventParticipantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.events.getDetail(id as string);
      if (response.status === 'success') {
        setEvent(response.data);
        setParticipants(response.data.registrations || []);
        
        // Update selected participant if it was open
        if (selectedParticipant) {
          const updated = response.data.registrations.find((p: any) => p.id === selectedParticipant.id);
          if (updated) setSelectedParticipant(updated);
        }
      }
    } catch (err: any) {
      toast.error('Gagal memuat daftar peserta');
    } finally {
      setLoading(false);
    }
  }, [id, selectedParticipant]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleVerifyPayment = async () => {
    if (!selectedParticipant) return;
    
    // Find the billing for this registration
    const billing = selectedParticipant.member?.billings?.find((b: any) => b.registrationId === selectedParticipant.id);
    
    if (!billing) {
      toast.error('Data tagihan tidak ditemukan');
      return;
    }

    if (billing.status === 'PAID') {
      toast.error('Pembayaran sudah terverifikasi');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.billing.verify({ billingId: billing.id });
      if (res.status === 'success') {
        toast.success('Pembayaran berhasil diverifikasi');
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi pembayaran');
    } finally {
      setVerifying(false);
    }
  };

  const handleWhatsApp = () => {
    if (!selectedParticipant?.member?.phoneNumber) {
      toast.error('Nomor WhatsApp tidak tersedia');
      return;
    }
    let phone = selectedParticipant.member.phoneNumber;
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleChat = async () => {
    if (!selectedParticipant?.member?.userId) {
      toast.error('Pengguna tidak memiliki akun untuk chat');
      return;
    }

    try {
      const res = await api.chat.createConversation(selectedParticipant.member.userId);
      if (res.status === 'success') {
        router.push(`/admin/messages/${res.data.id}`);
      }
    } catch (err: any) {
      toast.error('Gagal memulai chat');
    }
  };

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchesSearch = 
        p.member?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.member?.nia?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'Semua' || 
        (filterStatus === 'Terverifikasi' && (p.status === 'APPROVED' || p.status === 'SUCCESS')) ||
        (filterStatus === 'Pending' && p.status === 'PENDING') ||
        (filterStatus === 'Ditolak' && p.status === 'REJECTED');

      return matchesSearch && matchesStatus;
    });
  }, [participants, searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'SUCCESS':
        return (
          <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 text-[9px] font-black uppercase">
            <CheckCircle2 size={10} />
            Terverifikasi
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[9px] font-black uppercase">
            <Clock size={10} />
            Pending
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 text-[9px] font-black uppercase">
            <XCircle size={10} />
            Ditolak
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-black uppercase">
            {status}
          </div>
        );
    }
  };

  return (
    <>
      <div className="pb-10">
        {/* Header - Simplified as TopBar is already in layout */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 leading-none mb-1">Manajemen Peserta</h1>
            <p className="text-[10px] font-bold text-gray-500 truncate uppercase tracking-widest">{event?.title || 'Loading...'}</p>
          </div>
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all">
            <Download size={20} />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIA..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all">
            <Filter size={18} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition-colors" />
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">{participants.length}</span>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Orang</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-amber-500/20 transition-colors" />
              <p className="text-[10px] font-black uppercase text-amber-500/60 tracking-[0.2em] mb-2">Lunas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500 tracking-tighter">
                  {participants.filter(p => p.status === 'APPROVED' || p.status === 'SUCCESS' || p.status === 'PAID').length}
                </span>
                <span className="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest">Orang</span>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['Semua', 'Pending', 'Terverifikasi', 'Ditolak'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === s 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                    : 'bg-white/5 text-gray-500 border border-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Participants List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Memuat data...</p>
              </div>
            ) : filteredParticipants.length > 0 ? (
              filteredParticipants.map((p) => (
                <motion.div 
                  layoutId={`participant-${p.id}`}
                  key={p.id}
                  onClick={() => setSelectedParticipant(p)}
                  className="bg-white/[0.03] border border-white/5 p-4 rounded-[2rem] flex items-center gap-4 active:scale-[0.98] transition-all shadow-xl relative overflow-hidden group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/10 shrink-0 group-active:scale-90 transition-transform">
                    <span className="text-amber-500 font-black text-xl uppercase">
                      {p.member?.fullName?.charAt(0) || '?'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-[13px] font-black text-white uppercase truncate tracking-tight pr-2">
                        {p.member?.fullName || 'Anonim'}
                      </h4>
                      {getStatusBadge(p.status)}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                        <MapPin size={10} className="text-amber-500/50" />
                        {p.member?.dojo?.name || 'Pusat'}
                      </span>
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                        <Users size={10} className="text-amber-500/50" />
                        {p.category?.name || '-'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-gray-600">
                    <MoreVertical size={14} />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
                <Users className="mx-auto text-gray-800 mb-3" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Peserta tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participant Detail Drawer */}
      <AnimatePresence>
        {selectedParticipant && (
          <div className="fixed inset-0 z-[999] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedParticipant(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-[#0D0D10] border-t border-white/10 rounded-t-[3.5rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] p-8 pb-[calc(env(safe-area-inset-bottom,24px)+24px)] max-h-[95vh] overflow-y-auto z-[1000]"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 opacity-50" />
              
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl font-black text-amber-500 mb-4 uppercase shadow-2xl">
                  {selectedParticipant.member?.fullName?.charAt(0)}
                </div>
                <h3 className="text-xl font-black uppercase text-white tracking-tight leading-none mb-2">
                  {selectedParticipant.member?.fullName}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {selectedParticipant.member?.nia || 'TANPA NIA'}
                  </span>
                  {getStatusBadge(selectedParticipant.status)}
                </div>
              </div>

              <div className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Kategori</p>
                    <p className="text-xs font-bold text-white uppercase">{selectedParticipant.category?.name || '-'}</p>
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Biaya</p>
                    <p className="text-xs font-bold text-amber-500">Rp {selectedParticipant.category?.fee?.toLocaleString('id-ID') || '0'}</p>
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Dojo</p>
                    <p className="text-xs font-bold text-white uppercase truncate">{selectedParticipant.member?.dojo?.name || 'Pusat'}</p>
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Tgl Daftar</p>
                    <p className="text-xs font-bold text-white uppercase">
                      {new Date(selectedParticipant.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">Asal Cabang / Provinsi</p>
                  <p className="text-xs font-bold text-white uppercase leading-relaxed">
                    {selectedParticipant.member?.dojo?.branch?.name || '-'} / {selectedParticipant.member?.dojo?.branch?.province?.name || '-'}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-6 space-y-3">
                  <button 
                    onClick={handleVerifyPayment}
                    disabled={verifying || selectedParticipant.status === 'PAID' || selectedParticipant.status === 'APPROVED' || selectedParticipant.status === 'SUCCESS'}
                    className="w-full py-4 bg-amber-500 disabled:bg-gray-800 disabled:text-gray-500 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <UserCheck size={18} />
                    )}
                    {selectedParticipant.status === 'PAID' || selectedParticipant.status === 'APPROVED' || selectedParticipant.status === 'SUCCESS' 
                      ? 'Sudah Terverifikasi' 
                      : 'Verifikasi Pembayaran'}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleWhatsApp}
                      className="py-3.5 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/10"
                    >
                      <Phone size={14} className="text-green-500" />
                      WhatsApp
                    </button>
                    <button 
                      onClick={handleChat}
                      className="py-3.5 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/10"
                    >
                      <MessageSquare size={14} className="text-amber-500" />
                      Chat
                    </button>
                  </div>
                  <button 
                    className="w-full py-3 text-red-500/50 hover:text-red-500 font-black uppercase tracking-widest text-[9px] transition-colors"
                    onClick={() => toast.error('Fitur penolakan segera hadir')}
                  >
                    Tolak Pendaftaran
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
