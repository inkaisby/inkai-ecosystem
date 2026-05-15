<!-- Salinan untuk dibuka dari folder inkai-mobile-web. Versi kanonik di root monorepo: wireframe-laporan-peserta-cabang-wa.md -->

# Wireframe — ringkasan peserta untuk WhatsApp (laporan cabang)

Dokumen ini mendeskripsikan **format teks ringkas** untuk **ditempel ke WhatsApp** dan dilaporkan ke cabang (satu pesan per agenda / per ranting: judul, dojo, daftar peserta bernomor, total pembayaran).

---

## Wireframe alur di aplikasi

```
┌─────────────────────────────────────────────────────────────────┐
│  MANAJEMEN PESERTA · [Judul agenda]                               │
├─────────────────────────────────────────────────────────────────┤
│  [ Tab: Semua | Pending | Disetujui | Ditolak ]                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────┐                                                       │
│  │ foto │  NAMA LENGKAP ANGGOTA                                  │
│  │strip │  📍 GADING   [💳][📞][💬][📋 salin …]                   │
│  └──────┘   …                                                    │
└─────────────────────────────────────────────────────────────────┘

       │
       │  salin → teks mengikuti templat ringkas di bawah
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  WhatsApp — tempel pesan laporan                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Wireframe blok pesan (plain text)

```
┌─────────────────────────────────────────
│          │ {Judul agenda}
│          │ Ranting/Dojo: {nama}
│ (kosong) │
│          │ Peserta yang terdaftar
│          │ 1. {Nama singkat tingkat sabuk/Kyu}
│          │ 2. …
│          │ …
│          │ Total pembayaran Rp {nominal}
└─────────────────────────────────────────
```

---

## Templat (placeholder)

```
{Judul agenda}
Ranting/Dojo: {Ranting/Dojo}

Peserta yang terdaftar
1. {Nama} {ringkas tingkat, mis. Kyu 3}
2. {Nama} {ringkas tingkat}
3. {Nama} {ringkas tingkat}
…

Total pembayaran Rp {total}
```

**Catatan isi:**

- **Ringkas tingkat** bisa dari sabuk/Kyu di data anggota (contoh: `Kyu 3`, atau cuplikan dari `currentRank`).
- **Total pembayaran** = jumlah nominal yang dilaporkan untuk peserta yang masuk daftar (mis. penjumlahan biaya kategori / tagihan sesuai kebijakan laporan).

---

## Contoh terisi

```
Latihan Bersama Juni 2026
Ranting/Dojo: GADING

Peserta yang terdaftar
1. Reynard Nathanael Giovanni Kyu 3
2. zahwa Kyu 2
3. anggun Kyu 1
…

Total pembayaran Rp 1.000.000
```

---

## Referensi implementasi

- Saat ini tombol salin di `src/app/admin/events/[id]/participants/page.tsx` menghasilkan format **per peserta** (detail baris demi baris).
- Penyelarasan UI dengan templat **ringkas berikut** (satu blok + daftar bernomor + total) dapat ditambahkan terpisah (mis. aksi “salin laporan cabang” di header agenda atau aggregate dari peserta disetujui).
