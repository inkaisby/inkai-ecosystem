# Migrasi Opsi B — Semua CRUD lewat inkai-backend

Arsitektur target:

```text
inkai-sby / inkai-jatim / mobile  →  inkai-backend API  →  Supabase PostgreSQL
```

## 1. Deploy inkai-backend (Vercel)

Pastikan environment di Vercel:

```env
DATABASE_URL=postgresql://postgres:...@db.mzmdhkwleufeiyaspmns.supabase.co:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://postgres:...@db.mzmdhkwleufeiyaspmns.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=<secret-kuat>
CORS_ALLOWED_ORIGINS=https://inkai-sby.vercel.app,https://inkai-jatim.vercel.app,https://inkai-mobile-web.vercel.app
```

Deploy branch terbaru. Catat URL production, mis. `https://inkai-backend.vercel.app`.

## 2. Environment frontends

### inkai-sby (Vercel)

```env
INKAI_API_URL=https://<inkai-backend>.vercel.app
NEXT_PUBLIC_INKAI_API_URL=https://<inkai-backend>.vercel.app
AUTH_SECRET=<nextauth-secret>
NEXTAUTH_URL=https://inkai-sby.vercel.app
```

`DATABASE_URL` masih dipakai halaman admin SSR lama (verifikasi, iuran, absensi, dll.) sampai dimigrasi penuh.

### inkai-jatim (Vercel)

```env
INKAI_API_URL=https://<inkai-backend>.vercel.app
NEXT_PUBLIC_INKAI_API_URL=https://<inkai-backend>.vercel.app
NEXT_PUBLIC_APP_URL=https://inkai-jatim.vercel.app
```

`SUPABASE_*` dan `PORTAL_SESSION_SECRET` tidak diperlukan lagi untuk auth/CRUD operasional.

## 3. Checklist uji coba

| Langkah | App | Expected |
|---------|-----|----------|
| Login admin | inkai-sby | Session berisi JWT backend |
| `/admin/anggota?status=PENDING` | inkai-sby | 8 anggota PENDING Surabaya |
| Approve anggota | inkai-sby | `PATCH /v1/members/:id/registration` |
| Login pengurus | inkai-jatim | Cookie `inkai_token` |
| Dashboard anggota | inkai-jatim | Data dari `/v1/members` |
| Health | keduanya | `/api/auth/health` → backend `/health/db` OK |

## 4. Yang sudah dimigrasi

### inkai-backend
- CORS multi-origin
- `PATCH /v1/members/:id/registration` (approve/reject)
- `PATCH /v1/notifications/read-all`
- `GET/PUT /v1/settings/:key` (UKT invoice ack, komisi)
- `optionalAuthenticate` pada `/v1/org/*` GET

### inkai-sby
- Auth → `POST /v1/auth/login`
- API routes: auth, dojos, member profile, notifications, admin members/billing/verifications/carousel, UKT
- **Semua halaman admin + dashboard SSR** → backend API (tanpa Prisma langsung)
- `lib/audit.ts`, `lib/notifications.ts` → backend API
- `public-data.ts` → backend org/events/carousel

### inkai-jatim
- Auth/session → backend JWT (`inkai_token`)
- API: auth, org, members, health
- Dashboard context + members queries → backend

## 5. Sisa (opsional berikutnya)

- inkai-sby: `DATABASE_URL` di Vercel bisa dihapus setelah konfirmasi tidak ada runtime Prisma
- inkai-jatim `lib/portal/queries.ts` (konten portal publik — bukan operasional DB)
- Mobile: pastikan `API_URL` = inkai-backend

## 6. Operasional

| Tugas | App |
|-------|-----|
| Approve 8 PENDING Surabaya | **inkai-sby** `/admin/anggota?status=PENDING` |
| Register Surabaya | inkai-sby |
| Register Jatim (non-SBY) | inkai-jatim |
| Schema migration | inkai-backend Prisma only |
