'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getAssetUrl } from '@/lib/api';
import { 
  ShieldCheck, 
  XCircle, 
  Loader2, 
  User, 
  MapPin, 
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerificationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.members.verify(id as string);
        setMember(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Anggota tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };
    if (id) verify();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
        <p className="text-gray-500 font-black uppercase tracking-widest text-xs animate-pulse">Memverifikasi Data...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
          <XCircle size={40} />
        </div>
        <h1 className="text-2xl font-black uppercase mb-2">Verifikasi Gagal</h1>
        <p className="text-gray-500 text-sm max-w-xs mb-8">{error || 'Data anggota tidak valid atau tidak terdaftar di sistem.'}</p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isActive = member.status === 'Active' || member.status === 'AKTIF' || member.isAdmin;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-6 pb-20 animate-in fade-in duration-700">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">E-Verification</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Sistem Validasi INKAI</p>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 border-white/5 relative overflow-hidden"
        >
          <div className={`absolute top-0 right-0 p-4 ${isActive ? 'text-green-500' : 'text-red-500'}`}>
             <CheckCircle2 size={32} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-amber-500 to-amber-600 p-1 shadow-2xl shadow-amber-500/20">
                <div className="w-full h-full rounded-[1.8rem] bg-[#141417] flex items-center justify-center overflow-hidden">
                  {member.photoUrl ? (
                    <img src={getAssetUrl(member.photoUrl)} alt={member.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-gray-600" />
                  )}
                </div>
              </div>
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 border-[#0A0A0C] shadow-xl ${isActive ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                {isActive ? 'Verified' : 'Invalid'}
              </div>
            </div>

              <h2 className="text-2xl font-black uppercase leading-tight">{member.fullName}</h2>
              <p className="text-sm font-bold text-amber-500 font-mono tracking-widest">
                {member.nia || (member.isAdmin ? 'ADMINISTRATOR' : 'MEMPROSES NIA...')}
              </p>
            </div>

            <div className="w-full pt-6 border-t border-white/5 grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                  <Award size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest block">Tingkatan</span>
                  <span className="text-sm font-bold text-gray-200">{member.currentRank}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest block">Dojo / Ranting</span>
                  <span className="text-sm font-bold text-gray-200 uppercase">{member.dojoName}</span>
                  <p className="text-[10px] text-gray-500 font-medium">{member.branchName} - {member.provinceName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest block">Bergabung Sejak</span>
                  <span className="text-sm font-bold text-gray-200">
                    {new Date(member.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notice */}
        <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-center">
          <p className="text-[11px] text-gray-500 leading-relaxed italic">
            "Halaman ini adalah bukti digital keanggotaan resmi INKAI. Data ini disinkronisasi secara real-time dengan Database Pusat."
          </p>
        </div>
      </div>
    </div>
  );
}
