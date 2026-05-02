# Master Blueprint: Ekosistem Digital INKAI

Dokumen ini adalah ringkasan eksekutif dari seluruh sistem aplikasi **Institut Karate-do Indonesia (INKAI)** yang telah dirancang.

---

## 1. Visi Produk
Membangun platform terpusat untuk modernisasi administrasi, standarisasi teknik, dan penguatan ekonomi organisasi INKAI di seluruh Indonesia melalui integrasi Mobile App dan Web Dashboard.

---

## 2. Hirarki Pengguna & Akses
Sistem ini menggunakan struktur berjenjang sesuai AD/ART organisasi:

| Role | Platform | Tanggung Jawab Utama |
|------|----------|----------------------|
| **Anggota / Orang Tua** | Mobile App | Profil, Iuran, Kartu Digital, Event, Library. |
| **Ketua Dojo (Ranting)** | Mobile/Web | Absensi harian, Daftar Kolektif, Verifikasi Pindah. |
| **Pengurus Cabang (Kota)** | Web Admin | Pengawasan Dojo, Registrasi Dojo Baru, Approval Mutasi. |
| **Pengurus Prov. (Pengprov)** | Web Admin | Pengawasan Cabang, Rekap Anggota Prov, Broadcast Daerah. |
| **Pengurus Pusat (PP)** | Web Admin | Statistik Nasional, Manajemen Lisensi, Analitik, Audit Log. |

---

## 3. Modul Utama Sistem

### A. Keanggotaan & Identitas
- **NIA (Nomor Induk Anggota):** ID unik nasional sebagai kunci data.
- **Kartu Digital:** Kartu QR-based di App untuk identitas dan absensi.
- **Public Check:** Alat verifikasi NIA publik untuk mencegah pemalsuan sabuk.

### B. Operasional & Prestasi
- **Absensi Digital:** Scan QR di Dojo untuk syarat minimal ikut ujian (75%).
- **E-Verification:** Validasi sertifikat/piagam oleh admin pusat agar berstatus "Verified".
- **Mutasi Digital:** Flow perpindahan antar-dojo/cabang/provinsi yang terekam sistem.

### C. Manajemen Event & Fungsional
- **Event Engine:** Pendaftaran Ujian, Gashuku, dan Kejurnas secara terintegrasi.
- **Licensing System:** Tracking masa berlaku lisensi Wasit, Juri, dan Pelatih Nasional.

### D. Konten & Ekonomi
- **INKAI Store:** Katalog perlengkapan karate resmi untuk standarisasi seragam.
- **Digital Library:** Video tutorial Kata/Kihon resmi dari Honbu Dojo.

---

## 4. Konsep Teknis (Saran)
- **Frontend App:** Flutter atau React Native (iOS & Android).
- **Web Admin:** Next.js atau React dengan Tailwind CSS.
- **Backend:** Node.js/Go dengan PostgreSQL (Database terpusat).
- **Keamanan:** Encryption for PII, Audit Logs, Role-Based Access Control (RBAC).

---

## 5. Daftar Artefak Desain (Dokumentasi Lengkap)

Seluruh rancangan detail dapat diakses pada file-file berikut:

1.  **[Diskusi Awal & Konsep](file:///d:/website/inkai/DISKUSI-APLIKASI-INKAI.md)**
2.  **[Wireframe Mobile App (Anggota)](file:///d:/website/inkai/wireframe-inkai-app.md)**
3.  **[Wireframe Web Admin Dashboard](file:///d:/website/inkai/wireframe-inkai-web-admin.md)**
4.  **[Wireframe Admin Pusat (PP)](file:///d:/website/inkai/wireframe-inkai-admin-pusat.md)**
5.  **[Wireframe Admin Provinsi](file:///d:/website/inkai/wireframe-inkai-admin-provinsi.md)**
6.  **[Wireframe Admin Cabang](file:///d:/website/inkai/wireframe-inkai-admin-cabang.md)**
7.  **[Wireframe Admin Dojo/Ranting](file:///d:/website/inkai/wireframe-inkai-admin-dojo.md)**
8.  **[Wireframe Landing Page Publik](file:///d:/website/inkai/wireframe-inkai-landing-page.md)**
9.  **[Mockup Visual Premium (Mobile)](file:///d:/website/inkai/mockup-visual-inkai.md)**
10. **[Roadmap Pengembangan Tahunan](file:///d:/website/inkai/ROADMAP-PENGEMBANGAN.md)**

---

## 6. Penutup
Desain ini telah mencakup seluruh aspek operasional organisasi karate dari tingkat terbawah hingga pusat. Sistem dirancang untuk skala besar (100rb+ anggota) dengan fokus pada integritas data dan kemudahan penggunaan.

*Dokumen ini adalah referensi final untuk tahap pengembangan teknis.*
