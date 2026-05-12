# Wireframe Web Admin Panel (Desktop) - INKAI

Dokumen ini merinci desain antarmuka berbasis web (desktop) untuk Pengurus Pusat, Provinsi, dan Cabang. Antarmuka ini dirancang untuk produktivitas tinggi dalam mengelola data ribuan anggota, laporan keuangan, dan verifikasi dokumen.

---

## 1. Layout Utama (Shell)

Struktur dasar yang konsisten di semua level admin web.

```text
+----------------------------------------------------------------------------------+
| [LOGO INKAI]  Portal Admin Pusat/Provinsi         [🔍 Search...] [🔔] [👤 Admin V] |
+---+------------------------------------------------------------------------------+
| S |                                                                              |
| I |  DASHBOARD OVERVIEW                                                          |
| D |  --------------------------------------------------------------------------  |
| E |  +--------------+  +--------------+  +--------------+                        |
| B |  | TOTAL AGGOTA |  | TOTAL DOJO   |  | PENDING REQ  |                        |
| A |  | 125,400      |  | 3,450        |  | 45 Pending   |                        |
| R |  +--------------+  +--------------+  +--------------+                        |
|   |                                                                              |
| N |  GRAFIK PERTUMBUHAN ANGGOTA (TAHUNAN)                                        |
| A |  +------------------------------------------------------------------------+  |
| V |  | [####################################################################] |  |
|   |  +------------------------------------------------------------------------+  |
|   |                                                                              |
|   |  KEGIATAN AKTIF SAAT INI                                                     |
|   |  +----------------------------+  +----------------------------+              |
|   |  | Kejurnas 2026              |  | Ujian DAN Nasional         |              |
|   |  | [ Manage ] [ Reports ]     |  | [ Manage ] [ Reports ]     |              |
|   |  +----------------------------+  +----------------------------+              |
+---+------------------------------------------------------------------------------+
```

### Sidebar Menu:
- **Dashboard** (Ringkasan Statistik)
- **Hierarki Organisasi** (Daftar Pengprov/Cabang/Dojo)
- **Database Anggota** (Tabel Master Anggota)
- **Verifikasi & Approval** (Antrean Validasi Data & Mutasi)
- **Manajemen Event** (Ujian, Gashuku, Pertandingan)
- **Broadcast & Informasi** (Pengumuman Pusat/Daerah)
- **Pengaturan Sistem** (Manajemen User Admin & Konfigurasi)

---

## 2. Database Anggota (Master Table View)

Tampilan tabel dengan filter canggih untuk mengelola data massal.

```text
+----------------------------------------------------------------------------------+
| DATABASE ANGGOTA NASIONAL                                     [📥 Export Excel]  |
+----------------------------------------------------------------------------------+
| Filters: [ Wilayah v ] [ Cabang v ] [ Dojo v ] [ Sabuk v ] [ Status v ] [🔍 Cari] |
+----------------------------------------------------------------------------------+
| NIA       | Nama Lengkap    | Sabuk     | Wilayah       | Dojo        | Status   |
+-----------+-----------------+-----------+---------------+-------------+----------+
| 12345001  | Budi Santoso    | DAN 2     | Jawa Barat    | Pusat BDG   | [Aktif]  |
| 12345002  | Ani Wijaya      | Kyu 1     | DKI Jakarta   | GOR Ciracas | [Macet]  |
| 12345003  | Citra Dewi      | Kyu 3     | Jawa Timur    | Dojo Sub    | [Aktif]  |
| ...       | ...             | ...       | ...           | ...         | ...      |
+-----------+-----------------+-----------+---------------+-------------+----------+
| [First] [1] [2] [3] ... [1250] [Last]                        Rows per page: [25] |
+----------------------------------------------------------------------------------+
```

---

## 3. Sistem Verifikasi Riwayat & Sabuk

Antrean kerja (worklist) untuk memvalidasi klaim data yang diinput user dari aplikasi mobile.

