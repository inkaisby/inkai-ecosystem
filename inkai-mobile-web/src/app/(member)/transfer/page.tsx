"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, CheckCircle2, Circle, Loader2, Send, MapPin, Info } from "lucide-react";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export default function Transfer() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [dojos, setDojos] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDojo, setSelectedDojo] = useState("");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const hasPending = history.some(item => item.status === 'PENDING');

  useEffect(() => {
    setMounted(true);
    fetchProvinces();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await api.verifications.getMy();
      setHistory(data.data || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchProvinces = async () => {
    try {
      const data = await api.org.getProvinces();
      setProvinces(data.data || []);
    } catch (err) {
      console.error("Failed to fetch provinces", err);
    }
  };

  const fetchBranches = async (provinceId: string) => {
    try {
      const data = await api.org.getBranches(provinceId);
      setBranches(data.data || []);
      setSelectedBranch("");
      setDojos([]);
      setSelectedDojo("");
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  const fetchDojos = async (branchId: string) => {
    try {
      const data = await api.org.getDojos(branchId);
      setDojos(data.data || []);
      setSelectedDojo("");
    } catch (err) {
      console.error("Failed to fetch dojos", err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDojo) {
      toast.error("Silakan pilih Dojo tujuan");
      return;
    }
    if (!reason.trim()) {
      toast.error("Silakan tuliskan alasan kepindahan");
      return;
    }

    setIsLoading(true);
    try {
      await api.verifications.claim({
        type: "DOJO_TRANSFER",
        data: JSON.stringify({
          targetDojoId: selectedDojo,
          reason: reason
        }),
        proofUrl: "PENDING_DOCUMENT"
      });
      toast.success("Pengajuan pindah dojo berhasil dikirim!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  const currentDojo = user.dojo?.name || "Dojo Belum Terdaftar";
  const currentBranch = user.dojo?.branch?.name || "-";

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-x-hidden pb-32">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="px-6 pt-10 pb-6 flex items-center gap-6 z-10 sticky top-0 bg-[#050505]/80 backdrop-blur-md">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">PENGAJUAN PINDAH DOJO</h1>
      </header>

      <main className="px-6 space-y-10 z-10">
        {/* Current Data Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-glass inner-glow p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <MapPin size={80} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4 block">DATA SAAT INI</span>
          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase text-white">{currentDojo}</h2>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">{currentBranch}</p>
          </div>
        </motion.section>

        {/* Form Section */}
        <section className="space-y-6">
          <button 
            className="w-full flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5 group hover:bg-white/[0.08] transition-all"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Send size={18} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white">FORM PENGAJUAN PINDAH</h2>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-gray-600 transition-transform duration-300 ${isFormOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          <AnimatePresence>
            {isFormOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="premium-glass inner-glow p-8 rounded-[2.5rem] border-white/5 space-y-8">
                  {/* Province Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">WILAYAH TUJUAN</label>
                    <div className="relative group">
                      <select 
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 appearance-none transition-all"
                        value={selectedProvince}
                        onChange={(e) => {
                          setSelectedProvince(e.target.value);
                          fetchBranches(e.target.value);
                        }}
                      >
                        <option value="" className="bg-[#1a1a1f]">-- Pilih Wilayah --</option>
                        {provinces.map(p => (
                          <option key={p.id} value={p.id} className="bg-[#1a1a1f]">{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Branch Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">CABANG TUJUAN</label>
                    <div className="relative group">
                      <select 
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 appearance-none transition-all disabled:opacity-30"
                        value={selectedBranch}
                        disabled={!selectedProvince}
                        onChange={(e) => {
                          setSelectedBranch(e.target.value);
                          fetchDojos(e.target.value);
                        }}
                      >
                        <option value="" className="bg-[#1a1a1f]">-- Pilih Cabang --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id} className="bg-[#1a1a1f]">{b.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Dojo Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">DOJO TUJUAN</label>
                    <div className="relative group">
                      <select 
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 appearance-none transition-all disabled:opacity-30"
                        value={selectedDojo}
                        disabled={!selectedBranch}
                        onChange={(e) => setSelectedDojo(e.target.value)}
                      >
                        <option value="" className="bg-[#1a1a1f]">-- Pilih Dojo --</option>
                        {dojos.map(d => (
                          <option key={d.id} value={d.id} className="bg-[#1a1a1f]">{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Reason Textarea */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">ALASAN KEPINDAHAN</label>
                    <textarea 
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all min-h-[120px] placeholder:text-gray-700"
                      placeholder="Tuliskan alasan Anda pindah..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {hasPending && (
                    <div className="p-4 bg-amber-500/10 rounded-2xl flex gap-3 items-center">
                      <Info size={16} className="text-amber-500 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider leading-relaxed">
                        Pengajuan Anda sedang diproses. Silakan tunggu hingga selesai.
                      </p>
                    </div>
                  )}

                  <button 
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center justify-center gap-3"
                    onClick={handleSubmit}
                    disabled={isLoading || !selectedDojo || !reason.trim() || hasPending}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Send size={18} />
                        {hasPending ? 'PENGAJUAN DIPROSES' : 'KIRIM PENGAJUAN'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Alur Verifikasi */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 ml-1">ALUR VERIFIKASI</h2>
          <div className="premium-glass inner-glow p-8 rounded-[2.5rem] border-white/5 space-y-6">
            {[
              { label: 'Diajukan oleh Anggota', active: true },
              { label: 'Persetujuan Dojo Asal', active: false },
              { label: 'Verifikasi Cabang', active: false },
              { label: 'Update Otomatis NIA', active: false }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step.active ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-white/10 text-gray-600'}`}>
                  {step.active ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${step.active ? 'text-white' : 'text-gray-600'}`}>
                  {i + 1}. {step.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* History Section */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 ml-1">RIWAYAT PENGAJUAN</h2>
          {history.length === 0 ? (
            <div className="premium-glass inner-glow p-10 rounded-[2.5rem] text-center text-[10px] font-black uppercase tracking-widest text-gray-600 border-dashed border-white/10">
              Belum ada riwayat pengajuan
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                let details = "-";
                try {
                  const parsedData = JSON.parse(item.data);
                  details = parsedData.reason || "-";
                } catch (e) {
                  details = item.data;
                }

                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-glass inner-glow p-6 rounded-[2rem] border-white/5 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{item.type.replace('_', ' ')}</span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${
                        item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 
                        item.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {item.status === 'PENDING' ? 'MENUNGGU' : item.status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs font-bold text-white leading-relaxed uppercase tracking-wider">
                        {details}
                      </div>
                    </div>
                    {item.adminNotes && (
                      <div className="p-4 bg-white/[0.02] border-l-2 border-amber-500 rounded-r-xl">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Catatan Admin:</p>
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{item.adminNotes}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
