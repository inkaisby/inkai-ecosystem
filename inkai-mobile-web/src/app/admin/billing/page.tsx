'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import StatCard from '@/components/admin/StatCard';

export default function AdminBillingPage() {
  const router = useRouter();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const fetchBillings = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      
      const response = await api.billing.getAll(params);
      setBillings(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      toast.error('Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings(1);
  }, [statusFilter]);

  const handleVerify = async (billingId: string) => {
    if (!confirm('Verifikasi pembayaran iuran ini?')) return;
    setIsVerifying(billingId);
    try {
      await api.billing.verify({ billingId });
      toast.success('Pembayaran berhasil diverifikasi!');
      fetchBillings(meta.page);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memverifikasi');
    } finally {
      setIsVerifying(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'WAITING_VERIFICATION': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PENDING': return 'bg-gray-500/10 text-gray-500 border-white/10';
      case 'OVERDUE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/admin')}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-0.5">
              <Wallet size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Manajemen Iuran</span>
            </div>
            <h2 className="text-xl font-black uppercase text-white leading-tight">Keuangan Organisasi</h2>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          label="Total Masuk" 
          value={`Rp ${(billings.filter(b => b.status === 'PAID').reduce((acc, b) => acc + b.amount, 0) / 1000).toLocaleString()}rb`}
          subValue="Bulan Ini"
          icon={ArrowUpRight}
          color="green"
        />
        <StatCard 
          label="Tunggakan" 
          value={billings.filter(b => b.status === 'PENDING').length.toString()}
          subValue="Menunggu"
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBillings(1)}
            placeholder="Cari Nama Anggota atau NIA..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['', 'PAID', 'WAITING_VERIFICATION', 'PENDING'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${
                statusFilter === status 
                ? 'bg-amber-500 border-amber-500 text-black' 
                : 'bg-white/5 border-white/10 text-gray-500'
              }`}
            >
              {status || 'SEMUA'}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Daftar Transaksi</h3>
          <button className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1">
            <Download size={12} /> Export
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest animate-pulse">Menyelaraskan Kas...</p>
          </div>
        ) : billings.length > 0 ? (
          <div className="space-y-3">
            {billings.map((billing) => (
              <div key={billing.id} className="glass-card p-4 space-y-4 border-white/5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-500">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{billing.member?.fullName}</h4>
                      <p className="text-[10px] text-gray-500">{billing.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${getStatusStyle(billing.status)}`}>
                    {billing.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-[9px] text-gray-600 uppercase font-black mb-1">Jumlah Tagihan</p>
                    <p className="text-lg font-black text-white">Rp {billing.amount.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-600 uppercase font-black mb-1">Jatuh Tempo</p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {new Date(billing.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {billing.status === 'WAITING_VERIFICATION' && (
                  <div className="pt-4 border-t border-white/5">
                    <button 
                      onClick={() => handleVerify(billing.id)}
                      disabled={isVerifying === billing.id}
                      className="w-full py-3 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {isVerifying === billing.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Verifikasi Pembayaran
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center space-y-4 border-white/5 border-dashed">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
              <Wallet size={32} />
            </div>
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Belum ada transaksi ditemukan.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-1 pt-4">
        <p className="text-[10px] text-gray-500 uppercase font-black">
          Total: <span className="text-white">{meta.total}</span> Transaksi
        </p>
        <div className="flex gap-2">
          <button 
            disabled={meta.page === 1}
            onClick={() => fetchBillings(meta.page - 1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 disabled:opacity-20"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center px-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-gray-400">
            {meta.page}
          </div>
          <button 
            disabled={meta.page * meta.limit >= meta.total}
            onClick={() => fetchBillings(meta.page + 1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 disabled:opacity-20"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
