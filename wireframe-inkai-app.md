# Wireframe Aplikasi INKAI (Mobile App)

Berikut adalah gambaran kasar (wireframe) antarmuka aplikasi mobile INKAI. Wireframe ini dirancang dengan mempertimbangkan pengalaman pengguna (UX) yang sederhana namun mencakup semua fitur inti, termasuk dukungan untuk Orang Tua yang mengelola banyak anak.

---

## 1. Halaman Login / Registrasi

Halaman pertama saat pengguna membuka aplikasi.

```text
+---------------------------------------+
|                                       |
|          [ LOGO INKAI ]               |
|                                       |
|  Selamat Datang di Portal Anggota     |
|                                       |
|  Email / No. Anggota:                 |
|  [_________________________________]  |
|                                       |
|  Kata Sandi:                          |
|  [_____________________________ [👁️]]  |
|                                       |
|  [        MASUK (LOGIN)            ]  |
|                                       |
|  Lupa Kata Sandi?                     |
|                                       |
|---------------------------------------|
|  Belum punya akun / Anggota baru?     |
|  [       DAFTAR SEKARANG           ]  |
|                                       |
|  Pendaftaran Orang Tua (Untuk Anak):  |
|  [    DAFTAR SEBAGAI ORANG TUA     ]  |
|                                       |
+---------------------------------------+
```

### Logika Input Login:

Sistem secara otomatis mendeteksi tipe akun berdasarkan kredensial yang dimasukkan:

1.  **Jika Input = No. Anggota (NIA)**:
    *   Sistem mengidentifikasi ini sebagai **Anggota Individu**.
    *   Setelah login berhasil, pengguna langsung diarahkan ke **Dashboard Pribadi** (tanpa fitur Switch Profile).
    *   Cocok untuk: Pelatih, Anggota Dewasa, atau Senior.

2.  **Jika Input = Email**:
    *   Sistem mengecek tipe pendaftaran email tersebut.
    *   **Tipe Orang Tua**: Jika email terdaftar sebagai akun wali, pengguna diarahkan ke **Dashboard Parent Mode** (dengan fitur Switch Profile untuk memilih anak).
    *   **Tipe Individu**: Jika email terdaftar untuk satu anggota saja, pengguna langsung masuk ke profil pribadinya.

---

## 1.1 Halaman Lupa Kata Sandi

Digunakan jika pengguna lupa kredensial mereka.

```text
+---------------------------------------+
|  < Kembali ke Login                   |
|---------------------------------------|
|                                       |
|          [ LOGO INKAI ]               |
|                                       |
|  PEMULIHAN KATA SANDI                 |
|                                       |
|  Masukkan Email atau NIA Anda untuk   |
|  menerima instruksi pemulihan.        |
|                                       |
|  Email / NIA:                         |
|  [_________________________________]  |
|                                       |
|  [      KIRIM LINK PEMULIHAN       ]  |
|                                       |
|---------------------------------------|
|  Bantuan? Hubungi Admin / Dojo Anda   |
|                                       |
+---------------------------------------+
```

---

## 1.2 Halaman Pendaftaran Anggota Baru

Formulir untuk calon anggota yang ingin mendaftar secara mandiri.

```text
+---------------------------------------+
|  < Kembali                            |
|---------------------------------------|
|          PENDAFTARAN ANGGOTA          |
|                                       |
|  Nama Lengkap:                        |
|  [_________________________________]  |
|                                       |
|  Email:                               |
|  [_________________________________]  |
|                                       |
|  Nomor WA:                            |
|  [_________________________________]  |
|                                       |
|  Pilih Wilayah (Provinsi):           |
|  [-- Pilih Wilayah --           [v] ] |
|  Pilih Cabang (Kota/Kab):             |
|  [-- Pilih Cabang --            [v] ] |
|  Pilih Dojo (Ranting):                |
|  [-- Pilih Dojo --              [v] ] |
|  *Pilihan Dojo tidak dapat diubah      |
|   sendiri setelah mendaftar.          |
|                                       |
|  Kata Sandi Baru:                     |
|  [_____________________________ [👁️]]  |
|                                       |
|  Ulangi Kata Sandi:                   |
|  [_____________________________ [👁️]]  |
|                                       |
|  [       DAFTAR SEKARANG           ]  |
|                                       |
|  Sudah punya akun? Login di sini      |
+---------------------------------------+
```

