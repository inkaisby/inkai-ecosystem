'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Map, 
  ChevronRight, 
  Plus, 
  Building2, 
  MapPin, 
  Users,
  MoreVertical,
  Loader2,
  Search,
  ArrowLeft,
  Filter,
  X,
  UserCheck,
  Lock
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function OrganizationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New States
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<'provinces' | 'details' | 'branches' | 'dojos'>('provinces');
  const [selectedProvince, setSelectedProvince] = useState<any | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [dojos, setDojos] = useState<any[]>([]);
  const [dojosLoading, setDojosLoading] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProvinceName, setNewProvinceName] = useState('');
  const [newProvinceHead, setNewProvinceHead] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit Province states
  const [showEditProvinceModal, setShowEditProvinceModal] = useState(false);
  const [editProvinceName, setEditProvinceName] = useState('');
  const [editProvinceHead, setEditProvinceHead] = useState('');
  
  // Edit Branch states
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchHead, setEditBranchHead] = useState('');
  
  // Add Branch states
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchHead, setNewBranchHead] = useState('');
  
  // Edit Dojo states
  const [showEditDojoModal, setShowEditDojoModal] = useState(false);
  const [selectedDojo, setSelectedDojo] = useState<any | null>(null);
  const [editDojoName, setEditDojoName] = useState('');
  const [editDojoPIC, setEditDojoPIC] = useState('');
  const [editDojoAddress, setEditDojoAddress] = useState('');
  const [editDojoKecamatan, setEditDojoKecamatan] = useState('');
  const [editDojoVenue, setEditDojoVenue] = useState('');
  const [editDojoPhone, setEditDojoPhone] = useState('');
  const [editDojoSchedule, setEditDojoSchedule] = useState('');
  
  // Add Dojo states
  const [showAddDojoModal, setShowAddDojoModal] = useState(false);
  const [newDojoName, setNewDojoName] = useState('');
  const [newDojoPIC, setNewDojoPIC] = useState('');
  const [newDojoAddress, setNewDojoAddress] = useState('');
  const [newDojoKecamatan, setNewDojoKecamatan] = useState('');
  const [newDojoVenue, setNewDojoVenue] = useState('');
  const [newDojoPhone, setNewDojoPhone] = useState('');
  const [newDojoSchedule, setNewDojoSchedule] = useState('');

  // Admin Account states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const response = await api.org.getProvinces();
        setProvinces(response.data);
        
        const pId = searchParams.get('provinceId');
        const bId = searchParams.get('branchId');

        // 1. Regional Admin Auto-Navigation (Priority)
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.managedBranchId) {
            const prov = response.data[0];
            if (prov) {
              setSelectedProvince(prov);
              const branchRes = await api.org.getBranches(prov.id);
              setBranches(branchRes.data);
              const branch = branchRes.data.find((b: any) => b.id === user.managedBranchId);
              if (branch) {
                setSelectedBranch(branch);
                setViewState('dojos');
                await fetchDojos(branch.id);
                return; // Stop here for branch admin
              }
            }
          } else if (user.managedProvinceId) {
            const prov = response.data.find((p: any) => p.id === user.managedProvinceId);
            if (prov) {
              setSelectedProvince(prov);
              setViewState('branches');
              await fetchBranches(prov.id);
              return; // Stop here for province admin
            }
          }
        }
        
        // 2. Search Params Navigation (Fallback)
        if (pId) {
          const prov = response.data.find((p: any) => p.id === pId);
          if (prov) {
            setSelectedProvince(prov);
            if (bId) {
              const branchResp = await api.org.getBranches(pId);
              const branch = branchResp.data.find((b: any) => b.id === bId);
              if (branch) {
                setSelectedBranch(branch);
                setBranches(branchResp.data);
                setViewState('dojos');
                await fetchDojos(bId);
              } else {
                setViewState('branches');
                setBranches(branchResp.data);
              }
            } else {
              setViewState('branches');
              await fetchBranches(pId);
            }
          }
        } else {
          setViewState('provinces');
          setSelectedProvince(null);
          setSelectedBranch(null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [searchParams]);

  const fetchBranches = async (provinceId: string) => {
    setBranchesLoading(true);
    try {
      const response = await api.org.getBranches(provinceId);
      setBranches(response.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchDojos = async (branchId: string) => {
    setDojosLoading(true);
    try {
      const response = await api.org.getDojos(branchId);
      setDojos(response.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDojosLoading(false);
    }
  };

  const handleViewDetails = (province: any) => {
    setSelectedProvince(province);
    setViewState('details');
  };

  const handleManageBranches = (province: any) => {
    setSelectedProvince(province);
    setViewState('branches');
    fetchBranches(province.id);
  };

  const handleViewDojos = (branch: any) => {
    setSelectedBranch(branch);
    setViewState('dojos');
    fetchDojos(branch.id);
  };

  const handleBack = () => {
    if (viewState === 'dojos') {
      setViewState('branches');
      setSelectedBranch(null);
      setDojos([]);
    } else {
      setViewState('provinces');
      setSelectedProvince(null);
      setBranches([]);
    }
  };

  const filteredProvinces = provinces.filter(prov => 
    prov.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prov.headName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.headName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDojos = dojos.filter(dojo => 
    dojo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dojo.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dojo.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProvince = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvinceName) return;
    
    setIsSubmitting(true);
    try {
      await api.org.createProvince({ 
        name: newProvinceName, 
        headName: newProvinceHead 
      });
      
      const response = await api.org.getProvinces();
      setProvinces(response.data);
      
      setShowAddModal(false);
      setNewProvinceName('');
      setNewProvinceHead('');
      toast.success('Wilayah berhasil ditambahkan!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditProvince = (prov: any) => {
    setSelectedProvince(prov);
    setEditProvinceName(prov.name);
    setEditProvinceHead(prov.headName || '');
    setAdminEmail(prov.admins?.[0]?.email || '');
    setAdminPassword('');
    setShowEditProvinceModal(true);
  };

  const handleUpdateProvince = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince || !editProvinceName) return;

    setIsSubmitting(true);
    try {
      await api.org.updateProvince(selectedProvince.id, {
        name: editProvinceName,
        headName: editProvinceHead,
        adminEmail,
        adminPassword
      });

      const response = await api.org.getProvinces();
      setProvinces(response.data);
      
      setShowEditProvinceModal(false);
      setSelectedProvince(null);
      toast.success('Data wilayah berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditBranch = (branch: any) => {
    setSelectedBranch(branch);
    setEditBranchName(branch.name);
    setEditBranchHead(branch.headName || '');
    setAdminEmail(branch.admins?.[0]?.email || '');
    setAdminPassword('');
    setShowEditBranchModal(true);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !editBranchName) return;

    setIsSubmitting(true);
    try {
      await api.org.updateBranch(selectedBranch.id, {
        name: editBranchName,
        headName: editBranchHead,
        adminEmail,
        adminPassword
      });

      await fetchBranches(selectedProvince.id);
      
      setShowEditBranchModal(false);
      setSelectedBranch(null);
      toast.success('Data cabang berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince || !newBranchName) return;

    setIsSubmitting(true);
    try {
      await api.org.createBranch({
        name: newBranchName,
        headName: newBranchHead,
        provinceId: selectedProvince.id
      });

      await fetchBranches(selectedProvince.id);
      
      setShowAddBranchModal(false);
      setNewBranchName('');
      setNewBranchHead('');
      toast.success('Cabang baru berhasil ditambahkan!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditDojo = (dojo: any) => {
    setSelectedDojo(dojo);
    setEditDojoName(dojo.name);
    setEditDojoPIC(dojo.contactPerson || '');
    setEditDojoAddress(dojo.address || '');
    setEditDojoKecamatan(dojo.kecamatan || '');
    setEditDojoVenue(dojo.tempatLatihan || '');
    setEditDojoPhone(dojo.phoneNumber || '');
    setEditDojoSchedule(dojo.schedule || '');
    setShowEditDojoModal(true);
  };

  const handleUpdateDojo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDojo || !editDojoName) return;

    setIsSubmitting(true);
    try {
      await api.org.updateDojo(selectedDojo.id, {
        name: editDojoName,
        contactPerson: editDojoPIC,
        address: editDojoAddress,
        kecamatan: editDojoKecamatan,
        tempatLatihan: editDojoVenue,
        phoneNumber: editDojoPhone,
        schedule: editDojoSchedule
      });

      await fetchDojos(selectedBranch.id);
      
      setShowEditDojoModal(false);
      setSelectedDojo(null);
      toast.success('Data dojo berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDojo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !newDojoName) return;

    setIsSubmitting(true);
    try {
      await api.org.createDojo({
        name: newDojoName,
        contactPerson: newDojoPIC,
        address: newDojoAddress,
        kecamatan: newDojoKecamatan,
        tempatLatihan: newDojoVenue,
        phoneNumber: newDojoPhone,
        schedule: newDojoSchedule,
        branchId: selectedBranch.id
      });

      await fetchDojos(selectedBranch.id);
      
      setShowAddDojoModal(false);
      setNewDojoName('');
      setNewDojoPIC('');
      setNewDojoAddress('');
      setNewDojoKecamatan('');
      setNewDojoVenue('');
      setNewDojoPhone('');
      setNewDojoSchedule('');
      toast.success('Dojo baru berhasil ditambahkan!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewMembers = (dojo: any) => {
    router.push(`/members?dojoId=${dojo.id}&dojoName=${encodeURIComponent(dojo.name)}&branchId=${selectedBranch?.id}&provinceId=${selectedProvince?.id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          {viewState !== 'provinces' && (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors mb-4 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">
                {viewState === 'dojos' ? `Kembali ke Cabang ${selectedProvince?.name}` : 'Kembali ke Daftar Wilayah'}
              </span>
            </button>
          )}
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Map size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">
              {viewState === 'provinces' ? 'Struktur Organisasi' : 
               viewState === 'details' ? 'Detail Wilayah' : 
               viewState === 'branches' ? 'Kelola Cabang' : 'Daftar Dojo'}
            </span>
          </div>
          <h2 className="text-3xl font-bold uppercase">
            {viewState === 'provinces' ? 'Hierarki Nasional' : 
             viewState === 'dojos' ? selectedBranch?.name : selectedProvince?.name}
          </h2>
          <p className="text-gray-500 mt-1">
            {viewState === 'provinces' 
              ? 'Pantau persebaran wilayah, cabang, dan dojo INKAI di seluruh Indonesia.'
              : viewState === 'dojos'
              ? `Daftar ranting/dojo yang terdaftar di bawah Cabang ${selectedBranch?.name}.`
              : `Manajemen data dan struktur organisasi untuk wilayah ${selectedProvince?.name}.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              suppressHydrationWarning={true}
              placeholder={
                viewState === 'provinces' ? "Cari wilayah..." :
                viewState === 'branches' ? `Cari cabang di ${selectedProvince?.name}...` :
                "Cari dojo..."
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {viewState === 'provinces' && (
            <button 
              onClick={() => setShowAddModal(true)}
              suppressHydrationWarning={true}
              className="btn-primary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
            >
              <Plus size={18} />
              Tambah Wilayah Baru
            </button>
          )}
          {viewState === 'branches' && (
            <button 
              onClick={() => setShowAddBranchModal(true)}
              suppressHydrationWarning={true}
              className="btn-primary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
            >
              <Plus size={18} />
              Tambah Cabang
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <Map className="absolute inset-0 m-auto text-amber-500 animate-pulse" size={24} />
          </div>
          <p className="text-gray-400 font-medium tracking-wide">Menyelaraskan data organisasi...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center glass-card border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter size={32} />
          </div>
          <h3 className="text-xl font-bold text-red-500 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold transition-all">
            Coba Lagi
          </button>
        </div>
      ) : viewState === 'provinces' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProvinces.map((prov) => (
            <div key={prov.id} className="glass-card group hover:scale-[1.01] hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 border border-white/5 hover:border-amber-500/20">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-amber-500/10">
                    {prov.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight group-hover:text-amber-500 transition-colors">{prov.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Ketua Pengprov: <span className="text-gray-300 font-semibold ml-1">{prov.headName || 'Belum diatur'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEditProvince(prov)}
                  className="p-2.5 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all active:scale-95"
                >
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-5 mb-8">
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 group-hover:bg-white/[0.04] transition-colors group-hover:border-amber-500/10">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Building2 size={14} className="text-amber-500/50" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Cabang</span>
                  </div>
                  <p className="text-2xl font-black">{prov._count?.branches || 0}</p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 group-hover:bg-white/[0.04] transition-colors group-hover:border-amber-500/10">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <MapPin size={14} className="text-amber-500/50" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Dojo</span>
                  </div>
                  <p className="text-2xl font-black">{prov.branches?.reduce((acc: number, b: any) => acc + (b._count?.dojos || 0), 0) || 0}</p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 group-hover:bg-white/[0.04] transition-colors group-hover:border-amber-500/10">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Users size={14} className="text-amber-500/50" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Anggota</span>
                  </div>
                  <p className="text-2xl font-black">{prov.branches?.reduce((acc: number, b: any) => acc + (b.dojos?.reduce((acc2: number, d: any) => acc2 + (d._count?.members || 0), 0) || 0), 0) || 0}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleViewDetails(prov)}
                  className="flex-[1.5] py-3 text-xs font-black uppercase tracking-widest border border-white/10 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn"
                >
                  Detail
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => handleManageBranches(prov)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-amber-500/5 border border-amber-500/10 rounded-2xl hover:bg-amber-500/10 text-amber-500 transition-all active:scale-95"
                >
                  Cabang
                </button>
              </div>
            </div>
          ))}
          
          {filteredProvinces.length === 0 && (
            <div className="col-span-2 py-20 text-center text-gray-500 glass-card">
              {searchQuery ? `Tidak ada wilayah yang cocok dengan "${searchQuery}"` : 'Belum ada data wilayah. Silakan tambah wilayah baru.'}
            </div>
          )}
        </div>
      ) : viewState === 'details' ? (
        <div className="glass-card p-10 animate-in fade-in slide-in-from-right-8 duration-700 border border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                <h4 className="text-lg font-black uppercase tracking-widest text-white">Informasi Strategis</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-tighter">Nama Wilayah</span>
                  <p className="text-xl font-bold text-white">{selectedProvince?.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-tighter">Ketua Pengprov</span>
                  <p className="text-xl font-bold text-white">{selectedProvince?.headName || 'Belum diatur'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-tighter">Total Cabang Terdaftar</span>
                  <p className="text-xl font-bold text-white">{selectedProvince?._count?.branches || 0} Cabang</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-tighter">Status Organisasi</span>
                  <div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-green-500/20">Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-amber-500/20">
                <Building2 size={48} />
              </div>
              <h4 className="font-bold text-2xl mb-2">Kelola Cabang</h4>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">Akses kontrol penuh untuk manajemen cabang dan dojo di wilayah ini.</p>
              <button 
                onClick={() => handleManageBranches(selectedProvince)}
                className="btn-primary w-full py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Buka Dashboard Cabang
              </button>
            </div>
          </div>
        </div>
      ) : viewState === 'branches' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          {branchesLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium tracking-wide">Memuat struktur cabang...</p>
            </div>
          ) : branches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBranches.map((branch) => (
                <div 
                  key={branch.id} 
                  onClick={() => handleViewDojos(branch)}
                  className="glass-card p-6 hover:bg-white/[0.04] transition-all border border-white/5 hover:border-amber-500/20 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-2 transition-all"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-xl tracking-tight mb-1 group-hover:text-amber-500 transition-colors">{branch.name}</h4>
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-gray-500" />
                        <p className="text-xs text-gray-400 font-medium">Ketua: <span className="text-gray-200">{branch.headName || 'Belum diatur'}</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditBranch(branch);
                      }}
                      className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all active:scale-90"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-6 py-4 border-t border-white/5 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center">
                        <MapPin size={14} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Dojo</p>
                        <p className="font-bold text-sm leading-none">{branch._count?.dojos || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center">
                        <Users size={14} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Anggota</p>
                        <p className="font-bold text-sm leading-none">{branch.dojos?.reduce((acc: number, d: any) => acc + (d._count?.members || 0), 0) || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setShowAddBranchModal(true)}
                className="border-2 border-dashed border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group active:scale-95 shadow-inner"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-amber-500/10 group-hover:scale-110 transition-all">
                  <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <div className="text-center">
                  <span className="block text-lg font-black uppercase tracking-widest">Tambah Cabang</span>
                  <span className="text-xs opacity-50 font-medium">Perluas jaringan organisasi</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="py-32 text-center glass-card border-white/5 bg-white/[0.01]">
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 opacity-20">
                <Building2 size={56} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Belum Ada Cabang</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-10 leading-relaxed">Struktur organisasi wilayah ini masih kosong. Mulai bangun jaringan dengan menambahkan cabang pertama.</p>
              <button 
                onClick={() => setShowAddBranchModal(true)}
                suppressHydrationWarning={true}
                className="px-8 py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-amber-400 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                Inisialisasi Cabang Baru
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          {dojosLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium tracking-wide">Memuat daftar dojo...</p>
            </div>
          ) : dojos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDojos.map((dojo) => (
                <div 
                  key={dojo.id} 
                  onClick={() => handleViewMembers(dojo)}
                  className="glass-card p-6 border border-white/5 hover:border-amber-500/20 transition-all group cursor-pointer hover:bg-white/[0.04] active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-xl tracking-tight mb-1 group-hover:text-amber-500 transition-colors uppercase">{dojo.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">PIC: <span className="text-gray-200 uppercase">{dojo.contactPerson || 'Belum diatur'}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDojo(dojo);
                        }}
                        className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                      >
                        <MoreVertical size={18} />
                      </button>
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                        <MapPin size={18} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-1 italic">"{dojo.address || 'Alamat belum ditambahkan'}"</p>
                  
                  <div className="grid grid-cols-2 gap-y-2 mb-6 border-t border-white/5 pt-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">Kecamatan</p>
                      <p className="text-[10px] font-bold text-gray-300 uppercase truncate">{dojo.kecamatan || '-'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">Tempat Latihan</p>
                      <p className="text-[10px] font-bold text-gray-300 uppercase truncate">{dojo.tempatLatihan || '-'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">No. WhatsApp</p>
                      <p className="text-[10px] font-bold text-amber-500 truncate">{dojo.phoneNumber || '-'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">Jadwal</p>
                      <p className="text-[10px] font-bold text-gray-300 truncate uppercase">{dojo.schedule || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-amber-500/20 transition-all">
                        <Users size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter leading-none mb-1">Anggota Aktif</p>
                        <p className="font-bold text-lg leading-none">{dojo._count?.members || 0}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMembers(dojo);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Lihat Anggota
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setShowAddDojoModal(true)}
                className="border-2 border-dashed border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group active:scale-95 shadow-inner"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-amber-500/10 group-hover:scale-110 transition-all">
                  <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <div className="text-center">
                  <span className="block text-lg font-black uppercase tracking-widest">Tambah Dojo</span>
                  <span className="text-xs opacity-50 font-medium">Tambah ranting baru</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="py-32 text-center glass-card border-white/5 bg-white/[0.01]">
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 opacity-20">
                <MapPin size={56} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Belum Ada Dojo</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-10 leading-relaxed">Cabang ini belum memiliki dojo atau ranting yang terdaftar.</p>
              <button 
                onClick={() => setShowAddDojoModal(true)}
                suppressHydrationWarning={true}
                className="px-8 py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-amber-400 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                Daftarkan Dojo Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Dojo Modal */}
      {showEditDojoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Dojo / Ranting</h3>
              <button 
                onClick={() => setShowEditDojoModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              >
                <MoreVertical size={20} className="rotate-90" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateDojo} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Dojo / Ranting</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={editDojoName}
                  onChange={(e) => setEditDojoName(e.target.value.toUpperCase())}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">PIC / Penanggung Jawab</label>
                <input 
                  type="text"
                  placeholder="Nama Penanggung Jawab"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={editDojoPIC}
                  onChange={(e) => setEditDojoPIC(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Alamat Dojo</label>
                <textarea 
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
                  value={editDojoAddress}
                  onChange={(e) => setEditDojoAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Kecamatan</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                    value={editDojoKecamatan}
                    onChange={(e) => setEditDojoKecamatan(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">No. WhatsApp</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={editDojoPhone}
                    onChange={(e) => setEditDojoPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Tempat Latihan</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                    value={editDojoVenue}
                    onChange={(e) => setEditDojoVenue(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Jadwal Latihan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Sen & Kam 16:00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                    value={editDojoSchedule}
                    onChange={(e) => setEditDojoSchedule(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEditDojoModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dojo Modal */}
      {showAddDojoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Tambah Dojo Baru</h3>
              <button 
                onClick={() => setShowAddDojoModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              >
                <MoreVertical size={20} className="rotate-90" />
              </button>
            </div>
            
            <form onSubmit={handleAddDojo} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Dojo / Ranting</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: DOJO PUSAT"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={newDojoName}
                  onChange={(e) => setNewDojoName(e.target.value.toUpperCase())}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">PIC / Penanggung Jawab</label>
                <input 
                  type="text"
                  placeholder="Nama Penanggung Jawab"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={newDojoPIC}
                  onChange={(e) => setNewDojoPIC(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Alamat Dojo</label>
                <textarea 
                  rows={2}
                  placeholder="Alamat lengkap tempat latihan"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
                  value={newDojoAddress}
                  onChange={(e) => setNewDojoAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Kecamatan</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                    value={newDojoKecamatan}
                    onChange={(e) => setNewDojoKecamatan(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">No. WhatsApp</label>
                  <input 
                    type="text"
                    placeholder="0812..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={newDojoPhone}
                    onChange={(e) => setNewDojoPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Tempat Latihan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: GOR SENAYAN"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                    value={newDojoVenue}
                    onChange={(e) => setNewDojoVenue(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Jadwal Latihan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Sen & Kam 16:00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                    value={newDojoSchedule}
                    onChange={(e) => setNewDojoSchedule(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddDojoModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Tambah Dojo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Province Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Tambah Wilayah Baru (PENGPROV)</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              >
                <MoreVertical size={20} className="rotate-90" />
              </button>
            </div>
            
            <form onSubmit={handleAddProvince} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Provinsi / Wilayah</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: DKI JAKARTA"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={newProvinceName}
                  onChange={(e) => setNewProvinceName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Ketua Pengprov</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap Beserta Gelar"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={newProvinceHead}
                  onChange={(e) => setNewProvinceHead(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Simpan Wilayah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Cabang</h3>
              <button 
                onClick={() => setShowEditBranchModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              >
                <MoreVertical size={20} className="rotate-90" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBranch} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Cabang</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={editBranchName}
                  onChange={(e) => setEditBranchName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Ketua Cabang</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={editBranchHead}
                  onChange={(e) => setEditBranchHead(e.target.value.toUpperCase())}
                />
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Akun Admin Cabang</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Admin</label>
                    <input 
                      type="email"
                      placeholder="admin.cabang@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Password Baru</label>
                    <input 
                      type="password"
                      placeholder="Isi untuk ubah password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEditBranchModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Province Modal */}
      {showEditProvinceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Wilayah (PENGPROV)</h3>
              <button 
                onClick={() => setShowEditProvinceModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              >
                <MoreVertical size={20} className="rotate-90" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProvince} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Provinsi / Wilayah</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={editProvinceName}
                  onChange={(e) => setEditProvinceName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Ketua Pengprov</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap Beserta Gelar"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={editProvinceHead}
                  onChange={(e) => setEditProvinceHead(e.target.value.toUpperCase())}
                />
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Akun Admin Wilayah</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Admin</label>
                    <input 
                      type="email"
                      placeholder="admin.wilayah@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Password Baru</label>
                    <input 
                      type="password"
                      placeholder="Isi untuk ubah password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEditProvinceModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Tambah Cabang Baru</h3>
              <button 
                onClick={() => setShowAddBranchModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              >
                <MoreVertical size={20} className="rotate-90" />
              </button>
            </div>
            
            <form onSubmit={handleAddBranch} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Cabang</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: JAKARTA PUSAT"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Ketua Cabang</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
                  value={newBranchHead}
                  onChange={(e) => setNewBranchHead(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Tambah Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500`}>
          <div className={`glass-card flex items-center gap-3 px-6 py-4 shadow-2xl border ${toast.type === 'success' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {toast.type === 'success' ? <UserCheck size={18} /> : <Filter size={18} />}
            </div>
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <Map className="absolute inset-0 m-auto text-amber-500 animate-pulse" size={24} />
        </div>
        <p className="text-gray-400 font-medium tracking-wide">Menyelaraskan data organisasi...</p>
      </div>
    }>
      <OrganizationContent />
    </Suspense>
  );
}
