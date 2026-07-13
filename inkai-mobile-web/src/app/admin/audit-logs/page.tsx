"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertCircle,
  Clock,
  ShieldAlert,
  Laptop,
  Globe,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface AuditLogItem {
  id: string;
  userId: string | null;
  email: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  location: string | null;
  createdAt: string;
  user?: {
    fullName: string | null;
    email: string;
  } | null;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auditLogs.getAll({
        page: currentPage,
        limit,
        search: debouncedSearch,
        action: actionFilter,
      });

      if (res && res.status === "success" && res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || null);
      } else {
        throw new Error("Gagal memuat log audit");
      }
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Terjadi kesalahan saat memuat data log audit."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, debouncedSearch, actionFilter]);

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to parse user agent
  const parseUserAgent = (ua: string | null) => {
    if (!ua) return "Perangkat Tidak Diketahui";
    
    // Simple OS detection
    let os = "Unknown OS";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    // Simple Browser detection
    let browser = "Unknown Browser";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edge")) browser = "Edge";
    
    return `${browser} (${os})`;
  };

  // Badges color based on action type
  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("FAILED") || act.includes("BLOCKED") || act.includes("LOCKED") || act.includes("DELETE")) {
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
    if (act.includes("SUCCESS") || act.includes("COMPLETED")) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (act.includes("CREATE")) {
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
    if (act.includes("UPDATE") || act.includes("CHANGE")) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
    return "bg-gray-500/10 text-gray-400 border border-white/10";
  };

  // Check permissions
  const isAuthorized = useMemo(() => {
    if (!authUser || !authUser.roles) return false;
    return authUser.roles.some(
      (r: any) => {
        const roleName = typeof r === 'string' ? r : r?.name;
        return roleName === 'ADMINISTRATOR' || roleName === 'ADMIN_PUSAT';
      }
    );
  }, [authUser]);

  if (!isAuthorized) {
    return (
      <div className="p-6">
        <div className="glass-card text-center space-y-6 border-red-500/20 bg-red-500/5 py-12">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Akses Ditolak</h3>
            <p className="text-gray-400 text-xs max-w-md mx-auto">
              Halaman Audit Log hanya dapat diakses oleh Administrator Tingkat Pusat.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Audit Log Sistem
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Kronologi audit & riwayat penggunaan akun pengurus/admin untuk kepatuhan sistem.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari email pengurus, alamat IP, deskripsi aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
          >
            <option value="" className="bg-[#1C1C1E]">Semua Aktivitas</option>
            <option value="LOGIN_SUCCESS" className="bg-[#1C1C1E]">Login Sukses</option>
            <option value="LOGIN_FAILED" className="bg-[#1C1C1E]">Login Gagal</option>
            <option value="ACCOUNT_LOCKED" className="bg-[#1C1C1E]">Akun Terkunci</option>
            <option value="PASSWORD_CHANGED" className="bg-[#1C1C1E]">Password Diganti</option>
            <option value="MEMBER_CREATED" className="bg-[#1C1C1E]">Anggota Baru Dibuat</option>
            <option value="MEMBER_DELETED" className="bg-[#1C1C1E]">Anggota Dihapus</option>
            <option value="ADMIN_ACTION" className="bg-[#1C1C1E]">Aksi Admin / Update</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {error ? (
        <div className="glass-card text-center p-6 border-red-500/20 bg-red-500/5">
          <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      ) : loading && logs.length === 0 ? (
        <div className="glass-card flex flex-col justify-center items-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs text-gray-400">Sedang memuat data audit log...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card text-center py-20 text-gray-400 text-xs">
          Tidak ada log aktivitas yang ditemukan.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card p-0 overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Pengguna / Akun</th>
                    <th className="py-3 px-4">Aktivitas</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Perangkat & IP</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-all">
                      <td className="py-3 px-4 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-500" />
                          {formatDate(log.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {log.user?.fullName || log.email || "System"}
                          </span>
                          {log.user && (
                            <span className="text-[10px] text-gray-400">
                              {log.user.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={log.details || ""}>
                        {log.details || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Laptop size={11} className="text-gray-500" />
                            {parseUserAgent(log.userAgent)}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Globe size={11} className="text-gray-500" />
                            {log.ip || "unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all"
                          title="Lihat Detail Log"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-gray-400">
                Menampilkan <span className="font-medium text-white">{logs.length}</span> log dari{" "}
                <span className="font-medium text-white">{pagination.total}</span> data
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-gray-400 px-2">
                  Halaman <span className="font-medium text-white">{currentPage}</span> dari{" "}
                  <span className="font-medium text-white">{pagination.totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages || loading}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1C1C1E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white">Detail Log Audit</h3>
                <span className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-gray-400">Waktu Kejadian</span>
                <span className="col-span-2 text-white font-semibold">
                  {formatDate(selectedLog.createdAt)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-gray-400">Aktivitas (Action)</span>
                <span className="col-span-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionBadgeClass(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-gray-400">Nama Akun/Email</span>
                <span className="col-span-2 text-white font-medium">
                  {selectedLog.user?.fullName ? `${selectedLog.user.fullName} (${selectedLog.user.email})` : (selectedLog.email || "Sistem (Automated)")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-gray-400">Alamat IP</span>
                <span className="col-span-2 text-white font-mono">{selectedLog.ip || "—"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-gray-400">Browser / OS</span>
                <span className="col-span-2 text-white">
                  {parseUserAgent(selectedLog.userAgent)}
                </span>
              </div>

              <div className="space-y-1.5 py-1.5">
                <span className="text-gray-400 block">Deskripsi Aktivitas Lengkap</span>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-gray-300 leading-relaxed text-[11px] font-sans break-words whitespace-pre-wrap">
                  {selectedLog.details || "Tidak ada detail log."}
                </div>
              </div>

              {selectedLog.userAgent && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-gray-400 block">Raw User Agent Header</span>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-gray-400 font-mono text-[10px] break-all leading-normal">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-white/5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-white/10 text-white font-semibold rounded-xl text-xs hover:bg-white/20 active:scale-95 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
