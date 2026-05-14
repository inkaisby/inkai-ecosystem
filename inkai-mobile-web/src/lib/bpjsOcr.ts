/** OCR parsing untuk Kartu BPJS / KIS — nilai dipakai untuk upload dan pengecekan profil */

export type BpjsExtracted = {
  cardNumber?: string;
  fullName?: string;
  address?: string;
  birthDateRaw?: string;
  birthDateIso?: string;
  nik?: string;
};

const MONTH_MAP: Record<string, number> = {
  JANUARI: 0,
  JANUARY: 0,
  FEBRUARI: 1,
  PEBRUARI: 1,
  FEBRUARY: 1,
  MARET: 2,
  MARCH: 2,
  APRIL: 3,
  MEI: 4,
  MAY: 4,
  JUNI: 5,
  JUNE: 5,
  JULI: 6,
  JULY: 6,
  AGUSTUS: 7,
  AUGUST: 7,
  SEPTEMBER: 8,
  OKTOBER: 9,
  OCTOBER: 9,
  NOPEMBER: 10,
  NOVEMBER: 10,
  DESEMBER: 11,
  DECEMBER: 11,
};

function parseIndonesianBirthLine(raw: string): string | undefined {
  const u = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  const m = u.match(/^(\d{1,2})\s+([A-Z]{3,})\s+(\d{4})$/);
  if (!m) return undefined;
  const day = parseInt(m[1], 10);
  const monthKey = m[2];
  const year = parseInt(m[3], 10);
  const monthIdx = MONTH_MAP[monthKey];
  if (monthIdx === undefined) return undefined;
  const d = new Date(year, monthIdx, day);
  if (d.getFullYear() !== year || d.getMonth() !== monthIdx || d.getDate() !== day) return undefined;
  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Mengurai teks hasil Tesseract — toleran terhadap noise ringan */
export function parseBpjsOcrText(raw: string): BpjsExtracted {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const upper = text.toUpperCase();

  let cardNumber: string | undefined;
  const cardMatch = upper.match(/NOMOR\s+KARTU\s*[.:]?\s*([\d\s]{10,20})/);
  if (cardMatch?.[1]) {
    cardNumber = cardMatch[1].replace(/\D/g, '');
    if (cardNumber.length < 10) cardNumber = undefined;
  }

  let nik: string | undefined;
  const nikMatch = upper.match(/NIK\s*[.:]?\s*(\d[\d\s]{15,17})/);
  if (nikMatch?.[1]) {
    nik = nikMatch[1].replace(/\D/g, '');
    if (nik.length !== 16) nik = undefined;
  }

  let birthDateRaw: string | undefined;
  const ttlMatch = text.match(/TANGGAL\s+LAHIR\s*[.:]?\s*([^\n\r]+)/i);
  if (ttlMatch?.[1]) {
    birthDateRaw = ttlMatch[1].trim().replace(/\s+/g, ' ');
  }

  let fullName: string | undefined;
  const namaMatch = text.match(
    /NAMA\s*[.:]?\s*([\s\S]+?)(?=\s*ALAMAT\s*[.:]|TANGGAL\s+LAHIR\s*[.:]|NIK\s*[.:]|$)/i,
  );
  if (namaMatch?.[1]) {
    fullName = namaMatch[1].replace(/\s+/g, ' ').trim();
    fullName = fullName.replace(/^(MR|MRS|MS)[.\s]+/i, '').trim() || fullName;
  }

  let address: string | undefined;
  const addrMatch = text.match(
    /ALAMAT\s*[.:]?\s*([\s\S]+?)(?=\s*TANGGAL\s+LAHIR\s*[.:]|NIK\s*[.:]|$)/i,
  );
  if (addrMatch?.[1]) {
    address = addrMatch[1].replace(/\s+/g, ' ').trim();
  }

  let birthDateIso: string | undefined;
  if (birthDateRaw) {
    birthDateIso = parseIndonesianBirthLine(birthDateRaw);
  }

  return {
    cardNumber,
    fullName,
    address,
    birthDateRaw,
    birthDateIso,
    nik,
  };
}

const OCR_TIMEOUT_MS = 45000;

/** Pemindaian gambar kartu (bukan PDF) — muat Tesseract secara dinamis */
export async function scanBpjsCardImage(file: File): Promise<BpjsExtracted> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('ind+eng');
  try {
    const task = worker.recognize(file);
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Pemindaian kartu melebihi batas waktu')), OCR_TIMEOUT_MS);
    });
    const {
      data: { text },
    } = await Promise.race([task, timeout]);
    return parseBpjsOcrText(text);
  } finally {
    await worker.terminate();
  }
}
