# Wireframe Aplikasi INKAI (Mode Pengurus Pusat / PP)

Dokumen ini merinci antarmuka untuk Pengurus Pusat yang memegang otoritas tertinggi secara nasional. Pengurus Pusat (PP) mengawasi seluruh Pengurus Provinsi (Pengprov), Pengurus Cabang (Pengcab), Dojo, dan seluruh Anggota INKAI di seluruh Indonesia.

---

## 1. Dashboard Pengurus Pusat (Nasional)

Gambaran statistik kesehatan organisasi INKAI secara nasional.

```text
+---------------------------------------+
|  LOGO INKAI      [PENGURUS PUSAT (PP)]|
|  Halo, Shihan Ahmad (Ketua Umum PP)   |
|---------------------------------------|
|  STATISTIK NASIONAL:                  |
|  +-------------------+----------------+
|  | TOTAL PROVINSI: 38| TOTAL CABANG:  |
|  |                   | 520 Cabang     |
|  +-------------------+----------------+
|  | TOTAL ANGGOTA:    | TOTAL DOJO:    |
|  | 125.000 Orang     | 3.450 Dojo     |
|  +-------------------+----------------+
|                                       |
|  MENU EKSEKUTIF PUSAT:                |
|  [🏛️ Daftar Provinsi ] [📊 Laporan Nas. ]|
|  [👥 Data Anggota    ] [📢 Info Nasional ]|
|  [🥋 Event & Ujian   ] [📩 Approval PP   ]|
|                                       |
|  AGENDA NASIONAL TERDEKAT:            |
|  - "Kejurnas INKAI 2026 - Jakarta"    |
|  - "Ujian DAN Nasional Gelombang I"   |
|                                       |
|=======================================|
| [Home]  [Provinsi]  [Admin]   [Profil ]|
+---------------------------------------+
```

---

## 2. Monitoring Pengprov (Seluruh Indonesia)

Melihat dan mengelola daftar Pengurus Provinsi di seluruh Indonesia.

```text
+---------------------------------------+
|  < Kembali        Daftar Provinsi     |
|---------------------------------------|
|  [ Cari Provinsi...               [Q] ]|
|                                       |
|  1. Pengprov Jawa Barat               |
|     Ketua: Shihan Agus                |
|     Cabang: 25 | Anggota: 15.400      |
|     [ Detail ] [ Kelola ]             |
|                                       |
|  2. Pengprov Jawa Timur               |
|     Ketua: Shihan Bambang             |
|     Cabang: 32 | Anggota: 18.200      |
|     [ Detail ] [ Kelola ]             |
|                                       |
|  3. Pengprov Bali                     |
|     Ketua: Shihan Wayan               |
|     Cabang: 9  | Anggota: 4.500       |
|     [ Detail ] [ Kelola ]             |
|                                       |
|  [ + DAFTARKAN PENGURUS PROVINSI BARU ]|
+---------------------------------------+
```

---

## 3. Database Anggota Nasional

Pencarian anggota di seluruh Indonesia dengan filter berjenjang (Provinsi -> Cabang -> Dojo).

```text
+---------------------------------------+
|  < Kembali        Anggota Nasional    |
|---------------------------------------|
|  [ Cari Nama / NIA Nasional...    [Q] ]|
|                                       |
|  FILTER BERJENJANG:                   |
|  Prov: [ Jawa Barat           [v] ]   |
|  Kota: [ Kota Bandung         [v] ]   |
|  Dojo: [ Semua Dojo           [v] ]   |
|                                       |
|  HASIL PENCARIAN:                     |
|  1. Budi Santoso (NIA: 12345)         |
|     Prov: Jabar | Sabuk: Hitam DAN 2  |
|                                       |
|  2. Siti Aminah (NIA: 99887)          |
|     Prov: Jabar | Sabuk: Cokelat Kyu 1|
|                                       |
|  [ EXPORT DATA NASIONAL (CSV/XLS) ]   |
+---------------------------------------+
```

---

## 4. Manajemen Event & Ujian Nasional

Pengelolaan agenda besar yang melibatkan seluruh atau sebagian besar wilayah.

```text
+---------------------------------------+
|  < Kembali         Event Nasional     |
|---------------------------------------|
|  DAFTAR AGENDA AKTIF:                 |
|  1. Ujian DAN Nasional (Sabuk Hitam)  |
|     Status: Pendaftaran Dibuka        |
|     Peserta Terdaftar: 450 Orang      |
|     [ Kelola ] [ Data Peserta ]       |
|                                       |
|  2. Pelatihan Pelatih Nasional        |
|     Status: Persiapan                 |
|     Lokasi: PMPP TNI, Sentul          |
|     [ Detail ] [ Edit ]               |
|                                       |
|  [ + BUAT AGENDA NASIONAL BARU ]      |
+---------------------------------------+
```

---

## 5. Broadcast Nasional

Fitur broadcast informasi dari Pengurus Pusat ke seluruh struktur di bawahnya.

