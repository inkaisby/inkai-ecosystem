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
import toast from 'react-hot-toast';

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
    email: '',
    password: '',
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
    if (searchParams.get('showAdd') === 'true') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (showAddModal && (!dojoId || isEdit)) {
      api.org.getProvinces().then((res: any) => setProvinces(res.data));
    }
  }, [showAddModal, dojoId, isEdit]);

  useEffect(() => {
    if (selectedProvinceId) {
      api.org.getBranches(selectedProvinceId).then((res: any) => {
        setBranches(res.data);
      });
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedBranchId) {
      api.org.getDojos(selectedBranchId).then((res: any) => {
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
      router.push('/admin/organization');
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
      email: member.user?.email || '',
      password: '',
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
      email: '',
      password: '',
      dojoId: dojoId || ''
    });
    setDateInput('');
    setIsEdit(false);
    setEditId(null);
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-amber-500 mb-0.5">
                <Users size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">
                  {dojoId ? `Dojo ${dojoName}` : 'Database Nasional'}
                </span>
              </div>
              <h2 className="text-xl font-black uppercase text-white truncate leading-tight">
                {dojoId ? dojoName : 'Anggota'}
              </h2>
            </div>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all">
              <Download size={18} />
            </button>
          </div>
        </div>

        <button 
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-amber-500/20"
        >
          <Plus size={20} />
          Tambah Anggota
        </button>

        {dojoId && (
          <div className="grid grid-cols-2 gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase text-gray-500">Wilayah</p>
              <p className="text-[11px] font-bold text-gray-300 uppercase truncate">{dojoInfo?.kecamatan || '...'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase text-gray-500">Kontak</p>
              <p className="text-[11px] font-bold text-amber-500 uppercase truncate">{dojoInfo?.phoneNumber || '...'}</p>
            </div>
          </div>
        )}
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

      {/* Filter & List Area */}
      <div className="space-y-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Nama, NIA, atau Email..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 transition-all text-white"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1 text-xs py-2.5">
              <Search size={16} />
              Cari Anggota
            </button>
            {dojoId && (
              <button 
                type="button"
                onClick={() => router.push('/admin/members')}
                className="btn-secondary text-xs py-2.5 px-3"
                title="Hapus Filter Dojo"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3 relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-[#0A0A0C] flex items-center justify-center z-10 rounded-2xl">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          )}

          {members.length > 0 ? members.map((member) => (
            <div 
              key={member.id} 
              onClick={() => {
                setSelectedMember(member);
                setShowDetailModal(true);
              }}
              className="glass-card p-4 flex items-center justify-between border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/10">
                  <span className="text-amber-500 font-bold text-xs">
                    {member.fullName?.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{member.fullName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">{member.nia || 'N/A'}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="text-[10px] text-amber-500 font-bold truncate">{member.currentRank}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-[9px] px-2 py-0.5 rounded-full inline-block font-bold ${
                  member.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {member.status}
                </div>
                <p className="text-[9px] text-gray-600 mt-1 truncate max-w-[80px]">{member.dojo?.name || 'Umum'}</p>
              </div>
            </div>
          )) : !loading && (
            <div className="glass-card p-12 text-center text-gray-500 text-xs italic border-dashed border-white/5">
              Tidak ada data anggota ditemukan.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] text-gray-500 uppercase font-black">
            Total: <span className="text-white">{meta.total}</span> Anggota
          </p>
          <div className="flex gap-2">
            <button 
              disabled={meta.page === 1}
              onClick={() => fetchMembers(meta.page - 1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 disabled:opacity-20"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center px-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-gray-400">
              {meta.page}
            </div>
            <button 
              disabled={meta.page * meta.limit >= meta.total}
              onClick={() => fetchMembers(meta.page + 1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 disabled:opacity-20"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#0A0A0C] animate-in fade-in">
          <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">
                {isEdit ? 'Ubah Anggota' : 'Anggota Baru'}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                if (isEdit && editId) {
                  await api.members.update(editId, formData as any); 
                } else {
                  await api.members.create(formData);
                }
                setShowAddModal(false);
                resetForm();
                fetchMembers(1, search);
                toast.success(isEdit ? 'Data anggota berhasil diperbarui!' : 'Anggota baru berhasil terdaftar!');
              } catch (err: any) {
                const msg = err.response?.data?.message || err.message || 'Gagal memproses data';
                toast.error(msg);
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-10 font-black uppercase text-amber-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                      placeholder="CONTOH: BUDI SANTOSO"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Jenis Kelamin</label>
                    <div className="relative">
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer font-bold focus-outline-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Tanggal Lahir</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="DD/MM/YYYY"
                        readOnly
                        value={dateInput || (formData.birthDate ? formData.birthDate.split('-').reverse().join('/') : '')}
                        onClick={(e) => {
                          const input = e.currentTarget.nextElementSibling?.nextElementSibling as HTMLInputElement;
                          if (input && input.showPicker) input.showPicker();
                        }}
                        className="glass-input w-full px-4 py-3 text-sm cursor-pointer font-bold focus-outline-none"
                      />
                      <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input 
                        type="date"
                        className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
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
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Sabuk</label>
                    <div className="relative">
                        <select 
                          value={formData.currentRank}
                          onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
                          className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer font-bold focus-outline-none"
                          style={{ colorScheme: 'dark' }}
                        >
                          <optgroup label="Sabuk Putih">
                            <option value="Putih (Kyu 10)">Putih (Kyu 10)</option>
                            <option value="Putih (Kyu 9)">Putih (Kyu 9)</option>
                          </optgroup>
                          <optgroup label="Sabuk Kuning">
                            <option value="Kuning (Kyu 8)">Kuning (Kyu 8)</option>
                            <option value="Kuning (Kyu 7)">Kuning (Kyu 7)</option>
                          </optgroup>
                          <optgroup label="Sabuk Hijau">
                            <option value="Hijau (Kyu 6)">Hijau (Kyu 6)</option>
                          </optgroup>
                          <optgroup label="Sabuk Biru">
                            <option value="Biru (Kyu 5)">Biru (Kyu 5)</option>
                            <option value="Biru (Kyu 4)">Biru (Kyu 4)</option>
                          </optgroup>
                          <optgroup label="Sabuk Coklat">
                            <option value="Coklat (Kyu 3)">Coklat (Kyu 3)</option>
                            <option value="Coklat (Kyu 2)">Coklat (Kyu 2)</option>
                            <option value="Coklat (Kyu 1)">Coklat (Kyu 1)</option>
                          </optgroup>
                          <optgroup label="Sabuk Hitam (DAN)">
                            {[...Array(10)].map((_, i) => (
                              <option key={i} value={`Hitam (DAN ${i + 1})`}>Hitam (DAN {i + 1})</option>
                            ))}
                          </optgroup>
                        </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">NIA (Opsional)</label>
                    <input 
                      type="text" 
                      value={formData.nia}
                      onChange={(e) => setFormData({ ...formData, nia: e.target.value })}
                      placeholder="Nomor Induk"
                      className="glass-input w-full px-4 py-3 text-sm font-bold focus-outline-none"
                    />
                  </div>
                </div>

                <div className="pt-5 border-t border-white-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-amber-500" />
                    <label className="text-10 font-black uppercase text-amber-500 tracking-widest block leading-none">Kredensial Login</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nama@email.com"
                        className="glass-input w-full px-4 py-3 text-sm font-bold focus-outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">
                        {isEdit ? 'Sandi Baru' : 'Kata Sandi'}
                      </label>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={isEdit ? 'Kosongkan jika tetap' : 'Min. 6 karakter'}
                        className="glass-input w-full px-4 py-3 text-sm font-bold focus-outline-none"
                      />
                    </div>
                  </div>
                </div>

                {(!dojoId || isEdit) ? (
                  <div className="space-y-4 pt-5 border-t border-white-5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest block ml-1 opacity-80">Penempatan Dojo</label>
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
                            required
                            className="glass-input w-full px-4 py-3 text-sm appearance-none font-bold focus-outline-none"
                            style={{ colorScheme: 'dark' }}
                          >
                          <option value="">Provinsi...</option>
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
                          required
                          disabled={!selectedProvinceId}
                          className="glass-input w-full px-4 py-3 text-sm appearance-none disabled:opacity-30 font-bold focus-outline-none"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="">Pengcab...</option>
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
                        required
                        disabled={!selectedBranchId}
                        className="glass-input w-full px-4 py-3 text-sm appearance-none disabled:opacity-30 font-bold focus-outline-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Pilih Dojo...</option>
                        {dojos.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500-10 rounded-2xl border border-amber-500-10 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1.5">Wilayah</p>
                        <p className="text-[12px] font-black text-gray-200 uppercase leading-none">
                          {isEdit ? selectedMember?.dojo?.branch?.province?.name : dojoInfo?.branch?.province?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1.5">Pengcab</p>
                        <p className="text-[12px] font-black text-gray-200 uppercase leading-none">
                          {isEdit ? selectedMember?.dojo?.branch?.name : dojoInfo?.branch?.name || '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1.5">Dojo Sekarang</p>
                      <p className="text-sm font-black text-amber-500 uppercase leading-none">
                        {isEdit ? selectedMember?.dojo?.name : dojoName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || (!dojoId && !formData.dojoId)}
                  className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      ...
                    </>
                  ) : (
                    isEdit ? 'Simpan' : 'Daftar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0C] animate-in fade-in">
          <div className="glass-card w-full max-w-2xl p-0 overflow-hidden animate-in">
            {/* Modal Header/Banner */}
            <div className="h-32 bg-amber-500 relative">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 bg-black-20 hover:bg-black-40 text-white rounded-full backdrop-blur-md transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-2xl bg-dark-card p-1 border-4 border-white-5 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-amber-500 flex items-center justify-center font-bold text-black text-3xl">
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
                    <span className="px-2 py-0-5 bg-amber-500-10 text-amber-500 rounded text-xs font-bold uppercase border border-amber-500-20">
                      {selectedMember.currentRank}
                    </span>
                    <span className="text-gray-500 text-xs font-mono">{selectedMember.nia || 'Belum ada NIA'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <div className={`w-2 h-2 rounded-full ${selectedMember.status === 'Active' ? 'bg-green-500 shadow-lg' : 'bg-red-500'}`} />
                    <span className={`text-xs font-bold uppercase ${selectedMember.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedMember.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                  <p className="text-10 text-gray-500 uppercase font-black">Status Keanggotaan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-3">Informasi Personal</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="p-2 bg-white-5 rounded-lg"><Users size={16} className="text-amber-500" /></div>
                        <div>
                          <p className="text-10 text-gray-500 uppercase">Jenis Kelamin</p>
                          <p className="text-sm font-medium">{selectedMember.gender || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="p-2 bg-white-5 rounded-lg"><Calendar size={16} className="text-amber-500" /></div>
                        <div>
                          <p className="text-10 text-gray-500 uppercase">Tanggal Lahir</p>
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
                    <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-3">Wilayah & Dojo</p>
                    <div className="p-4 bg-white-5 rounded-2xl border border-white-5 space-y-4">
                      <div>
                        <p className="text-10 text-gray-500 uppercase">Provinsi</p>
                        <p className="text-sm font-bold text-gray-200">{selectedMember.dojo?.branch?.province?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-10 text-gray-500 uppercase">Pengcab</p>
                        <p className="text-sm font-bold text-gray-200">{selectedMember.dojo?.branch?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-10 text-gray-500 uppercase">Dojo</p>
                        <p className="text-sm font-bold text-amber-500">{selectedMember.dojo?.name || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold"
                >
                  Tutup
                </button>
                <button 
                  onClick={async () => {
                    const newPassword = prompt('Masukkan password baru (default: 123456):', '123456');
                    if (newPassword) {
                      setIsSubmitting(true);
                      try {
                        await api.members.update(selectedMember.id, { password: newPassword } as any);
                        toast.success(`Sandi ${selectedMember.fullName} berhasil direset!`);
                      } catch (err: any) {
                        toast.error(err.message || 'Gagal reset sandi');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Reset Sandi
                </button>
                <button 
                  onClick={() => handleEdit(selectedMember)}
                  className="btn-primary flex-[2] py-3 shadow-amber-20 text-xs"
                >
                  Ubah Data Lengkap
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