---

## 2. Halaman Beranda (Home) & Navigasi Utama

Setelah login, ini adalah halaman utamanya. Di bawah terdapat navigasi bar (Bottom Navigation).

```text
+---------------------------------------+
| [Profil Pic] Halo, Ayah Budi!   [ 🔔 ]|
| Orang Tua (2 Anak Terdaftar)          |
|---------------------------------------|
|                                       |
|  +---------------------------------+  |
|  |  STATUS KEANGGOTAAN: AKTIF      |  |
|  |  Berlaku s/d: 31 Des 2026       |  |
|  +---------------------------------+  |
|                                       |
|  [ GANTI PROFIL ANAK / SWITCH ]       |
|  (●) Budi (Aktif)                     |
|  ( ) Ani  (Iuran Menunggak)           |
|                                       |
|  MENU CEPAT:                          |
|  [QR Code Saya]  [Bayar Iuran]        |
|  [Jadwal Latihan][Buku Saku]          |
|                                       |
|  EVENT TERDEKAT:                      |
|  +---------------------------------+  |
|  | Kejuaraan Nasional 2026         |  |
|  | 15 Agustus 2026                 |  |
|  | [ Lihat Detail ]                |  |
|  +---------------------------------+  |
|                                       |
|                                       |
|=======================================|
| [Home]  [Event]  [Keanggotaan] [Profil|
+---------------------------------------+
```

---

## 3. Halaman Keanggotaan (Membership & Iuran)

Fokus pada status anggota dan pembayaran iuran. Data akan menyesuaikan profil anak yang dipilih.

```text
+---------------------------------------+
|  < Kembali      Keanggotaan           |
|---------------------------------------|
|                                       |
|  KARTU ANGGOTA DIGITAL (BUDI)         |
|  +---------------------------------+  |
|  | [ FOTO RESMI ANGGOTA ] [📷]     |  |
|  | Nama : Budi Santoso             |  |
|  | NIA  : 123.456.789              |  |
|  | Dojo : Dojo Pusat Jakarta [🔒]   |  |
|  | [     QR CODE VALIDASI    ]     |  |
|  +---------------------------------+  |
|  *Tunjukkan QR ini saat latihan untuk |
|   absensi digital.                    |
|                                       |
|  [     LIHAT RIWAYAT ABSENSI >    ]     |
|                                       |
|  *Pindah Dojo? Hubungi Ketua Ranting  |
|                                       |
|  [     LIHAT DETAIL IURAN >      ]     |
|                                       |
|  DOKUMEN PENDUKUNG:                   |
|  - Akte Lahir: [ Lihat / Upload ⬆️ ]   |
|  - Kartu BPJS: [ Lihat / Upload ⬆️ ]   |
|                                       |
|=======================================|
| [Home]  [Event] *[Keanggotaan]*[Profil|
+---------------------------------------+
```

---

## 3.1 Halaman Pengajuan Pindah Dojo

Formulir digital untuk mengajukan perpindahan antar dojo/ranting.

```text
+---------------------------------------+
|  < Kembali      Pengajuan Pindah      |
|---------------------------------------|
|                                       |
|  DATA SAAT INI:                       |
|  Dojo: Dojo Pusat Jakarta             |
|  Cabang: Jakarta Pusat                |
|                                       |
|  TUJUAN PINDAH:                       |
|  Pilih Wilayah Tujuan:                |
|  [-- Pilih Wilayah --           [v] ] |
|  Pilih Cabang Tujuan:                 |
|  [-- Pilih Cabang --            [v] ] |
|  Pilih Dojo Tujuan:                   |
|  [-- Pilih Dojo --              [v] ] |
|                                       |
|  Alasan Kepindahan:                   |
|  [_________________________________]  |
|  [_________________________________]  |
|                                       |
|  [        KIRIM PENGAJUAN          ]  |
|                                       |
|  -----------------------------------  |
|  STATUS VERIFIKASI:                   |
|  [X] Diajukan (Anggota)               |
|  [ ] Verifikasi Ketua Ranting (Pending)|
|  [ ] Verifikasi Ketua Cabang  (Pending)|
|                                       |
|  *Perpindahan otomatis diperbarui di  |
|   kartu setelah disetujui Cabang.     |
+---------------------------------------+
```

