# Wireframe Aplikasi INKAI (Mode Pengurus Cabang)

Dokumen ini merinci antarmuka untuk Pengurus Cabang yang berada satu tingkat di atas Ketua Dojo/Ranting. Pengurus Cabang bertanggung jawab mengawasi beberapa Dojo dalam wilayahnya.

---

## 1. Dashboard Pengurus Cabang

Halaman utama yang memberikan gambaran statistik seluruh Dojo di bawah naungan Cabang.

```text
+---------------------------------------+
|  LOGO INKAI    [Cabang Jakarta Timur] |
|  Halo, Sensei Budi (Pengurus Cabang)  |
|---------------------------------------|
|  STATISTIK CABANG:                    |
|  +-------------------+----------------+
|  | TOTAL DOJO: 12    | TOTAL ANGGOTA: |
|  |                   | 450 Orang      |
|  +-------------------+----------------+
|  | PENDING APPROVAL  | [ 5 Pengajuan ]|
|  +-------------------+----------------+
|                                       |
|  MENU UTAMA:                          |
|  [🏠 Daftar Dojo  ] [👥 Semua Anggota]|
|  [📢 Buat Info    ] [📊 Laporan Cabang]|
|                                       |
|  PENGUMUMAN TERAKHIR:                 |
|  - "Ujian Kenaikan Sabuk Wilayah..."  |
|  - "Update Iuran Tahunan 2026..."     |
|                                       |
|=======================================|
| [Home]    [Dojo]    [Info]    [Profil*]|
+---------------------------------------+
*Klik Profil untuk melihat kartu anggota 
 pribadi dan riwayat keanggotaan.
```

---

## 2. Daftar Dojo di Bawah Cabang

Melihat daftar Dojo/Ranting yang masuk dalam wilayah Cabang ini.

```text
+---------------------------------------+
|  < Kembali           Daftar Dojo      |
|---------------------------------------|
|  [ Cari Nama Dojo...              [Q] ]|
|                                       |
|  1. Dojo Pusat Jakarta                |
|     Ketua: Sensei Ahmad               |
|     Anggota: 85 | [ Lihat Anggota ]   |
|                                       |
|  2. Dojo GOR Ciracas                  |
|     Ketua: Senpai Linda               |
|     Anggota: 42 | [ Lihat Anggota ]   |
|                                       |
|  3. Dojo SDN 01 Rawamangun            |
|     Ketua: Senpai Taufik              |
|     Anggota: 30 | [ Lihat Anggota ]   |
|                                       |
|  [ + DAFTARKAN DOJO BARU ]            |
+---------------------------------------+
```

---

## 3. Daftar Semua Anggota (Lintas Dojo)

Melihat seluruh anggota di Cabang tersebut dengan filter per Dojo.

```text
+---------------------------------------+
|  < Kembali         Data Anggota       |
|---------------------------------------|
|  Filter Dojo: [ Semua Dojo      [v] ] |
|  Filter Sabuk: [ Semua Sabuk    [v] ] |
|                                       |
|  1. Budi Santoso (NIA: 12345)         |
|     Dojo: Pusat Jakarta | Sabuk: Biru |
|                                       |
|  2. Ani Wijaya (NIA: 67890)           |
|     Dojo: GOR Ciracas   | Sabuk: Putih|
|                                       |
|  3. Citra Dewi (NIA: 11223)           |
|     Dojo: Pusat Jakarta | Sabuk: Kuning|
|                                       |
|  [ Cari Nama / NIA...             [Q] ]|
+---------------------------------------+
```

---

## 4. Manajemen Pengumuman

Fitur untuk membuat pengumuman yang ditargetkan ke level tertentu.

```text
+---------------------------------------+
|  < Kembali        Buat Pengumuman     |
|---------------------------------------|
|  JUDUL:                               |
|  [ Input Judul Pengumuman...        ] |
|                                       |
|  ISI PENGUMUMAN:                      |
|  +-----------------------------------+|
|  |                                   ||
|  | [ Input isi pesan di sini... ]    ||
|  |                                   ||
|  +-----------------------------------+|
|                                       |
|  TARGET AUDIENS:                      |
|  ( ) Khusus Ketua Dojo/Ranting        |
|  ( ) Semua Anggota (Seluruh Cabang)   |
|                                       |
|  LAMPIRAN: [ Unggah File/Gambar (+) ] |
|                                       |
|  [       KIRIM PENGUMUMAN SEKARANG     ] |
+---------------------------------------+
```

---

## 5. Verifikasi & Approval (Opsional)

Menyetujui hal-hal yang membutuhkan level Cabang, seperti perpindahan anggota antar-dojo yang sudah disetujui ketua dojo.

