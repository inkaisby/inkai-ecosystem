# Wireframe Aplikasi INKAI (Mode Pengurus Provinsi / Pengprov)

Dokumen ini merinci antarmuka untuk Pengurus Provinsi yang mengawasi seluruh Cabang dan Dojo di wilayah provinsinya. Pengurus Provinsi (Pengprov) memiliki wewenang administratif tertinggi di tingkat daerah, membawahi Pengurus Cabang, Ketua Dojo, dan seluruh Anggota di provinsi tersebut.

---

## 1. Dashboard Pengurus Provinsi

Halaman utama yang memberikan gambaran statistik kesehatan organisasi di tingkat provinsi.

```text
+---------------------------------------+
|  LOGO INKAI      [PENGPROV JAWA BARAT]|
|  Halo, Shihan Agus (Ketua Pengprov)   |
|---------------------------------------|
|  STATISTIK PROVINSI:                  |
|  +-------------------+----------------+
|  | TOTAL CABANG: 25  | TOTAL DOJO:    |
|  |                   | 180 Dojo       |
|  +-------------------+----------------+
|  | TOTAL ANGGOTA:    | PENDING VERIF: |
|  | 4.250 Orang       | [ 12 Pengajuan]|
|  +-------------------+----------------+
|                                       |
|  MENU EKSEKUTIF:                      |
|  [🏢 Daftar Cabang ] [🏠 Semua Dojo    ]|
|  [👥 Data Anggota  ] [📢 Info Provinsi ]|
|  [📊 Lap. Tahunan  ] [📩 Persetujuan   ]|
|                                       |
|  KEGIATAN PROVINSI TERDEKAT:          |
|  - "Musprov INKAI Jabar 2026..."      |
|  - "Gashuku & Ujian DAN Wilayah..."   |
|                                       |
|=======================================|
| [Home]   [Cabang]   [Admin]   [Profil ]|
+---------------------------------------+
```

---

## 2. Daftar Cabang (Pengcab) se-Provinsi

Melihat dan mengelola daftar Pengurus Cabang (tingkat Kota/Kabupaten).

```text
+---------------------------------------+
|  < Kembali         Daftar Cabang      |
|---------------------------------------|
|  [ Cari Nama Cabang...            [Q] ]|
|                                       |
|  1. Pengcab Kota Bandung              |
|     Ketua: Sensei Dedi                |
|     Dojo: 15 | Anggota: 850           |
|     [ Detail ] [ Kelola ]             |
|                                       |
|  2. Pengcab Kab. Bogor                |
|     Ketua: Sensei Rudy                |
|     Dojo: 22 | Anggota: 1.100         |
|     [ Detail ] [ Kelola ]             |
|                                       |
|  3. Pengcab Kota Bekasi               |
|     Ketua: Sensei Maya                |
|     Dojo: 12 | Anggota: 600           |
|     [ Detail ] [ Kelola ]             |
|                                       |
|  [ + DAFTARKAN PENGURUS CABANG BARU ] |
+---------------------------------------+
```

---

## 3. Monitoring Dojo (Global Provinsi)

Melihat seluruh Dojo di provinsi dengan filter per Cabang.

```text
+---------------------------------------+
|  < Kembali          Data Dojo         |
|---------------------------------------|
|  Filter Cabang: [ Semua Cabang  [v] ] |
|                                       |
|  1. Dojo Pusat Bandung (Kota Bandung) |
|     Ketua: Sensei Budi                |
|     Anggota: 120 | [ Lihat Detail ]   |
|                                       |
|  2. Dojo Cibinong (Kab. Bogor)        |
|     Ketua: Senpai Linda               |
|     Anggota: 45  | [ Lihat Detail ]   |
|                                       |
|  [ Cari Nama Dojo...              [Q] ]|
+---------------------------------------+
```

---

## 4. Database Anggota (Global Provinsi)

Pencarian anggota di seluruh provinsi untuk verifikasi data atau mutasi besar.

