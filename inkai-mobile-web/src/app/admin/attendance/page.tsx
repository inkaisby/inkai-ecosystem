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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
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
    void fetchLogs();
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

  const startEdit = (log: AttendanceLog) => {
    setEditingId(log.id);
    setEditValue(toDatetimeLocalValue(log.checkInAt));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: string) => {
    const dt = new Date(editValue);
    if (Number.isNaN(dt.getTime())) {
      toast.error('Waktu tidak valid');
      return;
    }
    setBusyId(id);
    try {
      await api.attendance.updateStaff(id, { checkInAt: dt.toISOString() });
      toast.success('Waktu absensi diperbarui');
      cancelEdit();
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
      cancelEdit();
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          <h2 className="text-xl font-black uppercase text-white leading-tight">Absensi</h2>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">{scopeHint}</p>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Lihat kehadiran QR dojo dan agenda per hari. Koreksi waktu absen atau hapus catatan yang salah. Anggota
        tidak dapat mengubah riwayat dari aplikasi.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-amber-500/90 tracking-widest ml-0.5">
            Tanggal laporan
          </label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div className="glass-card px-4 py-3 flex-1 min-w-[140px] max-w-xs">
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Jumlah catatan</p>
          <p className="text-2xl font-black text-white">{logs.length}</p>
        </div>
      </div>

      <div className="glass-card space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h3 className="text-lg font-bold">Daftar kehadiran</h3>
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

        <div className="overflow-x-auto relative min-h-[300px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center adm-bg z-10 rounded-xl">
              <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">Error: {error}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-4 pl-2 font-medium">Anggota</th>
                  <th className="pb-4 font-medium">Dojo</th>
                  <th className="pb-4 font-medium">Agenda</th>
                  <th className="pb-4 font-medium">Waktu</th>
                  <th className="pb-4 font-medium">Metode</th>
                  <th className="pb-4 text-right pr-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-all align-top">
                    <td className="py-4 pl-2">
                      <p className="font-bold text-white">{log.member?.fullName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{log.member?.nia}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-500 shrink-0" />
                        <span className="text-xs">{log.dojo?.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-start gap-2 text-xs text-gray-300">
                        <Calendar size={14} className="text-gray-500 shrink-0 mt-0.5" />
                        <span>{log.event?.title || '—'}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      {editingId === log.id ? (
                        <input
                          type="datetime-local"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white max-w-[11rem]"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={14} />
                          <span className="text-xs">
                            {new Date(log.checkInAt).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full border border-white/10 text-gray-500">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {editingId === log.id ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === log.id}
                              onClick={() => void saveEdit(log.id)}
                              className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-40"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              disabled={busyId === log.id}
                              onClick={cancelEdit}
                              className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busyId !== null}
                              onClick={() => startEdit(log)}
                              title="Ubah waktu"
                              className="p-2 rounded-lg border border-white/10 bg-white/5 text-amber-400 hover:bg-white/10 disabled:opacity-30"
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
                              className="p-2 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/15 disabled:opacity-30"
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
