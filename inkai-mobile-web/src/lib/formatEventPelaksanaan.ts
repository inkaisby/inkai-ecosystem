/** Tanggal pelaksanaan untuk meta kartu: satu hari "15 Mei 2026", rentang "15 - 16 Mei 2026". */
export function formatEventPelaksanaan(
  startIso: string | undefined,
  endIso?: string | null,
): string {
  if (!startIso) return "";
  const start = new Date(startIso);
  const end =
    endIso != null && String(endIso).trim() !== "" ? new Date(endIso) : start;

  const sameCalendarDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameCalendarDay(start, end)) {
    return start.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const d = (x: Date, o: Intl.DateTimeFormatOptions) =>
    x.toLocaleDateString("id-ID", o);

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${d(end, { month: "short" })} ${end.getFullYear()}`;
    }
    return `${d(start, { day: "numeric", month: "short" })} - ${d(end, {
      day: "numeric",
      month: "short",
    })} ${end.getFullYear()}`;
  }

  return `${d(start, { day: "numeric", month: "short", year: "numeric" })} - ${d(
    end,
    { day: "numeric", month: "short", year: "numeric" },
  )}`;
}