```text
+---------------------------------------+
|  < Kembali         Data Anggota       |
|---------------------------------------|
|  [ Cari Nama / NIA...             [Q] ]|
|                                       |
|  Filter Cabang: [ Kota Bandung  [v] ] |
|  Filter Sabuk : [ Hitam (DAN)   [v] ] |
|                                       |
|  HASIL (DAN di Kota Bandung):         |
|  1. Budi Santoso (NIA: 12345)         |
|     Dojo: Pusat | Sabuk: Hitam DAN 2  |
|                                       |
|  2. Ani Wijaya (NIA: 67890)           |
|     Dojo: Siliwangi | Sabuk: Hitam DAN 1|
|                                       |
|  [ DOWNLOAD REKAP ANGGOTA (EXCEL) ]   |
+---------------------------------------+
```

---

## 5. Manajemen Pengumuman Provinsi

Fitur broadcast informasi dari Pengprov ke struktur di bawahnya.

```text
+---------------------------------------+
|  < Kembali       Broadcast Provinsi   |
|---------------------------------------|
|  JUDUL:                               |
|  [ Masukkan Judul Informasi...      ] |
|                                       |
|  ISI PESAN:                           |
|  +-----------------------------------+|
|  |                                   ||
1: |  | [ Tulis pesan pengprov... ]       ||
2: |  |                                   ||
3: |  +-----------------------------------+|
|                                       |
|  TARGET BROADCAST:                    |
|  [ ] Semua Ketua Cabang (Pengcab)     |
|  [ ] Semua Ketua Dojo (Ranting)       |
|  [ ] Semua Anggota se-Provinsi        |
|                                       |
|  METODE: [ App Push ] [ Email ]       |
|                                       |
|  [      PUBLIKASIKAN SEKARANG      ]  |
+---------------------------------------+
```

---

## 6. Verifikasi & Approval (Level Pengprov)

Persetujuan untuk hal-hal strategis tingkat daerah.

```text
+---------------------------------------+
|  < Kembali        Persetujuan         |
|---------------------------------------|
|  PENGAJUAN UJIAN DAN (SABUK HITAM):   |
|  - Pengcab Kota Bandung (12 Peserta)  |
|    [ Cek Dokumen ] [ Approve ]        |
|                                       |
|  - Pengcab Kab. Bogor (8 Peserta)     |
|    [ Cek Dokumen ] [ Approve ]        |
|                                       |
|  MUTASI ANTAR CABANG:                 |
|  - Nama: Eko Prasetyo                 |
|    Dari: Kota Bandung -> Kab. Bogor   |
|    Status: Disetujui kedua Pengcab    |
|    [ VERIFIKASI AKHIR ]               |
+---------------------------------------+
```

---

## 7. Form Registrasi Pengcab Baru

Ketua Pengprov menunjuk dan mendaftarkan Ketua Cabang baru.

```text
+---------------------------------------+
|  < Kembali      Registrasi Pengcab    |
|---------------------------------------|
|  WILAYAH CABANG:                      |
|  [ Pilih Kota/Kabupaten...      [v] ] |
|                                       |
|  IDENTITAS KETUA CABANG:              |
|  [ Cari Member by NIA/Nama...     [Q] ]|
|  Terpilih: Sensei Dedi (NIA: 11223)   |
|                                       |
|  DOKUMEN SK PENGANGKATAN:             |
|  [ Unggah PDF SK Pengprov (+) ]       |
|                                       |
|  AKSES LOGIN:                         |
|  Email: [ dedi.pengcab@email.com ]    |
|  Pass : [ ********               ]    |
|                                       |
|  [     SIMPAN & AKTIFKAN PENGCAB     ] |
+---------------------------------------+
```

---

## 8. Profil Pribadi (Role: Anggota)

Sebagai Ketua Pengprov, Shihan Agus tetap memiliki akses ke riwayat karate pribadinya.

```text
+---------------------------------------+
|  Profil Eksekutif & Keanggotaan       |
|---------------------------------------|
|  [ Foto Profil ]  Shihan Agus         |
|  Jabatan: Ketua Pengprov Jawa Barat   |
|  NIA: 112233 | Sabuk: Hitam (DAN 6)   |
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
| [Home]   [Cabang]   [Admin]   [Profil ]|
+---------------------------------------+
```