---

## 3.2 Halaman Riwayat & Prestasi

Mencatat perjalanan karateka, mulai dari kenaikan tingkat hingga pelatihan.

```text
+---------------------------------------+
|  < Kembali      Riwayat & Prestasi    |
|---------------------------------------|
| [ Sabuk ] [ Piagam ] [ Pelatihan ]  |
|                                       |
|  RIWAYAT KENAIKAN TINGKAT:            |
|  +---------------------------------+  |
|  | [Sabuk Hitam] - DAN 1           |  |
|  | Tanggal: 20 Feb 2027            |  |
|  | Lokasi : Jakarta (Pusat)        |  |
|  +---------------------------------+  |
|  | [Sabuk Coklat] - KYU 1          |  |
|  | Tanggal: 15 Jan 2026            |  |
|  | Lokasi : Surabaya               |  |
|  +---------------------------------+  |
|  | [Sabuk Biru] - KYU 2            |  |
|  | Tanggal: 10 Juli 2025           |  |
|  | Lokasi : Sidoarjo               |  |
|  +---------------------------------+  |
|                                       |
|  STATUS VERIFIKASI:                   |
|  (V) = Data sudah divalidasi Pusat    |
|  (?) = Menunggu Validasi              |
|                                       |
|  [ + TAMBAH DATA KENAIKAN MANUAL ]    |
|                                       |
|  [ LIHAT PIAGAM & PERTANDINGAN > ]    |
|  [ LIHAT RIWAYAT PELATIHAN > ]        |
|                                       |
|=======================================|
| [Home]  [Event] *[Keanggotaan]*[Profil|
+---------------------------------------+
```

### Form Input Kenaikan (Kyu 10 - Kyu 1):
```text
+---------------------------------------+
|  [X] Tutup       Input Kenaikan       |
|---------------------------------------|
|  Tingkatan (Kyu / DAN):               |
|  [-- Pilih Kyu 10 s/d DAN 9 --  [v] ] |
|                                       |
|  Tanggal Lulus:                       |
|  [ DD / MM / YYYY ]                   |
|                                       |
|  Lokasi Ujian:                        |
|  [_________________________________]  |
|                                       |
|  [        SIMPAN RIWAYAT           ]  |
+---------------------------------------+
```

---

## 3.4 Halaman Piagam & Pertandingan (Sertifikat)

Daftar prestasi dan penghargaan digital anggota.

```text
+---------------------------------------+
|  < Kembali      Piagam & Pertandingan |
|---------------------------------------|
|                                       |
|  RIWAYAT PIAGAM & PERTANDINGAN:       |
|  1. Juara 1 Kumite Perorangan (2025)  |
|     [ Lihat Piagam ] [ Download ]     |
|                                       |
|  2. Piagam Atlet Terbaik Dojo (2024)  |
|     [ Lihat Piagam ] [ Download ]     |
|                                       |
|  [ + UNGGAH PIAGAM / HASIL LOMBA ]    |
|                                       |
+---------------------------------------+
```

---

## 3.5 Halaman Riwayat Pelatihan

Catatan keikutsertaan dalam kegiatan teknis INKAI.

```text
+---------------------------------------+
|  < Kembali      Riwayat Pelatihan     |
|---------------------------------------|
|                                       |
|  DAFTAR KEGIATAN:                     |
|  1. Gashuku Provinsi Jatim            |
|     Tanggal: 10-12 Maret 2025         |
|                                       |
|  2. Penataran Wasit/Juri              |
|     Tanggal: 05 Juni 2024             |
|                                       |
|  [ + TAMBAH RIWAYAT PELATIHAN ]       |
|                                       |
+---------------------------------------+
```

---

## 3.3 Halaman Pembayaran Iuran

Modul khusus untuk mengelola tagihan iuran tahunan anggota.

