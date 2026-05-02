'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  UserMinus,
  Mail,
  Phone,
  Loader2,
  X,
  ArrowLeft
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Suspense } from 'react';

function MembersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dojoId = searchParams.get('dojoId');
  const dojoName = searchParams.get('dojoName');
  const branchId = searchParams.get('branchId');
  const provinceId = searchParams.get('provinceId');

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [dojoInfo, setDojoInfo] = useState<any | null>(null);

  const fetchMembers = async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const params: any = { page, search: searchQuery };
      if (dojoId) params.dojoId = dojoId;
      
      const response = await api.members.getAll(params);
      setMembers(response.data);
      setMeta(response.meta);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(1, search);
    if (dojoId) {
      const fetchDojoInfo = async () => {
        try {
          const response = await api.org.getDojoDetail(dojoId);
          setDojoInfo(response.data);
        } catch (err) {
          console.error('Failed to fetch dojo info', err);
        }
      };
      fetchDojoInfo();
    } else {
      setDojoInfo(null);
    }
  }, [dojoId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers(1, search);
  };

  const handleBack = () => {
    if (branchId && provinceId) {
      router.push(`/organization?branchId=${branchId}&provinceId=${provinceId}`);
    } else {
      router.push('/organization');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div>
        {dojoId && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors mb-4 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Kembali ke Daftar Dojo</span>
          </button>
        )}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Users size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">
                {dojoId ? `Anggota Dojo ${dojoName}` : 'Database Nasional'}
              </span>
            </div>
            <h2 className="text-3xl font-bold uppercase">
              {dojoId ? dojoName : 'Daftar Anggota'}
            </h2>
            {dojoId ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Kecamatan</p>
                  <p className="text-xs font-bold text-gray-300 uppercase">{dojoInfo?.kecamatan || '...'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Tempat Latihan</p>
                  <p className="text-xs font-bold text-gray-300 uppercase line-clamp-1">{dojoInfo?.tempatLatihan || '...'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">No. WhatsApp</p>
                  <p className="text-xs font-bold text-amber-500 uppercase">{dojoInfo?.phoneNumber || '...'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Jadwal Latihan</p>
                  <p className="text-xs font-bold text-gray-300 uppercase line-clamp-1">{dojoInfo?.schedule || '...'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 mt-1">
                Kelola data keanggotaan INKAI di seluruh wilayah Indonesia.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium">
              <Download size={18} />
              Export Data
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={18} />
              Anggota Baru
            </button>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card flex items-center gap-4 py-4">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs">Anggota Aktif</p>
            <h4 className="text-xl font-bold">{meta.total > 0 ? meta.total : '...'}</h4>
          </div>
        </div>
      </div>

      {/* Filter & Table Area */}
      <div className="glass-card space-y-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan Nama, NIA, atau Email..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all text-sm">
              <Search size={18} />
              Cari
            </button>
          </div>
          {dojoId && (
            <button 
              type="button"
              onClick={() => router.push('/members')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl transition-all text-sm font-bold"
            >
              <X size={18} />
              Hapus Filter Dojo
            </button>
          )}
        </form>

        <div className="overflow-x-auto relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
              <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
          )}

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                <th className="pb-4 pl-2 font-medium">Informasi Anggota</th>
                <th className="pb-4 font-medium">NIA</th>
                <th className="pb-4 font-medium">Wilayah / Dojo</th>
                <th className="pb-4 font-medium">Tingkatan</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 text-right pr-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="py-5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-black text-xs">
                        {member.fullName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-amber-500 transition-colors">{member.fullName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 text-gray-400 font-mono text-xs">{member.nia}</td>
                  <td className="py-5">
                    <p className="text-white text-xs">{member.dojo?.branch?.province?.name || '-'}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{member.dojo?.name}</p>
                  </td>
                  <td className="py-5">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-[10px] font-bold uppercase border border-amber-500/20">
                      {member.currentRank}
                    </span>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-medium ${member.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>{member.status}</span>
                    </div>
                  </td>
                  <td className="py-5 text-right pr-2">
                    <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {members.length === 0 && !loading && (
            <div className="py-20 text-center text-gray-500">
              Tidak ada data anggota ditemukan.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center pt-6 border-t border-white/5">
          <p className="text-xs text-gray-500">
            Menampilkan <span className="text-white font-medium">{members.length}</span> dari <span className="text-white font-medium">{meta.total}</span> anggota
          </p>
          <div className="flex gap-2">
            <button 
              disabled={meta.page === 1}
              onClick={() => fetchMembers(meta.page - 1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={meta.page * meta.limit >= meta.total}
              onClick={() => fetchMembers(meta.page + 1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    }>
      <MembersContent />
    </Suspense>
  );
}
