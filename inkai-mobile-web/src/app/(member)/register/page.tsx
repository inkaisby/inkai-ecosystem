"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Eye, EyeOff, User, Mail, Smartphone, Lock, ShieldCheck, MapPin } from "lucide-react";
import CustomToast from "@/components/CustomToast/CustomToast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [dojos, setDojos] = useState<{ id: string; name: string }[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [dojoId, setDojoId] = useState('');
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingDojos, setIsLoadingDojos] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      setIsLoadingProvinces(true);
      try {
        const res = await api.org.getProvinces();
        if (!cancelled && res.status === 'success' && Array.isArray(res.data)) {
          setProvinces(res.data);
        }
      } catch {
        if (!cancelled) setToast({ show: true, message: 'Gagal memuat daftar provinsi.', type: 'error' });
      } finally {
        if (!cancelled) setIsLoadingProvinces(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const fetchBranches = async (pid: string) => {
    setIsLoadingBranches(true);
    try {
      const res = await api.org.getBranches(pid);
      if (res.status === 'success' && Array.isArray(res.data)) setBranches(res.data);
      else setBranches([]);
    } catch {
      setBranches([]);
      setToast({ show: true, message: 'Gagal memuat cabang.', type: 'error' });
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const fetchDojos = async (bid: string) => {
    setIsLoadingDojos(true);
    try {
      const res = await api.org.getDojos(bid);
      if (res.status === 'success' && Array.isArray(res.data)) setDojos(res.data);
      else setDojos([]);
    } catch {
      setDojos([]);
      setToast({ show: true, message: 'Gagal memuat dojo.', type: 'error' });
    } finally {
      setIsLoadingDojos(false);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProvinceId(val);
    setBranchId('');
    setDojoId('');
    setBranches([]);
    setDojos([]);
    if (val) void fetchBranches(val);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBranchId(val);
    setDojoId('');
    setDojos([]);
    if (val) void fetchDojos(val);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setToast({ show: true, message: 'Harap lengkapi semua kolom pendaftaran.', type: 'error' });
      return;
    }
    if (!dojoId) {
      setToast({ show: true, message: 'Silakan pilih Provinsi, Cabang, dan Dojo/Ranting.', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      await api.auth.register({
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        password: formData.password,
        dojoId,
      });
      
      const loginResult = await login(formData.email, formData.password);
      
      if (loginResult.ok) {
        setToast({ show: true, message: 'Pendaftaran berhasil! Mengarahkan ke profil...', type: 'success' });
        setTimeout(() => {
          router.push('/profile/edit?new_user=true');
        }, 1500);
      } else {
        setToast({ show: true, message: 'Pendaftaran berhasil! Silakan login.', type: 'success' });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh', backgroundColor: 'var(--background-dark)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Blurs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '70%', height: '70%', backgroundColor: 'var(--ambient-orb-amber)', filter: 'blur(100px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', backgroundColor: 'var(--ambient-orb-blue)', filter: 'blur(100px)', borderRadius: '50%' }} />
      </div>

      <div className="flex flex-col py-6" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px', margin: '0 auto', flex: 1 }}>
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-10 font-black uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}
            disabled={isLoading}
          >
            <ArrowLeft size={16} /> Kembali
          </button>

          <h1 className="text-2xl font-black text-white mb-2">Pendaftaran Anggota</h1>
          <p className="text-gray-500 text-10 font-bold uppercase tracking-widest">Pilih dojo, lalu lengkapi kontak dan kata sandi</p>
          <p className="text-gray-400 text-xs leading-relaxed mt-3">
            Nomor Induk Anggota (NIA) mengikuti proses verifikasi pengurus setelah Anda melengkapi profil dan dokumen di langkah berikutnya.
          </p>
        </motion.div>
        
        {/* Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6 shadow-2xl"
          style={{ borderRadius: '2rem' }}
        >
          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }}>
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  className="glass-input w-full py-4 pl-12 pr-4 text-sm" 
                  placeholder="Masukkan nama lengkap" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            {/* Wilayah latihan */}
            <div className="space-y-4 pb-2 border-b border-white/5">
              <p className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Wilayah latihan</p>

              <div className="space-y-2">
                <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Provinsi</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2, pointerEvents: 'none' }}>
                    <MapPin size={18} />
                  </div>
                  <select
                    className="glass-input w-full py-4 pl-12 pr-10 text-sm appearance-none cursor-pointer disabled:opacity-40"
                    value={provinceId}
                    onChange={handleProvinceChange}
                    required
                    disabled={isLoading || isLoadingProvinces}
                  >
                    <option value="">Pilih provinsi</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {isLoadingProvinces && (
                    <Loader2 className="animate-spin" size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Cabang</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2, pointerEvents: 'none' }}>
                    <MapPin size={18} />
                  </div>
                  <select
                    className="glass-input w-full py-4 pl-12 pr-10 text-sm appearance-none cursor-pointer disabled:opacity-40"
                    value={branchId}
                    onChange={handleBranchChange}
                    required
                    disabled={isLoading || !provinceId || isLoadingBranches}
                  >
                    <option value="">Pilih cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {isLoadingBranches && (
                    <Loader2 className="animate-spin" size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Dojo / Ranting</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2, pointerEvents: 'none' }}>
                    <MapPin size={18} />
                  </div>
                  <select
                    className="glass-input w-full py-4 pl-12 pr-10 text-sm appearance-none cursor-pointer disabled:opacity-40"
                    value={dojoId}
                    onChange={(e) => setDojoId(e.target.value)}
                    required
                    disabled={isLoading || !branchId || isLoadingDojos}
                  >
                    <option value="">Pilih dojo atau ranting</option>
                    {dojos.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {isLoadingDojos && (
                    <Loader2 className="animate-spin" size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
                  )}
                </div>
              </div>

              <p className="text-gray-500 text-[11px] italic ml-1 leading-snug -mt-1">
                Pilihan dojo tidak dapat diubah sendiri setelah pendaftaran.
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  className="glass-input w-full py-4 pl-12 pr-4 text-sm" 
                  placeholder="email@contoh.com" 
                  required 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }}>
                  <Smartphone size={18} />
                </div>
                <input 
                  type="tel" 
                  className="glass-input w-full py-4 pl-12 pr-4 text-sm" 
                  placeholder="Contoh: 08123456789" 
                  required 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }}>
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="glass-input w-full py-4 pl-12 pr-12 text-sm" 
                  placeholder="••••••••" 
                  required 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  disabled={isLoading} 
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest"
              style={{ marginTop: '2rem', fontSize: '0.7rem', padding: '1.2rem', boxShadow: '0 8px 20px -6px rgba(245, 158, 11, 0.3)' }}
              disabled={isLoading}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>DAFTAR SEKARANG</span>
                  </>
                )}
              </div>
            </motion.button>
          </form>
        </motion.div>
      </div>

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