```text
+----------------------------------------------------------------------------------+
| ANTREAN VERIFIKASI DATA                                                          |
+----------------------------------------------------------------------------------+
| [ Tab: Riwayat Sabuk (15) ] [ Tab: Prestasi (8) ] [ Tab: Mutasi (12) ]           |
+----------------------------------------------------------------------------------+
| TANGGAL    | ANGGOTA        | KLAIM DATA      | BUKTI DOKUMEN       | AKSI       |
+------------+----------------+-----------------+---------------------+------------+
| 01/05/2026 | Budi Santoso   | Lulus DAN 2     | [📄 Ijazah_Budi.pdf] | [V] [X]    |
| 30/04/2026 | Eko Prasetyo   | Juara 1 Kumite  | [🖼️ Sertifikat.jpg]  | [V] [X]    |
+------------+----------------+-----------------+---------------------+------------+
|                                                                                  |
| PREVIEW DOKUMEN (Klik baris untuk melihat):                                      |
| +-----------------------------------------+                                      |
| |                                         |                                      |
| |             [ GAMBAR IJAZAH ]           |      [ CATATAN ADMIN:            ]   |
| |                                         |      [ Data sesuai database 2024 ]   |
| |                                         |                                      |
| |                                         |      [ APPROVE ]    [ REJECT ]       |
| +-----------------------------------------+                                      |
+----------------------------------------------------------------------------------+
```

---

## 4. Sistem Absensi Dojo (Web View)

Ketua Dojo dapat melihat rekap kehadiran bulanan di laptop.

```text
+----------------------------------------------------------------------------------+
| REKAP ABSENSI LATIHAN - DOJO PUSAT JAKARTA                                       |
+----------------------------------------------------------------------------------+
| Periode: [ Mei 2026 v ]                                      [📥 Download PDF]   |
+--------------------+-----+-----+-----+-----+-----+-------------------------------+
| NAMA ANGGOTA       | TGL1| TGL3| TGL5| TGL8| ... | % KEHADIRAN | STATUS UJIAN    |
+--------------------+-----+-----+-----+-----+-----+-------------+-----------------+
| Budi Santoso       | [V] | [V] | [V] | [V] | ... | 100%        | [SIAP UJIAN]    |
| Ani Wijaya         | [V] | [X] | [V] | [X] | ... | 50%         | [BELUM CUKUP]   |
| ...                | ... | ... | ... | ... | ... | ...         | ...             |
+--------------------+-----+-----+-----+-----+-----+-------------+-----------------+
| *Syarat minimal ikut ujian: 75% Kehadiran                                        |
+----------------------------------------------------------------------------------+

---

## 6. Manajemen Broadcast & Riwayat Informasi

Admin dapat membuat dan melihat performa pengumuman yang dikirim.

```text
+----------------------------------------------------------------------------------+
| RIWAYAT BROADCAST & PENGUMUMAN                                [ + BUAT BARU ]    |
+----------------------------------------------------------------------------------+
| TANGGAL    | JUDUL                 | TARGET         | STATUS    | TERBACA    |
+------------+-----------------------+----------------+-----------+------------+
| 01/05/2026 | Instruksi Seragam     | Semua Anggota  | Terkirim  | 85.400     |
| 28/04/2026 | Update Iuran 2026     | Semua Anggota  | Terkirim  | 110.200    |
| 25/04/2026 | Ujian DAN Nasional    | Sabuk Cokelat  | Terkirim  | 5.200      |
+------------+-----------------------+----------------+-----------+------------+
|                                                                                  |
| DETAIL BROADCAST:                                                                |
| +------------------------------------------------------------------------------+ |
| | Judul  : Instruksi Seragam Baru                                              | |
| | Isi    : Menindaklanjuti hasil Rakernas, diberitahukan bahwa...              | |
| | Lampir : [📄 sk_seragam.pdf]                                                 | |
| +------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------+

---

## 7. Sistem Helpdesk & Tiket Bantuan

Admin merespons kendala yang dialami anggota melalui sistem tiket terpadu.