```text
+---------------------------------------+
|  < Kembali      Iuran Anggota         |
|---------------------------------------|
|                                       |
|  TAGIHAN AKTIF (MEI 2026):          |
|  Tujuan: Dojo Pusat Jakarta         |
|  +---------------------------------+  |
|  | Iuran Bulanan - Mei 2026        |  |
|  | Nominal: Rp 25.000              |  |
|  | Status : [ BELUM BAYAR ]        |  |
|  +---------------------------------+  |
|                                       |
|  [ PILIH METODE PEMBAYARAN ]          |
|  ( ) Virtual Account (Dojo)           |
|  ( ) E-Wallet (Dojo)                  |
|  ( ) Bayar Tunai ke Dojo              |
|                                       |
|  [        BAYAR SEKARANG           ]  |
|  [     UPLOAD BUKTI TRANSFER       ]  |
|                                       |
|  -----------------------------------  |
|  RIWAYAT PEMBAYARAN:                  |
|  - April 2026 .... Rp 25.000 [ LUNAS ]|
|  - Maret 2026 .... Rp 25.000 [ LUNAS ]|
|  - Feb 2026 ...... Rp 25.000 [ LUNAS ]|
|                                       |
|  *Tekan [v] untuk download invoice.   |
+---------------------------------------+
```

---

## 4. Halaman Event (Jadwal & Pendaftaran)

Daftar event yang tersedia. Saat mendaftar, Orang Tua bisa memilih anak mana yang akan didaftarkan.

```text
+---------------------------------------+
|  < Kembali         Event INKAI        |
|---------------------------------------|
|  [ Tab: Akan Datang ] [ Tab: Riwayat] |
|                                       |
|  +---------------------------------+  |
|  | 🏆 Gashuku Nasional 2026        |  |
|  | 📍 Bali | 📅 10-12 Sep 2026     |  |
|  | [        LIHAT DETAIL >         ]  |
|  +---------------------------------+  |
|                                       |
|  +---------------------------------+  |
|  | 🥋 Ujian Kenaikan Sabuk Hitam   |  |
|  | 📍 Jakarta | 📅 25 Okt 2026     |  |
|  | [        LIHAT DETAIL >         ]  |
|  +---------------------------------+  |
|                                       |
|=======================================|
| [Home] *[Event]* [Keanggotaan] [Profil|
+---------------------------------------+
```

---

## 4.1 Halaman Detail & Pembayaran Event

Halaman khusus setelah event dipilih untuk pendaftaran dan pembayaran.

```text
+---------------------------------------+
|  < Kembali      Detail & Daftar       |
|---------------------------------------|
|  [     Banner Event / Foto      ]     |
|                                       |
|  🏆 Gashuku Nasional 2026              |
|  📍 Bali | 📅 10-12 Sep 2026          |
|                                       |
|  DESKRIPSI:                           |
|  Kegiatan latihan bersama seluruh...  |
|  Biaya: Rp 500.000                    |
|                                       |
|  PILIH PESERTA (ANGGOTA):             |
|  (●) Budi Santoso                     |
|  ( ) Ani Wijaya                       |
|                                       |
|  METODE PEMBAYARAN:                   |
|  [-- Pilih Metode Bayar --      [v] ] |
|                                       |
|  [       DAFTAR & BAYAR SEKARANG   ]  |
|                                       |
+---------------------------------------+
```

### Logika Pemilihan Peserta:

1.  **Mode Wali (Orang Tua)**:
    *   Menampilkan daftar nama anak yang terdaftar di bawah akun tersebut (Radio Button).
    *   Wali harus memilih salah satu anak sebelum bisa melanjutkan ke pembayaran.
2.  **Mode Individu**:
    *   Bagian "PILIH PESERTA" disembunyikan.
    *   Sistem otomatis menetapkan pemilik akun sebagai peserta tunggal.

---

## 5. Halaman Profil

Pengaturan akun orang tua dan akses ke manajemen anak.

