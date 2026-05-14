/** Bandingkan field profil dengan teks yang diambil dari kartu BPJS */

export type BpjsOcrStored = {
  fullName?: string;
  address?: string;
  birthDateRaw?: string;
  birthDateIso?: string;
  nik?: string;
  extractedAt?: string;
};

export type ProfileLike = {
  fullName?: string | null;
  nik?: string | null;
  birthDate?: string | null;
  address?: string | null;
  member?: {
    fullName?: string | null;
    nik?: string | null;
    birthDate?: string | null;
    address?: string | null;
  };
};

export type BpjsMismatchFlags = {
  fullName: boolean;
  nik: boolean;
  birthDate: boolean;
  address: boolean;
};

export function normalizeNik(s: string): string {
  return s.replace(/\D/g, '');
}

export function normalizePersonName(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeAddressLine(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function profileBirthYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addressRoughMatch(profile: string, ocr: string): boolean {
  const a = normalizeAddressLine(profile);
  const b = normalizeAddressLine(ocr);
  if (!a || !b) return true;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  if (shorter.length >= 10 && longer.includes(shorter)) return true;
  return false;
}

/** true = ada ketidaksesuaian (peringatan) */
export function computeBpjsProfileMismatches(
  user: ProfileLike,
  ocr: BpjsOcrStored | null | undefined,
): BpjsMismatchFlags {
  const empty: BpjsMismatchFlags = {
    fullName: false,
    nik: false,
    birthDate: false,
    address: false,
  };
  if (!ocr || typeof ocr !== 'object') return empty;

  const fullName = user.fullName ?? user.member?.fullName ?? '';
  const nik = user.nik ?? user.member?.nik ?? '';
  const birthDate = user.birthDate ?? user.member?.birthDate ?? '';
  const address = user.address ?? user.member?.address ?? '';

  const flags = { ...empty };

  if (ocr.fullName?.trim() && fullName?.trim()) {
    if (normalizePersonName(ocr.fullName) !== normalizePersonName(fullName)) {
      flags.fullName = true;
    }
  }

  if (ocr.nik?.trim() && nik?.trim()) {
    if (normalizeNik(ocr.nik) !== normalizeNik(nik)) {
      flags.nik = true;
    }
  }

  const ocrBirth = ocr.birthDateIso?.trim();
  if (ocrBirth && birthDate?.trim()) {
    if (profileBirthYmd(birthDate) !== ocrBirth) {
      flags.birthDate = true;
    }
  }

  if (ocr.address?.trim() && address?.trim()) {
    if (!addressRoughMatch(address, ocr.address)) {
      flags.address = true;
    }
  }

  return flags;
}
