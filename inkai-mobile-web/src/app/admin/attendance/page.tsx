'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  MapPin,
  Clock,
  Loader2,
  ChevronLeft,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModalPortal from '@/components/admin/AdminModalPortal';
import { useAuth } from '@/context/AuthContext';

type AttendanceLog = {
  id: string;
  checkInAt: string;
  method?: string;
  member?: { fullName?: string; nia?: string };
  dojo?: { name?: string };
  event?: { id?: string; title?: string } | null;
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayDateInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [reportDate, setReportDate] = useState(todayDateInputValue);
  const [editModalLog, setEditModalLog] = useState<AttendanceLog | null>(null);
  const [editCheckInAt, setEditCheckInAt] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteAttendancePrompt, setDeleteAttendancePrompt] = useState<{
    id: string;
    memberName: string;
  } | null>(null);

  const scopeHint = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const r0 = typeof roles[0] === 'string' ? roles[0] : (roles[0] as { name?: string })?.name;
    if (r0 === 'ADMIN_BRANCH' && user?.managedBranchName) {
      return `Wilayah cabang Anda: ${user.managedBranchName}`;
    }
    if (r0 === 'ADMIN_DOJO' && user?.managedDojoName) {
      return `Ranting/dojo Anda: ${user.managedDojoName}`;
    }
    if (r0 === 'ADMIN_PROVINCE' && user?.managedProvinceName) {
      return `Provinsi Anda: ${user.managedProvinceName}`;
    }
    if (r0 === 'ADMINISTRATOR' || r0 === 'ADMIN_PUSAT') {
      return 'Lingkup nasional';
    }
    return 'Data difilter sesuai hak akses akun Anda.';
  }, [user]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.attendance.getLogs({
        date: reportDate,
        limit: 400,
      });
      const rows = Array.isArray(response?.data) ? response.data : [];
      setLogs(rows);
    } catch (err: unknown) {
      const ax = err as { message?: string; response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || ax.message || 'Gagal memuat');
    } finally {
      setLoading(false);
    }
  }, [reportDate]);

  useEffect(() => {
    // Defer fetch so setState inside fetchLogs does not run synchronously in the effect body
    // (eslint react-hooks — avoid cascading renders).
    const handle = globalThis.setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => globalThis.clearTimeout(handle);
  }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = String(log.member?.fullName ?? '').toLowerCase();
    const nia = String(log.member?.nia ?? '').toLowerCase();
    const dojo = String(log.dojo?.name ?? '').toLowerCase();
    const agenda = String(log.event?.title ?? '').toLowerCase();
    return name.includes(q) || nia.includes(q) || dojo.includes(q) || agenda.includes(q);
  });

  const openEditModal = (log: AttendanceLog) => {
    setEditModalLog(log);
    setEditCheckInAt(toDatetimeLocalValue(log.checkInAt));
  };

  const closeEditModal = () => {
    setEditModalLog(null);
    setEditCheckInAt('');
  };

  const saveEditModal = async () => {
    if (!editModalLog) return;
    const dt = new Date(editCheckInAt);
    if (Number.isNaN(dt.getTime())) {
      toast.error('Waktu tidak valid');
      return;
    }
    const id = editModalLog.id;
    setBusyId(id);
    try {
      await api.attendance.updateStaff(id, { checkInAt: dt.toISOString() });
      toast.success('Waktu absensi diperbarui');
      closeEditModal();
      await fetchLogs();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setBusyId(null);
    }
  };

  const openDeleteAttendancePrompt = (id: string, name: string) => {
    setDeleteAttendancePrompt({
      id,
      memberName: (name || 'anggota ini').trim() || 'anggota ini',
    });
  };

  const executeRemoveLog = async () => {
    if (!deleteAttendancePrompt) return;
    const { id } = deleteAttendancePrompt;
    setBusyId(id);
    try {
      await api.attendance.deleteStaff(id);
      toast.success('Catatan absensi dihapus');
      setDeleteAttendancePrompt(null);
      closeEditModal();
      await fetchLogs();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Gagal menghapus');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0 max-w-full">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-amber-500 mb-0.5">
            <ClipboardCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Laporan pengurus</span>
          </div>
          <h2 className="text-xl font-black uppercase text-[var(--text-light)] leading-tight">Absensi</h2>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">{scopeHint}</p>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Lihat kehadiran QR dojo dan agenda per hari. Koreksi waktu absen atau hapus catatan yang salah. Anggota
        tidak dapat mengubah riwayat dari aplikasi.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap min-w-0">
        <div className="space-y-1 w-full sm:w-auto max-w-full min-w-0 sm:max-w-xs">
          <label className="text-[10px] font-black uppercase text-amber-500/90 tracking-widest ml-0.5">
            Tanggal laporan
          </label>
          {/* adm-dark-field: teks datepicker terbaca di mode siang + malam (globals.css) */}
          <div className="adm-dark-field rounded-xl border border-slate-600/35 bg-[#1e1e24] shadow-inner">
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full min-h-[44px] rounded-xl px-4 py-3 text-sm bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-amber-500/45 focus:ring-inset"
            />
          </div>
        </div>
        <div className="glass-card px-4 py-3 flex-1 min-w-[140px] max-w-xs">
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Jumlah catatan</p>
          <p className="text-2xl font-black text-[var(--text-light)]">{logs.length}</p>
        </div>
      </div>

      <div className="glass-card space-y-6 min-w-0 max-w-full">
        <div className="flex justify-between items-center flex-wrap gap-3 min-w-0">
          <h3 className="text-lg font-bold text-[var(--text-light)]">Daftar kehadiran</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Cari anggota, dojo, agenda..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-black-20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="relative min-h-[300px] w-full max-w-full min-w-0">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center adm-bg z-10 rounded-xl">
              <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">Error: {error}</div>
          ) : (
            <div className="overflow-x-auto w-full max-w-full min-w-0 overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x pb-1">
            <table className="w-full min-w-[620px] table-fixed text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-4 pl-2 font-medium min-w-0 w-[22%]">Anggota</th>
                  <th className="pb-4 font-medium min-w-0 w-[14%]">Dojo</th>
                  <th className="pb-4 font-medium min-w-0 w-[20%]">Agenda</th>
                  <th className="pb-4 font-medium min-w-0 w-[18%]">Waktu</th>
                  <th className="pb-4 font-medium min-w-0 w-[14%]">Metode</th>
                  <th className="pb-4 text-right pr-2 pl-3 font-medium w-[100px] min-w-[100px] max-w-[100px] shadow-[-12px_0_14px_-10px_rgba(0,0,0,0.25)] bg-[var(--glass-bg)] backdrop-blur-md sticky right-0 z-30 border-l border-white/10 align-top">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((log) => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors align-top">
                    <td className="py-4 pl-2 min-w-0 align-top">
                      <p className="font-bold text-[var(--text-light)] break-words">{log.member?.fullName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{log.member?.nia}</p>
                    </td>
                    <td className="py-4 min-w-0 align-top">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin size={14} className="text-gray-500 shrink-0 mt-0.5" />
                        <span className="text-xs break-words">{log.dojo?.name}</span>
                      </div>
                    </td>
                    <td className="py-4 min-w-0 align-top">
                      <div className="flex items-start gap-2 text-xs text-gray-300 min-w-0">
                        <Calendar size={14} className="text-gray-500 shrink-0 mt-0.5" />
                        <span className="break-words min-w-0">{log.event?.title || '—'}</span>
                      </div>
                    </td>
                    <td className="py-4 min-w-0 align-top">
                      <div className="flex items-start gap-2 text-gray-400 min-w-0">
                        <Clock size={14} className="shrink-0 mt-0.5" />
                        <span className="text-xs break-words min-w-0">
                          {new Date(log.checkInAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 min-w-0 align-top">
                      <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full border border-white/10 text-gray-500 break-all inline-block max-w-full">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2 pl-3 min-w-0 align-top w-[100px] min-w-[100px] max-w-[100px] shadow-[-12px_0_14px_-10px_rgba(0,0,0,0.2)] bg-[var(--glass-bg)] backdrop-blur-md sticky right-0 z-20 border-l border-white/10 group-hover:bg-white/[0.02]">
                      <div className="flex justify-end gap-1 flex-nowrap relative z-10">
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => openEditModal(log)}
                          title="Koreksi waktu"
                          className="shrink-0 p-2 rounded-lg border border-white/10 bg-white/5 text-amber-400 hover:bg-white/10 disabled:opacity-30"
                        >
                          <Pencil size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            openDeleteAttendancePrompt(log.id, log.member?.fullName || '')
                          }
                          title="Hapus dari laporan"
                          className="shrink-0 p-2 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/15 disabled:opacity-30"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center text-gray-500">
              {logs.length === 0
                ? 'Tidak ada catatan absensi pada tanggal ini untuk wilayah Anda.'
                : 'Tidak ada hasil pencarian.'}
            </div>
          )}
        </div>
      </div>
    </div>

    <AdminModalPortal>
      <AnimatePresence>
        {editModalLog && (
          <motion.div
            key="edit-attendance-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="admin-modal-overlay admin-modal-overlay--dialog admin-modal-overlay--stack"
            role="presentation"
            onClick={() => {
              if (busyId === null) closeEditModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="admin-modal-dialog-panel relative max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-att-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl" />
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-500 shadow-lg shadow-amber-500/10">
                <Pencil size={28} aria-hidden />
              </div>
              <h3
                id="edit-att-title"
                className="mb-1 text-xl font-black uppercase tracking-tight text-white text-center"
              >
                Koreksi absensi
              </h3>
              <p className="mb-6 text-center text-[11px] text-gray-500 leading-relaxed">
                Ubah waktu pencatatan jika ada kesalahan. Semua field di bawah hanya untuk referensi.
              </p>

              <div className="space-y-4 mb-6 text-left">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Anggota</p>
                  <p className="text-sm font-bold text-white break-words">{editModalLog.member?.fullName}</p>
                  <p className="text-xs text-gray-500 font-mono">{editModalLog.member?.nia || '—'}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Dojo</p>
                    <p className="text-white break-words">{editModalLog.dojo?.name || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Agenda</p>
                    <p className="text-white break-words">{editModalLog.event?.title || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Metode</p>
                    <p className="text-white">{editModalLog.method || '—'}</p>
                  </div>
                </div>
              </div>

              <label className="block text-[10px] font-black uppercase tracking-widest text-amber-500/90 mb-2 ml-0.5">
                Waktu absensi
              </label>
              <div className="adm-dark-field rounded-xl border border-slate-600/35 bg-[#1e1e24] shadow-inner mb-6">
                <input
                  type="datetime-local"
                  value={editCheckInAt}
                  onChange={(e) => setEditCheckInAt(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl px-4 py-3 text-sm bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-amber-500/45 focus:ring-inset"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void saveEditModal()}
                  disabled={busyId === editModalLog.id}
                  className="w-full rounded-2xl bg-amber-500 py-4 text-xs font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === editModalLog.id ? 'Menyimpan...' : 'Simpan perubahan'}
                </button>
                <button
                  type="button"
                  disabled={busyId === editModalLog.id}
                  onClick={closeEditModal}
                  className="w-full rounded-2xl border border-white/5 bg-white/5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 transition-all active:scale-95 disabled:opacity-40"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {deleteAttendancePrompt && (
          <motion.div
            key="delete-attendance-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="admin-modal-overlay admin-modal-overlay--dialog admin-modal-overlay--stack"
            role="presentation"
            onClick={() => {
              if (busyId === null) setDeleteAttendancePrompt(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="admin-modal-dialog-panel relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-att-title"
              aria-describedby="delete-att-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-red-500/5 blur-3xl" />

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-red-500/20 bg-red-500/10 text-red-500 shadow-2xl shadow-red-500/10">
                <Trash2 size={32} aria-hidden />
              </div>
              <h3
                id="delete-att-title"
                className="mb-3 text-xl font-black uppercase tracking-tight text-white"
              >
                Hapus catatan absensi?
              </h3>
              <p
                id="delete-att-desc"
                className="mb-8 text-xs font-medium leading-relaxed text-gray-400"
              >
                Catatan kehadiran{' '}
                <span className="break-words font-bold text-white">
                  {deleteAttendancePrompt.memberName}
                </span>{' '}
                akan disembunyikan dari laporan (soft delete). Anggota dapat mencatat ulang absensi jika
                diperlukan.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void executeRemoveLog()}
                  disabled={busyId === deleteAttendancePrompt.id}
                  className="w-full rounded-2xl bg-red-500 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === deleteAttendancePrompt.id ? 'Menghapus...' : 'Ya, hapus catatan'}
                </button>
                <button
                  type="button"
                  disabled={busyId === deleteAttendancePrompt.id}
                  onClick={() => setDeleteAttendancePrompt(null)}
                  className="w-full rounded-2xl border border-white/5 bg-white/5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 transition-all active:scale-95 disabled:opacity-40"
                >
                  Batalkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminModalPortal>
    </>
  );
}
