const TYPE_LABELS: Record<string, string> = {
  DOJO_TRANSFER: "Mutasi Dojo",
  RANK_PROMOTION: "Kenaikan Tingkat",
  ACHIEVEMENT: "Prestasi / Piagam / Pelatihan",
};

/** RANK_PROMOTION: teks tingkat saja (lama) atau JSON `{ title, date, location }` */
export function parseRankPromotionPayload(raw: string): {
  title: string;
  date?: string;
  location?: string;
} {
  if (!raw) return { title: "—" };
  try {
    const o = JSON.parse(raw) as { title?: string; date?: string; location?: string };
    if (o && typeof o === "object" && typeof o.title === "string" && o.title.trim()) {
      return {
        title: o.title.trim(),
        ...(o.date ? { date: o.date } : {}),
        ...(typeof o.location === "string" && o.location.trim()
          ? { location: o.location.trim() }
          : {}),
      };
    }
  } catch {
    /* legacy plain string */
  }
  return { title: raw.trim() || "—" };
}

export function verificationTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type.replace(/_/g, " ");
}

export type VerificationDetailRow = { label: string; value: string };

function categoryLabel(code?: string): string {
  if (code === "PIAGAM") return "Piagam / Pertandingan";
  if (code === "PELATIHAN") return "Pelatihan / Sertifikasi";
  if (code === "SABUK") return "Kenaikan Sabuk";
  return code || "—";
}

export function verificationDataSummary(raw: string, type: string): string {
  if (!raw) return "—";
  if (type === "RANK_PROMOTION") return parseRankPromotionPayload(raw).title;
  if (type === "ACHIEVEMENT") {
    try {
      const o = JSON.parse(raw) as { title?: string };
      return o.title || raw;
    } catch {
      return raw;
    }
  }
  if (type === "DOJO_TRANSFER") {
    try {
      const o = JSON.parse(raw) as { reason?: string };
      return o.reason ? o.reason.slice(0, 80) + (o.reason.length > 80 ? "…" : "") : raw;
    } catch {
      return raw;
    }
  }
  return raw;
}

export function verificationDataRows(raw: string, type: string): VerificationDetailRow[] {
  const rows: VerificationDetailRow[] = [];

  if (type === "RANK_PROMOTION") {
    const p = parseRankPromotionPayload(raw);
    rows.push({ label: "Tingkatan diajukan", value: p.title || "—" });
    if (p.date) rows.push({ label: "Tanggal kejadian", value: p.date });
    if (p.location) rows.push({ label: "Lokasi", value: p.location });
    return rows;
  }

  if (type === "ACHIEVEMENT") {
    try {
      const o = JSON.parse(raw) as {
        category?: string;
        title?: string;
        date?: string;
        location?: string;
      };
      if (o.category) rows.push({ label: "Tipe riwayat", value: categoryLabel(o.category) });
      if (o.title) rows.push({ label: "Judul", value: o.title });
      if (o.date) rows.push({ label: "Tanggal", value: o.date });
      if (o.location) rows.push({ label: "Lokasi", value: o.location });
      if (rows.length === 0) rows.push({ label: "Data", value: raw || "—" });
      return rows;
    } catch {
      rows.push({ label: "Data", value: raw || "—" });
      return rows;
    }
  }

  if (type === "DOJO_TRANSFER") {
    try {
      const o = JSON.parse(raw) as { targetDojoId?: string; reason?: string };
      if (o.targetDojoId) rows.push({ label: "Dojo tujuan (ID)", value: o.targetDojoId });
      if (o.reason) rows.push({ label: "Alasan", value: o.reason });
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
  }

  rows.push({ label: "Data", value: raw || "—" });
  return rows;
}

export function isOpenableProofUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const t = url.trim();
  if (t === "—" || t === "PENDING_DOCUMENT" || t === "-" || t === "N/A") return false;
  return /^https?:\/\//i.test(t);
}