```text
+---------------------------------------+
|  < Kembali      Broadcast Nasional    |
|---------------------------------------|
|  JUDUL:                               |
|  [ Instruksi Ketum Terkait Seragam  ] |
|                                       |
|  ISI PESAN:                           |
|  +-----------------------------------+|
|  | Menindaklanjuti hasil Rakernas... ||
|  |                                   ||
|  +-----------------------------------+|
|                                       |
|  TARGET PENERIMA:                     |
|  [x] Semua Pengprov (Provinsi)        |
|  [x] Semua Pengcab (Cabang)           |
|  [x] Semua Ketua Dojo                 |
|  [x] Seluruh Anggota (Nasional)       |
|                                       |
|  METODE: [ App Push ] [ WhatsApp ]    |
|                                       |
|  [    KIRIM KE SELURUH INDONESIA    ] |
+---------------------------------------+
```

---

## 6. Verifikasi & Approval (Level PP)

Persetujuan registrasi Pengprov baru atau mutasi antar-provinsi.

```text
+---------------------------------------+
|  < Kembali         Approval PP        |
|---------------------------------------|
|  PENGAJUAN PENGPROV BARU:             |
|  - Nama: Pengprov Papua Barat Daya    |
|    Ketua: Sensei Markus               |
|    [ Cek Dokumen SK ] [ SETUJUI ]     |
|                                       |
|  MUTASI ANTAR-PROVINSI:               |
|  - Nama: Andi Wijaya                  |
|    Dari: Jabar -> Jatim               |
|    Status: Disetujui kedua Pengprov   |
|    [ VALIDASI FINAL PUSAT ]           |
|                                       |
|  PERUBAHAN DATA STRATEGIS:            |
|  - Request Reset Password Admin Prov  |
|    (Pengprov DKI Jakarta) [ RESET ]   |
|                                       |
|  VERIFIKASI DATA ANGGOTA (KLAIM):     |
|  - Budi S. (Klaim: DAN 2)             |
|    [ Cek Ijazah ] [ Validasi ]        |
|  - Eko P. (Klaim: Juara 1)            |
|    [ Cek Piagam ] [ Validasi ]        |
+---------------------------------------+

### Tampilan Preview & Validasi:
```text
+---------------------------------------+
|  < Kembali        Verifikasi Data     |
|---------------------------------------|
|  NAMA: Budi Santoso                   |
|  KLAIM: Lulus Ujian DAN 2             |
|                                       |
|  FOTO BUKTI (IJAZAH):                 |
|  +---------------------------------+  |
|  |                                 |  |
|  |         [ GAMBAR IJAZAH ]       |  |
|  |                                 |  |
|  +---------------------------------+  |
|                                       |
|  [  APPROVE  ]   [  REJECT / TOLAK  ] |
|                                       |
|  *Jika di-approve, status di profil   |
|   anggota menjadi "VERIFIED".         |
+---------------------------------------+
```
```

---

## 7. Registrasi Pengurus Provinsi (Pengprov) Baru

Menu untuk mendaftarkan kepengurusan tingkat provinsi yang baru terbentuk.

```text
+---------------------------------------+
|  < Kembali      Registrasi Pengprov   |
|---------------------------------------|
|  WILAYAH PROVINSI:                    |
|  [ Pilih Provinsi...            [v] ] |
|                                       |
|  IDENTITAS KETUA PENGPROV:            |
|  [ Cari Member by NIA/Nama...     [Q] ]|
|  Terpilih: Shihan Agus (NIA: 11223)   |
|                                       |
|  DOKUMEN SK PENGANGKATAN PP:          |
|  [ Unggah PDF SK Pusat (+) ]          |
|                                       |
|  AKSES LOGIN ADMIN PROVINSI:          |
|  Email: [ admin.jabar@inkai.or.id ]   |
|  Pass : [ ********               ]    |
|                                       |
|  [    SIMPAN & AKTIFKAN PENGPROV    ] |
+---------------------------------------+
```

---

## 8. Profil Pribadi (Ketua Umum PP)

Akses ke data karate pribadi Ketua Umum sebagai anggota INKAI.

```text
+---------------------------------------+
|  Profil Eksekutif Pusat               |
|---------------------------------------|
|  [ Foto Profil ]  Shihan Ahmad        |
|  Jabatan: Ketua Umum Pengurus Pusat   |
|  NIA: 00001  | Sabuk: Hitam (DAN 8)   |
|                                       |
|  MENU PRIBADI:                        |
|  +-----------------------------------+|
|  | [🪪 Kartu Anggota Digital      ] ||
|  | [🥋 Riwayat Kyu / DAN          ] ||
|  | [🎓 Sertifikasi Nasional        ] ||
|  | [🏆 Penghargaan Organisasi     ] ||
|  +-----------------------------------+|
|                                       |
|  [ KELUAR / LOGOUT ]                  |
|=======================================|
| [Home]  [Provinsi]  [Admin]   [Profil ]|
+---------------------------------------+
```
