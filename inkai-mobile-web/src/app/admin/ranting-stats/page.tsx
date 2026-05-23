"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronRight, AlertCircle, ArrowLeft, Search } from "lucide-react";
import { api } from "@/lib/api";

interface RantingStat {
  rantingId: string;
  rantingName: string;
  totalMembers: number;
  kyuBreakdown: Record<string, number>;
}

export default function RantingStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<RantingStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRantingIndex, setExpandedRantingIndex] = useState<number | null>(null);

  const [expandedKyu, setExpandedKyu] = useState<string | null>(null);
  const [kyuMembers, setKyuMembers] = useState<any[]>([]);
  const [kyuMembersLoading, setKyuMembersLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRantingKyu, setExpandedRantingKyu] = useState<{ rantingId: string; kyu: string } | null>(null);
  const [rantingKyuMembers, setRantingKyuMembers] = useState<any[]>([]);
  const [rantingKyuMembersLoading, setRantingKyuMembersLoading] = useState(false);

  const kyuTotals = React.useMemo(() => {
    const totals: Record<string, number> = {};
    stats.forEach(ranting => {
      Object.entries(ranting.kyuBreakdown).forEach(([kyu, count]) => {
        totals[kyu] = (totals[kyu] || 0) + count;
      });
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  const sortedStats = React.useMemo(() => {
    return [...stats].sort((a, b) => a.rantingName.localeCompare(b.rantingName));
  }, [stats]);

  const filteredStats = React.useMemo(() => {
    return sortedStats.filter(s => s.rantingName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sortedStats, searchQuery]);

  const totalGlobalMembers = React.useMemo(() => {
    return kyuTotals.reduce((sum, [_, count]) => sum + count, 0);
  }, [kyuTotals]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const res = await api.dashboard.getStats();
        setStats(res.data.rantingStats || []);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Terjadi kesalahan saat mengambil data sebaran anggota.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExpandKyu = async (kyu: string) => {
    if (expandedKyu === kyu) {
      setExpandedKyu(null);
      return;
    }
    setExpandedKyu(kyu);
    setKyuMembersLoading(true);
    try {
      const res = await api.members.getAll({ currentRank: kyu, limit: 1000 });
      setKyuMembers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setKyuMembersLoading(false);
    }
  };

  const handleExpandRantingKyu = async (rantingId: string, kyu: string) => {
    if (expandedRantingKyu?.rantingId === rantingId && expandedRantingKyu?.kyu === kyu) {
      setExpandedRantingKyu(null);
      return;
    }
    setExpandedRantingKyu({ rantingId, kyu });
    setRantingKyuMembersLoading(true);
    try {
      const res = await api.members.getAll({ dojoId: rantingId, currentRank: kyu, limit: 1000 });
      setRantingKyuMembers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRantingKyuMembersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="w-full h-12 rounded-xl skeleton" />
        <div className="w-full h-16 rounded-xl skeleton" />
        <div className="w-full h-16 rounded-xl skeleton" />
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
          <p className="text-gray-400 text-xs">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full text-sm">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8 px-4 sm:px-6 pt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Sebaran Anggota</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Berdasarkan Ranting dan Tingkatan (Kyu)</p>
          </div>
        </div>
        
        {!loading && !error && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center mb-2">
            <p className="text-xs text-amber-500 font-bold tracking-wider">
              TOTAL KESELURUHAN: <span className="text-white text-sm font-black mx-1">{totalGlobalMembers}</span> ANGGOTA DARI <span className="text-white text-sm font-black mx-1">{stats.length}</span> RANTING
            </p>
          </div>
        )}

      <div className="space-y-3">
        {kyuTotals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 mb-3">Total per Tingkatan (Kyu)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {kyuTotals.map(([kyu, count]) => {
                const percentage = totalGlobalMembers > 0 ? Math.round((count / totalGlobalMembers) * 100) : 0;
                return (
                  <button 
                    key={kyu} 
                    onClick={() => handleExpandKyu(kyu)}
                    className={`glass-card p-4 border flex flex-col items-center justify-center text-center active:scale-95 transition-all relative overflow-hidden ${
                      expandedKyu === kyu ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
                    }`}
                  >
                    <div className="absolute bottom-0 left-0 h-1 bg-amber-500/40" style={{ width: `${percentage}%` }}></div>
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">{kyu}</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-black text-white">{count}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">anggota</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {expandedKyu && (
              <div className="mt-4 glass-card p-4 border-amber-500/20 bg-black/40 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">{expandedKyu}</h3>
                  <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full font-bold">
                    {kyuMembers.length} Anggota
                  </span>
                </div>
                
                {kyuMembersLoading ? (
                  <div className="text-center text-xs text-amber-500/70 font-medium italic py-6 animate-pulse">
                    Memuat data anggota...
                  </div>
                ) : kyuMembers.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {kyuMembers.map((m: any) => (
                      <div key={m.id} className="flex justify-between items-center bg-white/[0.03] hover:bg-white/[0.05] rounded-lg p-3 transition-colors">
                        <span className="text-xs text-white font-bold truncate max-w-[60%]">{m.fullName}</span>
                        <span className="text-[9px] text-amber-500/80 font-black uppercase tracking-wider text-right truncate max-w-[40%] bg-amber-500/5 px-2 py-1 rounded">
                          {m.dojo?.name || 'Pusat'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-500 italic py-6">
                    Tidak ada data anggota ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
          <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rincian per Ranting</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cari ranting..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>
        
        {filteredStats.length > 0 ? (
          filteredStats.map((ranting, idx) => {
            const maxInRanting = Math.max(0, ...Object.values(ranting.kyuBreakdown));
            return (
              <div key={idx} className="glass-card border-white/5 bg-white/[0.02] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedRantingIndex(expandedRantingIndex === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
                >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                    <Users size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white uppercase tracking-wide">{ranting.rantingName}</h5>
                    <p className="text-[11px] text-amber-500 font-bold mt-0.5">{ranting.totalMembers} Total Anggota</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  {expandedRantingIndex === idx ? (
                    <ChevronDown size={18} className="text-amber-500" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </div>
              </button>
              {expandedRantingIndex === idx && (
                <div className="p-4 pt-0 border-t border-white/5 bg-black/20">
                      <div className="flex flex-col gap-2 pt-4">
                        {Object.entries(ranting.kyuBreakdown)
                          .sort((a, b) => b[1] - a[1]) // Sort by count descending
                          .map(([kyu, count], kyuIdx) => {
                            const barWidth = maxInRanting > 0 ? Math.round((count / maxInRanting) * 100) : 0;
                            const isKyuExpanded = expandedRantingKyu?.rantingId === ranting.rantingId && expandedRantingKyu?.kyu === kyu;
                            return (
                              <div key={kyuIdx} className="flex flex-col">
                                <button 
                                  onClick={() => handleExpandRantingKyu(ranting.rantingId, kyu)}
                                  className={`flex items-center justify-between bg-black/40 p-3 rounded-lg border hover:bg-black/60 transition-colors relative overflow-hidden ${
                                    isKyuExpanded ? 'border-amber-500/30' : 'border-white/5'
                                  }`}
                                >
                                  <div className="absolute top-0 left-0 h-full bg-amber-500/10" style={{ width: `${barWidth}%` }}></div>
                                  <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                                    <span className="text-xs text-gray-300 font-bold uppercase tracking-wide">{kyu}</span>
                                  </div>
                                  <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/10 shadow-sm relative z-10">
                                    <span className="text-sm text-amber-500 font-black">{count}</span>
                                    <span className="text-[10px] text-amber-500/70 font-black uppercase tracking-wider">&nbsp;ANGGOTA</span>
                                  </div>
                                </button>
                                
                                {isKyuExpanded && (
                                  <div className="mt-2 ml-4 p-3 border-l-2 border-amber-500/30 bg-black/20 rounded-r-lg animate-in fade-in slide-in-from-top-2">
                                    {rantingKyuMembersLoading ? (
                                      <div className="text-[10px] text-amber-500/70 font-medium italic animate-pulse">Memuat...</div>
                                    ) : rantingKyuMembers.length > 0 ? (
                                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                        {rantingKyuMembers.map((m: any) => (
                                          <div key={m.id} className="text-xs text-white/90 font-medium bg-white/5 px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors">
                                            {m.fullName}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-gray-500 italic">Tidak ada data.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white/5 rounded-xl border border-white/5">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold uppercase tracking-wider">Belum ada data ranting</p>
          </div>
        )}
      </div>
    </div>
  );
}