```text
+---------------------------------------+
|                 Profil                |
|---------------------------------------|
|        ( O )  <-- Foto Ayah           |
|  Ayah Budi                            |
|  ayah@email.com                       |
|  [ Edit Profil Utama ]                |
|                                       |
|  MANAJEMEN KELUARGA:                  |
|  [ > ] Kelola Akun Anak (2 Anak)      |
|  [ > ] Tambah Anggota Anak Baru       |
|                                       |
|  PENGATURAN PENGGUNA:                 |
|  [ > ] Ubah Kata Sandi                |
|  [ > ] Pengaturan Notifikasi          |
|  [ > ] Bantuan & Pusat Dukungan       |
|                                       |
|  [          KELUAR (LOGOUT)        ]  |
|                                       |
|=======================================|
| [Home]  [Event]  [Keanggotaan]*[Profil|
+---------------------------------------+
```

---

## 6. Halaman Kelola Akun Anak (Parent Mode)

Khusus untuk orang tua yang mengelola lebih dari satu anak dalam satu akun.

```text
+---------------------------------------+
|  < Kembali        Akun Anak Saya      |
|---------------------------------------|
|                                       |
|  DAFTAR ANAK:                         |
|                                       |
|  1. Budi Santoso                      |
|     Sabuk: Kuning                     |
|     [ Lihat Kartu ] [ Bayar Iuran ]   |
|                                       |
|  2. Ani Wijaya                        |
|     Sabuk: Putih                      |
|     [ Lihat Kartu ] [ Bayar Iuran ]   |
|                                       |
|  -----------------------------------  |
|  [ + ] TAMBAH ANGGOTA (ANAK) BARU     |
|                                       |
|  *Setiap anak akan memiliki NIA       |
|   sendiri namun dikelola 1 akun HP.   |
|                                       |
+---------------------------------------+

---

## 7. Halaman Riwayat Kehadiran (Attendance History)

Menampilkan statistik kehadiran anggota sebagai syarat ujian.

```text
+---------------------------------------+
|  < Kembali       Riwayat Kehadiran    |
|---------------------------------------|
|  Nama: Budi Santoso                   |
|  Persentase: 92% (Sangat Baik)        |
|                                       |
|  LOG KEHADIRAN MEI 2026:              |
|  - 05 Mei: 19:00 (Hadir)              |
|  - 03 Mei: 18:55 (Hadir)              |
|  - 01 Mei: 19:05 (Hadir)              |
|                                       |
|  LOG KEHADIRAN APRIL 2026:            |
|  - 28 April: 19:00 (Hadir)            |
|  - 25 April: (Izin)                   |
|                                       |
|  *Minimal 75% untuk ikut ujian sabuk. |
+---------------------------------------+

---

## 10. Halaman Keamanan Akun (Security Settings)

Pengaturan untuk melindungi akun anggota.

```text
+---------------------------------------+
|  < Kembali         Keamanan Akun      |
|---------------------------------------|
|  AUTENTIKASI:                         |
|  - Ubah Kata Sandi         [ Ubah > ] |
|  - Biometric Login (FaceID) [ (o) ]   |
|                                       |
|  SESI AKTIF:                          |
|  - iPhone 13 (Jakarta)                |
|    [ Keluar dari Sesi Ini ]           |
|                                       |
|  ZONA BAHAYA:                         |
|  [        HAPUS AKUN PERMANEN      ]  |
|  *Data keanggotaan (NIA) tidak akan   |
|   terhapus, hanya akses akun app.     |
+---------------------------------------+

---

## 11. Halaman Lisensi Fungsional (Wasit & Pelatih)

Khusus untuk anggota yang memiliki sertifikasi kepelatihan atau perwasitan.

```text
+---------------------------------------+
|  < Kembali        Lisensi Saya        |
|---------------------------------------|
|  [ Tab: Pelatih ] [ Tab: Wasit/Juri ] |
|                                       |
|  LISENSI PELATIH:                     |
|  +---------------------------------+  |
|  | [📷] LISENSI PELATIH MADYA      |  |
|  | No: PL-2024-001                 |  |
|  | Status: [ AKTIF ]               |  |
|  | Berlaku s/d: 12 Jan 2027        |  |
|  +---------------------------------+  |
|                                       |
|  LISENSI WASIT/JURI:                  |
|  +---------------------------------+  |
|  | [📷] WASIT NASIONAL (A)         |  |
|  | No: WN-2023-088                 |  |
|  | Status: [ EXPIRED / MATI ]      |  |
|  | Berlaku s/d: 01 Mei 2026        |  |
|  +---------------------------------+  |
|                                       |
|  [ + UNGGAH PEMBARUAN LISENSI ]       |
+---------------------------------------+

