'use client';

import React, { useState, useEffect } from 'react';
import { 
  Map, 
  ChevronRight, 
  Plus, 
  Building2, 
  MapPin, 
  Users,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function OrganizationPage() {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await api.org.getProvinces();
        setProvinces(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Map size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Struktur Organisasi</span>
          </div>
          <h2 className="text-3xl font-bold">Hierarki Nasional</h2>
          <p className="text-gray-500 mt-1">Pantau persebaran wilayah, cabang, dan dojo INKAI di seluruh Indonesia.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={18} />
          Tambah Wilayah Baru
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={48} />
          <p className="text-gray-500 text-sm">Memuat data organisasi...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 glass-card">
          Error: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {provinces.map((prov) => (
            <div key={prov.id} className="glass-card group hover:bg-white/[0.04] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-bold">
                    {prov.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{prov.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Ketua Pengprov: <span className="text-white">{prov.headName || 'Belum diatur'}</span></p>
                  </div>
                </div>
                <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Building2 size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Cabang</span>
                  </div>
                  <p className="text-lg font-bold">{prov._count?.branches || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MapPin size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Dojo</span>
                  </div>
                  <p className="text-lg font-bold">{prov.branches?.reduce((acc: number, b: any) => acc + (b._count?.dojos || 0), 0) || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Users size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Anggota</span>
                  </div>
                  <p className="text-lg font-bold">{prov.branches?.reduce((acc: number, b: any) => acc + (b.dojos?.reduce((acc2: number, d: any) => acc2 + (d._count?.members || 0), 0) || 0), 0) || 0}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2 text-xs font-bold border border-white/10 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                  Lihat Detail
                  <ChevronRight size={14} />
                </button>
                <button className="flex-1 py-2 text-xs font-bold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  Kelola Cabang
                </button>
              </div>
            </div>
          ))}
          
          {provinces.length === 0 && (
            <div className="col-span-2 py-20 text-center text-gray-500 glass-card">
              Belum ada data wilayah. Silakan tambah wilayah baru.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
