# Wireframe Aplikasi INKAI (Mode Ketua Ranting/Dojo)

Dokumen ini merinci antarmuka untuk Ketua Ranting/Dojo yang berfungsi untuk memantau anggota, iuran, dan pendaftaran event kolektif.

---

## 1. Dashboard Ketua Ranting/Dojo

Halaman utama yang memberikan ringkasan kondisi Dojo saat ini.

```text
+---------------------------------------+
|  LOGO INKAI    [Dojo Pusat Jakarta]   |
|  Halo, Sensei Ahmad (Ketua Dojo)      |
|---------------------------------------|
|  RINGKASAN DOJO:                      |
|  +-------------------+----------------+
|  | TOTAL ANGGOTA: 85 | AKTIF: 72      |
|  +-------------------+----------------+
|  | PENDING TRANSFER  | [ 3 Pengajuan ]|
|  +-------------------+----------------+
|                                       |
|  MENU ADMIN:                          |
|  [👥 Daftar Anggota] [💰 Laporan Iuran]|
|  [🏆 Daftar Kolektif][📩 Verifikasi  ]|
|                                       |
|  IURAN BULAN INI (MEI):               |
|  - Terbayar: 45 / 85 Anggota          |
|  [ Lihat Detail Menunggak ]           |
|                                       |
|=======================================|
| [Home]  [Anggota]  [Absensi]  [Profil ]|
+---------------------------------------+
| *Menu baru: Absensi untuk scan QR      |
|  anggota saat latihan dimulai.         |
```

---

## 2. Daftar Anggota Dojo

Melihat seluruh profil dan status keanggotaan semua karateka di Dojo tersebut.

```text
+---------------------------------------+
|  < Kembali        Daftar Anggota      |
|---------------------------------------|
|  [ Cari Nama / NIA...             [Q] ]|
|  Filter: [ Sabuk v ] [ Status v ]     |
|                                       |
|  1. Budi Santoso (NIA: 12345)         |
|     Sabuk: Coklat | Status: AKTIF     |
|     [ Detail ] [ Bayar Iuran ]        |
|                                       |
|  2. Ani Wijaya (NIA: 67890)           |
|     Sabuk: Putih  | Status: NONAKTIF  |
|     [ Detail ] [ Bayar Iuran ]        |
|                                       |
|  3. Citra Dewi (NIA: 11223)           |
|     Sabuk: Kuning | Status: AKTIF     |
|     [ Detail ] [ Bayar Iuran ]        |
|                                       |
|  [ + TAMBAH ANGGOTA BARU (OFFLINE) ]  |
+---------------------------------------+
```

---

## 3. Pendaftaran Event Kolektif

Fitur bagi Ketua Dojo untuk mendaftarkan banyak anggota sekaligus ke sebuah event (misal: Kejuaraan atau Gashuku).

```text
+---------------------------------------+
|  < Kembali      Daftar Kolektif       |
|---------------------------------------|
|  PILIH EVENT:                         |
|  [ Gashuku Nasional 2026        [v] ] |
|                                       |
|  PILIH ANGGOTA (Dojo Pusat):          |
|  [X] Budi Santoso (Coklat)            |
|  [ ] Ani Wijaya (Putih)               |
|  [X] Citra Dewi (Kuning)              |
|  [X] Dedi Irawan (Hijau)              |
|  ...                                  |
|                                       |
|  RINGKASAN:                           |
|  Total Peserta: 3 Anggota             |
|  Total Biaya  : Rp 1.500.000          |
|                                       |
|  [     LANJUT KE PEMBAYARAN       ]   |
+---------------------------------------+
```

---

## 4. Laporan Iuran Anggota (Bulanan)

Memantau siapa saja yang sudah membayar dan siapa yang belum untuk tiap bulannya.

```text
+---------------------------------------+
|  < Kembali       Laporan Iuran        |
|---------------------------------------|
|  Periode: [ Mei 2026            [v] ] |
|                                       |
|  STATUS PEMBAYARAN:                   |
|  [ LUNAS ]  Budi Santoso              |
|  [ LUNAS ]  Citra Dewi                |
|  [ PENDING ] Dedi Irawan              |
|  [ BELUM ]  Ani Wijaya                |
|                                       |
|  AKSI MASAL:                          |
|  [ KIRIM REMINDER WA KE PENUNGGAK ]   |
|                                       |
|  *Reminder akan dikirim ke No WA      |
|   anggota/orang tua masing-masing.    |
+---------------------------------------+
```

