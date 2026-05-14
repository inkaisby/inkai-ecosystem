'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Map, 
  ChevronRight, 
  ChevronLeft,
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
import AdminModalPortal from '@/components/admin/AdminModalPortal';

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
  const [editProvinceId, setEditProvinceId] = useState('');
  const [editProvinceName, setEditProvinceName] = useState('');
  const [editProvinceHead, setEditProvinceHead] = useState('');
  
  // Edit Branch states
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [editBranchId, setEditBranchId] = useState('');
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchHead, setEditBranchHead] = useState('');
  
  // Add Branch states
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchHead, setNewBranchHead] = useState('');
  
  // Edit Dojo states
  const [showEditDojoModal, setShowEditDojoModal] = useState(false);
  const [selectedDojo, setSelectedDojo] = useState<any | null>(null);
  const [editDojoId, setEditDojoId] = useState('');
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
  const [user, setUser] = useState<any>(null);
  

  useEffect(() => {
    initData();
  }, [searchParams]);

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
        const currentUser = JSON.parse(userData);
        setUser(currentUser);
        if (currentUser.managedDojoId) {
          const prov = response.data[0];
          if (prov) {
            setSelectedProvince(prov);
            const branchRes = await api.org.getBranches(prov.id);
            setBranches(branchRes.data);
            const branch = branchRes.data[0];
            if (branch) {
              setSelectedBranch(branch);
              setViewState('dojos');
              await fetchDojos(branch.id);
              return;
            }
          }
        } else if (currentUser.managedBranchId) {
          const prov = response.data[0];
          if (prov) {
            setSelectedProvince(prov);
            const branchRes = await api.org.getBranches(prov.id);
            setBranches(branchRes.data);
            const branch = branchRes.data.find((b: any) => b.id === currentUser.managedBranchId);
            if (branch) {
              setSelectedBranch(branch);
              setViewState('dojos');
              await fetchDojos(branch.id);
              return; // Stop here for branch admin
            }
          }
        } else if (currentUser.managedProvinceId) {
          const prov = response.data.find((p: any) => p.id === currentUser.managedProvinceId);
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

  const fetchProvinces = async () => {
    try {
      const response = await api.org.getProvinces();
      setProvinces(response.data);
    } catch (err: any) {
      console.error(err);
    }
  };

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

  const handleManageDojos = (branch: any) => {
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
        headName: newProvinceHead,
        adminEmail,
        adminPassword
      });
      
      await fetchProvinces();
      
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

  const handleOpenEditProvince = (province: any) => {
    setEditProvinceId(province.id);
    setEditProvinceName(province.name);
    setEditProvinceHead(province.headName || '');
    setAdminEmail(province.admins?.[0]?.email || '');
    setAdminPassword('');
    setShowEditProvinceModal(true);
  };

  const handleUpdateProvince = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProvinceId || !editProvinceName) return;

    setIsSubmitting(true);
    try {
      await api.org.updateProvince(editProvinceId, {
        name: editProvinceName,
        headName: editProvinceHead,
        adminEmail,
        adminPassword
      });

      await fetchProvinces();
      setShowEditProvinceModal(false);
      setEditProvinceId('');
      toast.success('Data provinsi berhasil diperbarui!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan sistem';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditBranch = (branch: any) => {
    setEditBranchId(branch.id);
    setEditBranchName(branch.name);
    setEditBranchHead(branch.headName || '');
    setAdminEmail(branch.admins?.[0]?.email || '');
    setAdminPassword('');
    setShowEditBranchModal(true);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchId || !editBranchName || !selectedProvince) return;

    setIsSubmitting(true);
    try {
      await api.org.updateBranch(editBranchId, {
        name: editBranchName,
        headName: editBranchHead,
        adminEmail,
        adminPassword
      });

      await fetchBranches(selectedProvince.id);
      
      setShowEditBranchModal(false);
      setEditBranchId('');
      toast.success('Data cabang berhasil diperbarui!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan sistem';
      toast.error(msg);
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
        provinceId: selectedProvince.id,
        adminEmail,
        adminPassword
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
    setEditDojoId(dojo.id);
    setEditDojoName(dojo.name);
    setEditDojoPIC(dojo.contactPerson || '');
    setEditDojoAddress(dojo.address || '');
    setEditDojoKecamatan(dojo.kecamatan || '');
    setEditDojoVenue(dojo.tempatLatihan || '');
    setEditDojoPhone(dojo.phoneNumber || '');
    setEditDojoSchedule(dojo.schedule || '');
    setAdminEmail(dojo.admins?.[0]?.email || '');
    setAdminPassword('');
    setShowEditDojoModal(true);
  };

  const handleUpdateDojo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDojoId || !editDojoName || !selectedBranch) return;

    setIsSubmitting(true);
    try {
      await api.org.updateDojo(editDojoId, {
        name: editDojoName,
        contactPerson: editDojoPIC,
        address: editDojoAddress,
        kecamatan: editDojoKecamatan,
        tempatLatihan: editDojoVenue,
        phoneNumber: editDojoPhone,
        schedule: editDojoSchedule,
        adminEmail,
        adminPassword
      });

      await fetchDojos(selectedBranch.id);
      
      setShowEditDojoModal(false);
      setEditDojoId('');
      toast.success('Data dojo berhasil diperbarui!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan sistem';
      toast.error(msg);
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
        branchId: selectedBranch.id,
        adminEmail,
        adminPassword
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
    router.push(`/admin/members?dojoId=${dojo.id}&dojoName=${encodeURIComponent(dojo.name)}&branchId=${selectedBranch?.id}&provinceId=${selectedProvince?.id}`);
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={viewState === 'provinces' ? () => router.push('/admin') : handleBack}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center border-2 border-white/10 shadow-lg shadow-amber-500/20">
                <span className="text-black font-black text-sm">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 leading-none mb-1.5 truncate max-w-[150px]">
                  {user?.roles?.[0] === 'ADMINISTRATOR' || user?.roles?.[0] === 'ADMIN_PUSAT' ? 'Pengurus Pusat' :
                   user?.roles?.[0] === 'ADMIN_PROVINCE' ? (user?.managedProvinceName || 'Provinsi') :
                   user?.roles?.[0] === 'ADMIN_BRANCH' ? (user?.managedBranchName || 'Cabang') :
                   user?.roles?.[0] === 'ADMIN_DOJO' ? (user?.managedDojoName || 'Dojo / Ranting') :
                   'Administrator'}
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-[9px] font-bold text-white/60 tracking-wider">
                    {user?.roles?.[0] === 'ADMINISTRATOR' ? 'Super Admin' :
                     user?.roles?.[0] === 'ADMIN_PUSAT' ? 'Admin Pusat' :
                     user?.roles?.[0] === 'ADMIN_PROVINCE' ? 'Admin Provinsi' :
                     user?.roles?.[0] === 'ADMIN_BRANCH' ? 'Admin Cabang' :
                     user?.roles?.[0] === 'ADMIN_DOJO' ? 'Admin Dojo' :
                     'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (viewState === 'provinces') setShowAddModal(true);
              else if (viewState === 'branches') setShowAddBranchModal(true);
              else if (viewState === 'dojos') setShowAddDojoModal(true);
            }}
            className="p-2.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-90 shadow-lg shadow-amber-500/20"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-amber-500 transition-colors">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder={
              viewState === 'provinces' ? "Cari wilayah..." : 
              viewState === 'branches' ? "Cari cabang..." : "Cari dojo..."
            }
            className="glass-input w-full py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all text-white placeholder:text-gray-600 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
        <div className="grid grid-cols-1 gap-5">
          {filteredProvinces.map((prov) => (
            <div 
              key={prov.id} 
              className="modal-gradient p-6 rounded-2xl border border-white-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500"
            >
              {/* Subtle background glow */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center font-black text-xl text-black shadow-lg shadow-amber-500/20">
                    {prov.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-1">{prov.name}</h3>
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ketua: {prov.headName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEditProvince(prov)}
                  className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-all"
                >
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 my-6">
                <div className="p-3.5 bg-white-5 rounded-2xl border border-white-5 text-center group-hover:border-white-10 transition-colors">
                  <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1.5">Cabang</p>
                  <p className="text-lg font-black text-white">{prov._count?.branches || 0}</p>
                </div>
                <div className="p-3.5 bg-white-5 rounded-2xl border border-white-5 text-center group-hover:border-white-10 transition-colors">
                  <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1.5">Dojo</p>
                  <p className="text-lg font-black text-white">{prov.branches?.reduce((acc: number, b: any) => acc + (b._count?.dojos || 0), 0) || 0}</p>
                </div>
                <div className="p-3.5 bg-white-5 rounded-2xl border border-white-5 text-center group-hover:border-white-10 transition-colors">
                  <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1.5">Anggota</p>
                  <p className="text-lg font-black text-white">{prov.branches?.reduce((acc: number, b: any) => acc + (b.dojos?.reduce((acc2: number, d: any) => acc2 + (d._count?.members || 0), 0) || 0), 0) || 0}</p>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button 
                  onClick={() => handleViewDetails(prov)}
                  className="btn-secondary flex-1 py-3 text-[10px] font-black uppercase tracking-widest"
                >
                  Detail
                </button>
                <button 
                  onClick={() => handleManageBranches(prov)}
                  className="btn-primary flex-[2] py-3 text-[10px] font-black uppercase tracking-widest shadow-amber-20"
                >
                  Kelola Cabang
                </button>
              </div>
            </div>
          ))}
          
          {filteredProvinces.length === 0 && (
            <div className="modal-gradient p-16 rounded-2xl text-center text-gray-500 text-xs italic border border-dashed border-white-10">
              Tidak ada data wilayah ditemukan.
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
        <div className="grid grid-cols-1 gap-5">
          {filteredBranches.map((branch) => (
            <div 
              key={branch.id} 
              className="modal-gradient p-6 rounded-2xl border border-white-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center font-black text-xl text-black shadow-lg shadow-amber-500/20">
                    <Building2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-1">{branch.name}</h3>
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ketua: {branch.headName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEditBranch(branch)}
                  className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-all"
                >
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-3.5 bg-white-5 rounded-2xl border border-white-5 text-center">
                  <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1.5 text-center">Total Dojo</p>
                  <p className="text-lg font-black text-white text-center">{branch._count?.dojos || 0}</p>
                </div>
                <div className="p-3.5 bg-white-5 rounded-2xl border border-white-5 text-center">
                  <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1.5 text-center">Anggota</p>
                  <p className="text-lg font-black text-white text-center">{branch.dojos?.reduce((acc: number, d: any) => acc + (d._count?.members || 0), 0) || 0}</p>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button 
                  onClick={() => handleManageDojos(branch)}
                  className="btn-primary flex-1 py-3 text-[10px] font-black uppercase tracking-widest shadow-amber-20"
                >
                  Kelola Dojo / Ranting
                </button>
              </div>
            </div>
          ))}
          
          {filteredBranches.length === 0 && (
            <div className="modal-gradient p-16 rounded-2xl text-center text-gray-500 text-xs italic border border-dashed border-white-10">
              Tidak ada data cabang ditemukan.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredDojos.map((dojo) => (
            <div 
              key={dojo.id} 
              className="modal-gradient p-6 rounded-2xl border border-white-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                    <MapPin size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-1">{dojo.name}</h3>
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">PIC: {dojo.headName || dojo.contactPerson || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEditDojo(dojo)}
                  className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-all"
                >
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-3.5 bg-white-5 rounded-2xl border border-white-5">
                  <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1.5 text-center">Kecamatan</p>
                  <p className="text-xs font-bold text-white text-center truncate">{dojo.kecamatan || 'N/A'}</p>
                </div>
                <div className="p-3.5 bg-white-5 rounded-2xl border border-white-5">
                  <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1.5 text-center">Anggota</p>
                  <p className="text-lg font-black text-white text-center">{dojo._count?.members || 0}</p>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button 
                  onClick={() => handleViewMembers(dojo)}
                  className="btn-primary flex-1 py-3 text-[10px] font-black uppercase tracking-widest shadow-amber-20"
                >
                  Lihat Anggota
                </button>
              </div>
            </div>
          ))}
          {filteredDojos.length === 0 && (
            <div className="modal-gradient p-16 rounded-2xl text-center text-gray-500 text-xs italic border border-dashed border-white-10">
              Tidak ada data dojo ditemukan.
            </div>
          )}
        </div>
      )}

      {/* Edit Dojo Modal */}
      {showEditDojoModal && (
        <AdminModalPortal>
        <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
          <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Edit Dojo / Ranting</h3>
              <button 
                onClick={() => setShowEditDojoModal(false)}
                className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateDojo} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-amber-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Dojo / Ranting</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={editDojoName}
                  onChange={(e) => setEditDojoName(e.target.value.toUpperCase())}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Ketua / PIC</label>
                <input 
                  type="text"
                  placeholder="Nama Penanggung Jawab"
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={editDojoPIC}
                  onChange={(e) => setEditDojoPIC(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Alamat Dojo</label>
                <textarea 
                  rows={2}
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                  value={editDojoAddress}
                  onChange={(e) => setEditDojoAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Kecamatan</label>
                  <input 
                    type="text"
                    className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                    value={editDojoKecamatan}
                    onChange={(e) => setEditDojoKecamatan(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">No. WhatsApp</label>
                  <input 
                    type="text"
                    className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                    value={editDojoPhone}
                    onChange={(e) => setEditDojoPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Tempat Latihan</label>
                  <input 
                    type="text"
                    className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                    value={editDojoVenue}
                    onChange={(e) => setEditDojoVenue(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Jadwal Latihan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Sen & Kam 16:00"
                    className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                    value={editDojoSchedule}
                    onChange={(e) => setEditDojoSchedule(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Akun Admin Dojo</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Email Admin</label>
                    <input 
                      type="email"
                      required
                      placeholder="admin.dojo@email.com"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Password Baru</label>
                    <input 
                      type="password"
                      placeholder="Isi untuk ubah password"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowEditDojoModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* Add Dojo Modal */}
      {showAddDojoModal && (
        <AdminModalPortal>
        <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
          <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Tambah Dojo Baru</h3>
              <button 
                onClick={() => setShowAddDojoModal(false)}
                className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddDojo} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nama Dojo</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: DOJO PUSAT"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white uppercase focus:border-amber-500/50"
                  value={newDojoName}
                  onChange={(e) => setNewDojoName(e.target.value.toUpperCase())}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Ketua / PIC</label>
                <input 
                  type="text"
                  placeholder="Nama Penanggung Jawab"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white uppercase"
                  value={newDojoPIC}
                  onChange={(e) => setNewDojoPIC(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Alamat</label>
                <textarea 
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                  value={newDojoAddress}
                  onChange={(e) => setNewDojoAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Kecamatan</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white uppercase"
                    value={newDojoKecamatan}
                    onChange={(e) => setNewDojoKecamatan(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">WhatsApp</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                    value={newDojoPhone}
                    onChange={(e) => setNewDojoPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Akun Admin Dojo</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Admin</label>
                    <input 
                      type="email"
                      required
                      placeholder="admin.dojo@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Password</label>
                    <input 
                      type="password"
                      placeholder="Min. 6 karakter"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddDojoModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Daftar'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* Add Province Modal */}
      {showAddModal && (
        <AdminModalPortal>
        <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
          <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Tambah Wilayah Baru</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddProvince} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-amber-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Provinsi / Wilayah</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: DKI JAKARTA"
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={newProvinceName}
                  onChange={(e) => setNewProvinceName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Ketua Pengprov</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap Beserta Gelar"
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={newProvinceHead}
                  onChange={(e) => setNewProvinceHead(e.target.value.toUpperCase())}
                />
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Akun Admin Wilayah</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Email Admin</label>
                    <input 
                      type="email"
                      required
                      placeholder="admin.provinsi@email.com"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="Min. 6 karakter"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
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
                  disabled={isSubmitting}
                  className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* Edit Branch Modal */}
      {showEditBranchModal && (
        <AdminModalPortal>
        <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
          <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Edit Cabang</h3>
              <button 
                onClick={() => setShowEditBranchModal(false)}
                className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBranch} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-amber-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Cabang</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={editBranchName}
                  onChange={(e) => setEditBranchName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Ketua Cabang</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap"
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={editBranchHead}
                  onChange={(e) => setEditBranchHead(e.target.value.toUpperCase())}
                />
              </div>

              <div className="pt-4 border-t border-white-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Akun Admin Cabang</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Email Admin</label>
                    <input 
                      type="email"
                      required
                      placeholder="admin.cabang@email.com"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Password Baru</label>
                    <input 
                      type="password"
                      placeholder="Isi untuk ubah password"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowEditBranchModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* Edit Province Modal */}
      {showEditProvinceModal && (
        <AdminModalPortal>
        <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
          <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Edit Wilayah (PENGPROV)</h3>
              <button 
                onClick={() => setShowEditProvinceModal(false)}
                className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProvince} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-amber-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Provinsi / Wilayah</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={editProvinceName}
                  onChange={(e) => setEditProvinceName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Ketua Pengprov</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap Beserta Gelar"
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={editProvinceHead}
                  onChange={(e) => setEditProvinceHead(e.target.value.toUpperCase())}
                />
              </div>

              <div className="pt-4 border-t border-white-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Akun Admin Wilayah</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Email Admin</label>
                    <input 
                      type="email"
                      required
                      placeholder="admin.wilayah@email.com"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Password Baru</label>
                    <input 
                      type="password"
                      placeholder="Isi untuk ubah password"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowEditProvinceModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <AdminModalPortal>
        <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
          <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Tambah Cabang Baru</h3>
              <button 
                onClick={() => setShowAddBranchModal(false)}
                className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddBranch} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-amber-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Cabang</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: JAKARTA PUSAT"
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Nama Ketua Cabang</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap"
                  className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                  value={newBranchHead}
                  onChange={(e) => setNewBranchHead(e.target.value.toUpperCase())}
                />
              </div>

              <div className="pt-4 border-t border-white-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Akun Admin Cabang</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Email Admin</label>
                    <input 
                      type="email"
                      required
                      placeholder="admin.cabang@email.com"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="Min. 6 karakter"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none font-bold tracking-tight"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* Modals Container */}
      <div className="space-y-4">
        {/* Modals are handled below */}
      </div>
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
