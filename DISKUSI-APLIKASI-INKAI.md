# Diskusi Aplikasi INKAI (Institut Karate-do Indonesia)

Dokumen ini merangkum diskusi perencanaan aplikasi mobile dan web **tanpa detail implementasi kode**.

---

## Tujuan produk

- Aplikasi tentang **INKAI**, dapat diakses di **HP (Android & iOS)**.
- Fitur inti: **login**, **profil**, **keanggotaan**, **event**, dan modul terkait.
- **Juga dapat dibuka di browser desktop** (portal web responsif atau web terpisah dengan data yang sama).

---

## Jalur teknis (konsep)

### 1. Web dulu + PWA + opsional wrapper

- Website responsif + PWA (install di home screen, cache/offline ringan).
- Untuk distribusi ke App Store kadang perlu wrapper ringan.
- **Kelebihan**: satu tim, deploy cepat, perbaikan sekali untuk semua surface.
- **Keterbatasan**: UX “native” sangat dalam dan edge case perangkat bisa kurang mulus; untuk organisasi sering sudah cukup.

### 2. Cross-platform (React Native, Flutter, dll.)

- Satu codebase untuk Android + iOS; UI lebih “aplikasi” daripada web biasa.
- Browser desktop sering membutuhkan **front-end web tambahan** (admin + portal anggota) dengan **backend/API yang sama**.
- **Kelebihan**: UX mobile kuat; integrasi notifikasi dan device lebih natural.
- **Keterbatasan**: dua permukaan (app + web) jika web desktop wajib kuat.

### 3. Native murni (Swift + Kotlin)

- **Kelebihan**: polish tertinggi per platform.
- **Keterbatasan**: biaya dan waktu terbesar (dua codebase).

---

## Arsitektur konsep (umum)

- **Backend + API** terpusat: autentikasi, profil, peran (anggota vs pengurus), keanggotaan, transaksi, event.
- **Basis data** terpusat.
- **Panel admin (web)** untuk pengurus: anggota, iuran, event, laporan.
- **Keamanan**: login, sesi/token, kontrol akses berbasis peran.

### Hal yang diputuskan lebih awal

- **Sumber kebenaran keanggotaan**: verifikasi (nomor anggota, pengurus, dll.).
- **Event**: hanya informasi vs pendaftaran + kuota + bukti pembayaran.
- **Notifikasi**: pengumuman vs reminder iuran/event (mempengaruhi pilihan app vs web saja).
- **Offline**: perlu atau tidak (lapangan dengan sinyal lemah).

---

## Jawaban kebutuhan (dikonfirmasi pengguna)

| Aspek | Keputusan |
|--------|-----------|
| Distribusi | **Wajib** di **Play Store** dan **App Store** |
| Keanggotaan | Ada **iuran** |
| Event | **Jadwal** + **pendaftaran** + **pembayaran** |

---

## Implikasi ke wajib Play Store & App Store

- Perlu aplikasi yang **didistribusikan resmi**, bukan sekadar bookmark web.
- **Cross-platform** (mis. Flutter atau React Native) umumnya **seimbang** untuk satu codebase → dua store dengan UX layak (login, profil, keanggotaan, alur event).
- Web desktop tetap bisa: **portal responsif** atau modul web dengan **API/backend sama**.

---

## Keanggotaan ber-iuran

Bukan sekadar halaman profil; ini **pembayaran berkala** + **status aktif / nonaktif**.

Yang perlu direncanakan:

- **Model iuran**: bulanan, tahunan, per periode keanggotaan; grace period bila ada.
- **Channel pembayaran di Indonesia**: e-wallet, VA bank, kartu, QRIS — biasanya melalui **payment gateway** (mis. Midtrans, Xendit, dll.), bukan menyimpan data kartu sendiri.
- **Toko aplikasi vs pembayaran ke organisasi**  
  Aturan Google Play / App Store membedakan jenis barang/jasa digital vs pembayaran ke organisasi nyata. **Iuran keanggotaan** sering **tidak** melalui In-App Purchase, tetapi **nuansa kebijakan berubah** — **wajib diklarifikasi dengan dokumentasi store terkini dan saran legal** sebelum arsitektur pembayaran final.
- **Rekonsiliasi**: webhook dari gateway, status `pending` / `paid` / `failed`, riwayat untuk sengketa.

---

## Event: jadwal + pendaftaran + pembayaran

Tiga lapisan:

1. **Kalender / jadwal** — daftar, detail, lokasi, syarat.
2. **Pendaftaran** — kuota, formulir, dokumen (opsional), status peserta.
3. **Pembayaran** — sama gateway atau aturan terpisah; kemungkinan **DP + pelunasan**, **early bird**, kupon internal.

Pertanyaan operasional yang memengaruhi desain:

- Siapa yang **membuat event** (pusat saja vs cabang / dojo).
- **Pembatalan** dan kebijakan **pengembalian dana**.
- Perlu **check-in** (QR/tiket) di venue atau cukup daftar nama.

---

## Arsitektur konsep yang disarankan untuk kasus ini

- **Backend + API terpusat.**
- **Aplikasi mobile** untuk pengalaman anggota utama di store.
- **Web** untuk **pengurus** (kelola anggota, iuran, event, laporan); anggota dapat memakai web di desktop tanpa install.
- **Push notification** untuk iuran, konfirmasi pembayaran, update event.

---

## MVP yang disarankan

1. Login + profil + status keanggotaan  
2. **Iuran**: tagihan per periode, bayar, riwayat  
3. Event: daftar → detail → daftar → bayar → status peserta  
4. Admin web: data master minimal  

Pengembangan lanjutan: laporan, multi-cabang, fitur komunitas, dll.

---

## Risiko & kepatuhan

- **Perlindungan data pribadi** (UU PDP Indonesia): kumpulkan data sesedikit mungkin, kebijakan privasi, persetujuan.
- **Audit**: log transaksi dan akses.
- **Kebijakan pembayaran di dalam app vs alur web**: hindari penolakan review store dengan keputusan produk yang konsisten sejak awal.

---

## Ringkasan rekomendasi praktis

- **Flutter atau React Native** untuk **Android + iOS**.  
- **Backend terpisah**; **web admin + portal web anggota** memakai API yang sama.  
- **Payment gateway** untuk iuran dan event, dengan **webhook / antrean** untuk status pembayaran yang andal.

---

## Topik lanjutan (untuk menyempitkan desain data)

- Struktur **pengurus**:
    - **Pusat**: Monitoring nasional.
    - **Provinsi (Pengda)**: Monitoring tingkat provinsi.
    - **Cabang (Pengcab)**: Mengawasi beberapa Dojo/Ranting, membuat pengumuman wilayah, dan verifikasi perpindahan anggota antar-dojo.
    - **Dojo/Ranting**: Level operasional terkecil, mengelola anggota dan iuran harian.
- Apakah **satu akun** boleh mewakili **keluarga / anak** atau **strict satu akun satu anggota**.

---

*Dokumen ini disimpan dari diskusi perencanaan; bukan spesifikasi teknis final.*
