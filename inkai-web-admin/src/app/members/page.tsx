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
  ArrowLeft,
  ChevronDown,
  Calendar
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
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Laki-laki',
    birthDate: '',
    currentRank: 'Putih (Kyu 10)',
    nia: '',
    dojoId: dojoId || ''
  });
  const [provinces, setProvinces] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [dojos, setDojos] = useState<any[]>([]);
  
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

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

  useEffect(() => {
    if (showAddModal && (!dojoId || isEdit)) {
      api.org.getProvinces().then(res => setProvinces(res.data));
    }
  }, [showAddModal, dojoId, isEdit]);

  useEffect(() => {
    if (selectedProvinceId) {
      api.org.getBranches(selectedProvinceId).then(res => {
        setBranches(res.data);
      });
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedBranchId) {
      api.org.getDojos(selectedBranchId).then(res => {
        setDojos(res.data);
      });
    }
  }, [selectedBranchId]);

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

  const handleEdit = (member: any) => {
    setEditId(member.id);
    setIsEdit(true);
    setFormData({
      fullName: member.fullName,
      gender: member.gender || 'Laki-laki',
      birthDate: member.birthDate ? member.birthDate.split('T')[0] : '',
      currentRank: member.currentRank || 'Putih',
      nia: member.nia || '',
      dojoId: member.dojoId || ''
    });

    // Pre-fill hierarchy for editing
    if (member.dojo?.branch?.provinceId) {
      setSelectedProvinceId(member.dojo.branch.provinceId);
      // We need to fetch branches and dojos for these to work, 
      // but the useEffects will handle it once the IDs are set.
      setSelectedBranchId(member.dojo.branchId);
    }

    const dateOnly = member.birthDate ? member.birthDate.split('T')[0] : '';
    setDateInput(dateOnly ? dateOnly.split('-').reverse().join('/') : '');
    setShowDetailModal(false);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      gender: 'Laki-laki',
      birthDate: '',
      currentRank: 'Putih (Kyu 10)',
      nia: '',
      dojoId: dojoId || ''
    });
    setDateInput('');
    setIsEdit(false);
    setEditId(null);
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
            <button 
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
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
                <tr 
                  key={member.id} 
                  onClick={() => {
                    setSelectedMember(member);
                    setShowDetailModal(true);
                  }}
                  className="hover:bg-white/[0.02] transition-all group cursor-pointer"
                >
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

      {/* Form Modal (Add / Edit) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-lg p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold uppercase tracking-tight">
                {isEdit ? 'Ubah Data Anggota' : 'Daftarkan Anggota Baru'}
              </h3>
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
                if (isEdit && editId) {
                  await api.members.update(editId, formData); 
                } else {
                  await api.members.create(formData);
                }
                setShowAddModal(false);
                resetForm();
                fetchMembers(1, search);
              } catch (err: any) {
                alert(err.message);
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                    placeholder="CONTOH: BUDI SANTOSO"
                    className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Jenis Kelamin</label>
                    <div className="relative">
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="Laki-laki" className="bg-[#1e1e24] text-white">Laki-laki</option>
                        <option value="Perempuan" className="bg-[#1e1e24] text-white">Perempuan</option>
                      </select>
                      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Tanggal Lahir</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        placeholder="DD/MM/YYYY"
                        value={dateInput || (formData.birthDate ? formData.birthDate.split('-').reverse().join('/') : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDateInput(val);
                          const parts = val.split('/');
                          if (parts.length === 3 && parts[2].length === 4) {
                            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            if (!isNaN(Date.parse(isoDate))) {
                              setFormData({ ...formData, birthDate: isoDate });
                            }
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text');
                          const parts = pastedData.split('/');
                          if (parts.length === 3) {
                            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            if (!isNaN(Date.parse(isoDate))) {
                              setFormData({ ...formData, birthDate: isoDate });
                              setDateInput(pastedData);
                            }
                          }
                        }}
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all"
                      />
                      <button 
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                          if (input.showPicker) input.showPicker();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
                      >
                        <Calendar size={18} />
                      </button>
                      <input 
                        type="date"
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        value={formData.birthDate}
                        onChange={(e) => {
                          setFormData({ ...formData, birthDate: e.target.value });
                          setDateInput(e.target.value.split('-').reverse().join('/'));
                        }}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">Tingkatan (Sabuk)</label>
                    <div className="relative">
                        <select 
                          value={formData.currentRank}
                          onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
                          className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                          style={{ colorScheme: 'dark' }}
                        >
                          <optgroup label="Sabuk Putih" className="bg-[#1e1e24]">
                            <option value="Putih (Kyu 10)">Putih (Kyu 10)</option>
                            <option value="Putih (Kyu 9)">Putih (Kyu 9)</option>
                          </optgroup>
                          <optgroup label="Sabuk Kuning" className="bg-[#1e1e24]">
                            <option value="Kuning (Kyu 8)">Kuning (Kyu 8)</option>
                            <option value="Kuning (Kyu 7)">Kuning (Kyu 7)</option>
                          </optgroup>
                          <optgroup label="Sabuk Hijau" className="bg-[#1e1e24]">
                            <option value="Hijau (Kyu 6)">Hijau (Kyu 6)</option>
                          </optgroup>
                          <optgroup label="Sabuk Biru" className="bg-[#1e1e24]">
                            <option value="Biru (Kyu 5)">Biru (Kyu 5)</option>
                            <option value="Biru (Kyu 4)">Biru (Kyu 4)</option>
                          </optgroup>
                          <optgroup label="Sabuk Coklat" className="bg-[#1e1e24]">
                            <option value="Coklat (Kyu 3)">Coklat (Kyu 3)</option>
                            <option value="Coklat (Kyu 2)">Coklat (Kyu 2)</option>
                            <option value="Coklat (Kyu 1)">Coklat (Kyu 1)</option>
                          </optgroup>
                          <optgroup label="Sabuk Hitam (DAN)" className="bg-[#1e1e24]">
                            {[...Array(10)].map((_, i) => (
                              <option key={i} value={`Hitam (DAN ${i + 1})`}>Hitam (DAN {i + 1})</option>
                            ))}
                          </optgroup>
                        </select>
                      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">NIA (Opsional)</label>
                    <input 
                      type="text" 
                      value={formData.nia}
                      onChange={(e) => setFormData({ ...formData, nia: e.target.value })}
                      placeholder="Nomor Induk Anggota"
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                {(!dojoId || isEdit) ? (
                  <div className="space-y-4 pt-2 border-t border-white/5">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Wilayah & Dojo</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <select 
                          value={selectedProvinceId}
                          onChange={(e) => {
                            setSelectedProvinceId(e.target.value);
                            setSelectedBranchId('');
                            setDojos([]);
                            setFormData(prev => ({ ...prev, dojoId: '' }));
                          }}
                          className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 appearance-none"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="">Pilih Provinsi</option>
                          {provinces.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select 
                          value={selectedBranchId}
                          onChange={(e) => {
                            setSelectedBranchId(e.target.value);
                            setFormData(prev => ({ ...prev, dojoId: '' }));
                          }}
                          disabled={!selectedProvinceId}
                          className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 appearance-none disabled:opacity-30"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="">Pilih Pengcab</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                    <div className="relative">
                      <select 
                        value={formData.dojoId}
                        onChange={(e) => setFormData({ ...formData, dojoId: e.target.value })}
                        disabled={!selectedBranchId}
                        className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 appearance-none disabled:opacity-30"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Pilih Dojo</option>
                        {dojos.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Provinsi</p>
                        <p className="text-xs font-bold text-gray-300 uppercase">
                          {isEdit ? selectedMember?.dojo?.branch?.province?.name : dojoInfo?.branch?.province?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Pengcab</p>
                        <p className="text-xs font-bold text-gray-300 uppercase">
                          {isEdit ? selectedMember?.dojo?.branch?.name : dojoInfo?.branch?.name || '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Dojo Tujuan</p>
                      <p className="text-sm font-bold text-amber-500 uppercase">
                        {isEdit ? selectedMember?.dojo?.name : dojoName}
                      </p>
                    </div>
                  </div>
                )}
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
                  disabled={isSubmitting || (!dojoId && !formData.dojoId)}
                  className="flex-[2] py-3 rounded-xl bg-amber-500 text-black text-sm font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    isEdit ? 'Simpan Perubahan' : 'Daftarkan Anggota'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header/Banner */}
            <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-700 relative">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-2xl bg-[#1e1e24] p-1 border-4 border-[#1e1e24] shadow-xl">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-black text-3xl">
                    {selectedMember.fullName.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-1">{selectedMember.fullName}</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[10px] font-bold uppercase border border-amber-500/20">
                      {selectedMember.currentRank}
                    </span>
                    <span className="text-gray-500 text-xs font-mono">{selectedMember.nia || 'Belum ada NIA'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <div className={`w-2 h-2 rounded-full ${selectedMember.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                    <span className={`text-xs font-bold uppercase ${selectedMember.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedMember.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Status Keanggotaan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3">Informasi Personal</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="p-2 bg-white/5 rounded-lg"><Users size={16} className="text-amber-500" /></div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Jenis Kelamin</p>
                          <p className="text-sm font-medium">{selectedMember.gender || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="p-2 bg-white/5 rounded-lg"><Calendar size={16} className="text-amber-500" /></div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Tanggal Lahir</p>
                          <p className="text-sm font-medium">
                            {selectedMember.birthDate ? new Date(selectedMember.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3">Wilayah & Dojo</p>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Provinsi</p>
                        <p className="text-sm font-bold text-gray-200">{selectedMember.dojo?.branch?.province?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Pengcab</p>
                        <p className="text-sm font-bold text-gray-200">{selectedMember.dojo?.branch?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Dojo</p>
                        <p className="text-sm font-bold text-amber-500">{selectedMember.dojo?.name || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-all text-gray-400"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => handleEdit(selectedMember)}
                  className="flex-[2] py-3 rounded-xl bg-amber-500 text-black text-sm font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                >
                  Ubah Data Anggota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
