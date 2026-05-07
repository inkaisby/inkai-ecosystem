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
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function VerificationPage() {
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
      const response = await fetch('http://localhost:5001/v1/verifications/pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setClaims(data.data);
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
      await fetch(`http://localhost:5001/v1/verifications/${selectedClaim.id}/process`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, adminNotes })
      });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <ShieldCheck size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Antrean Kerja</span>
          </div>
          <h2 className="text-3xl font-bold">Verifikasi & Approval</h2>
          <p className="text-gray-500 mt-1">Validasi klaim data anggota, riwayat sabuk, dan pengajuan mutasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Table View */}
        <div className="xl:col-span-2 glass-card space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Daftar Antrean
              {!loading && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] rounded-full font-bold">{claims.length} Menunggu</span>}
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
                    <th className="pb-4 font-medium">Nama Anggota</th>
                    <th className="pb-4 font-medium">Jenis Pengajuan</th>
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
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.id.substring(0, 8)}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-white">{item.member?.fullName}</p>
                        <p className="text-[10px] text-gray-500">{item.member?.nia}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-white text-xs">{item.type.replace('_', ' ')}</p>
                        <p className="text-[10px] text-amber-500 mt-0.5 font-bold uppercase">{item.data}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase">{item.status}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <Eye size={16} />
                          </button>
                        </div>
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

        {/* Detail Preview Panel */}
        <div className="glass-card flex flex-col h-full bg-gradient-to-b from-[#1e1e24] to-transparent">
          <div className="flex items-center gap-3 pb-6 border-b border-white/5 mb-6">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold">Pratinjau Dokumen</h3>
              <p className="text-xs text-gray-500">Silakan periksa keaslian bukti.</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-8 text-center bg-black/20 overflow-hidden">
            {selectedClaim ? (
              <div className="space-y-4">
                <div className="w-full aspect-video bg-white/5 rounded-lg flex items-center justify-center text-gray-600">
                  <FileText size={48} />
                </div>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">BUKTI: {selectedClaim.type}</p>
                <p className="text-[10px] text-gray-500 break-all">{selectedClaim.proofUrl}</p>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
                  <FileText size={40} />
                </div>
                <p className="text-gray-500 text-sm">Klik baris di tabel untuk melihat<br/>dokumen pendukung.</p>
              </>
            )}
          </div>

          {selectedClaim && (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Catatan Admin</p>
                <textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none resize-none text-white"
                  placeholder="Tambahkan alasan jika menolak pengajuan..."
                  rows={3}
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button 
                  disabled={processing}
                  onClick={() => handleProcess('REJECTED')}
                  className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  TOLAK
                </button>
                <button 
                  disabled={processing}
                  onClick={() => handleProcess('APPROVED')}
                  className="flex-1 py-3 bg-green-500 text-black rounded-xl font-bold text-xs hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'SETUJUI'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