```text
+----------------------------------------------------------------------------------+
| DAFTAR TIKET MASUK                                            [ Filter: Open v ] |
+----------------------------------------------------------------------------------+
| TICKET ID  | NAMA ANGGOTA    | SUBJEK               | STATUS    | TERAKHIR     |
+------------+-----------------+----------------------+-----------+--------------+
| #TK-8891   | Budi Santoso    | Iuran tidak update   | [OPEN]    | 5 Menit lalu |
| #TK-8890   | Ani Wijaya      | Lupa NIA             | [CLOSED]  | 2 Jam lalu   |
| #TK-8889   | Eko Prasetyo    | Salah Dojo           | [ON HOLD] | 1 Hari lalu  |
+------------+-----------------+----------------------+-----------+--------------+
|                                                                                  |
| RESPON TIKET (#TK-8891):                                                         |
| +------------------------------------------------------------------------------+ |
| | Pesan User: "Saya sudah bayar lewat VA tapi status masih belum lunas..."     | |
| | [📄 bukti_transfer.jpg]                                                      | |
| |                                                                              | |
| | Balasan Admin:                                                               | |
| | [ Input pesan balasan ke user di sini... ]                                   | |
| |                                                                              | |
| | [ KIRIM BALASAN ]     [ TANDAI SELESAI (CLOSE) ]                             | |
| +------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------+
---

## 8. Manajemen Event Detail (Pembuatan & Monitoring)

Admin tingkat Pusat/Provinsi dapat membuat agenda kegiatan dengan parameter lengkap.

```text
+----------------------------------------------------------------------------------+
| BUAT EVENT BARU                                                                  |
+----------------------------------------------------------------------------------+
| INFO DASAR:                         | PENGATURAN PESERTA:                        |
| Nama Event: [___________________]   | Sabuk Min : [ Putih v ]  Maks: [ DAN 9 v ] |
| Kategori  : [ Ujian / Gashuku v ]   | Umur Min  : [ 6 th  ]    Maks: [ 60 th  ] |
| Tanggal   : [ DD/MM/YYYY ]          | Kuota Tot : [ 500   ]                      |
| Lokasi    : [___________________]   | Biaya     : Rp [________________]          |
|                                     |                                            |
| DESKRIPSI & BANNER:                 | DOKUMEN PERSYARATAN (Wajib Upload):        |
| [ Input deskripsi lengkap... ]      | [x] Akte Lahir   [ ] Kartu BPJS            |
| [ + Unggah Banner Event (16:9) ]    | [x] Foto Ijazah Terakhir                   |
|                                     |                                            |
| [          SIMPAN & PUBLIKASIKAN KE SEMUA JARINGAN INKAI          ]              |
+----------------------------------------------------------------------------------+

| MONITORING PENDAFTAR: Gashuku Nasional 2026                 [📥 Download Rekap]  |
+----------------------------------------------------------------------------------+
| NO | NAMA ANGGOTA    | DOJO            | KATEGORI       | STATUS BAYAR | AKSI    |
+----+-----------------+-----------------+----------------+--------------+---------+
| 1  | Budi Santoso    | Pusat Jakarta   | Kumite -60kg   | [LUNAS]      | [Edit]  |
| 2  | Ani Wijaya      | Siliwangi       | Kata Perorangan| [PENDING]    | [Edit]  |
+----+-----------------+-----------------+----------------+--------------+---------+
```

---

## 9. Admin & User Management

Manajemen hak akses untuk pengurus di berbagai tingkatan (Pusat, Provinsi, Cabang, Dojo).

```text
+----------------------------------------------------------------------------------+
| MANAJEMEN USER ADMIN                                          [ + UNDANG ADMIN ] |
+----------------------------------------------------------------------------------+
| NAMA PENGURUS   | LEVEL       | ROLE          | EMAIL                | STATUS    |
+-----------------+-------------+---------------+----------------------+-----------+
| Shihan Ahmad    | Pusat       | Super Admin   | ahmad@inkai.or.id    | [AKTIF]   |
| Sensei Dedi     | Provinsi    | Admin Prov    | dedi.jabar@email.com | [AKTIF]   |
| Senpai Linda    | Dojo        | Admin Dojo    | linda@dojo.com       | [SUSPEND] |
+-----------------+-------------+---------------+----------------------+-----------+

### Form Undang Admin Baru:
+----------------------------------------------------------------------------------+
| UNDANG ADMIN BARU                                                                |
+----------------------------------------------------------------------------------+
| Pilih Anggota: [ Cari Nama/NIA... [Q] ] | Level Akses: [ Cabang v ]             |
| Role Khusus  : [ Bendahara v ]          | Email Kerja: [________________]       |
|                                                                                  |
| [          KIRIM UNDANGAN AKTIVASI (EMAIL)          ]                            |
| *User akan menerima link untuk set password sendiri.                             |
+----------------------------------------------------------------------------------+

---

## 10. Audit Logs (Log Aktivitas)

Rekaman aktivitas administratif untuk keamanan dan transparansi.

