"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  Map,
  Clock,
  Search,
  AlertCircle,
  Plus,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  FileText,
  MessageSquare,
  ClipboardCheck,
  Wallet,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import {
  StatCardSkeleton,
  MemberItemSkeleton,
} from "@/components/admin/Skeleton";
import { api, Member } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { verificationTypeLabel } from "@/lib/verificationDisplay";

interface DashboardStats {
  totalMembers: number;
  totalDojos: number;
  totalBranches: number;
  totalProvinces: number;
  pendingVerifications: number;
}

interface PendingClaim {
  id: string;
  member?: {
    fullName: string;
  };
  type: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type?: string;
  createdAt: string;
  isRead?: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [statsRes, membersRes, pendingMembersRes, pendingClaimsRes, announcementsRes] =
          await Promise.all([
            api.dashboard.getStats(),
            api.dashboard.getRecentActivities(),
            api.members.getAll({ status: "PENDING", limit: 5 }),
            api.verifications.getPending(),
            api.notifications.getMy()
          ]);
        setStats(statsRes.data);
        setRecentMembers(membersRes.data || []);
        setPendingMembers(pendingMembersRes.data || []);
        setPendingClaims(pendingClaimsRes.data || []);
        setAnnouncements(announcementsRes.data || []);
      } catch (err: unknown) {
        console.error("Dashboard fetch error:", err);
        const errorResponse = err as {
          response?: { status: number; data?: { message?: string } };
          message?: string;
        };
        if (errorResponse.response?.status === 401) {
          // Handled by interceptor, but we can also handle here
          logout();
          router.push("/admin/login");
        } else if (
          errorResponse.response?.data?.message?.includes(
            "Insufficient permissions",
          ) ||
          errorResponse.message?.includes("Insufficient permissions")
        ) {
          setError(
            "Akses ditolak: Akun Anda tidak memiliki hak akses Administrator.",
          );
        } else {
          setError(
            errorResponse.response?.data?.message ||
              errorResponse.message ||
              "Terjadi kesalahan saat mengambil data.",
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, logout]);

  const user = authUser;

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return recentMembers;
    const query = searchQuery.toLowerCase();
    return recentMembers.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(query) ||
        m.nia?.toLowerCase().includes(query),
    );
  }, [searchQuery, recentMembers]);

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="space-y-2">
                <div className="w-32 h-3 skeleton" />
                <div className="w-24 h-2 skeleton" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl skeleton" />
          </div>
          <div className="w-full h-12 rounded-xl skeleton" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="w-32 h-3 skeleton" />
            <div className="w-16 h-3 skeleton" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>

        <div className="space-y-4">
          <div className="w-32 h-4 skeleton" />
          <div className="space-y-3">
            <MemberItemSkeleton />
            <MemberItemSkeleton />
            <MemberItemSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card text-center space-y-6 border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Terjadi Kesalahan</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("inkai_token");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/admin/login");
              }}
              className="btn-secondary text-sm w-full"
            >
              Logout / Ganti Akun
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full text-sm"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatScopeLabel = (type: "members" | "org") => {
    if (!user) return "...";
    const role = user.roles?.[0];

    if (type === "members") {
      if (role === "ADMIN_DOJO") return user.managedDojoName || "Dojo";
      if (role === "ADMIN_BRANCH") return user.managedBranchName || "Cabang";
      if (role === "ADMIN_PROVINCE")
        return user.managedProvinceName || "Provinsi";
      return "Nasional";
    } else {
      if (role === "ADMIN_DOJO") return "Status Aktif";
      if (role === "ADMIN_BRANCH") return `${stats?.totalDojos || 0} Dojo`;
      if (role === "ADMIN_PROVINCE")
        return `${stats?.totalBranches || 0} Cabang`;
      return `${stats?.totalProvinces || 0} Prov`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-6">
      {/* Header - Simplified as TopBar is now in Layout */}
      <div className="space-y-4">
        <button
          onClick={() => router.push("/admin/members?showAdd=true")}
          className="btn-primary w-full text-sm py-4 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="font-black uppercase tracking-wider">
            Tambah Anggota Baru
          </span>
        </button>
        <button
          onClick={() => router.push("/admin/attendance")}
          className="w-full glass-card p-4 flex items-center justify-between border-amber-500/15 bg-amber-500/[0.04] hover:bg-amber-500/10 active:scale-[0.99] transition-all text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500 border border-amber-500/25 shrink-0">
              <ClipboardCheck size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white uppercase tracking-wide">
                Laporan absensi
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                Cabang & ranting: koreksi waktu, hapus catatan salah
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600 shrink-0" />
        </button>
        <button
          onClick={() => router.push("/admin/billing")}
          className="w-full glass-card p-4 flex items-center justify-between border-amber-500/15 bg-amber-500/[0.04] hover:bg-amber-500/10 active:scale-[0.99] transition-all text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500 border border-amber-500/25 shrink-0">
              <Wallet size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white uppercase tracking-wide">
                Laporan & Verifikasi Iuran
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                Pantau total iuran masuk, tagihan tertunda, dan setujui bukti transfer
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600 shrink-0" />
        </button>
        <button
          onClick={() => {
            if (user?.roles?.[0] === 'ADMIN_DOJO' && user?.managedDojoId) {
              router.push(`/admin/organization?dojoId=${user.managedDojoId}&dojoName=${encodeURIComponent(user.managedDojoName || '')}`);
            } else {
              router.push("/admin/organization");
            }
          }}
          className="w-full glass-card p-4 flex items-center justify-between border-amber-500/15 bg-amber-500/[0.04] hover:bg-amber-500/10 active:scale-[0.99] transition-all text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500 border border-amber-500/25 shrink-0">
              <Map size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white uppercase tracking-wide">
                Kelola Organisasi & Ranting
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                {!user ? 'Mengatur unit wilayah, cabang, dan ranting latihan' :
                 user.roles?.[0] === 'ADMINISTRATOR' || user.roles?.[0] === 'ADMIN_PUSAT' ? 'Mengatur unit wilayah, cabang, dan ranting latihan se-Nasional' :
                 user.roles?.[0] === 'ADMIN_PROVINCE' ? `Mengatur cabang & ranting latihan di ${user.managedProvinceName || 'Provinsi'}` :
                 user.roles?.[0] === 'ADMIN_BRANCH' ? `Mengatur ranting/dojo latihan di ${user.managedBranchName || 'Cabang'}` :
                 `Kelola Ranting / Dojo ${user.managedDojoName || ''}`}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600 shrink-0" />
        </button>
      </div>

      {/* Stats Section with Collapse Toggle */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            Key Performance Indicators
          </h3>
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-[10px] text-amber-500 font-black bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10 uppercase tracking-wider active:scale-90 transition-all"
          >
            {showStats ? "Collapse" : "Expand"}
          </button>
        </div>

        {showStats && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
            <StatCard
              label="Total Anggota"
              value={stats?.totalMembers?.toLocaleString() || "0"}
              subValue={getStatScopeLabel("members")}
              icon={Users}
              trend="up"
              onClick={() => router.push("/admin/members")}
            />
            <StatCard
              label={
                user?.roles?.[0] === "ADMIN_DOJO"
                  ? "Peringkat Dojo"
                  : "Total Dojo"
              }
              value={
                user?.roles?.[0] === "ADMIN_DOJO"
                  ? "#"
                  : stats?.totalDojos?.toLocaleString() || "0"
              }
              subValue={getStatScopeLabel("org")}
              icon={MapPin}
              onClick={() => router.push("/admin/organization")}
            />

            <StatCard
              label="Pending"
              value={stats?.pendingVerifications?.toString() || "0"}
              subValue="Menunggu"
              icon={Clock}
              onClick={() => router.push("/admin/verification")}
            />
          </div>
        )}
      </div>

      {/* Pending Tasks & Verifications */}
      {(pendingMembers.length > 0 || pendingClaims.length > 0) && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-amber-500" />
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                Butuh Perhatian & Verifikasi
              </h3>
            </div>
            <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black">
              {pendingMembers.length + pendingClaims.length} TOTAL
            </span>
          </div>

          <div className="space-y-3">
            {/* Pending Members */}
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                onClick={() =>
                  router.push(
                    `/admin/members?memberId=${member.id}&title=Verifikasi Pendaftaran`,
                  )
                }
                className="glass-card p-4 flex items-center justify-between border-amber-500/10 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">
                      {member.fullName}
                    </h4>
                    <p className="text-[9px] text-amber-500 font-black uppercase tracking-wider mt-0.5">
                      Butuh Aktivasi & NIA
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-600" />
              </div>
            ))}

            {/* Pending Claims */}
            {pendingClaims.slice(0, 5).map((claim) => (
              <div
                key={claim.id}
                onClick={() =>
                  router.push(`/admin/verification?claimId=${claim.id}`)
                }
                className="glass-card p-4 flex items-center justify-between border-blue-500/10 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">
                      {claim.member?.fullName}
                    </h4>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-wider mt-0.5">
                      {verificationTypeLabel(claim.type)}
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Members Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-xl font-black text-white tracking-tight">
            Anggota Terbaru
          </h3>
          <button
            onClick={() => router.push("/admin/members")}
            className="text-[10px] text-amber-500 font-black uppercase tracking-[0.15em] hover:opacity-80 transition-opacity"
          >
            Lihat Semua
          </button>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors">
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder="Cari NIA atau Nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full bg-[#16161a] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-amber-500/30 text-white placeholder:text-gray-600 transition-all shadow-inner"
          />
        </div>

        <div className="space-y-3">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, i) => (
              <div
                key={i}
                onClick={() =>
                  router.push(`/admin/members?memberId=${member.id}`)
                }
                className="glass-card p-4 flex items-center justify-between border-white/5 hover:bg-white/[0.03] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-center border border-amber-500/10 shadow-inner">
                    <span className="text-amber-500 font-black text-lg">
                      {member.fullName?.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white uppercase truncate tracking-wide">
                      {member.fullName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500 font-mono font-bold">
                        {member.nia || "NO NIA"}
                      </span>
                      <span className="text-[10px] text-amber-500 font-black uppercase tracking-wider">
                        {member.currentRank}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      member.status === "Active"
                        ? "bg-green-500/10 text-green-500 border border-green-500/10"
                        : "bg-red-500/10 text-red-500 border border-red-500/10"
                    }`}
                  >
                    {member.status}
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
                    {member.dojo?.name || "TPI"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-12 text-center border-dashed border-white/5">
              <p className="text-gray-600 text-xs italic font-medium">
                {searchQuery
                  ? "Tidak ada anggota yang cocok dengan pencarian."
                  : "Belum ada aktivitas pendaftaran terbaru."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Announcements Section */}
      <div className="space-y-4 min-w-0 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center px-1 gap-3 min-w-0">
          <h3 className="text-lg font-black text-white tracking-tight min-w-0 flex-1 truncate">Pengumuman</h3>
          <button 
            onClick={() => router.push('/admin/broadcast')}
            className="text-[10px] text-amber-500 font-black uppercase tracking-[0.15em] shrink-0 whitespace-nowrap"
          >
            Buat Baru
          </button>
        </div>
        <div className="grid gap-3 min-w-0">
          {announcements.length > 0 ? (
            announcements.slice(0, 3).map((news, i) => (
              <div
                key={i}
                className="glass-card flex w-full max-w-full min-w-0 items-center gap-3 sm:gap-4 border-white/5 p-4 hover:bg-white/[0.02] transition-all overflow-hidden"
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-amber-500/50">
                  <MessageSquare size={18} />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex justify-between items-start gap-2 min-w-0">
                    <span className="text-[9px] text-amber-500 uppercase font-black tracking-widest truncate">
                      {news.type || 'BROADCAST'}
                    </span>
                    <span className="text-[9px] text-gray-600 font-bold whitespace-nowrap shrink-0 tabular-nums">
                      {new Date(news.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mt-0.5 uppercase tracking-wide">
                    {news.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                    {news.content}
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-700 shrink-0" />
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center border-dashed border-white/5">
              <p className="text-gray-600 text-xs italic font-medium">Belum ada pengumuman terbaru.</p>
            </div>
          )}
        </div>
      </div>

      {/* Support Card */}
      <div
        onClick={() =>
          window.open(
            "https://wa.me/6281331053100?text=Halo%20Support%20INKAI,%20saya%20butuh%20bantuan%20terkait%20panel%20admin.",
            "_blank",
          )
        }
        className="glass-card bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/10 p-5 cursor-pointer hover:bg-amber-500/20 active:scale-[0.98] transition-all"
      >
        <h3 className="text-base font-bold text-white mb-1">Pusat Bantuan</h3>
        <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">
          Butuh panduan teknis pengelolaan organisasi? Tim support kami siap
          membantu.
        </p>
        <button className="btn-secondary w-full text-xs py-2 pointer-events-none">
          <MessageSquare size={14} />
          Hubungi Support INKAI
        </button>
      </div>
    </div>
  );
}
