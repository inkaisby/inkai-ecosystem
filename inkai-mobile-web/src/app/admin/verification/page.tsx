'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  Filter,
  FileText,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

function VerificationContent() {
  const searchParams = useSearchParams();
  const claimId = searchParams.get('claimId');
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const response = await api.verifications.getPending();
      setClaims(response.data);
      
      // Auto-select claim if claimId is in URL
      if (claimId && response.data.length > 0) {
        const target = response.data.find((c: any) => c.id === claimId);
        if (target) {
          setSelectedClaim(target);
        }
      }
    } catch (err) {
      toast.error('Gagal memuat antrean verifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedClaim) return;
    setProcessing(true);
    try {
      await api.verifications.process(selectedClaim.id, { status, adminNotes });
      toast.success(status === 'APPROVED' ? 'Pengajuan berhasil disetujui!' : 'Pengajuan telah ditolak.');
      setSelectedClaim(null);
      setAdminNotes('');
      fetchClaims();
    } catch (err) {
      toast.error('Gagal memproses pengajuan');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-0.5">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Antrean Kerja</span>
            </div>
            <h2 className="text-xl font-black uppercase text-white leading-tight">Verifikasi</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={32} />
          <p className="text-gray-500 text-xs animate-pulse">Memuat antrean...</p>
        </div>
      ) : claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedClaim(item)}
              className={`glass-card p-5 border-white/5 space-y-4 transition-all ${selectedClaim?.id === item.id ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">{item.member?.fullName}</h4>
                    <p className="text-[10px] text-gray-500 font-mono">{item.member?.nia || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/10">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold uppercase">{item.status}</span>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[8px] uppercase font-black text-gray-500">Jenis Pengajuan</p>
                    <p className="text-xs font-bold text-white uppercase mt-0.5">{item.type.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase font-black text-gray-500">Data</p>
                    <p className="text-xs font-bold text-amber-500 uppercase mt-0.5">{item.data}</p>
                  </div>
                </div>
              </div>

              {selectedClaim?.id === item.id && (
                <div className="pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2">Dokumen Pendukung</p>
                    <p className="text-[10px] text-gray-500 break-all mb-4">{item.proofUrl || 'Tidak ada URL dokumen'}</p>
                    <button className="text-[10px] font-black uppercase text-white bg-white/10 px-4 py-2 rounded-lg">
                      Buka Dokumen
                    </button>
                  </div>

                  <div className="space-y-2">
                    <textarea 
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                      placeholder="Tambahkan catatan admin..."
                      rows={2}
                    />
                    <div className="flex gap-3">
                      <button 
                        disabled={processing}
                        onClick={() => handleProcess('REJECTED')}
                        className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-[10px] uppercase"
                      >
                        Tolak
                      </button>
                      <button 
                        disabled={processing}
                        onClick={() => handleProcess('APPROVED')}
                        className="flex-1 py-3 bg-green-500 text-black rounded-xl font-bold text-[10px] uppercase"
                      >
                        {processing ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Setujui'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4 border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
            <ShieldCheck size={32} />
          </div>
          <p className="text-gray-500 text-xs italic">Semua antrean verifikasi sudah selesai diproses.</p>
        </div>
      )}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-amber-500" size={32} />
        <p className="text-gray-500 text-xs animate-pulse">Memuat...</p>
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}
