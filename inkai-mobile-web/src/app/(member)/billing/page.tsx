"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, Loader2, Check, Clock, ShieldAlert, Trash2, ChevronRight, Landmark, QrCode, Banknote } from "lucide-react";
import styles from "./Billing.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { billingApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";

export default function Billing() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [billings, setBillings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('VA');
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, id: '', title: '', message: '' });

  useEffect(() => {
    setMounted(true);
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    try {
      const response = await billingApi.getMyBillings();
      if (response.data.status === 'success') {
        setBillings(response.data.data);
      }
    } catch (error) {
      console.error("Fetch billings error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    const pendingBillings = billings.filter(b => b.status === 'PENDING');
    if (pendingBillings.length === 0) return;

    setIsProcessing(true);
    try {
      // Process each pending billing
      for (const billing of pendingBillings) {
        await billingApi.processPayment({
          billingId: billing.id,
          paymentMethod: selectedMethod
        });
      }
      
      const message = selectedMethod === 'CASH' ? 'Permintaan terkirim. Silakan bayar ke Bendahara Dojo.' : 'Pembayaran Berhasil!';
      setToast({ show: true, message, type: 'success' });
      setShowPaymentModal(false);
      fetchBillings();
    } catch (error: any) {
      setToast({ show: true, message: "Gagal memproses pembayaran: " + (error.response?.data?.message || error.message), type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = (id: string) => {
    setConfirmModal({
      show: true,
      id,
      title: "Batalkan Tagihan?",
      message: "Ini juga akan membatalkan pendaftaran event terkait. Lanjutkan?"
    });
  };

  const handleDelete = async () => {
    const id = confirmModal.id;
    setConfirmModal({ ...confirmModal, show: false });
    
    try {
      await billingApi.deleteBilling(id);
      setToast({ show: true, message: 'Tagihan berhasil dibatalkan', type: 'success' });
      fetchBillings();
    } catch (error: any) {
      setToast({ show: true, message: "Gagal menghapus tagihan: " + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  if (!mounted || isAuthLoading || isLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const totalUnpaid = billings
    .filter(b => b.status === 'PENDING')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const hasWaiting = billings.some(b => b.status === 'WAITING_VERIFICATION');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Pembayaran</h1>
      </header>

      <div className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Total Belum Dibayar</p>
        <h2 className={styles.totalAmount}>
          Rp {new Intl.NumberFormat('id-ID').format(totalUnpaid)}
        </h2>
        <button 
          className={`${styles.payBtn} ${hasWaiting ? styles.waiting : ''}`}
          disabled={totalUnpaid === 0 || hasWaiting || isProcessing}
          onClick={() => setShowPaymentModal(true)}
        >
          {hasWaiting ? "MENUNGGU VERIFIKASI" : "BAYAR SEKARANG"}
        </button>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Riwayat Tagihan</h2>
        <div className={styles.list}>
          {billings.length > 0 ? (
            billings.map((bill) => {
              const isPaid = bill.status === 'PAID';
              const isWaiting = bill.status === 'WAITING_VERIFICATION';
              return (
                <div key={bill.id} className={styles.billItem}>
                  <div className={`${styles.statusIcon} ${isPaid ? styles.paid : isWaiting ? styles.waitingIcon : styles.pending}`}>
                    {isPaid ? <Check size={16} /> : isWaiting ? <ShieldAlert size={16} /> : <Clock size={16} />}
                  </div>
                  <div className={styles.billInfo}>
                    <h3 className={styles.billTitle}>{bill.description || (bill.type === 'MONTHLY_IURAN' ? 'Iuran Bulanan' : 'Biaya Event')}</h3>
                    <p className={`${styles.billMeta} ${isPaid ? styles.metaPaid : isWaiting ? styles.metaWaiting : ''}`}>
                      {isPaid ? `Lunas pada: ${new Date(bill.updatedAt).toLocaleDateString('id-ID')}` : 
                       isWaiting ? "Menunggu Verifikasi" : `Jatuh tempo: ${new Date(bill.dueDate).toLocaleDateString('id-ID')}`}
                    </p>
                  </div>
                  <div className={styles.billRight}>
                    <p className={`${styles.amount} ${isPaid ? styles.amountPaid : ''}`}>
                      Rp {new Intl.NumberFormat('id-ID').format(bill.amount)}
                    </p>
                    {!isPaid && !isWaiting && (
                      <button className={styles.deleteBtn} onClick={() => confirmDelete(bill.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>Tidak ada tagihan.</div>
          )}
        </div>
      </section>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.modalOverlay}
              onClick={() => setShowPaymentModal(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={styles.modal}
            >
              <h3 className={styles.modalTitle}>Konfirmasi Pembayaran</h3>
              <div className={styles.modalSummary}>
                <span>Total Tagihan</span>
                <span className={styles.modalAmount}>Rp {new Intl.NumberFormat('id-ID').format(totalUnpaid)}</span>
              </div>
              
              <p className={styles.methodLabel}>Pilih Metode Pembayaran:</p>
              <div className={styles.methods}>
                {[
                  { id: 'VA', label: 'Virtual Account (Dojo)', icon: <Landmark size={20} /> },
                  { id: 'QRIS', label: 'QRIS / E-Wallet', icon: <QrCode size={20} /> },
                  { id: 'CASH', label: 'Tunai ke Bendahara Dojo', icon: <Banknote size={20} /> },
                ].map(method => (
                  <div 
                    key={method.id} 
                    className={`${styles.methodItem} ${selectedMethod === method.id ? styles.methodSelected : ''}`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className={styles.methodIcon}>{method.icon}</div>
                    <span className={styles.methodText}>{method.label}</span>
                    {selectedMethod === method.id && <Check size={14} className={styles.checkIcon} />}
                  </div>
                ))}
              </div>

              <button 
                className={styles.confirmBtn}
                disabled={isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? <Loader2 className={styles.spinner} size={20} /> : "LANJUTKAN PEMBAYARAN"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ height: '100px' }} />
      <BottomNav />

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

      <ConfirmationModal 
        isVisible={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
        isDangerous={true}
        confirmLabel="HAPUS"
      />
    </div>
  );
}