```text
+---------------------------------------+
|  < Kembali       Persetujuan Cabang   |
|---------------------------------------|
|  PERPINDAHAN ANGGOTA:                 |
|                                       |
|  Nama: Eko Prasetyo                   |
|  Dari: Dojo Pusat Jakarta             |
|  Ke  : Dojo GOR Ciracas               |
|  Ket: Disetujui kedua Ketua Dojo      |
|                                       |
|  [    APPROVE    ]   [    TOLAK     ] |
+---------------------------------------|
|  PENGAJUAN UJIAN DAN/DAN:             |
|  - Dojo Pusat (15 Orang) [ Detail ]   |
|  - Dojo Ciracas (5 Orang) [ Detail ]  |
+---------------------------------------+
```
---

## 6. Profil Pribadi & Keanggotaan (Role: Anggota)

Karena Pengurus Cabang juga merupakan anggota aktif, mereka memiliki akses ke profil pribadi mereka sendiri.

```text
+---------------------------------------+
|  Profil Pengurus & Keanggotaan        |
|---------------------------------------|
|  [ Foto Profil ]  Sensei Budi         |
|  Jabatan: Pengurus Cabang JKT Timur   |
|  NIA: 998877 | Sabuk: Hitam (DAN 4)   |
|                                       |
|  MENU PRIBADI:                        |
|  +-----------------------------------+|
|  | [🪪 Kartu Anggota Digital      ] ||
|  | [🥋 Riwayat Kyu / DAN          ] ||
|  | [🎓 Riwayat Pelatihan & Diklat ] ||
|  | [🏆 Piagam & Sertifikat        ] ||
|  +-----------------------------------+|
|                                       |
|  [ KELUAR / LOGOUT ]                  |
|=======================================|
| [Home]    [Dojo]    [Info]    [Profil ]|
+---------------------------------------+
```

---

## 7. Detail Riwayat Kyu / DAN (Pribadi)

```text
+---------------------------------------+
|  < Kembali       Riwayat Kyu / DAN    |
|---------------------------------------|
|  1. DAN 4 (Hitam)                     |
|     Lulus: 12 Jan 2024 | Lokasi: JKT  |
|                                       |
|  2. DAN 3 (Hitam)                     |
|     Lulus: 05 Mei 2020 | Lokasi: BDG  |
|                                       |
|  3. DAN 2 (Hitam)                     |
|     Lulus: 10 Okt 2017 | Lokasi: SUB  |
|                                       |
|  [ + TAMBAH RIWAYAT (MENUNGGU VERIF) ]|
+---------------------------------------+
```

---

## 8. Detail Riwayat Pelatihan (Pribadi)

```text
+---------------------------------------+
|  < Kembali      Riwayat Pelatihan     |
|---------------------------------------|
|  1. Penataran Wasit Juri Nasional     |
|     Tahun: 2025 | Status: LULUS       |
|                                       |
|  2. Gashuku Wilayah Barat             |
|     Tahun: 2024 | Peran: Instruktur   |
|                                       |
|  3. Sertifikasi Pelatih Dasar         |
|     Tahun: 2022 | Status: LULUS       |
|                                       |
|  [ + TAMBAH RIWAYAT PELATIHAN ]       |
+---------------------------------------+
```
---

## 9. Form Pendaftaran Dojo Baru & Ketua Dojo

Ketua Cabang mendaftarkan Dojo baru dan menunjuk Ketua Dojo dari daftar anggota yang ada atau mendaftarkan user baru.

```text
+---------------------------------------+
|  < Kembali      Registrasi Dojo Baru  |
|---------------------------------------|
|  NAMA DOJO:                           |
|  [ Input Nama Dojo...               ] |
|                                       |
|  ALAMAT / LOKASI:                     |
|  [ Input Alamat Lengkap...          ] |
|                                       |
|  TUNJUK KETUA DOJO:                   |
|  [ Cari Member by Nama/NIA...     [Q] ]|
|  Hasil:                               |
|  ( ) Senpai Taufik (NIA: 11223)       |
|  ( ) Senpai Linda  (NIA: 44556)       |
|  [ + DAFTARKAN USER BARU JADI KETUA ] |
|                                       |
|  AKSES LOGIN KETUA:                   |
|  Email: [ taufik@email.com         ] |
|  Pass : [ ********                 ] |
|                                       |
|  [      SIMPAN & AKTIFKAN DOJO      ] |
+---------------------------------------+
```

---

## 10. Manajemen Jabatan (Ganti Ketua Dojo)

```text
+---------------------------------------+
|  < Kembali       Kelola Ketua Dojo    |
|---------------------------------------|
|  DOJO: Dojo GOR Ciracas               |
|  KETUA SAAT INI: Senpai Linda         |
|                                       |
|  GANTI KETUA:                         |
|  [ Pilih Anggota Pengganti...   [v] ] |
|                                       |
|  ALASAN PERGANTIAN:                   |
|  [ Mutasi / Masa Jabatan Habis...   ] |
|                                       |
|  [    KONFIRMASI PERGANTIAN KETUA   ] |
+---------------------------------------+
```
