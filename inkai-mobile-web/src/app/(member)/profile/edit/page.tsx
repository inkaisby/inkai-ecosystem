"use client";

import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, User, Phone, MapPin, Calendar, Loader2, AlertTriangle, CheckCircle2, Home, MapPinned, ShieldCheck, CheckCircle } from "lucide-react";
import styles from "./EditProfile.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import api, { getAssetUrl } from "@/lib/api";
import { compressImage } from "@/lib/imageUtils";

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new_user') === 'true';
  const { user, isLoading: isAuthLoading, isAdmin, fetchProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isDojoLocked = !!(user?.dojoId || user?.member?.dojoId);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: 'MALE',
    birthPlace: '',
    birthDate: '',
    address: '',
    birthCertificateUrl: '',
    bpjsCardUrl: '',
    provinceId: '',
    branchId: '',
    dojoId: '',
    nik: ''
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [dojos, setDojos] = useState<any[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingDojos, setIsLoadingDojos] = useState(false);

  // Helper to convert base64 to File
  const base64ToFile = (base64: string, filename: string) => {
    try {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      return null;
    }
  };

  // Check if profile is complete
  const auditFields = [
    { key: 'fullName', label: 'Nama Lengkap', isComplete: !!formData.fullName },
    { key: 'nik', label: 'NIK', isComplete: !!formData.nik && formData.nik.length === 16 },
    { key: 'phoneNumber', label: 'Nomor WhatsApp', isComplete: !!formData.phoneNumber },
    { key: 'gender', label: 'Jenis Kelamin', isComplete: !!formData.gender },
    { key: 'birthPlace', label: 'Tempat Lahir', isComplete: !!formData.birthPlace },
    { key: 'birthDate', label: 'Tanggal Lahir', isComplete: !!formData.birthDate },
    { key: 'address', label: 'Alamat Lengkap', isComplete: !!formData.address },
    { key: 'dojoId', label: 'Dojo/Ranting', isComplete: !!formData.dojoId },
    { key: 'photo', label: 'Foto Profil', isComplete: !!photoPreview || !!user?.photoUrl },
  ];

  // Identify which fields have changed compared to the database
  const changedFields = (() => {
    if (!user) return [];
    const fields = [];
    const dbFullName = user.fullName || '';
    const dbPhoneNumber = user.phoneNumber || '';
    const dbGender = user.gender || user.member?.gender || 'MALE';
    const dbBirthPlace = user.birthPlace || user.member?.birthPlace || '';
    const dbBirthDate = user.birthDate || user.member?.birthDate;
    const dbAddress = user.address || user.member?.address || '';
    const dbDojoId = user.dojoId || user.member?.dojoId || '';

    if (formData.fullName !== dbFullName) fields.push('Nama Lengkap');
    if (formData.nik !== (user.nik || user.member?.nik || '')) fields.push('NIK');
    if (formData.phoneNumber !== dbPhoneNumber) fields.push('Nomor WhatsApp');
    if (formData.gender !== dbGender) fields.push('Jenis Kelamin');
    if (formData.birthPlace !== dbBirthPlace) fields.push('Tempat Lahir');
    
    const dbDateStr = dbBirthDate ? new Date(dbBirthDate).toISOString().split('T')[0] : '';
    if (formData.birthDate !== dbDateStr) fields.push('Tanggal Lahir');
    
    if (formData.address !== dbAddress) fields.push('Alamat');
    if (formData.dojoId !== dbDojoId) fields.push('Dojo/Ranting');
    if (photoFile) fields.push('Foto Profil');
    
    return fields;
  })();

  const isDirty = changedFields.length > 0;
  const isProfileComplete = isAdmin || auditFields.every(f => f.isComplete);

  // Manual Save Logic
  const handleSave = async () => {
    if (!isDirty || isSaving || phoneError) return;
    
    setIsSaving(true);
    try {
      if (photoFile) {
        const photoData = new FormData();
        photoData.append('photo', photoFile);
        await api.auth.uploadPhoto(photoData);
        setPhotoFile(null); 
      }
      
      await api.auth.updateProfile(formData);
      await fetchProfile();
      setLastSaved(new Date());
      localStorage.removeItem(`profile_draft_${user?.id}`);
      setToast({ show: true, message: 'Profil berhasil diperbarui', type: 'success' });
    } catch (error: any) {
      console.error('Save failed:', error);
      setToast({ 
        show: true, 
        message: error.response?.data?.message || 'Gagal menyimpan profil. Silakan coba lagi.', 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user && (!mounted || !isDirty)) {
      const provinceId = user.dojo?.branch?.provinceId || user.member?.dojo?.branch?.provinceId || '';
      const branchId = user.dojo?.branchId || user.member?.dojo?.branchId || '';
      const dojoId = user.dojoId || user.member?.dojoId || '';

      const initialData = {
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || user.member?.gender || 'MALE',
        birthPlace: user.birthPlace || user.member?.birthPlace || '',
        birthDate: (user.birthDate || user.member?.birthDate) ? new Date(user.birthDate || user.member?.birthDate).toISOString().split('T')[0] : '',
        address: user.address || user.member?.address || '',
        birthCertificateUrl: user.birthCertificateUrl || user.member?.birthCertificateUrl || '',
        bpjsCardUrl: user.bpjsCardUrl || user.member?.bpjsCardUrl || '',
        provinceId,
        branchId,
        dojoId,
        nik: user.nik || user.member?.nik || ''
      };

      // If first mount, check localStorage draft
      if (!mounted) {
        const savedDraft = localStorage.getItem(`profile_draft_${user.id}`);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            setFormData({ ...initialData, ...parsed.formData });
            if (parsed.photoPreview) {
              setPhotoPreview(parsed.photoPreview);
              const file = base64ToFile(parsed.photoPreview, 'draft_photo.png');
              if (file) setPhotoFile(file);
            }
          } catch (e) {
            setFormData(initialData);
          }
        } else {
          setFormData(initialData);
        }
        setMounted(true);
      } else {
        // Just sync with DB state if not dirty
        setFormData(initialData);
      }

      fetchProvinces();
      if (provinceId) fetchBranches(provinceId);
      if (branchId) fetchDojos(branchId);
    }
  }, [user, mounted, isDirty]);

  // Draft persistence (fallback)
  useEffect(() => {
    if (mounted && isDirty && user) {
      const draft = {
        formData,
        photoPreview: photoPreview?.startsWith('data:') ? photoPreview : null
      };
      localStorage.setItem(`profile_draft_${user.id}`, JSON.stringify(draft));
    }
  }, [formData, photoPreview, isDirty, mounted, user]);

  const fetchProvinces = async () => {
    setIsLoadingProvinces(true);
    try {
      const res = await api.org.getProvinces();
      if (res.status === 'success') setProvinces(res.data);
    } catch (error) {
      console.error('Failed to fetch provinces', error);
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  const fetchBranches = async (provinceId: string) => {
    setIsLoadingBranches(true);
    try {
      const res = await api.org.getBranches(provinceId);
      if (res.status === 'success') setBranches(res.data);
    } catch (error) {
      console.error('Failed to fetch branches', error);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const fetchDojos = async (branchId: string) => {
    setIsLoadingDojos(true);
    try {
      const res = await api.org.getDojos(branchId);
      if (res.status === 'success') setDojos(res.data);
    } catch (error) {
      console.error('Failed to fetch dojos', error);
    } finally {
      setIsLoadingDojos(false);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, provinceId: val, branchId: '', dojoId: '' }));
    setBranches([]);
    setDojos([]);
    if (val) fetchBranches(val);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, branchId: val, dojoId: '' }));
    setDojos([]);
    if (val) fetchDojos(val);
  };

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    const cleanValue = value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, phoneNumber: cleanValue });

    if (cleanValue.length === 0) {
      setPhoneError(null);
    } else if (cleanValue.length < 10) {
      setPhoneError("Nomor WhatsApp minimal 10 digit");
    } else if (!cleanValue.startsWith('08') && !cleanValue.startsWith('62')) {
      setPhoneError("Nomor harus dimulai dengan 08 atau 62");
    } else {
      setPhoneError(null);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressImage(file, 250);
        setPhotoFile(compressed);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(compressed);
      } catch (err) {
        console.error('Photo compression failed', err);
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => {
          router.back();
        }} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>EDIT PROFIL</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isDirty && !isSaving && !phoneError && (
            <button 
              onClick={handleSave}
              style={{ 
                backgroundColor: 'var(--primary-gold)', 
                color: 'black', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                fontSize: '12px', 
                fontWeight: 'bold' 
              }}
            >
              SIMPAN
            </button>
          )}
          <div style={{ fontSize: '11px', fontWeight: '500' }}>
            {isSaving ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}>
                <Loader2 size={12} className={styles.spinner} /> Sinkronisasi...
              </div>
            ) : lastSaved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                <CheckCircle2 size={12} /> Data Tersimpan
              </div>
            ) : isDirty ? (
              <div style={{ color: '#f59e0b' }}>Menunggu input...</div>
            ) : null}
          </div>
        </div>
      </header>

      {isNewUser ? (
        <div style={{ padding: '16px', backgroundColor: 'rgba(255,193,7,0.1)', color: '#ffc107', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', fontSize: '14px' }}>
          Selamat datang! Silakan lengkapi data profil Anda terlebih dahulu.
        </div>
      ) : !isProfileComplete ? (
        <div className={styles.auditPanel}>
          <div className={styles.auditHeading}>
            <AlertTriangle size={18} />
            Mode Audit: Profil Belum Lengkap
          </div>
          <div className={styles.auditGrid}>
            {auditFields.map(f => (
              <div
                key={f.key}
                className={`${styles.auditField} ${f.isComplete ? styles.auditFieldDone : ""}`}
              >
                {f.isComplete ? <CheckCircle2 size={14} /> : <div className={styles.auditDot} />}
                <span style={{ textDecoration: f.isComplete ? "line-through" : "none" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <form className={styles.form} onSubmit={(e) => e.preventDefault()} style={{ paddingBottom: '120px' }}>
        <div className={styles.field} style={{ alignItems: 'center' }}>
          <label className={styles.label}>Foto Profil</label>
          <div className={styles.avatarWrapper}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange}
              className={styles.fileInput}
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className={styles.avatarLabel}>
              {photoPreview || user?.photoUrl ? (
                 <img src={photoPreview || getAssetUrl(user?.photoUrl)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="#666" />
              )}
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Ketuk untuk mengganti foto</p>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>NIK (Nomor Induk Kependudukan)</label>
          <div className={styles.inputWrapper}>
            <ShieldCheck size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              className={styles.input}
              placeholder="16 Digit NIK"
              value={formData.nik || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                setFormData({...formData, nik: val});
              }}
              required
            />
          </div>
          {formData.nik && formData.nik.length !== 16 && (
            <p className={styles.errorText}>NIK harus berjumlah 16 digit</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nama Lengkap</label>
          <div className={styles.inputWrapper}>
            <User size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              className={`${styles.input} ${styles.uppercase}`}
              value={formData.fullName || ''}
              onChange={(e) => {
                setFormData({...formData, fullName: e.target.value.toUpperCase()});
              }}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nomor WhatsApp</label>
          <div className={`${styles.inputWrapper} ${phoneError ? styles.inputError : ''}`}>
            <Phone size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              className={styles.input}
              value={formData.phoneNumber || ''}
              onChange={handlePhoneChange}
              placeholder="Contoh: 08123456789"
              required
            />
          </div>
          {phoneError && <p className={styles.errorText}>{phoneError}</p>}
        </div>

        {/* Member/Profile specific fields - Always visible for profile completion */}
        <div className={styles.field}>
          <label className={styles.label}>Jenis Kelamin</label>
          <div className={styles.radioGroup}>
            <button 
              type="button" 
              className={`${styles.radioBtn} ${formData.gender === 'MALE' ? styles.radioActive : ''}`}
              onClick={() => {
                setFormData({...formData, gender: 'MALE'});
              }}
            >
              Laki-laki
            </button>
            <button 
              type="button" 
              className={`${styles.radioBtn} ${formData.gender === 'FEMALE' ? styles.radioActive : ''}`}
              onClick={() => {
                setFormData({...formData, gender: 'FEMALE'});
              }}
            >
              Perempuan
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tempat Lahir</label>
          <div className={styles.inputWrapper}>
            <MapPinned size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              className={`${styles.input} ${styles.uppercase}`}
              value={formData.birthPlace || ''}
              onChange={(e) => {
                setFormData({...formData, birthPlace: e.target.value.toUpperCase()});
              }}
              placeholder="Contoh: JAKARTA"
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tanggal Lahir</label>
          <div className={styles.inputWrapper}>
            <Calendar size={20} className={styles.inputIcon} />
            <input 
              type="date" 
              className={styles.input}
              value={formData.birthDate || ''}
              onChange={(e) => {
                setFormData({...formData, birthDate: e.target.value});
              }}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Alamat Lengkap</label>
          <div className={styles.inputWrapper}>
            <Home size={20} className={styles.inputIcon} style={{ top: '12px', transform: 'none' }} />
            <textarea 
              className={`${styles.input} ${styles.uppercase}`}
              style={{ minHeight: '80px', paddingTop: '12px', paddingLeft: '44px' }}
              value={formData.address || ''}
              onChange={(e) => {
                setFormData({...formData, address: e.target.value.toUpperCase()});
              }}
              placeholder="ALAMAT LENGKAP SESUAI KTP"
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Provinsi {isDojoLocked && <CheckCircle2 size={14} color="#10b981" />}
          </label>
          <div className={styles.inputWrapper}>
            <MapPin size={20} className={styles.inputIcon} />
            <select 
              className={styles.input} 
              value={formData.provinceId || ''} 
              onChange={handleProvinceChange}
              required
              disabled={isDojoLocked}
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {isLoadingProvinces && <Loader2 size={16} className={styles.spinner} style={{ position: 'absolute', right: '12px' }} />}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Cabang {isDojoLocked && <CheckCircle2 size={14} color="#10b981" />}
          </label>
          <div className={styles.inputWrapper}>
            <MapPin size={20} className={styles.inputIcon} />
            <select 
              className={styles.input} 
              value={formData.branchId || ''} 
              onChange={handleBranchChange}
              disabled={!formData.provinceId || isDojoLocked}
              required
            >
              <option value="">Pilih Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {isLoadingBranches && <Loader2 size={16} className={styles.spinner} style={{ position: 'absolute', right: '12px' }} />}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Dojo / Ranting {isDojoLocked && <CheckCircle2 size={14} color="#10b981" />}
          </label>
          <div className={styles.inputWrapper}>
            <MapPin size={20} className={styles.inputIcon} />
            <select 
              className={styles.input} 
              value={formData.dojoId || ''} 
              onChange={(e) => {
                setFormData(prev => ({ ...prev, dojoId: e.target.value }));
              }}
              disabled={!formData.branchId || isDojoLocked}
              required
            >
              <option value="">Pilih Dojo/Ranting</option>
              {dojos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {isLoadingDojos && <Loader2 size={16} className={styles.spinner} style={{ position: 'absolute', right: '12px' }} />}
          </div>
          {isDojoLocked && <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>Wilayah Dojo sudah terkunci dan tidak dapat diubah.</p>}
        </div>


      </form>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/80 to-transparent mobile-fixed-bottom-bar">
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving || !!phoneError}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-2xl transition-all flex items-center justify-center gap-2 ${
            !isDirty || isSaving || !!phoneError
              ? 'bg-gray-800 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-yellow-600 to-yellow-500 active:scale-95 hover:shadow-yellow-500/20'
          }`}
          style={{ 
            boxShadow: isDirty && !isSaving ? '0 10px 30px -10px rgba(245, 158, 11, 0.5)' : 'none'
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Menyimpan ke Server...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              {isDirty ? 'Simpan Perubahan Sekarang' : 'Data Sudah Sesuai'}
            </>
          )}
        </button>
        {lastSaved && !isDirty && (
          <p className="text-center text-[10px] text-green-400 mt-3 font-medium tracking-wider uppercase">
            Terakhir Sinkronisasi: {lastSaved.toLocaleTimeString()}
          </p>
        )}
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

export default function EditProfile() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    }>
      <EditProfileContent />
    </Suspense>
  );
}
