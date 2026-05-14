"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, UserRoundPen, KeyRound, BellRing, LogOut, ChevronRight, Loader2, Plus } from "lucide-react";
import styles from "./Profile.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { getAssetUrl } from "@/lib/api";
import { computeBpjsProfileMismatches, type BpjsOcrStored } from "@/lib/bpjsProfileCompare";

export default function Profile() {
  const router = useRouter();
  const { user, logout, isAdmin, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bpjsOcr = user?.bpjsOcrExtracted as BpjsOcrStored | undefined;
  const bpjsMismatch = useMemo(
    () =>
      user
        ? computeBpjsProfileMismatches(user, bpjsOcr)
        : { fullName: false, nik: false, birthDate: false, address: false },
    [user, bpjsOcr],
  );

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const menuItems = [
    { icon: <UserRoundPen size={20} />, label: "Edit Profil", path: "/profile/edit" },
    { icon: <KeyRound size={20} />, label: "Ganti Kata Sandi", path: "/profile/password" },
    { icon: <BellRing size={20} />, label: "Notifikasi Saya", path: "/notifications" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>PROFIL SAYA</h1>
      </header>

      <section className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          {user?.photoUrl ? (
            <img 
              key={user.photoUrl}
              src={getAssetUrl(user.photoUrl)} 
              alt={user.fullName || "Profile"} 
              className={styles.avatar} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = "/logo.png"; // Fallback to logo if image fails
              }}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {user?.fullName?.substring(0, 1).toUpperCase() || "U"}
            </div>
          )}
        </div>
        <h2 className={styles.name}>{user?.fullName}</h2>
        {bpjsMismatch.fullName && bpjsOcr?.fullName && (
          <p className={styles.bpjsNameHint}>
            Nama di kartu BPJS berbeda: {bpjsOcr.fullName}
          </p>
        )}
        <p className={styles.nia}>NIA: {user?.nia || (isAdmin ? "ADMINISTRATOR" : "-")}</p>
        <div className={styles.statusBadge}>{isAdmin ? 'Administrator' : 'Anggota Aktif'}</div>
      </section>
      
      <section className={styles.infoSection}>
        <div className={styles.infoCard}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nomor Kartu BPJS</span>
            <span className={styles.infoValue}>{user.bpjsCardNumber || "—"}</span>
            {!user.bpjsCardNumber && (user.bpjsCardUrl || user.member?.bpjsCardUrl) && (
              <span className={styles.infoMismatchNote}>Unggah foto kartu di menu Dokumen untuk membaca nomor otomatis.</span>
            )}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>NIK (Nomor Induk Kependudukan)</span>
            <span className={`${styles.infoValue} ${bpjsMismatch.nik ? styles.infoValueWarning : ""}`}>
              {user.nik || "-"}
            </span>
            {bpjsMismatch.nik && bpjsOcr?.nik && (
              <span className={styles.infoMismatchNote}>Pada kartu BPJS: {bpjsOcr.nik}</span>
            )}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tempat, Tanggal Lahir</span>
            <span className={`${styles.infoValue} ${bpjsMismatch.birthDate ? styles.infoValueWarning : ""}`}>
              {user.birthPlace || "-"}, {user.birthDate ? new Date(user.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
            </span>
            {bpjsMismatch.birthDate && (bpjsOcr?.birthDateRaw || bpjsOcr?.birthDateIso) && (
              <span className={styles.infoMismatchNote}>
                Pada kartu BPJS: {bpjsOcr.birthDateRaw || bpjsOcr.birthDateIso}
              </span>
            )}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Jenis Kelamin</span>
            <span className={styles.infoValue}>
              {user.gender === 'MALE' ? 'Laki-laki' : user.gender === 'FEMALE' ? 'Perempuan' : '-'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Alamat Lengkap</span>
            <span className={`${styles.infoValue} ${bpjsMismatch.address ? styles.infoValueWarning : ""}`}>
              {user.address || "-"}
            </span>
            {bpjsMismatch.address && bpjsOcr?.address && (
              <span className={styles.infoMismatchNote}>Pada kartu BPJS: {bpjsOcr.address}</span>
            )}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Dojo / Ranting</span>
            <span className={styles.infoValue}>
              {user.dojo?.name || "-"} ({user.dojo?.branch?.province?.name || "-"})
            </span>
          </div>
        </div>
      </section>

      <section className={styles.menuSection}>
        <p className={styles.sectionLabel}>PENGATURAN:</p>
        <div className={styles.menuList}>
          {menuItems.map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={styles.menuItem}
              onClick={() => router.push(item.path)}
            >
              <div className={styles.menuIcon}>{item.icon}</div>
              <span className={styles.menuLabel}>{item.label}</span>
              <ChevronRight size={16} className={styles.chevron} />
            </motion.div>
          ))}
        </div>
      </section>

      {(user.roles?.includes('PARENT') || (Array.isArray(user.roles) && user.roles.some((r: any) => r === 'PARENT' || r.name === 'PARENT'))) && (
        <section className={styles.menuSection}>
          <p className={styles.sectionLabel}>AKUN TERHUBUNG:</p>
          <div className={styles.emptyConnected}>
            Belum ada data anak terhubung
          </div>
          <button className={styles.addChildBtn}>
            <Plus size={18} />
            Tambah Anak / Anggota Baru
          </button>
        </section>
      )}

      <section className={styles.logoutSection}>
        <button className={styles.logoutBtn} onClick={() => { logout(); router.push("/"); }}>
          <LogOut size={20} />
          LOGOUT / KELUAR
        </button>
      </section>

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}
