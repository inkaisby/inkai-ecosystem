/** Warna lingkar foto sesuai teks tingkat sabuk di basis data (mis. "Kuning (Kyu 8)"). */
export type BeltRingVisual = {
  bg: string;
  shadow?: string;
};

export function beltRingVisual(rankRaw: string | null | undefined): BeltRingVisual {
  const r = (rankRaw || '').trim().toLowerCase();
  if (r.includes('hitam')) {
    return {
      bg: '#171717',
      shadow: '0 0 0 2px rgba(234, 179, 8, 0.42)',
    };
  }
  if (r.includes('coklat')) return { bg: '#9a3412' };
  if (r.includes('biru')) return { bg: '#2563eb' };
  if (r.includes('hijau')) return { bg: '#16a34a' };
  if (r.includes('kuning')) return { bg: '#ca8a04' };
  if (r.includes('putih')) {
    return {
      bg: '#e2e8f0',
      shadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.45)',
    };
  }
  return { bg: '#64748b' };
}
