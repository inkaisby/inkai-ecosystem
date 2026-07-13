# Panduan Pengembangan Ekosistem INKAI

Selamat datang di repositori pengembangan **Institut Karate-do Indonesia (INKAI)**. Proyek ini menggunakan arsitektur modular untuk mendukung Web Admin, Mobile App, dan API Terpusat.

## 📁 Struktur Proyek

- **`/inkai-backend`**: API Server (Node.js, Express, TypeScript, PostgreSQL).
- **`/inkai-mobile`**: Aplikasi Mobile untuk Anggota (Flutter).

---

## 🚀 Cara Memulai

### 1. Persiapan Backend (API)
1. Masuk ke folder backend: `cd inkai-backend`
2. Install dependensi: `npm install`
3. Salin file `.env` dan sesuaikan koneksi database: `cp .env.example .env`
4. Jalankan server: `npm run dev`

### 2. Persiapan Mobile App
1. Pastikan **Flutter SDK** sudah terinstall di sistem Anda.
2. Masuk ke folder mobile: `cd inkai-mobile`
3. Ambil dependensi: `flutter pub get`
4. Jalankan aplikasi: `flutter run`

---

## 🛠️ Stack Teknologi
- **Backend**: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL.
- **Frontend Web**: React (Next.js), Tailwind CSS.
- **Frontend Mobile**: Flutter (Dart).
- **Auth**: JWT (JSON Web Token).
- **Payment Gateway**: Midtrans / Xendit.
