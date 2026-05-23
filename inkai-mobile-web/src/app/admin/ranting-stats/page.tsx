"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

interface RantingStat {
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
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Sebaran Anggota</h1>
          <p className="text-xs text-gray-500 font-medium">Berdasarkan Ranting dan Tingkatan (Kyu)</p>
        </div>
      </div>

      <div className="space-y-3">
        {stats.length > 0 ? (
          stats.map((ranting, idx) => (
            <div key={idx} className="glass-card border-white/5 bg-white/[0.02] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedRantingIndex(expandedRantingIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left active:bg-white/[0.02] transition-colors"
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
                  <div className="flex flex-col gap-2.5 mt-4">
                    {Object.entries(ranting.kyuBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([kyu, count]) => (
                      <div key={kyu} className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                          <span className="text-xs text-gray-300 font-bold uppercase tracking-wide">{kyu}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/10 shadow-sm">
                          <span className="text-sm text-amber-500 font-black">{count}</span>
                          <span className="text-[10px] text-amber-500/70 font-black uppercase tracking-wider">anggota</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center border-dashed border-white/5">
            <p className="text-gray-600 text-xs italic font-medium">Belum ada data ranting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