---

## 5. Verifikasi Perpindahan Anggota

Ketua Dojo menyetujui anggota yang ingin masuk ke dojonya atau keluar dari dojonya.

```text
+---------------------------------------+
|  < Kembali        Verifikasi          |
|---------------------------------------|
|  PENGAJUAN PINDAH DOJO:               |
|                                       |
|  Nama: Eko Prasetyo                   |
|  Asal: Dojo Surabaya Barat            |
|  Tujuan: Dojo Pusat Jakarta           |
|  Alasan: Pindah Domisili              |
|                                       |
|  [    SETUJUI    ]   [    TOLAK     ] |
|                                       |
|  *Setelah disetujui Ketua Dojo, akan  |
|   diteruskan ke Ketua Cabang.         |
+---------------------------------------+
```
---

## 6. Profil Pribadi & Keanggotaan (Role: Anggota)

Sebagai Ketua Dojo, Sensei Ahmad juga memiliki profil keanggotaan pribadi.

```text
+---------------------------------------+
|  Profil Ketua & Keanggotaan           |
|---------------------------------------|
|  [ Foto Profil ]  Sensei Ahmad         |
|  Jabatan: Ketua Dojo Pusat Jakarta    |
|  NIA: 887766 | Sabuk: Hitam (DAN 3)   |
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
| [Home]  [Anggota]  [Keuangan] [Profil ]|
+---------------------------------------+
```

---

## 7. Riwayat Kyu / DAN (Pribadi)

```text
+---------------------------------------+
|  < Kembali       Riwayat Kyu / DAN    |
|---------------------------------------|
|  1. DAN 3 (Hitam)                     |
|     Lulus: 2021 | Lokasi: Honbu Dojo  |
|                                       |
|  2. DAN 2 (Hitam)                     |
|     Lulus: 2018 | Lokasi: Cabang JKT  |
|                                       |
|  [ + TAMBAH DATA LULUS UJIAN ]        |
+---------------------------------------+
```
---

## 8. Riwayat Pelatihan (Pribadi)

```text
+---------------------------------------+
|  < Kembali      Riwayat Pelatihan     |
|---------------------------------------|
|  1. Gashuku Nasional 2023             |
|     Status: PESERTA                   |
|                                       |
|  2. Coaching Clinic Kumite            |
|     Status: LULUS                     |
|                                       |
|  [ + TAMBAH DATA PELATIHAN ]          |
+---------------------------------------+

---

## 9. Sistem Absensi Latihan (Harian)

Fitur bagi pelatih/ketua dojo untuk mencatat kehadiran anggota secara cepat.

```text
+---------------------------------------+
|  < Kembali         Absensi Dojo       |
+---------------------------------------|
|  TANGGAL: 01 Mei 2026                 |
|                                       |
|  [        SCAN QR ANGGOTA          ]  |
|  (Membuka Kamera HP)                  |
|                                       |
|  REKAP SCAN HARI INI:                 |
|  1. Budi Santoso (19:05)   [OK]       |
|  2. Citra Dewi   (19:10)   [OK]       |
|  3. Dedi Irawan  (19:15)   [OK]       |
|                                       |
|  [     INPUT MANUAL (BY NAME)      ]  |
|                                       |
|  [        SIMPAN ABSENSI           ]  |
+---------------------------------------+
```

### QR Scanner View (Admin):
```text
+---------------------------------------+
|  [X] Batal         Scanning...        |
|---------------------------------------|
|                                       |
|      [       |        |       ]       |
|      [-------+        +-------]       |
|      [       | CAMERA |       ]       |
|      [-------+        +-------]       |
|      [       |        |       ]       |
|                                       |
|  Arahkan kamera ke QR Code Anggota    |
|  di HP Anggota / Kartu Fisik          |
+---------------------------------------+
```
```
