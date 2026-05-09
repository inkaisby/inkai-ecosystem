'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  MapPin, 
  Users, 
  Clock, 
  Calendar,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AttendancePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.attendance.getLogs();
        setLogs(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-amber-500 mb-0.5">
            <ClipboardCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Monitoring Latihan</span>
          </div>
          <h2 className="text-xl font-black uppercase text-white leading-tight">Presensi</h2>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">Pantau kehadiran anggota di setiap dojo secara real-time.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-4">
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Kehadiran Hari Ini</p>
          <h4 className="text-2xl font-bold">{logs.length}</h4>
        </div>
        {/* Add more stat cards if needed */}
      </div>

      <div className="glass-card space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Log Aktivitas Terbaru</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Cari anggota..." 
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[300px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0C] z-10 rounded-xl">
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
                  <th className="pb-4 font-medium">Waktu</th>
                  <th className="pb-4 font-medium">Metode</th>
                  <th className="pb-4 text-right pr-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="py-4 pl-2">
                      <p className="font-bold text-white">{log.member?.fullName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{log.member?.nia}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-500" />
                        <span className="text-xs">{log.dojo?.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} />
                        <span className="text-xs">
                          {new Date(log.checkInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full border border-white/10 text-gray-500">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <span className="text-[10px] font-bold uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded">
                        HADIR
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {logs.length === 0 && !loading && (
            <div className="py-20 text-center text-gray-500">
              Belum ada riwayat kehadiran hari ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
