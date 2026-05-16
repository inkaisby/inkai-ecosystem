import type { Prisma } from '@prisma/client';

const TRACK_STATUSES = ['PENDING', 'WAITING_VERIFICATION'] as const;

/**
 * Nominal tagihan EVENT_FEE = biaya kategori (dibulatkan) + ekor unik 1–999 rupiah,
 * unik per agenda antar tagihan yang masih belum lunas (agar mutasi bank/QRIS statis bisa dilacak).
 */
export async function pickUniqueEventFeeAmount(
  tx: Prisma.TransactionClient,
  eventId: string,
  baseFee: number,
  excludeBillingId?: string,
): Promise<{ baseRounded: number; uniqueTail: number; total: number }> {
  const baseRounded = Math.round(baseFee);

  const regRows = await tx.eventRegistration.findMany({
    where: { eventId },
    select: { id: true },
  });
  const regIds = regRows.map((r) => r.id);

  const taken =
    regIds.length === 0
      ? []
      : await tx.billing.findMany({
          where: {
            type: 'EVENT_FEE',
            status: { in: [...TRACK_STATUSES] },
            registrationId: { in: regIds },
            isDeleted: false,
            ...(excludeBillingId ? { NOT: { id: excludeBillingId } } : {}),
          },
          select: { amount: true },
        });
  const usedTotals = new Set(taken.map((b) => Math.round(b.amount)));

  for (let uniqueTail = 1; uniqueTail <= 999; uniqueTail++) {
    const total = baseRounded + uniqueTail;
    if (!usedTotals.has(total)) {
      return { baseRounded, uniqueTail, total };
    }
  }

  throw new Error(
    'Kuota kode unik untuk agenda ini penuh (maks. 999 nominal berbeda per biaya kategori). Hubungi administrator.',
  );
}
