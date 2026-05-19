'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Loader2,
  ChevronLeft,
  Search,
  Wallet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  XCircle,
  Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

function BillingContent() {
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const response = await api.billing.getAll();
      setBillings(response.data || response || []);
    } catch (err) {
      toast.error('Gagal memuat data iuran');
    } finally {
      setLoading(false);
    }
  };

  // KPIs calculations
  const stats = useMemo(() => {
    let totalReceived = 0;
    let waitingCount = 0;
    let pendingCount = 0;

    billings.forEach((b) => {
      if (b.status === 'PAID') {
        totalReceived += b.amount || 0;
      } else if (b.status === 'WAITING_VERIFICATION') {
        waitingCount++;
      } else if (b.status === 'PENDING') {
        pendingCount++;
      }
    });

    return { totalReceived, waitingCount, pendingCount };
  }, [billings]);

  // Filtered billings
  const filteredBillings = useMemo(() => {
    return billings.filter((b) => {
      // 1. Text Search
      const name = b.member?.fullName?.toLowerCase() || '';
      const nia = b.member?.nia?.toLowerCase() || '';
      const dojo = b.member?.dojo?.name?.toLowerCase() || '';
      const desc = b.description?.toLowerCase() || '';
      const matchesSearch = 
        name.includes(searchQuery.toLowerCase()) || 
        nia.includes(searchQuery.toLowerCase()) || 
        dojo.includes(searchQuery.toLowerCase()) ||
        desc.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

      // 3. Type Filter
      if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;

      return true;
    });
  }, [billings, searchQuery, statusFilter, typeFilter]);

  const handleVerify = async (billingId: string, status: 'APPROVED' | 'REJECTED') => {
    if (processingAction) return;
    setProcessingAction(status);
    try {
      await api.billing.verify({
        billingId,
        status,
        adminNotes: adminNotes.trim()
      });
      toast.success(status === 'APPROVED' ? 'Pembayaran berhasil disetujui!' : 'Bukti pembayaran ditolak & tagihan di-reset.');
      setSelectedBilling(null);
      setAdminNotes('');
      fetchBillings();
    } catch (err) {
      toast.error('Gagal memproses verifikasi');
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-0.5">
            <Wallet size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Manajemen Keuangan</span>
          </div>
          <h2 className="text-xl font-black uppercase text-white leading-tight">Iuran Anggota</h2>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 border-emerald-500/10 bg-emerald-500/[0.02] flex flex-col justify-between">
          <span className="text-[8px] font-bold uppercase text-emerald-500 tracking-wider">Total Masuk</span>
          <span className="text-xs font-black text-white mt-1">
            Rp {new Intl.NumberFormat('id-ID', { compactDisplay: 'short', notation: 'compact' }).format(stats.totalReceived)}
          </span>
        </div>
        <div className="glass-card p-3 border-amber-500/10 bg-amber-500/[0.02] flex flex-col justify-between">
          <span className="text-[8px] font-bold uppercase text-amber-500 tracking-wider">Menunggu</span>
          <span className="text-xs font-black text-white mt-1">
            {stats.waitingCount} Antrean
          </span>
        </div>
        <div className="glass-card p-3 border-red-500/10 bg-red-500/[0.02] flex flex-col justify-between">
          <span className="text-[8px] font-bold uppercase text-red-400 tracking-wider">Belum Bayar</span>
          <span className="text-xs font-black text-white mt-1">
            {stats.pendingCount} Tagihan
          </span>
        </div>
      </div>

      {/* Filters Block */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota, dojo, deskripsi..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase tracking-wider text-gray-500">Status Tagihan</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'WAITING_VERIFICATION', label: 'Menunggu' },
              { id: 'PAID', label: 'Lunas' },
              { id: 'PENDING', label: 'Belum Bayar' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded-lg border shrink-0 transition-all ${
                  statusFilter === st.id 
                    ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type Pill Filters */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase tracking-wider text-gray-500">Kategori Tagihan</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'Semua Kategori' },
              { id: 'MONTHLY_IURAN', label: 'Iuran Bulanan' },
              { id: 'EVENT_FEE', label: 'Biaya Event' }
            ].map((ty) => (
              <button
                key={ty.id}
                type="button"
                onClick={() => setTypeFilter(ty.id)}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded-lg border shrink-0 transition-all ${
                  typeFilter === ty.id 
                    ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {ty.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Billings List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={32} />
          <p className="text-gray-500 text-xs animate-pulse">Memuat daftar iuran...</p>
        </div>
      ) : filteredBillings.length > 0 ? (
        <div className="space-y-4">
          {filteredBillings.map((bill) => {
            const isWaiting = bill.status === 'WAITING_VERIFICATION';
            const isPaid = bill.status === 'PAID';
            const isSelected = selectedBilling?.id === bill.id;

            return (
              <div 
                key={bill.id}
                onClick={() => setSelectedBilling(isSelected ? null : bill)}
                className={`glass-card p-4 border-white/5 transition-all ${
                  isSelected ? 'border-amber-500/30 bg-amber-500/5' : ''
                }`}
                role="button"
                tabIndex={0}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase">{bill.member?.fullName}</h4>
                    <p className="text-[9px] text-gray-400">Dojo: {bill.member?.dojo?.name || 'N/A'}</p>
                    <p className="text-[9px] text-amber-500 font-medium">
                      {bill.description || (bill.type === 'MONTHLY_IURAN' ? 'Iuran Bulanan' : 'Biaya Event')}
                    </p>
                  </div>
                  <div className="text-right space-y-1.5">
                    <p className="text-xs font-black text-white">
                      Rp {new Intl.NumberFormat('id-ID').format(bill.amount)}
                    </p>
                    <div className="inline-flex">
                      {isPaid ? (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 size={8} /> Lunas
                        </span>
                      ) : isWaiting ? (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                          <Clock size={8} /> Verifikasi
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          <AlertCircle size={8} /> Belum Bayar
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div 
                    className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/5 p-3 rounded-xl">
                      <div>
                        <span className="text-gray-500 block">Jatuh Tempo</span>
                        <span className="text-white font-mono">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Jenis Pembayaran</span>
                        <span className="text-white uppercase">{bill.type}</span>
                      </div>
                    </div>

                    {isWaiting && (
                      <>
                        <div className="p-4 bg-black-40 rounded-xl border border-white/5 text-center space-y-3">
                          <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Bukti Transfer</p>
                          {bill.payment?.proofUrl ? (
                            <div className="space-y-3">
                              {/\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(bill.payment.proofUrl) && (
                                <img 
                                  src={bill.payment.proofUrl} 
                                  alt="Bukti Transfer" 
                                  className="w-full h-auto max-h-[250px] object-contain rounded-lg border border-white/10 mx-auto"
                                  onClick={() => window.open(bill.payment.proofUrl, '_blank')}
                                />
                              )}
                              <a
                                href={bill.payment.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block w-full text-center text-[9px] font-black uppercase bg-amber-500 text-black px-4 py-2.5 rounded-lg hover:bg-amber-400 transition-colors"
                              >
                                Buka Berkas Asli
                              </a>
                            </div>
                          ) : (
                            <p className="text-[9px] text-gray-500 italic">Berkas bukti transfer tidak tersedia</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <textarea 
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Tulis catatan penolakan / persetujuan..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={processingAction !== null}
                              onClick={() => handleVerify(bill.id, 'REJECTED')}
                              className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[9px] uppercase tracking-wider active:scale-95 transition-all"
                            >
                              Tolak Bukti
                            </button>
                            <button
                              type="button"
                              disabled={processingAction !== null}
                              onClick={() => handleVerify(bill.id, 'APPROVED')}
                              className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-black text-[9px] uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all"
                            >
                              Setujui
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4 border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
            <Wallet size={32} />
          </div>
          <p className="text-gray-500 text-xs italic">Tidak ada tagihan yang cocok dengan filter aktif.</p>
        </div>
      )}
    </div>
  );
}

export default function AdminBillingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-amber-500" size={32} />
        <p className="text-gray-500 text-xs animate-pulse">Memuat...</p>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