```text
+----------------------------------------------------------------------------------+
| LOG AKTIVITAS ADMIN                                           [ Filter: Date v ] |
+----------------------------------------------------------------------------------+
| WAKTU       | ADMIN         | AKSI                    | DETAIL                   |
+-------------+---------------+-------------------------+--------------------------+
| 01/05 14:00 | Shihan Ahmad  | Verifikasi Anggota      | NIA: 12345 (Budi S.)     |
| 01/05 13:45 | Sensei Dedi   | Buat Event Baru         | Gashuku Nasional 2026    |
| 01/05 12:10 | Senpai Linda  | Update Absensi          | Dojo Pusat JKT           |
+-------------+---------------+-------------------------+--------------------------+

---

## 11. Manajemen Lisensi (Wasit & Pelatih)

Admin Pusat memantau dan memvalidasi sertifikasi fungsional pengurus.

```text
+----------------------------------------------------------------------------------+
| MONITORING LISENSI NASIONAL                                   [📥 Export Data]   |
+----------------------------------------------------------------------------------+
| Filter: [ Semua Jenis v ] [ Status: Expired v ] [🔍 Cari Nama/NIA...]             |
+----------------------------------------------------------------------------------+
| NAMA           | JENIS LISENSI     | TINGKATAN       | MASA BERLAKU  | STATUS    |
+----------------+-------------------+-----------------+---------------+-----------+
| Shihan Agus    | Pelatih           | Nasional        | 12/12/2027    | [AKTIF]   |
| Sensei Rudy    | Wasit             | Nasional A      | 01/05/2026    | [EXPIRED] |
| Senpai Linda   | Pelatih           | Daerah          | 15/08/2026    | [AKTIF]   |
+----------------+-------------------+-----------------+---------------+-----------+
|                                                                                  |
| AKSI MASSAL:                                                                     |
| [ KIRIM NOTIFIKASI PERPANJANGAN KE SEMUA LISENSI EXPIRED ]                       |
+----------------------------------------------------------------------------------+

---

## 12. Manajemen Inventori & Pesanan (INKAI Store)

Admin mengelola stok perlengkapan dan memproses pesanan dari anggota.

```text
+----------------------------------------------------------------------------------+
| DAFTAR PESANAN MASUK                                          [ Status: Baru v ] |
+----------------------------------------------------------------------------------+
| ORDER ID   | NAMA PEMBELI    | PRODUK               | TOTAL      | STATUS      |
+------------+-----------------+----------------------+------------+-------------+
| #ORD-501   | Budi Santoso    | Karategi (L)         | Rp 250.000 | [DIPROSES]  |
| #ORD-500   | Ani Wijaya      | Sabuk Putih          | Rp 35.000  | [DIKIRIM]   |
+------------+-----------------+----------------------+------------+-------------+

### Manajemen Stok:
+----------------------------------------------------------------------------------+
| NAMA BARANG           | KATEGORI      | STOK TERSEDIA | HARGA      | AKSI        |
+-----------------------+---------------+---------------+------------+-------------+
| Karategi Pemula       | Seragam       | 45 Set        | Rp 250.000 | [Edit]      |
| Sabuk Hitam Tokaido   | Sabuk         | 12 Pcs        | Rp 150.000 | [Edit]      |
| [ + TAMBAH PRODUK BARU ]                                                         |
+----------------------------------------------------------------------------------+

---

## 13. Analitik Lanjutan & Heatmap Nasional

Dashboard eksekutif untuk melihat tren pertumbuhan dan persebaran anggota.

```text
+----------------------------------------------------------------------------------+
| ANALITIK PERTUMBUHAN NASIONAL                                 [ Filter: 2026 v ] |
+----------------------------------------------------------------------------------+
| HEATMAP PERSEBARAN DOJO (MAP):      | STATISTIK SABUK (PIE CHART):               |
| +--------------------------------+  | +----------------------------------------+ |
| |                                |  | |                                        | |
| |        [ PETA INDONESIA ]      |  | |   [ HITAM 5% ]  [ COKELAT 15% ]        | |
| |        (Warna Merah Pekat      |  | |   [ WARNA 80% ]                        | |
| |         = Dojo Padat)          |  | |                                        | |
| |                                |  | +----------------------------------------+ |
| +--------------------------------+  |                                            |
|                                     |                                            |
| TREN MEMBER BARU (LINE CHART):      | PREDIKSI PERTUMBUHAN 2027:                 |
| [ ############################ ]    | "Estimasi kenaikan 12% di Wilayah Timur"   |
+----------------------------------------------------------------------------------+
```
```
```
```
```