---

## 12. INKAI Store (Katalog Perlengkapan)

Pemesanan seragam dan perlengkapan karate resmi secara digital.

```text
+---------------------------------------+
|  < Kembali         INKAI Store        |
|---------------------------------------|
|  [🔍 Cari perlengkapan...         ]   |
|                                       |
|  KATEGORI: [ Seragam ] [ Sabuk ] [ Alat ]
|                                       |
|  PRODUK TERPOPULER:                   |
|  +-----------------+  +-----------------+
|  | [📷] Karategi   |  | [📷] Sabuk     |
|  | Standar Pemula  |  | Hitam Tokaido  |
|  | Rp 250.000      |  | Rp 150.000     |
|  | [ Beli ]        |  | [ Beli ]       |
|  +-----------------+  +-----------------+
|                                       |
|  [        LIHAT KERANJANG SAYA     ]  |
|  [        RIWAYAT PESANAN          ]  |
+---------------------------------------+

---

## 13. Materi Teknik & Video (Digital Library)

Akses ke video tutorial resmi standar INKAI Honbu Dojo.

```text
+---------------------------------------+
|  < Kembali        Materi Teknik       |
|---------------------------------------|
|  [🔍 Cari Kata/Teknik...          ]   |
|                                       |
|  KATEGORI:                            |
|  - [🥋] Dasar (Kihon)                 |
|  - [🥋] Jurus (Kata)                  |
|  - [🥋] Pertarungan (Kumite)          |
|                                       |
|  VIDEO TERBARU:                       |
|  +---------------------------------+  |
|  | [    Thumbnail Video Kata 1    ]  |
|  | Heian Shodan (Standar INKAI)    |
|  | [ Putar Sekarang ]              |
|  +---------------------------------+  |
|                                       |
|  *Akses materi sesuai tingkatan sabuk.|
+---------------------------------------+
```
```

### Halaman Detail & Checkout:
```text
+---------------------------------------+
|  < Kembali        Detail Produk       |
|---------------------------------------|
|  [      Gambar Produk (Besar)    ]     |
|                                       |
|  Karategi Standar Pemula (INKAI)       |
|  Harga: Rp 250.000                     |
|                                       |
|  Pilih Ukuran: [ S ] [ M ] [ L ] [ XL ]
|  Jumlah: [ - ] 1 [ + ]                 |
|                                       |
|  Pilih Lokasi Ambil/Kirim:             |
|  ( ) Ambil di Dojo (Tanpa Ongkir)      |
|  ( ) Kirim ke Alamat (JNE/J&T)         |
|                                       |
|  [       LANJUT KE PEMBAYARAN      ]   |
+---------------------------------------+
```
```
```

---

## 8. Halaman Notifikasi (Notification Center)

Tempat berkumpulnya semua informasi, dari pengumuman pusat hingga status pembayaran.

```text
+---------------------------------------+
|  < Kembali         Notifikasi         |
|---------------------------------------|
|  [ Tab: Semua ] [ Tab: Info ] [ Tab: Tagihan ]
|                                       |
|  HARI INI:                            |
|  +---------------------------------+  |
|  | 💰 PEMBAYARAN BERHASIL          |  |
|  | Iuran Mei 2026 telah diterima.  |  |
|  | [ Lihat Detail ]   (10:30)      |  |
|  +---------------------------------+  |
|                                       |
|  KEMARIN:                             |
|  +---------------------------------+  |
|  | 📢 PENGUMUMAN PUSAT             |  |
|  | Instruksi seragam baru...       |  |
|  | [ Baca Selengkapnya ]           |  |
|  +---------------------------------+  |
|                                       |
|  MINGGU INI:                          |
|  +---------------------------------+  |
|  | 🥋 REMINDER EVENT               |  |
|  | Gashuku Nasional 5 hari lagi!   |  |
|  +---------------------------------+  |
|                                       |
+---------------------------------------+
```
```
```
