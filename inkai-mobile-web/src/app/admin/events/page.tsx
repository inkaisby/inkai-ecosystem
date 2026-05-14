"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Plus,
  Search,
  Trophy,
  GraduationCap,
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Loader2,
  X,
  Edit2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  _count?: {
    registrations: number;
  };
}

export default function EventsPage() {
  const router = useRouter();
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
    endDate: "",
    location: "",
    category: "Kegiatan Umum",
  });

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
      const errorMessage = err instanceof Error ? err.message : "Gagal menghapus agenda";
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

  const isAnyModalOpen = showDetailModal || showEventModal || showDeleteModal;

  // Hide BottomNav and AdminMenu when modal is open
  useEffect(() => {
    const bottomNav = document.querySelector("nav");
    const adminMenu = document.querySelector('[class*="AdminMenu"]'); // Target AdminMenu floating button

    const elementsToHide = [bottomNav, adminMenu];

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
    setFormData({
      id: "",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      category: "Kegiatan Umum",
    });
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
    setModalMode("create");
    setShowEventModal(true);
  };

  const openEditModal = (event: Event) => {
    setFormData({
      id: event.id,
      title: event.title.replace("KEJURNAS: ", "").replace("UJIAN: ", ""),
      description: event.description || "",
      startDate: event.startDate
        ? new Date(event.startDate).toISOString().split("T")[0]
        : "",
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().split("T")[0]
        : "",
      location: event.location || "",
      category: event.title.toLowerCase().includes("kejurnas")
        ? "Kejuaraan"
        : event.title.toLowerCase().includes("ujian")
          ? "Ujian Kenaikan"
          : "Kegiatan Umum",
    });
    setModalMode("edit");
    setShowEventModal(true);
  };

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-full">
      {/* Main Page Content - Completely unmount when modal is open to prevent "leaking" or overlapping */}
      {!isAnyModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-500">
                  <Calendar size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Manajemen Agenda
                  </span>
                </div>
                <h2 className="text-xl font-black uppercase text-white leading-tight">
                  Event & Kegiatan
                </h2>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Kelola jadwal turnamen, ujian kenaikan tingkat, dan gashuku
              nasional.
            </p>

            <button
              onClick={openAddModal}
              className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus size={18} />
              Buat Event Baru
            </button>
          </div>

          {/* Categories Toggle - Scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {["Semua Event", "Kejuaraan", "Ujian Kenaikan", "Lain-lain"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setFilter(cat === "Semua Event" ? "Semua" : cat)
                  }
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    (filter === "Semua" && cat === "Semua Event") ||
                    filter === cat
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                      : "bg-white/5 text-gray-500 border border-white/5"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-amber-500" size={40} />
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                Memuat data...
              </p>
            </div>
          ) : error ? (
            <div className="p-10 text-center modal-gradient rounded-3xl border border-red-500/20 bg-red-500/5">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} />
              </div>
              <h3 className="text-lg font-bold text-red-500 mb-2 uppercase">
                Gagal Memuat Data
              </h3>
              <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto mb-6 leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search Box */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={16}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama event..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 transition-all text-white placeholder:text-gray-600 shadow-inner"
                  />
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <motion.div
                    layoutId={event.id}
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDetailModal(true);
                    }}
                    className="modal-gradient p-4 rounded-2xl border border-white/5 flex gap-4 items-center group active:scale-[0.98] transition-all relative overflow-hidden"
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-2xl ${
                        event.title.toLowerCase().includes("kejurnas")
                          ? "bg-blue-500 text-white"
                          : event.title.toLowerCase().includes("ujian")
                            ? "bg-amber-500 text-black"
                            : "bg-green-500 text-white"
                      }`}
                    >
                      {event.title.toLowerCase().includes("kejurnas") ? (
                        <Trophy size={20} />
                      ) : event.title.toLowerCase().includes("ujian") ? (
                        <GraduationCap size={20} />
                      ) : (
                        <Users size={20} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black uppercase text-white truncate mb-1 tracking-tight">
                        {event.title}
                      </h3>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                          <Calendar size={12} className="text-amber-500" />
                          {new Date(event.startDate).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold truncate">
                          <MapPin size={12} className="text-amber-500" />{" "}
                          {event.location || "Indonesia"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(event);
                      }}
                      className="p-2 text-gray-400 hover:text-white transition-all active:scale-90"
                    >
                      <Edit2 size={18} />
                    </button>
                  </motion.div>
                ))}

                {filteredEvents.length === 0 && (
                  <div className="py-16 text-center bg-white/5 rounded-3xl border border-white/5">
                    <Search className="mx-auto text-gray-700 mb-3" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Agenda tidak ditemukan
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <div className="modal-gradient p-6 rounded-3xl border border-white/5 bg-amber-500/5 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 opacity-[0.1] text-white -rotate-12">
                  <Trophy size={100} />
                </div>
                <div className="relative z-10 flex flex-col items-end text-right">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                    Statistik Tahun Ini
                  </h3>
                  <div className="mt-1">
                    <span className="text-5xl font-black text-white leading-none opacity-90">
                      {events.length}
                    </span>
                    <p className="text-[11px] text-gray-500 uppercase font-black mt-1">
                      Total Event Aktif
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {/* Event Detail Modal - FULL SCREEN OVERLAY WITH BLUR */}
        {showDetailModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[999999] bg-[#0A0A0C] flex flex-col overflow-hidden"
          >
            {/* Mobile-focused container for wide screens */}
            <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto relative bg-[#0A0A0C] shadow-2xl overflow-hidden">
              {/* FIXED TOP BAR */}
              <div className="mobile-hpad py-4 flex justify-between items-center z-50 pt-[calc(env(safe-area-inset-top,24px)+8px)] bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-white/5">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2.5 bg-white/5 text-white rounded-xl border border-white/10 active:scale-90 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedEvent);
                    }}
                    className="p-2.5 bg-white/5 text-white rounded-xl border border-white/10 active:scale-90 transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteEvent(selectedEvent.id, e)}
                    className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 active:scale-90 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* HERO SECTION - Improved for Premium Mobile Look */}
                <div className="pt-12 pb-8 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent relative flex flex-col items-center justify-center overflow-hidden">
                  <div className="relative z-10 text-center mobile-hpad w-full">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`w-full max-w-[280px] mx-auto py-2.5 rounded-full mb-6 flex items-center justify-center shadow-2xl border border-white/10 ${
                        selectedEvent.title.toLowerCase().includes("kejurnas")
                          ? "bg-blue-500 text-white"
                          : selectedEvent.title.toLowerCase().includes("ujian")
                            ? "bg-amber-500 text-black"
                            : "bg-green-500 text-white"
                      }`}
                    >
                      {selectedEvent.title
                        .toLowerCase()
                        .includes("kejurnas") ? (
                        <Trophy size={20} />
                      ) : selectedEvent.title
                          .toLowerCase()
                          .includes("ujian") ? (
                        <GraduationCap size={20} />
                      ) : (
                        <Users size={20} />
                      )}
                    </motion.div>

                    <h3 className="text-xl font-black uppercase tracking-tighter text-white leading-[1.1] mb-6 max-w-[320px] mx-auto">
                      {selectedEvent.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 justify-center">
                      <span
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${
                          selectedEvent.title.toLowerCase().includes("kejurnas")
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : selectedEvent.title
                                  .toLowerCase()
                                  .includes("ujian")
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-green-500/10 text-green-500 border-green-500/20"
                        }`}
                      >
                        {selectedEvent.title.toLowerCase().includes("kejurnas")
                          ? "KEJUARAAN"
                          : selectedEvent.title.toLowerCase().includes("ujian")
                            ? "UJIAN KENAIKAN"
                            : "KEGIATAN UMUM"}
                      </span>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400">
                        <MapPin size={12} className="text-amber-500" />
                        <span className="uppercase tracking-widest truncate max-w-[180px]">
                          {selectedEvent.location || "INDONESIA"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pb-32 mobile-hpad py-4 space-y-8">
                  <div className="space-y-8">
                    {/* Waktu Pelaksanaan */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-500 px-1">
                        <Calendar size={16} />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                          Waktu Pelaksanaan
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/5 shadow-inner">
                          <p className="text-[9px] text-gray-600 uppercase font-black mb-1.5 tracking-widest">
                            Mulai
                          </p>
                          <p className="text-sm font-black text-white">
                            {new Date(
                              selectedEvent.startDate,
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/5 shadow-inner">
                          <p className="text-[9px] text-gray-600 uppercase font-black mb-1.5 tracking-widest">
                            Selesai
                          </p>
                          <p className="text-sm font-black text-white">
                            {new Date(selectedEvent.endDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Informasi Peserta */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-500 px-1">
                        <Users size={16} />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                          Informasi Peserta
                        </h4>
                      </div>
                      <div className="bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-gray-500 uppercase font-black tracking-widest">
                            Pendaftar Saat Ini
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-amber-500">
                              {selectedEvent._count?.registrations || 0}
                            </span>
                            <span className="text-[10px] text-gray-700 font-bold uppercase">
                              Orang
                            </span>
                          </div>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                          <p className="text-[9px] text-gray-600 uppercase font-black mb-3 tracking-[0.2em]">
                            Deskripsi Agenda
                          </p>
                          <p className="text-[13px] text-gray-400 leading-relaxed font-medium">
                            {selectedEvent.description ||
                              "Tidak ada deskripsi tambahan untuk agenda ini."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ACTION BAR */}
              <div className="mobile-hpad pt-6 bg-[#0A0A0C]/80 backdrop-blur-xl border-t border-white/5 mt-auto pb-[calc(env(safe-area-inset-bottom,24px)+32px)]">
                <div className="flex gap-4 items-center">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      router.push(
                        `/admin/events/${selectedEvent.id}/participants`,
                      );
                    }}
                    className="flex-1 py-4 rounded-2xl bg-amber-500 text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Users size={18} />
                    Kelola Peserta Event
                  </button>
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
            className="fixed inset-0 z-[999999] bg-[#0A0A0C] flex flex-col overflow-hidden h-[100dvh]"
          >
            {/* Mobile-focused container for wide screens */}
            <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto relative bg-[#0A0A0C] shadow-2xl overflow-hidden h-full">
              <div className="flex justify-between items-center mobile-hpad pb-5 border-b border-white/5 pt-[calc(env(safe-area-inset-top,24px)+12px)] bg-[#0A0A0C]">
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

                      const eventPayload = {
                        ...formData,
                        title: finalTitle,
                        startDate: new Date(formData.startDate).toISOString(),
                        endDate: new Date(formData.endDate).toISOString(),
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
                  className="space-y-8 pb-32"
                >
                  <div className="space-y-6">
                    {/* Kategori */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">
                        Kategori Agenda
                      </label>
                      <div className="relative">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          required
                          className="w-full !bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer text-white shadow-inner"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="Kegiatan Umum">
                            Kegiatan Umum (Lain-lain)
                          </option>
                          <option value="Kejuaraan">
                            Kejuaraan / Turnamen
                          </option>
                          <option value="Ujian Kenaikan">
                            Ujian Kenaikan Tingkat
                          </option>
                        </select>
                        <ChevronRight
                          size={16}
                          className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none"
                        />
                      </div>
                    </div>

                    {/* Nama Event */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">
                        Nama Event / Agenda
                      </label>
                      <div className="relative">
                        <select
                          name="title"
                          required
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full !bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer text-white shadow-inner"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="">
                            Pilih salah satu item di daftar...
                          </option>
                          {formData.category === "Kejuaraan" && (
                            <>
                              <option value="KEJURNAS INKAI">
                                KEJURNAS INKAI
                              </option>
                              <option value="KEJURDA INKAI">
                                KEJURDA INKAI
                              </option>
                              <option value="OPEN TOURNAMENT">
                                OPEN TOURNAMENT
                              </option>
                              <option value="PIALA GUBERNUR">
                                PIALA GUBERNUR
                              </option>
                              <option value="PIALA WALIKOTA">
                                PIALA WALIKOTA
                              </option>
                            </>
                          )}
                          {formData.category === "Ujian Kenaikan" && (
                            <>
                              <option value="UJIAN KENAIKAN TINGKAT (UKT)">
                                UJIAN KENAIKAN TINGKAT (UKT)
                              </option>
                              <option value="GASHUKU & UKT NASIONAL">
                                GASHUKU & UKT NASIONAL
                              </option>
                              <option value="UJIAN DAN (SABUK HITAM)">
                                UJIAN DAN (SABUK HITAM)
                              </option>
                            </>
                          )}
                          {formData.category === "Kegiatan Umum" && (
                            <>
                              <option value="LATIHAN BERSAMA (GASHUKU)">
                                LATIHAN BERSAMA
                              </option>
                              <option value="RAPAT KERJA (RAKER)">
                                RAPAT KERJA (RAKER)
                              </option>
                              <option value="PELATIHAN PELATIH / WASIT">
                                PELATIHAN PELATIH / WASIT
                              </option>
                              <option value="KEGIATAN SOSIAL">
                                KEGIATAN SOSIAL
                              </option>
                            </>
                          )}
                        </select>
                        <ChevronRight
                          size={16}
                          className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none"
                        />
                      </div>
                    </div>

                    {/* Lokasi */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">
                        Lokasi
                      </label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500"
                          size={18}
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
                          className="w-full !bg-[#1e1e24] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-white placeholder:text-gray-600 shadow-inner"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                    </div>

                    {/* Tanggal */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">
                          Mulai
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          required
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full !bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-white shadow-inner"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">
                          Selesai
                        </label>
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
                          className="w-full !bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-white shadow-inner"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] ml-1">
                        Deskripsi Singkat
                      </label>
                      <textarea
                        name="description"
                        rows={4}
                        value={formData.description}
                        autoComplete="off"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Jelaskan detail kegiatan..."
                        className="w-full !bg-[#1e1e24] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none text-white placeholder:text-gray-600 shadow-inner"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* BOTTOM ACTION BAR */}
              <div className="mobile-hpad pt-6 bg-[#0A0A0C]/80 backdrop-blur-xl border-t border-white/5 mt-auto pb-[calc(env(safe-area-inset-bottom,24px)+24px)]">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-[10px] font-black hover:bg-white/5 transition-all text-gray-400 uppercase tracking-widest"
                  >
                    Batal
                  </button>
                  <button
                    form="eventForm"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 rounded-2xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
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
            className="fixed inset-0 z-[1000000] flex items-center justify-center mobile-safe-modal-gutter py-8 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-[360px] p-8 text-center rounded-[2.5rem] border border-white/10 shadow-2xl bg-[#1e1e24] relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />

              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/10 border border-red-500/20">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
                Hapus Agenda?
              </h3>
              <p className="text-gray-400 text-xs mb-8 leading-relaxed font-medium">
                Tindakan ini{" "}
                <span className="text-red-400 font-bold">permanen</span>. Semua
                data pendaftaran terkait akan ikut terhapus dari sistem.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Menghapus..." : "Ya, Hapus Sekarang"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                  }}
                  className="w-full py-4 bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-[0.2em] rounded-2xl border border-white/5 active:scale-95 transition-all"
                >
                  Batalkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
