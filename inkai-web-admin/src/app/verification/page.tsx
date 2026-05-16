'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  Clock, 
  FileText,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  verificationTypeLabel,
  verificationDataSummary,
  verificationDataRows,
  isOpenableProofUrl,
} from '@/lib/verificationDisplay';

export default function VerificationPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await api.verifications.getPending();
      setClaims(data.data || []);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat antrean verifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedClaim || processingAction) return;
    setProcessingAction(status);
    try {
      const notes = adminNotes.trim();
      await api.verifications.process(selectedClaim.id, {
        status,
        ...(notes ? { adminNotes: notes } : {}),
      });
      toast.success(status === 'APPROVED' ? 'Pengajuan berhasil disetujui!' : 'Pengajuan telah ditolak.');
      setSelectedClaim(null);
      setAdminNotes('');
      fetchClaims();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memproses pengajuan';
      toast.error(msg);
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <ShieldCheck size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Antrean Kerja</span>
          </div>
          <h2 className="text-3xl font-bold">Verifikasi</h2>
          <p className="text-gray-500 mt-1">
            Mutasi dojo, kenaikan tingkat, dan prestasi (piagam / pelatihan) dari anggota.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 glass-card space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Daftar antrean
              {!loading && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] rounded-full font-bold">
                  {claims.length} menunggu
                </span>
              )}
            </h3>
          </div>

          <div className="overflow-x-auto min-h-[400px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={40} />
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                    <th className="pb-4 pl-2 font-medium">Tgl / ID</th>
                    <th className="pb-4 font-medium">Nama anggota</th>
                    <th className="pb-4 font-medium">Jenis</th>
                    <th className="pb-4 font-medium">Ringkasan</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 text-right pr-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {claims.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedClaim(item)}
                      className={`hover:bg-white/[0.02] transition-all cursor-pointer group ${selectedClaim?.id === item.id ? 'bg-white/5' : ''}`}
                    >
                      <td className="py-4 pl-2">
                        <p className="text-white text-xs">{new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{item.id.substring(0, 8)}…</p>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-white">{item.member?.fullName}</p>
                        <p className="text-[10px] text-gray-500">{item.member?.nia}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-white text-xs">{verificationTypeLabel(item.type)}</p>
                      </td>
                      <td className="py-4 max-w-[200px]">
                        <p className="text-[11px] text-amber-500/90 line-clamp-2 break-words">
                          {verificationDataSummary(item.data, item.type)}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase">{item.status}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedClaim(item); }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          aria-label="Pratinjau"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {!loading && claims.length === 0 && (
              <div className="py-20 text-center text-gray-500">
                Semua antrean verifikasi sudah selesai diproses.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card flex flex-col h-full bg-gradient-to-b from-[#1e1e24] to-transparent">
          <div className="flex items-center gap-3 pb-6 border-b border-white/5 mb-6">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold">Pratinjau</h3>
              <p className="text-xs text-gray-500">Detail pengajuan & dokumen</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col border-2 border-dashed border-white/5 rounded-2xl p-6 text-center bg-black/20 overflow-y-auto max-h-[480px]">
            {selectedClaim ? (
              <div className="space-y-4 text-left w-full">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Jenis</p>
                  <p className="text-sm text-white font-bold">{verificationTypeLabel(selectedClaim.type)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Detail</p>
                  {verificationDataRows(selectedClaim.data, selectedClaim.type).map((row) => (
                    <div key={row.label} className="flex justify-between gap-2 text-xs border-b border-white/5 pb-2 last:border-0">
                      <span className="text-gray-500 shrink-0">{row.label}</span>
                      <span className="text-white text-right break-words">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-2">Dokumen pendukung</p>
                  <p className="text-[10px] text-gray-500 break-all mb-3">{selectedClaim.proofUrl || '—'}</p>
                  {isOpenableProofUrl(selectedClaim.proofUrl) ? (
                    <div className="space-y-4">
                      {/\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(selectedClaim.proofUrl) && (
                        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 group relative">
                          <img 
                            src={selectedClaim.proofUrl} 
                            alt="Bukti Dokumen" 
                            className="w-full h-auto max-h-[400px] object-contain cursor-zoom-in mx-auto"
                            onClick={() => window.open(selectedClaim.proofUrl, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <p className="text-white text-[10px] font-bold uppercase tracking-widest">Klik untuk Zoom</p>
                          </div>
                        </div>
                      )}
                      <a
                        href={selectedClaim.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Buka dokumen asli
                      </a>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-600 italic text-center">Tidak ada URL dokumen yang dapat dibuka.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
                  <FileText size={40} />
                </div>
                <p className="text-gray-500 text-sm">Klik baris di tabel untuk melihat detail.</p>
              </div>
            )}
          </div>

          {selectedClaim && (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Catatan admin</p>
                <textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none resize-none text-white"
                  placeholder="Alasan penolakan atau catatan internal…"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  disabled={processingAction !== null}
                  onClick={() => handleProcess('REJECTED')}
                  className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingAction === 'REJECTED' ? (
                    <Loader2 className="animate-spin mx-auto" size={16} />
                  ) : (
                    'TOLAK'
                  )}
                </button>
                <button 
                  type="button"
                  disabled={processingAction !== null}
                  onClick={() => handleProcess('APPROVED')}
                  className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-bold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingAction === 'APPROVED' ? (
                    <Loader2 className="animate-spin mx-auto" size={16} />
                  ) : (
                    'SETUJUI'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
