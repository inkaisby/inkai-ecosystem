"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Plus,
  Search,
  Trophy,
  GraduationCap,
  Users,
  MapPin,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Loader2,
  X,
  Edit2,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type EventUpsertPayload } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface EventCategoryRow {
  id: string;
  name: string;
  fee: number;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  registrationCloseAt?: string | null;
  location?: string;
  branchId?: string | null;
  branch?: { id: string; name: string; city?: string | null } | null;
  categories?: EventCategoryRow[];
  createdById?: string;
  provinceId?: string;
  _count?: {
    registrations: number;
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Nilai untuk input type="date" di zona waktu lokal perangkat. */
function dateToLocalDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Nilai untuk input type="time" (24 jam). */
function dateToLocalTimeInput(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Gabungan tanggal + jam lokal → ISO UTC untuk API. */
function localDateTimeToIso(dateYmd: string, timeHm: string): string {
  const [y, mo, d] = dateYmd.split("-").map((x) => parseInt(x, 10));
  const parts = (timeHm || "00:00").split(":");
  const hh = parseInt(parts[0] ?? "0", 10);
  const mm = parseInt(parts[1] ?? "0", 10);
  return new Date(y, mo - 1, d, hh, mm, 0, 0).toISOString();
}

/** Label singkat untuk toast / bantuan error validasi waktu. */
function formatLocalDateTimeShort(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Jika tanggal tutup sama dengan tanggal mulai, jam tutup tidak boleh lebih lambat dari jam mulai.
 */
function clampRegistrationCloseToStart<
  T extends {
    registrationCloseDate: string;
    registrationCloseTime: string;
    startDate: string;
    startTime: string;
  },
>(fd: T): T {
  const d = fd.registrationCloseDate?.trim();
  const t = fd.registrationCloseTime?.trim();
  const sd = fd.startDate?.trim();
  const st = fd.startTime?.trim();
  if (!d || !t || !sd || !st || d !== sd) return fd;
  const closeMs = new Date(localDateTimeToIso(d, t)).getTime();
  const startMs = new Date(localDateTimeToIso(sd, st)).getTime();
  if (closeMs <= startMs) return fd;
  return { ...fd, registrationCloseTime: st };
}

const AGENDA_TITLE_OPTIONS = {
  "Kegiatan Umum": [
    "LATIHAN BERSAMA",
    "RAPAT KERJA (RAKER)",
    "PELATIHAN PELATIH / WASIT",
    "KEGIATAN SOSIAL",
  ],
  Kejuaraan: [
    "KEJURNAS INKAI",
    "KEJURDA INKAI",
    "OPEN TOURNAMENT",
    "PIALA GUBERNUR",
    "PIALA WALIKOTA",
  ],
  "Ujian Kenaikan": [
    "UJIAN KENAIKAN TINGKAT (UKT)",
    "GASHUKU & UKT NASIONAL",
    "UJIAN DAN (SABUK HITAM)",
  ],
} as const;

function titleBelongsToCategory(category: string, title: string): boolean {
  const list = AGENDA_TITLE_OPTIONS[category as keyof typeof AGENDA_TITLE_OPTIONS];
  return !!(list && (list as readonly string[]).includes(title));
}

const AGENDA_COMBINED_SEP = "::";

const DEFAULT_EVENT_REGISTRATION_CATEGORY = "Pendaftaran";

function parseRegistrationFeeRp(s: string): number {
  const raw = String(s ?? "")
    .replace(/\s+/g, "")
    .replace(/,/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/** Ringkasan daftar tarif untuk kartu agenda / modal (nilai dibulatkan). */
function formatEventFeeSummaryLabel(
  categories: EventCategoryRow[] | undefined,
): string | null {
  if (!categories?.length) return null;
  const fees = categories
    .map((c) => Math.round(Number(c.fee ?? 0)))
    .filter((x) => Number.isFinite(x) && x > 0);
  if (!fees.length) return null;
  const min = Math.min(...fees);
  const max = Math.max(...fees);
  const fmt = (v: number) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(v);
  if (min === max) return `Rp ${fmt(min)}`;
  return `Rp ${fmt(min)} – ${fmt(max)}`;
}

/** Buat agenda: tanpa biaya kosong atau satu kategori "Pendaftaran". */
function buildCategoriesPayloadForCreate(
  registrationFeeRp: string,
): {
  categories?: Array<{ id?: string; name: string; fee: number }>;
} {
  const feeNum = parseRegistrationFeeRp(registrationFeeRp);
  if (feeNum <= 0) return {};
  return {
    categories: [{ name: DEFAULT_EVENT_REGISTRATION_CATEGORY, fee: feeNum }],
  };
}

type EventFeeFormRow = { id: string; name: string; feeRp: string };

/** Edit: banyak baris (dari API, dengan id) atau satu angka ketika agenda belum punya kategori. */
function buildCategoriesPayloadForEdit(
  feeRows: EventFeeFormRow[],
  registrationFeeRp: string,
): {
  categories?: Array<{ id?: string; name: string; fee: number }>;
} {
  if (feeRows.length > 0) {
    return {
      categories: feeRows.map((r) => ({
        ...(r.id.trim() !== "" ? { id: r.id.trim() } : {}),
        name: r.name.trim() || DEFAULT_EVENT_REGISTRATION_CATEGORY,
        fee: parseRegistrationFeeRp(r.feeRp),
      })),
    };
  }

  const feeNum = parseRegistrationFeeRp(registrationFeeRp);
  if (feeNum <= 0) return {};
  return {
    categories: [{ name: DEFAULT_EVENT_REGISTRATION_CATEGORY, fee: feeNum }],
  };
}

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const roleNames = useMemo(
    () =>
      Array.isArray(user?.roles)
        ? user.roles.map((r: string | { name: string }) =>
            typeof r === "string" ? r : r.name,
          )
        : ([] as string[]),
    [user],
  );
  const isSuper = useMemo(
    () =>
      roleNames.includes("ADMINISTRATOR") || roleNames.includes("ADMIN_PUSAT"),
    [roleNames],
  );
  const isProvinceAdmin =
    roleNames.includes("ADMIN_PROVINCE") && !!user?.managedProvinceId;
  const isBranchAdmin =
    roleNames.includes("ADMIN_BRANCH") && !!user?.managedBranchId;
  const isDojoAdmin = roleNames.includes("ADMIN_DOJO") && !!user?.managedDojoId;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "17:00",
    location: "",
    category: "Kegiatan Umum",
    branchId: "",
    eventProvinceId: "",
    registrationCloseDate: "",
    registrationCloseTime: "",
    registrationFeeRp: "",
  });

  const [eventFeeRows, setEventFeeRows] = useState<EventFeeFormRow[]>([]);

  /** national = cabang kosong/null (terlihat di semua ranting sesuaturan backend); branch = wilayah tertentu */
  const [wilayahScope, setWilayahScope] = useState<"national" | "branch">(
    "national",
  );
  const [provinceOptions, setProvinceOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [branchOptions, setBranchOptions] = useState<
    { id: string; name: string; city?: string | null }[]
  >([]);

  const canEditEvent = useCallback(
    (ev: Event | null) => {
      if (!ev || !user) return false;
      // Administrator & Admin Pusat bisa segalanya
      if (isSuper) return true;

      // Pembuat pertama kali (pemilik)
      if (ev.createdById === user.id) return true;

      // Admin Cabang: Bisa edit jika agenda milik cabangnya
      if (isBranchAdmin && ev.branchId === user.managedBranchId) return true;

      // Admin Provinsi: Bisa edit jika agenda milik provinsinya atau cabang di bawahnya
      if (isProvinceAdmin) {
        if (ev.provinceId === user.managedProvinceId) return true;
        // Jika ada data branch, cek provinceId di branch (opsional tergantung data API)
        if (
          ev.branch &&
          (ev.branch as any).provinceId === user.managedProvinceId
        )
          return true;
      }

      return false;
    },
    [isSuper, isBranchAdmin, isProvinceAdmin, user],
  );

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.events.getAll();
      setEvents(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteEvent = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEventToDelete(id);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    setIsSubmitting(true);
    try {
      await api.events.delete(eventToDelete);
      toast.success("Agenda berhasil dihapus");
      fetchEvents();
      setShowDeleteModal(false);
      setEventToDelete(null);
      if (showDetailModal) setShowDetailModal(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal menghapus agenda";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchEvents();
    };
    loadData();
  }, [fetchEvents]);

  useEffect(() => {
    if (!showEventModal) return;
    let cancelled = false;
    void (async () => {
      try {
        if (isSuper) {
          const pres = await api.org.getProvinces();
          if (
            !cancelled &&
            pres.status === "success" &&
            Array.isArray(pres.data)
          ) {
            setProvinceOptions((prev) => (prev.length > 0 ? prev : pres.data));
          }
        }
        if (isProvinceAdmin && user?.managedProvinceId) {
          const br = await api.org.getBranches(user.managedProvinceId);
          if (!cancelled && br.status === "success" && Array.isArray(br.data)) {
            setBranchOptions(br.data);
          }
        }
      } catch {
        toast.error("Gagal memuat data wilayah");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showEventModal, isSuper, isProvinceAdmin, user?.managedProvinceId]);

  useEffect(() => {
    if (
      !showEventModal ||
      !isSuper ||
      wilayahScope !== "branch" ||
      !formData.eventProvinceId
    ) {
      return;
    }
    let cancelled = false;
    void api.org
      .getBranches(formData.eventProvinceId)
      .then((br) => {
        if (cancelled) return;
        if (br.status === "success" && Array.isArray(br.data)) {
          setBranchOptions(br.data as typeof branchOptions);
        }
      })
      .catch(() => toast.error("Gagal memuat cabang"));
    return () => {
      cancelled = true;
    };
  }, [showEventModal, isSuper, wilayahScope, formData.eventProvinceId]);

  const isAnyModalOpen = showDetailModal || showEventModal || showDeleteModal;

  const portalReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Hide BottomNav and AdminMenu when modal is open
  useEffect(() => {
    const bottomNav = document.querySelector("nav");
    const adminMenu = document.querySelector('[class*="AdminMenu"]'); // Target AdminMenu floating button

    const topBar = document.querySelector("header.admin-topbar-fixed");
    const elementsToHide = [bottomNav, adminMenu, topBar].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );

    elementsToHide.forEach((el) => {
      if (el instanceof HTMLElement) {
        if (isAnyModalOpen) {
          el.style.visibility = "hidden";
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        } else {
          el.style.visibility = "visible";
          el.style.opacity = "1";
          el.style.pointerEvents = "auto";
        }
      }
    });

    // Cleanup on unmount
    return () => {
      elementsToHide.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.visibility = "visible";
          el.style.opacity = "1";
          el.style.pointerEvents = "auto";
        }
      });
    };
  }, [isAnyModalOpen]);

  const resetForm = () => {
    setWilayahScope("national");
    setBranchOptions([]);
    setFormData({
      id: "",
      title: "",
      description: "",
      startDate: "",
      startTime: "08:00",
      endDate: "",
      endTime: "17:00",
      location: "",
      category: "Kegiatan Umum",
      branchId: "",
      eventProvinceId: "",
      registrationCloseDate: "",
      registrationCloseTime: "",
      registrationFeeRp: "",
    });
    setEventFeeRows([]);
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const titleLower = event.title.toLowerCase();
        const isKejuaraan = titleLower.includes("kejurnas");
        const isUjian = titleLower.includes("ujian");
        const isOthers = !isKejuaraan && !isUjian;

        const matchesFilter =
          filter === "Semua" ||
          (filter === "Kejuaraan" && isKejuaraan) ||
          (filter === "Ujian Kenaikan" && isUjian) ||
          (filter === "Lain-lain" && isOthers);

        const matchesSearch =
          titleLower.includes(search.toLowerCase()) ||
          (event.location &&
            event.location.toLowerCase().includes(search.toLowerCase()));

        return matchesFilter && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
  }, [events, filter, search]);

  const openAddModal = () => {
    resetForm();
    if (isProvinceAdmin && user?.managedProvinceId) {
      void api.org.getBranches(user.managedProvinceId).then((br) => {
        if (br.status === "success" && Array.isArray(br.data)) {
          setBranchOptions(br.data as typeof branchOptions);
        }
      });
    }
    setModalMode("create");
    setShowEventModal(true);
  };

  const openEditModal = async (event: Event) => {
    const normalizedCats: EventCategoryRow[] = Array.isArray(event.categories)
      ? event.categories.map((c) => ({
          id: typeof c?.id === "string" ? c.id : "",
          name:
            (typeof c?.name === "string" ? c.name.trim() : "") ||
            DEFAULT_EVENT_REGISTRATION_CATEGORY,
          fee: Number(c?.fee ?? 0),
        }))
      : [];
    setEventFeeRows(
      normalizedCats.map((c) => ({
        id: c.id,
        name: c.name,
        feeRp: String(Math.round(Number(c.fee ?? 0))),
      })),
    );

    setWilayahScope(event.branchId ? "branch" : "national");
    setFormData({
      id: event.id,
      title: event.title.replace("KEJURNAS: ", "").replace("UJIAN: ", ""),
      description: event.description || "",
      startDate: event.startDate
        ? dateToLocalDateInput(new Date(event.startDate))
        : "",
      startTime: event.startDate
        ? dateToLocalTimeInput(new Date(event.startDate))
        : "08:00",
      endDate: event.endDate
        ? dateToLocalDateInput(new Date(event.endDate))
        : "",
      endTime: event.endDate
        ? dateToLocalTimeInput(new Date(event.endDate))
        : "17:00",
      location: event.location || "",
      category: event.title.toLowerCase().includes("kejurnas")
        ? "Kejuaraan"
        : event.title.toLowerCase().includes("ujian")
          ? "Ujian Kenaikan"
          : "Kegiatan Umum",
      branchId: event.branchId ?? "",
      eventProvinceId: "",
      registrationCloseDate: event.registrationCloseAt
        ? dateToLocalDateInput(new Date(event.registrationCloseAt))
        : "",
      registrationCloseTime: event.registrationCloseAt
        ? dateToLocalTimeInput(new Date(event.registrationCloseAt))
        : "",
      registrationFeeRp: "",
    });
    setModalMode("edit");
    setShowEventModal(true);

    let provincesSnapshot = provinceOptions;
    if (isSuper && provincesSnapshot.length === 0) {
      try {
        const pres = await api.org.getProvinces();
        if (pres.status === "success" && Array.isArray(pres.data)) {
          provincesSnapshot = pres.data;
          setProvinceOptions(pres.data);
        }
      } catch {
        /* cabang bisa dipilih manual */
      }
    }

    if (isProvinceAdmin && user?.managedProvinceId) {
      const br = await api.org.getBranches(user.managedProvinceId);
      if (br.status === "success" && Array.isArray(br.data)) {
        setBranchOptions(br.data as typeof branchOptions);
      }
    }

    if (isSuper && event.branchId && provincesSnapshot.length > 0) {
      try {
        for (const pr of provincesSnapshot) {
          const br = await api.org.getBranches(pr.id);
          const list = Array.isArray(br.data) ? br.data : [];
          const hit = list.find((b: { id: string }) => b.id === event.branchId);
          if (hit) {
            setBranchOptions(list as typeof branchOptions);
            setFormData((f) => ({
              ...f,
              eventProvinceId: pr.id,
              branchId: hit.id as string,
            }));
            break;
          }
        }
      } catch {
        /* */
      }
    }
  };

  return (
    <>
      <div className="w-full max-w-[480px] mx-auto min-h-full">
        {/* Main Page Content - Completely unmount when modal is open to prevent "leaking" or overlapping */}
        {!isAnyModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white transition-all duration-200 active:scale-95"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <Calendar size={13} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Manajemen Agenda
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Event & Kegiatan
                  </h2>
                </div>
              </div>

              <button
                onClick={openAddModal}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Buat Event Baru
              </button>
            </div>

            {/* Categories Toggle - Scrollable Tab Bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide no-scrollbar border-b border-white/5">
              {["Semua Event", "Kejuaraan", "Ujian Kenaikan", "Lain-lain"].map(
                (cat) => {
                  const isActive = (filter === "Semua" && cat === "Semua Event") || filter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setFilter(cat === "Semua Event" ? "Semua" : cat)
                      }
                      className={`whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-medium tracking-wide transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "bg-white/10 text-amber-500 border border-white/10 shadow-sm"
                          : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                }
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest">
                  Memuat data...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-red-500/[0.02] rounded-2xl border border-red-500/10">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X size={24} />
                </div>
                <h3 className="text-sm font-bold text-red-500 mb-1 uppercase tracking-wider">
                  Gagal Memuat Data
                </h3>
                <p className="text-[11px] text-gray-500 max-w-[220px] mx-auto mb-5 leading-relaxed">
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Search Box */}
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={15}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama event..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-[13px] font-medium focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.04] transition-all text-white placeholder:text-gray-600 shadow-sm"
                  />
                </div>

                {/* Events List */}
                <div className="space-y-2.5">
                  {filteredEvents.map((event) => {
                    const feeLine = formatEventFeeSummaryLabel(
                      event.categories,
                    );
                    const isKejuaraan = event.title.toLowerCase().includes("kejurnas");
                    const isUjian = event.title.toLowerCase().includes("ujian");

                    return (
                      <motion.div
                        layoutId={event.id}
                        key={event.id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowDetailModal(true);
                        }}
                        className="bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-xl border border-white/5 hover:border-white/10 flex gap-4 items-center group active:scale-[0.99] transition-all duration-300 relative overflow-hidden"
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                            isKejuaraan
                              ? "bg-blue-500/5 border-blue-500/10 text-blue-400 group-hover:bg-blue-500/10"
                              : isUjian
                                ? "bg-amber-500/5 border-amber-500/10 text-amber-400 group-hover:bg-amber-500/10"
                                : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/10"
                          }`}
                        >
                          {isKejuaraan ? (
                            <Trophy size={18} />
                          ) : isUjian ? (
                            <GraduationCap size={18} />
                          ) : (
                            <Users size={18} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold text-white truncate mb-1 tracking-tight group-hover:text-amber-500 transition-colors">
                            {event.title}
                          </h3>
                          <div className="flex flex-col gap-0.5 text-[11px] text-gray-400 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-gray-500 shrink-0" />
                              {new Date(event.startDate).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                              {" · "}
                              {new Date(event.startDate).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin size={12} className="text-gray-500 shrink-0" />
                              {event.location || "Indonesia"}
                            </span>
                            {feeLine && (
                              <span className="flex items-center gap-1.5 text-amber-500/90 font-semibold truncate">
                                <Wallet size={12} className="shrink-0" />
                                {feeLine}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 truncate mt-0.5">
                              Cabang:{" "}
                              {event.branch?.name ||
                                event.branch?.city ||
                                (event.branchId ? "Cabang tertentu" : "Nasional")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {canEditEvent(event) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                              className="p-2 text-gray-500 hover:text-white transition-all active:scale-90"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          <ChevronRight size={16} className="text-gray-600 group-hover:text-amber-500 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-white/5">
                      <Search
                        className="mx-auto text-gray-700 mb-2.5"
                        size={24}
                      />
                      <p className="text-[11px] font-medium tracking-wide text-gray-500">
                        Agenda tidak ditemukan
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats Card */}
                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -left-4 -bottom-4 opacity-[0.02] text-white -rotate-12 pointer-events-none">
                    <Trophy size={80} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                      Statistik Event
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Total event aktif terdaftar tahun ini
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-white tracking-tight">
                      {events.length}
                    </span>
                    <span className="text-[10px] text-gray-500 block uppercase font-medium mt-0.5">
                      Event
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {portalReady &&
        createPortal(
          <AnimatePresence>
            {/* Event Detail Modal - FULL SCREEN OVERLAY WITH BLUR */}
            {showDetailModal && selectedEvent && (
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="admin-modal-overlay"
              >
                <div className="admin-modal-sheet">
                  {/* FIXED TOP BAR */}
                  <div className="mobile-hpad-compact py-3 flex justify-between items-center gap-2 z-50 pt-[max(6px,env(safe-area-inset-top,0px))] adm-chrome-soft backdrop-blur-xl border-b border-white/5 shrink-0">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="p-2 bg-white/[0.03] text-white rounded-xl border border-white/5 active:scale-95 transition-all duration-200 shrink-0"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="flex gap-2 shrink-0">
                      {canEditEvent(selectedEvent) && (
                        <>
                          <button
                            onClick={() => {
                              setShowDetailModal(false);
                              openEditModal(selectedEvent);
                            }}
                            className="p-2 bg-white/[0.03] text-white rounded-xl border border-white/5 active:scale-95 transition-all duration-200"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteEvent(selectedEvent.id, e)}
                            className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/10 active:scale-95 transition-all duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                    {/* HERO SECTION */}
                    <div className="pt-6 pb-5 bg-gradient-to-b from-amber-500/[0.03] via-transparent to-transparent relative flex flex-col items-center justify-center overflow-hidden">
                      <div className="relative z-10 text-center mobile-hpad-compact w-full min-w-0">
                        {/* Compact type-specific badge */}
                        <div className="flex justify-center mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider border ${
                              selectedEvent.title.toLowerCase().includes("kejurnas")
                                ? "bg-blue-500/5 text-blue-400 border-blue-500/10"
                                : selectedEvent.title.toLowerCase().includes("ujian")
                                  ? "bg-amber-500/5 text-amber-400 border-amber-500/10"
                                  : "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                            }`}
                          >
                            {selectedEvent.title.toLowerCase().includes("kejurnas")
                              ? "KEJUARAAN"
                              : selectedEvent.title.toLowerCase().includes("ujian")
                                ? "UJIAN KENAIKAN"
                                : "KEGIATAN UMUM"}
                          </span>
                        </div>

                        <h3 className="text-base min-[390px]:text-lg font-bold text-white leading-snug mb-3.5 max-w-[340px] mx-auto px-1.5">
                          {selectedEvent.title}
                        </h3>

                        <div className="flex flex-col gap-1.5 max-w-[320px] mx-auto w-full">
                          <div className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white/[0.01] border border-white/5 rounded-xl text-[11px] font-medium text-gray-400">
                            <MapPin size={13} className="text-gray-500 shrink-0" />
                            <span className="truncate">{selectedEvent.location || "Indonesia"}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white/[0.01] border border-white/5 rounded-xl text-[11px] font-medium text-gray-400">
                            <Building2 size={13} className="text-gray-500 shrink-0" />
                            <span className="truncate">
                              {selectedEvent.branch
                                ? `${selectedEvent.branch.name}${selectedEvent.branch.city ? ` — ${selectedEvent.branch.city}` : ""}`
                                : "Wilayah Nasional"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pb-28 mobile-hpad-compact pt-1 space-y-6">
                      {/* Waktu Pelaksanaan */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-amber-500 px-0.5">
                          <Calendar size={14} />
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider">
                            Waktu Pelaksanaan
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/[0.01] p-3.5 rounded-xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1 tracking-wider">
                              Mulai
                            </p>
                            <p className="text-[13px] font-bold text-white leading-none">
                              {new Date(selectedEvent.startDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-[11px] font-medium text-amber-500/90 mt-1 tabular-nums">
                              {new Date(selectedEvent.startDate).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="bg-white/[0.01] p-3.5 rounded-xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1 tracking-wider">
                              Selesai
                            </p>
                            <p className="text-[13px] font-bold text-white leading-none">
                              {new Date(selectedEvent.endDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-[11px] font-medium text-amber-500/90 mt-1 tabular-nums">
                              {new Date(selectedEvent.endDate).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Batas Pendaftaran */}
                      <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1 tracking-wider">
                          Batas Pendaftaran Mandiri
                        </p>
                        <p className="text-[13px] font-semibold text-white leading-snug">
                          {selectedEvent.registrationCloseAt ? (
                            <>
                              {new Date(selectedEvent.registrationCloseAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              <span className="text-amber-500/90 tabular-nums">
                                {" · "}{new Date(selectedEvent.registrationCloseAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          ) : (
                            <>
                              Mengikuti jam mulai acara ({new Date(selectedEvent.startDate).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })})
                            </>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed font-medium">
                          Setelah batas ini, anggota tidak dapat mendaftar sendiri. Admin pengurus tetap dapat mendaftarkan via panel peserta.
                        </p>
                      </div>

                      {/* Biaya Pendaftaran */}
                      <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 text-amber-500 mb-2.5">
                          <Wallet size={14} className="shrink-0" />
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider">
                            Biaya Pendaftaran Peserta
                          </h4>
                        </div>
                        {selectedEvent.categories && selectedEvent.categories.length > 0 ? (
                          <ul className="space-y-1.5">
                            {selectedEvent.categories.map((c) => (
                              <li
                                key={c.id ?? `${c.name}-${c.fee}`}
                                className="flex justify-between gap-3 text-xs font-medium text-gray-300 border border-white/[0.03] rounded-lg px-3 py-2 bg-white/[0.01]"
                              >
                                <span className="min-w-0 truncate text-white font-medium text-[11px] tracking-wide">
                                  {c.name || DEFAULT_EVENT_REGISTRATION_CATEGORY}
                                </span>
                                <span className="tabular-nums shrink-0 text-amber-500 font-semibold">
                                  Rp {Math.round(Number(c.fee ?? 0)).toLocaleString("id-ID")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            Belum ada tarif kategori. Anggota tidak membayar biaya pendaftaran.
                          </p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2.5 leading-relaxed font-medium">
                          Tagihan dibayar anggota memakai nominal dasar ini ditambah kode unik kecil untuk verifikasi otomatis.
                        </p>
                      </div>

                      {/* Informasi Peserta & Deskripsi */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-amber-500 px-0.5">
                          <Users size={14} />
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider">
                            Informasi & Deskripsi
                          </h4>
                        </div>
                        <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider shrink-0">
                              Pendaftar Saat Ini
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-amber-500">
                                {selectedEvent._count?.registrations || 0}
                              </span>
                              <span className="text-[10px] text-gray-500 font-semibold uppercase">
                                Orang
                              </span>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5 tracking-wider">
                              Deskripsi Agenda
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                              {selectedEvent.description || "Tidak ada deskripsi tambahan untuk agenda ini."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="mobile-hpad-compact pt-4 adm-chrome-soft backdrop-blur-xl border-t border-white/5 mt-auto shrink-0 pb-[max(14px,calc(env(safe-area-inset-bottom,0px)+16px))]">
                    <div className="flex gap-3 items-center w-full">
                      {canEditEvent(selectedEvent) && (
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            router.push(
                              `/admin/events/${selectedEvent.id}/participants`,
                            );
                          }}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <Users size={16} />
                          Kelola Peserta Event
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Event Modal (Add/Edit) - FULL SCREEN OVERLAY WITH BLUR */}
            {showEventModal && (
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="admin-modal-overlay"
              >
                <div className="admin-modal-sheet">
                  <div className="flex justify-between items-center mobile-hpad pb-5 border-b border-white/5 pt-[calc(env(safe-area-inset-top,24px)+12px)] adm-bg">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none mb-1">
                        {modalMode === "create" ? "Buat Agenda" : "Edit Agenda"}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Lengkapi detail informasi
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEventModal(false)}
                      className="p-3 bg-white/5 text-gray-400 hover:text-white rounded-2xl border border-white/10 active:scale-90 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto mobile-hpad py-6 custom-scrollbar">
                    <form
                      id="eventForm"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSubmitting(true);
                        try {
                          let finalTitle = formData.title;
                          if (
                            formData.category === "Kejuaraan" &&
                            !finalTitle.toLowerCase().includes("kejurnas")
                          ) {
                            finalTitle = `KEJURNAS: ${finalTitle}`;
                          } else if (
                            formData.category === "Ujian Kenaikan" &&
                            !finalTitle.toLowerCase().includes("ujian")
                          ) {
                            finalTitle = `UJIAN: ${finalTitle}`;
                          }

                          if (
                            (isSuper || isProvinceAdmin) &&
                            wilayahScope === "branch"
                          ) {
                            if (isSuper && !formData.eventProvinceId) {
                              toast.error(
                                "Pilih provinsi untuk memuat daftar cabang.",
                              );
                              setIsSubmitting(false);
                              return;
                            }
                            if (!formData.branchId?.trim()) {
                              toast.error("Pilih cabang untuk agenda wilayah.");
                              setIsSubmitting(false);
                              return;
                            }
                          }

                          const wilayahPart =
                            isSuper || isProvinceAdmin
                              ? {
                                  branchId:
                                    wilayahScope === "national"
                                      ? null
                                      : formData.branchId || null,
                                }
                              : {};

                          const startIso = localDateTimeToIso(
                            formData.startDate,
                            formData.startTime,
                          );
                          const endIso = localDateTimeToIso(
                            formData.endDate,
                            formData.endTime,
                          );
                          if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
                            toast.error(
                              "Tanggal/jam selesai harus setelah atau sama dengan mulai.",
                            );
                            setIsSubmitting(false);
                            return;
                          }

                          const hasCloseD = formData.registrationCloseDate?.trim();
                          const hasCloseT = formData.registrationCloseTime?.trim();
                          if (
                            (hasCloseD && !hasCloseT) ||
                            (!hasCloseD && hasCloseT)
                          ) {
                            toast.error(
                              "Lengkapi tanggal dan jam batas pendaftaran, atau kosongkan keduanya.",
                            );
                            setIsSubmitting(false);
                            return;
                          }

                          let registrationCloseAt: string | null = null;
                          if (hasCloseD && hasCloseT) {
                            registrationCloseAt = localDateTimeToIso(
                              formData.registrationCloseDate,
                              formData.registrationCloseTime,
                            );
                            if (
                              new Date(registrationCloseAt).getTime() >
                              new Date(startIso).getTime()
                            ) {
                              toast.error(
                                `Batas pendaftaran (${formatLocalDateTimeShort(registrationCloseAt)}) harus sebelum atau sama dengan waktu mulai (${formatLocalDateTimeShort(startIso)}). Pada hari yang sama dengan acara, jam tutup tidak boleh setelah jam mulai.`,
                              );
                              setIsSubmitting(false);
                              return;
                            }
                          }

                          const categoriesPart =
                            modalMode === "create"
                              ? buildCategoriesPayloadForCreate(
                                  formData.registrationFeeRp,
                                )
                              : buildCategoriesPayloadForEdit(
                                  eventFeeRows,
                                  formData.registrationFeeRp,
                                );

                          const eventPayload: EventUpsertPayload = {
                            title: finalTitle,
                            description: formData.description,
                            startDate: startIso,
                            endDate: endIso,
                            registrationCloseAt,
                            location: formData.location,
                            ...wilayahPart,
                            ...categoriesPart,
                          };

                          if (modalMode === "create") {
                            await api.events.create(eventPayload);
                            toast.success("Agenda berhasil dibuat!");
                          } else {
                            await api.events.update(formData.id, eventPayload);
                            toast.success("Agenda berhasil diperbarui!");
                          }

                          setShowEventModal(false);
                          resetForm();
                          fetchEvents();
                        } catch (err: unknown) {
                          const errorMessage =
                            err instanceof Error
                              ? err.message
                              : "Gagal memproses agenda";
                          toast.error(errorMessage);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="space-y-6 pb-28 text-white"
                    >
                      <div className="space-y-5">
                        {/* Kategori + nama agenda */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                            Kategori & Nama Agenda
                          </label>
                          <div className="event-input-container">
                            <select
                              name="categoryAndTitle"
                              required
                              value={
                                formData.title.trim() === ""
                                  ? ""
                                  : `${formData.category}${AGENDA_COMBINED_SEP}${formData.title}`
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                if (!v.trim()) {
                                  setFormData({
                                    ...formData,
                                    category: "Kegiatan Umum",
                                    title: "",
                                  });
                                  return;
                                }
                                const sep = v.indexOf(AGENDA_COMBINED_SEP);
                                if (sep === -1) return;
                                setFormData({
                                  ...formData,
                                  category: v.slice(0, sep),
                                  title: v.slice(sep + AGENDA_COMBINED_SEP.length),
                                });
                              }}
                              className="event-form-field"
                              style={{ paddingRight: "36px" }}
                            >
                              <option value="">
                                Pilih kategori dan nama agenda…
                              </option>
                              {formData.title.trim() !== "" &&
                                !titleBelongsToCategory(
                                  formData.category,
                                  formData.title,
                                ) && (
                                  <option
                                    value={`${formData.category}${AGENDA_COMBINED_SEP}${formData.title}`}
                                  >
                                    {formData.title} (saat ini)
                                  </option>
                                )}
                              <optgroup label="Kegiatan Umum (Lain-lain)">
                                {AGENDA_TITLE_OPTIONS["Kegiatan Umum"].map(
                                  (title) => (
                                    <option
                                      key={`Kegiatan Umum:${title}`}
                                      value={`Kegiatan Umum${AGENDA_COMBINED_SEP}${title}`}
                                    >
                                      {title}
                                    </option>
                                  ),
                                )}
                              </optgroup>
                              <optgroup label="Kejuaraan / Turnamen">
                                {AGENDA_TITLE_OPTIONS["Kejuaraan"].map(
                                  (title) => (
                                    <option
                                      key={`Kejuaraan:${title}`}
                                      value={`Kejuaraan${AGENDA_COMBINED_SEP}${title}`}
                                    >
                                      {title}
                                    </option>
                                  ),
                                )}
                              </optgroup>
                              <optgroup label="Ujian Kenaikan Tingkat">
                                {AGENDA_TITLE_OPTIONS["Ujian Kenaikan"].map(
                                  (title) => (
                                    <option
                                      key={`Ujian Kenaikan:${title}`}
                                      value={`Ujian Kenaikan${AGENDA_COMBINED_SEP}${title}`}
                                    >
                                      {title}
                                    </option>
                                  ),
                                )}
                              </optgroup>
                            </select>
                            <ChevronRight
                              size={14}
                              className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        {/* Wilayah tayang */}
                        {(isSuper ||
                          isProvinceAdmin ||
                          isBranchAdmin ||
                          isDojoAdmin) && (
                          <div className="space-y-3.5 rounded-xl border border-white/5 bg-white/[0.01] p-4">
                            <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider block">
                              Wilayah Tayang Agenda
                            </label>
                            {isBranchAdmin && (
                              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                Agenda terikat ke cabang:{" "}
                                <span className="text-white font-semibold">
                                  {user?.managedBranchName || "—"}
                                </span>
                              </p>
                            )}
                            {isDojoAdmin && (
                              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                Agenda mengikuti cabang dojo:{" "}
                                <span className="text-white font-semibold">
                                  {user?.managedDojoName || "—"}
                                </span>
                              </p>
                            )}
                            {(isSuper || isProvinceAdmin) && (
                              <div className="space-y-3.5">
                                <div className="space-y-2">
                                  <label className="flex gap-2.5 items-center cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                      <input
                                        type="radio"
                                        name="wilayahScope"
                                        className="w-3.5 h-3.5 rounded-full border border-white/20 bg-transparent appearance-none checked:bg-amber-500 checked:border-amber-500 transition-all duration-200"
                                        checked={wilayahScope === "national"}
                                        onChange={() => {
                                          setWilayahScope("national");
                                          setFormData((f) => ({
                                            ...f,
                                            branchId: "",
                                            eventProvinceId: "",
                                          }));
                                        }}
                                      />
                                      <div className={`absolute w-1.5 h-1.5 bg-black rounded-full pointer-events-none transition-opacity ${wilayahScope === "national" ? "opacity-100" : "opacity-0"}`} />
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                                      Nasional (Semua cabang)
                                    </span>
                                  </label>
                                  <label className="flex gap-2.5 items-center cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                      <input
                                        type="radio"
                                        name="wilayahScope"
                                        className="w-3.5 h-3.5 rounded-full border border-white/20 bg-transparent appearance-none checked:bg-amber-500 checked:border-amber-500 transition-all duration-200"
                                        checked={wilayahScope === "branch"}
                                        onChange={() => setWilayahScope("branch")}
                                      />
                                      <div className={`absolute w-1.5 h-1.5 bg-black rounded-full pointer-events-none transition-opacity ${wilayahScope === "branch" ? "opacity-100" : "opacity-0"}`} />
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                                      Cabang Tertentu
                                    </span>
                                  </label>
                                </div>
                                {wilayahScope === "branch" && isSuper && (
                                  <div className="event-input-container">
                                    <select
                                      value={formData.eventProvinceId}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          eventProvinceId: e.target.value,
                                          branchId: "",
                                        })
                                      }
                                      className="event-form-field"
                                      style={{ paddingRight: "36px" }}
                                    >
                                      <option value="">Pilih provinsi…</option>
                                      {provinceOptions.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronRight
                                      size={14}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none"
                                    />
                                  </div>
                                )}
                                {wilayahScope === "branch" && (
                                  <div className="event-input-container">
                                    <select
                                      value={formData.branchId}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          branchId: e.target.value,
                                        })
                                      }
                                      className="event-form-field"
                                      style={{ paddingRight: "36px" }}
                                    >
                                      <option value="">
                                        Pilih cabang / ranting…
                                      </option>
                                      {branchOptions.map((b) => (
                                        <option key={b.id} value={b.id}>
                                          {b.city
                                            ? `${b.name} — ${b.city}`
                                            : b.name}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronRight
                                      size={14}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Lokasi */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                            Lokasi
                          </label>
                          <div className="event-input-container">
                            <MapPin
                              className="event-field-icon"
                              size={16}
                            />
                            <input
                              type="text"
                              name="location"
                              required
                              autoComplete="off"
                              value={formData.location}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  location: e.target.value,
                                })
                              }
                              placeholder="Gedung Olahraga, Kota..."
                              className="event-form-field event-form-field-icon"
                            />
                          </div>
                        </div>

                        {/* Biaya Pendaftaran */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                            Biaya Pendaftaran (per peserta)
                          </label>
                          {modalMode === "edit" && eventFeeRows.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-gray-500 leading-relaxed font-medium ml-0.5">
                                Nominal tagihan pembayaran mengikuti baris kategori di bawah ini.
                              </p>
                              <div className="space-y-2">
                                {eventFeeRows.map((row, idx) => (
                                  <div
                                    key={row.id ? row.id : `fee-${idx}`}
                                    className="rounded-xl border border-white/5 bg-white/[0.01] p-3 flex items-center justify-between gap-4"
                                  >
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-300 truncate">
                                      {row.name}
                                    </span>
                                    <div className="event-input-container" style={{ width: "144px" }}>
                                      <Wallet
                                        className="event-field-icon"
                                        size={14}
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        aria-label={`Biaya ${row.name}`}
                                        value={row.feeRp}
                                        onChange={(e) =>
                                          setEventFeeRows((rows) =>
                                            rows.map((r, i) =>
                                              i === idx
                                                ? { ...r, feeRp: e.target.value }
                                                : r,
                                            ),
                                          )
                                        }
                                        placeholder="0"
                                        className="event-form-field event-form-field-icon"
                                        style={{
                                          minHeight: "38px",
                                          padding: "8px 12px 8px 36px",
                                          fontSize: "12px",
                                          borderRadius: "8px"
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="event-input-container">
                                <Wallet
                                  className="event-field-icon"
                                  size={16}
                                />
                                <input
                                  type="number"
                                  name="registrationFeeRp"
                                  min={0}
                                  step={1}
                                  inputMode="numeric"
                                  autoComplete="off"
                                  value={formData.registrationFeeRp}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      registrationFeeRp: e.target.value,
                                    })
                                  }
                                  placeholder="0 = gratis"
                                  className="event-form-field event-form-field-icon"
                                />
                              </div>
                              <p className="text-[10px] text-gray-500 leading-relaxed font-medium ml-0.5">
                                {modalMode === "create" ? (
                                  <>
                                    Kategori tarif otomatis:{" "}
                                    <span className="text-gray-400 font-semibold">
                                      {DEFAULT_EVENT_REGISTRATION_CATEGORY}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    Isi biaya untuk membuat kategori{" "}
                                    <span className="text-gray-400 font-semibold">
                                      {DEFAULT_EVENT_REGISTRATION_CATEGORY}
                                    </span>
                                  </>
                                )}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Waktu Pelaksanaan */}
                        <div className="space-y-3.5 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-amber-500 px-0.5">
                            <Calendar size={13} className="shrink-0" aria-hidden />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">
                              Waktu Pelaksanaan
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                                Tanggal Mulai
                              </label>
                              <div className="event-input-container">
                                <input
                                  type="date"
                                  name="startDate"
                                  required
                                  value={formData.startDate}
                                  onChange={(e) =>
                                    setFormData((prev) =>
                                      clampRegistrationCloseToStart({
                                        ...prev,
                                        startDate: e.target.value,
                                      }),
                                    )
                                  }
                                  className="event-form-field"
                                />
                              </div>
                              <label className="text-[9px] font-semibold uppercase text-gray-500 tracking-wider ml-0.5">
                                Jam Mulai (24 Jam)
                              </label>
                              <div className="flex items-center gap-1.5">
                                <div className="event-input-container flex-1">
                                  <select
                                    value={formData.startTime.split(":")[0] || "08"}
                                    onChange={(e) => {
                                      const h = e.target.value;
                                      const m = formData.startTime.split(":")[1] || "00";
                                      setFormData((prev) =>
                                        clampRegistrationCloseToStart({
                                          ...prev,
                                          startTime: `${h}:${m}`,
                                        }),
                                      );
                                    }}
                                    className="event-form-field"
                                    style={{ padding: "12px 8px", textAlign: "center" }}
                                  >
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const val = i.toString().padStart(2, "0");
                                      return <option key={val} value={val}>{val}</option>;
                                    })}
                                  </select>
                                </div>
                                <span className="text-gray-400 font-bold">:</span>
                                <div className="event-input-container flex-1">
                                  <select
                                    value={formData.startTime.split(":")[1] || "00"}
                                    onChange={(e) => {
                                      const h = formData.startTime.split(":")[0] || "08";
                                      const m = e.target.value;
                                      setFormData((prev) =>
                                        clampRegistrationCloseToStart({
                                          ...prev,
                                          startTime: `${h}:${m}`,
                                        }),
                                      );
                                    }}
                                    className="event-form-field"
                                    style={{ padding: "12px 8px", textAlign: "center" }}
                                  >
                                    {Array.from({ length: 60 }, (_, i) => {
                                      const val = i.toString().padStart(2, "0");
                                      return <option key={val} value={val}>{val}</option>;
                                    })}
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                                Tanggal Selesai
                              </label>
                              <div className="event-input-container">
                                <input
                                  type="date"
                                  name="endDate"
                                  required
                                  value={formData.endDate}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      endDate: e.target.value,
                                    })
                                  }
                                  className="event-form-field"
                                />
                              </div>
                              <label className="text-[9px] font-semibold uppercase text-gray-500 tracking-wider ml-0.5">
                                Jam Selesai (24 Jam)
                              </label>
                              <div className="flex items-center gap-1.5">
                                <div className="event-input-container flex-1">
                                  <select
                                    value={formData.endTime.split(":")[0] || "17"}
                                    onChange={(e) => {
                                      const h = e.target.value;
                                      const m = formData.endTime.split(":")[1] || "00";
                                      setFormData((prev) => ({
                                        ...prev,
                                        endTime: `${h}:${m}`,
                                      }));
                                    }}
                                    className="event-form-field"
                                    style={{ padding: "12px 8px", textAlign: "center" }}
                                  >
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const val = i.toString().padStart(2, "0");
                                      return <option key={val} value={val}>{val}</option>;
                                    })}
                                  </select>
                                </div>
                                <span className="text-gray-400 font-bold">:</span>
                                <div className="event-input-container flex-1">
                                  <select
                                    value={formData.endTime.split(":")[1] || "00"}
                                    onChange={(e) => {
                                      const h = formData.endTime.split(":")[0] || "17";
                                      const m = e.target.value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        endTime: `${h}:${m}`,
                                      }));
                                    }}
                                    className="event-form-field"
                                    style={{ padding: "12px 8px", textAlign: "center" }}
                                  >
                                    {Array.from({ length: 60 }, (_, i) => {
                                      const val = i.toString().padStart(2, "0");
                                      return <option key={val} value={val}>{val}</option>;
                                    })}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Batas Pendaftaran */}
                        <div className="space-y-3 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-amber-500 px-0.5">
                            <Users size={13} className="shrink-0" aria-hidden />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">
                              Batas Pendaftaran Anggota (Opsional)
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed ml-0.5 -mt-1 font-medium">
                            Pendaftaran mandiri tutup otomatis saat acara dimulai jika dikosongkan.
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                                Tanggal Tutup
                              </label>
                              <div className="event-input-container">
                                <input
                                  type="date"
                                  name="registrationCloseDate"
                                  value={formData.registrationCloseDate}
                                  max={formData.startDate || undefined}
                                  onChange={(e) =>
                                    setFormData((prev) =>
                                      clampRegistrationCloseToStart({
                                        ...prev,
                                        registrationCloseDate: e.target.value,
                                      }),
                                    )
                                  }
                                  className="event-form-field"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                                Jam Tutup (24 Jam)
                              </label>
                              <div className="flex items-center gap-1.5">
                                <div className="event-input-container flex-1">
                                  <select
                                    value={formData.registrationCloseTime ? formData.registrationCloseTime.split(":")[0] : ""}
                                    onChange={(e) => {
                                      const h = e.target.value;
                                      const m = formData.registrationCloseTime ? (formData.registrationCloseTime.split(":")[1] || "00") : "00";
                                      setFormData((prev) =>
                                        clampRegistrationCloseToStart({
                                          ...prev,
                                          registrationCloseTime: h ? `${h}:${m}` : "",
                                        }),
                                      );
                                    }}
                                    className="event-form-field"
                                    style={{ padding: "12px 8px", textAlign: "center" }}
                                  >
                                    <option value="">--</option>
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const val = i.toString().padStart(2, "0");
                                      return <option key={val} value={val}>{val}</option>;
                                    })}
                                  </select>
                                </div>
                                <span className="text-gray-400 font-bold">:</span>
                                <div className="event-input-container flex-1">
                                  <select
                                    value={formData.registrationCloseTime ? formData.registrationCloseTime.split(":")[1] : ""}
                                    onChange={(e) => {
                                      const m = e.target.value;
                                      const h = formData.registrationCloseTime ? (formData.registrationCloseTime.split(":")[0] || "00") : "00";
                                      setFormData((prev) =>
                                        clampRegistrationCloseToStart({
                                          ...prev,
                                          registrationCloseTime: m ? `${h}:${m}` : "",
                                        }),
                                      );
                                    }}
                                    className="event-form-field"
                                    style={{ padding: "12px 8px", textAlign: "center" }}
                                  >
                                    <option value="">--</option>
                                    {Array.from({ length: 60 }, (_, i) => {
                                      const val = i.toString().padStart(2, "0");
                                      return <option key={val} value={val}>{val}</option>;
                                    })}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                          {formData.startDate &&
                            formData.startTime &&
                            formData.registrationCloseDate &&
                            formData.registrationCloseTime &&
                            formData.registrationCloseDate ===
                              formData.startDate && (
                              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                Jam tutup paling lambat: {formData.startTime.slice(0, 5)}.
                              </p>
                            )}
                        </div>

                        {/* Deskripsi */}
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <label className="text-[10px] font-semibold uppercase text-amber-500 tracking-wider ml-0.5">
                            Deskripsi Singkat
                          </label>
                          <div className="event-input-container">
                            <textarea
                              name="description"
                              rows={3}
                              value={formData.description}
                              autoComplete="off"
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Jelaskan detail kegiatan..."
                              className="event-form-field event-form-textarea"
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="mobile-hpad pt-4 adm-chrome-soft backdrop-blur-xl border-t border-white/5 mt-auto pb-[calc(env(safe-area-inset-bottom,16px)+16px)]">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowEventModal(false)}
                        className="flex-1 py-3 rounded-xl border border-white/5 text-[10px] font-semibold text-gray-400 hover:text-white uppercase tracking-wider hover:bg-white/[0.02] transition-all duration-200"
                      >
                        Batal
                      </button>
                      <button
                        form="eventForm"
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-semibold uppercase tracking-wider shadow-md hover:shadow-amber-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          "Simpan Agenda"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Elegant Delete Confirmation Modal WITH BLUR */}
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="admin-modal-overlay admin-modal-overlay--dialog"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="admin-modal-dialog-panel border border-white/5 bg-[#141418] max-w-[340px]"
                >
                  <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/10">
                    <Trash2 size={24} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                    Hapus Agenda?
                  </h3>
                  <p className="text-gray-400 text-xs mb-6 leading-relaxed font-medium">
                    Tindakan ini <span className="text-red-400 font-semibold">permanen</span>. Semua data pendaftaran terkait akan ikut terhapus dari sistem.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setEventToDelete(null);
                      }}
                      className="flex-1 py-2.5 bg-white/[0.03] text-gray-400 hover:text-white font-semibold text-[10px] uppercase tracking-wider rounded-lg border border-white/5 active:scale-95 transition-all duration-200"
                    >
                      Batalkan
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={isSubmitting}
                      className="flex-[1.5] py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-[10px] uppercase tracking-wider rounded-lg shadow-md hover:shadow-red-500/10 active:scale-95 transition-all duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
