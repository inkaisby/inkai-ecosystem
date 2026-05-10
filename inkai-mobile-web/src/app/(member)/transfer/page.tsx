"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, CheckCircle2, Circle, Loader2, Send } from "lucide-react";
import styles from "./Transfer.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
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
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const currentDojo = user.dojo?.name || "Dojo Belum Terdaftar";
  const currentBranch = user.dojo?.branch?.name || "-";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>PENGAJUAN PINDAH DOJO</h1>
      </header>

      <main className={styles.content}>
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.infoBox}
        >
          <span className={styles.infoLabel}>DATA SAAT INI</span>
          <div className={styles.infoValue}>
            {currentDojo}<br/>
            {currentBranch}
          </div>
        </motion.section>

        <section className={styles.formSection}>
          <button 
            className={styles.sectionToggle} 
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            <h2 className={styles.sectionHeading} style={{ margin: 0 }}>TUJUAN PINDAH:</h2>
            <ChevronDown 
              size={20} 
              className={styles.toggleIcon} 
              style={{ transform: isFormOpen ? 'rotate(180deg)' : 'rotate(0)' }}
            />
          </button>
          
          <motion.div
            initial={false}
            animate={{ 
              height: isFormOpen ? 'auto' : 0,
              opacity: isFormOpen ? 1 : 0,
              marginTop: isFormOpen ? 20 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Pilih Wilayah Tujuan:</label>
              <div className={styles.selectWrapper}>
                <select 
                  className={styles.select}
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    fetchBranches(e.target.value);
                  }}
                >
                  <option value="">-- Pilih Wilayah --</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className={styles.selectIcon} size={16} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Pilih Cabang Tujuan:</label>
              <div className={styles.selectWrapper}>
                <select 
                  className={styles.select}
                  value={selectedBranch}
                  disabled={!selectedProvince}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    fetchDojos(e.target.value);
                  }}
                >
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown className={styles.selectIcon} size={16} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Pilih Dojo Tujuan:</label>
              <div className={styles.selectWrapper}>
                <select 
                  className={styles.select}
                  value={selectedDojo}
                  disabled={!selectedBranch}
                  onChange={(e) => setSelectedDojo(e.target.value)}
                >
                  <option value="">-- Pilih Dojo --</option>
                  {dojos.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className={styles.selectIcon} size={16} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Alasan Kepindahan:</label>
              <textarea 
                className={styles.textarea}
                placeholder="Tuliskan alasan Anda pindah..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {hasPending && (
              <div className={styles.pendingNotice}>
                Pengajuan Anda sedang diproses. Silakan tunggu hingga selesai sebelum mengajukan kembali.
              </div>
            )}

            <button 
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isLoading || !selectedDojo || !reason.trim() || hasPending}
            >
              {isLoading ? (
                <Loader2 className={styles.spinner} size={20} />
              ) : (
                <>
                  <Send size={18} />
                  {hasPending ? 'PENGAJUAN DIPROSES' : 'KIRIM PENGAJUAN'}
                </>
              )}
            </button>
          </motion.div>
        </section>

        <section className={styles.workflowSection}>
          <h3 className={styles.workflowTitle}>ALUR VERIFIKASI:</h3>
          <div className={styles.workflowList}>
            <div className={styles.workflowItem}>
              <div className={styles.workflowIcon}><CheckCircle2 size={16} color="#10b981" /></div>
              <span className={`${styles.workflowLabel} ${styles.workflowLabelActive}`}>1. Diajukan oleh Anggota</span>
            </div>
            <div className={styles.workflowItem}>
              <div className={styles.workflowIcon}><Circle size={16} color="#666" /></div>
              <span className={styles.workflowLabel}>2. Persetujuan Dojo Asal (PIC)</span>
            </div>
            <div className={styles.workflowItem}>
              <div className={styles.workflowIcon}><Circle size={16} color="#666" /></div>
              <span className={styles.workflowLabel}>3. Verifikasi Cabang (Admin)</span>
            </div>
            <div className={styles.workflowItem}>
              <div className={styles.workflowIcon}><Circle size={16} color="#666" /></div>
              <span className={styles.workflowLabel}>4. Update Otomatis NIA/Dojo</span>
            </div>
          </div>
        </section>

        <section className={styles.historySection}>
          <h3 className={styles.sectionHeading}>RIWAYAT PENGAJUAN:</h3>
          {history.length === 0 ? (
            <div className={styles.emptyHistory}>Belum ada riwayat pengajuan</div>
          ) : (
            <div className={styles.historyList}>
              {history.map((item) => {
                let details = "Memuat data...";
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
                    className={styles.historyCard}
                  >
                    <div className={styles.historyHeader}>
                      <span className={styles.historyType}>{item.type.replace('_', ' ')}</span>
                      <span className={`${styles.historyStatus} ${styles['status' + item.status]}`}>
                        {item.status === 'PENDING' ? 'Menunggu' : item.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </div>
                    <div className={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className={styles.historyDetails}>
                      <strong>Alasan:</strong> {details}
                    </div>
                    {item.adminNotes && (
                      <div className={styles.adminNotes}>
                        <strong>Catatan Admin:</strong> {item.adminNotes}
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
