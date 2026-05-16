"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Award,
  Trophy,
  Loader2,
  CircleCheck,
  Wallet,
  Landmark,
  QrCode,
  Banknote,
  Check,
  Upload,
  Copy,
  Download,
  X,
} from "lucide-react";
import styles from "./EventDetail.module.css";
import { useRouter } from "next/navigation";
import api, { eventApi, billingApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import { compressImage } from "@/lib/imageUtils";

type EventFeeBillingRow = {
  id: string;
  registrationId?: string | null;
  type?: string;
  status?: string;
  amount?: number;
  baseFeeAmount?: number | null;
  uniqueTail?: number | null;
};

type RegistrationWithBillings = {
  id?: string;
  memberId?: string;
  categoryId?: string | null;
  status?: string;
  category?: { fee?: number; name?: string };
  member?: { billings?: EventFeeBillingRow[] };
};

interface EventCategory {
  id: string;
  name: string;
  fee: number;
}

interface EventDetailData {
  title: string;
  description?: string | null;
  startDate: string;
  registrationCloseAt?: string | null;
  location?: string | null;
  categories?: EventCategory[];
  registrations?: RegistrationWithBillings[];
}

function eventFeeBillingForRegistration(
  reg: RegistrationWithBillings | null,
): EventFeeBillingRow | null {
  const list = reg?.member?.billings;
  if (!Array.isArray(list)) return null;
  return (
    list.find((b) => {
      const t = String(b.type ?? "").toUpperCase().replace(/\s+/g, "_");
      return b.registrationId === reg?.id && t === "EVENT_FEE";
    }) ?? null
  );
}

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [userRegistration, setUserRegistration] = useState<RegistrationWithBillings | null>(null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [registrationNowMs, setRegistrationNowMs] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("VA");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(file);
    if (file && file.type.startsWith("image/")) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview(null);
    }
  };
  const categorySectionRef = useRef<HTMLDivElement>(null);
  /** Fallback jika `GET /events/:id` tidak menyertakan tagihan di `member.billings`. */
  const [feeBillingFromApi, setFeeBillingFromApi] = useState<EventFeeBillingRow | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const syncFeeBillingFromApi = useCallback(
    async (regId: string | null | undefined) => {
      if (!regId || !user) {
        setFeeBillingFromApi(null);
        return;
      }
      try {
        const response = await billingApi.getMyBillings();
        const payload = response.data as { status?: string; data?: unknown[] };
        if (payload?.status !== "success" || !Array.isArray(payload.data)) {
          setFeeBillingFromApi(null);
          return;
        }
        const row = payload.data.find((x) => {
          if (typeof x !== "object" || x === null) return false;
          const b = x as EventFeeBillingRow;
          const t = String(b.type ?? "").toUpperCase().replace(/\s+/g, "_");
          return b.registrationId === regId && t === "EVENT_FEE";
        }) as EventFeeBillingRow | undefined;
        setFeeBillingFromApi(row ?? null);
      } catch {
        setFeeBillingFromApi(null);
      }
    },
    [user],
  );

  const fetchEvent = useCallback(async () => {
    try {
      const response = await eventApi.getEvent(id);
      if (response.data.status === "success") {
        const eventData = response.data.data as EventDetailData;
        setEvent(eventData);

        const memberId = user?.member?.id ?? user?.id;
        if (memberId && eventData.registrations) {
          const reg = eventData.registrations.find(
            (r) => r.memberId === memberId,
          );
          if (reg) {
            setUserRegistration(reg);
            setSelectedCategoryId(reg.categoryId ?? null);
            void syncFeeBillingFromApi(reg.id);
          } else {
            setUserRegistration(null);
            setFeeBillingFromApi(null);
            if (eventData.categories && eventData.categories.length === 1) {
              setSelectedCategoryId(eventData.categories[0].id);
            }
          }
        } else {
          setUserRegistration(null);
          setFeeBillingFromApi(null);
          if (eventData.categories && eventData.categories.length === 1) {
            setSelectedCategoryId(eventData.categories[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Fetch event error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, user, syncFeeBillingFromApi]);

  useEffect(() => {
    const t = globalThis.setTimeout(() => {
      setMounted(true);
      void fetchEvent();
    }, 0);
    return () => globalThis.clearTimeout(t);
  }, [fetchEvent]);

  useEffect(() => {
    const tick = () => setRegistrationNowMs(Date.now());
    tick();
    const interval = window.setInterval(tick, 20_000);
    return () => window.clearInterval(interval);
  }, [id, event?.registrationCloseAt, event?.startDate]);

  const handleRegister = async () => {
    if (!user) return;
    const memberId = user.member?.id ?? user.id;
    if (!memberId) {
      setToast({
        show: true,
        message: "Akun Anda belum punya profil anggota. Lengkapi pendaftaran atau hubungi admin.",
        type: 'error',
      });
      return;
    }
    if (!selectedCategoryId && event?.categories && event.categories.length > 0) {
      setToast({ show: true, message: "Silakan pilih kategori terlebih dahulu.", type: 'error' });
      categorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!event) return;

    setIsRegistering(true);
    try {
      const response = await eventApi.registerEvent({
        eventId: id,
        memberId,
        categoryId: selectedCategoryId || undefined
      });
      
      if (response.data.status === 'success') {
        setToast({ show: true, message: "Pendaftaran Berhasil!", type: 'success' });
        void fetchEvent(); // Refresh data
      }
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } } };
      setToast({ show: true, message: ax.response?.data?.message || "Gagal mendaftar.", type: 'error' });
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePayEventFee = async () => {
    const b =
      eventFeeBillingForRegistration(userRegistration) ?? feeBillingFromApi;
    if (!b?.id) {
      setToast({
        show: true,
        message: "Tagihan tidak ditemukan. Cek menu Pembayaran atau hubungi pengurus.",
        type: "error",
      });
      return;
    }
    if (selectedPaymentMethod === "TRANSFER" && !proofFile) {
      setToast({
        show: true,
        message: "Unggah bukti transfer terlebih dahulu.",
        type: "error",
      });
      return;
    }
    setIsProcessingPayment(true);
    try {
      let proofUrl: string | undefined;
      if (selectedPaymentMethod === "TRANSFER" && proofFile) {
        let file = proofFile;
        if (file.type.startsWith("image/")) {
          try {
            file = await compressImage(file, 900);
          } catch {
            /* pakai asal */
          }
        }
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await api.auth.uploadFile(fd);
        const url =
          uploadRes &&
          typeof uploadRes === "object" &&
          "fileUrl" in uploadRes &&
          typeof (uploadRes as { fileUrl: unknown }).fileUrl === "string"
            ? (uploadRes as { fileUrl: string }).fileUrl
            : "";
        if (!url) throw new Error("Upload gagal.");
        proofUrl = url;
      }

      await billingApi.processPayment({
        billingId: b.id,
        paymentMethod: selectedPaymentMethod,
        ...(proofUrl ? { proofUrl } : {}),
      });
      const msg =
        selectedPaymentMethod === "CASH"
          ? "Permintaan terkirim. Silakan bayar ke Bendahara Dojo."
          : selectedPaymentMethod === "TRANSFER"
            ? "Bukti terkirim. Menunggu verifikasi bendahara."
            : selectedPaymentMethod === "QRIS"
              ? "Pengajuan QRIS terkirim. Bayar tepat nominal di e-wallet, lalu tunggu verifikasi bendahara."
              : "Pembayaran berhasil!";
      setToast({ show: true, message: msg, type: "success" });
      setShowPaymentModal(false);
      setProofFile(null);
      await fetchEvent();
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } }; message?: string };
      setToast({
        show: true,
        message: ax.response?.data?.message || ax.message || "Gagal memproses pembayaran.",
        type: "error",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!mounted || isAuthLoading || isLoading || !event) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const isUKT = event.title?.toUpperCase().includes('UKT') || event.title?.toUpperCase().includes('UJIAN');
  const regNorm = String(userRegistration?.status ?? "").trim().toUpperCase();
  const isPaid = regNorm === "PAID";
  const isApprovedLike = regNorm === "APPROVED" || regNorm === "SUCCESS";
  const isRegistered = !!userRegistration;
  const eventFeeBillingNested = eventFeeBillingForRegistration(userRegistration);
  const eventFeeBilling = eventFeeBillingNested ?? feeBillingFromApi;
  const billNorm = String(eventFeeBilling?.status ?? "").trim().toUpperCase();
  const categoryFee = (() => {
    const fromReg = Number(userRegistration?.category?.fee ?? 0);
    if (fromReg > 0) return fromReg;
    const cid = userRegistration?.categoryId;
    if (cid && event.categories?.length) {
      const c = event.categories.find((cat) => cat.id === cid);
      return Number(c?.fee ?? 0);
    }
    return 0;
  })();
  /** Fallback: beberapa pendaftaran backend tidak membawa categoryId/join category — satu kategori di event. */
  const inferredParticipantFee =
    categoryFee > 0
      ? categoryFee
      : event.categories?.length === 1
        ? Number(event.categories[0]?.fee ?? 0)
        : 0;

  /** Agenda menyebut kategori dengan biaya > 0 (meski keanggotaan kita tidak terhubungkan ke salah satu cabangnya). */
  const eventMayRequireFee = (event.categories ?? []).some(
    (c) => Number(c?.fee ?? 0) > 0,
  );

  const effectiveFeeSignal =
    inferredParticipantFee > 0 ||
    Number(eventFeeBilling?.amount ?? 0) > 0 ||
    (eventMayRequireFee && !eventFeeBilling);

  const isPendingMember = isRegistered && regNorm === "PENDING";
  const isRejected = regNorm === "REJECTED";
  const waitingPaymentVerify =
    isApprovedLike &&
    !isPaid &&
    billNorm === "WAITING_VERIFICATION";
  const needsPayRegistrationFee =
    isApprovedLike &&
    !isPaid &&
    billNorm === "PENDING" &&
    (Number(eventFeeBilling?.amount ?? 0) > 0 ||
      categoryFee > 0 ||
      inferredParticipantFee > 0 ||
      eventMayRequireFee);

  /** Footer + kartu pembayaran: ada tagihan/pembelian biaya mandiri yang belum selesai. */
  const showStickyPayCta =
    isRegistered &&
    isApprovedLike &&
    !isPaid &&
    !waitingPaymentVerify &&
    !isPendingMember &&
    !isRejected &&
    effectiveFeeSignal &&
    (!eventFeeBilling || billNorm === "PENDING");

  const effectiveRegistrationClose = event.registrationCloseAt
    ? new Date(event.registrationCloseAt)
    : new Date(event.startDate);
  const isSelfRegistrationClosed =
    registrationNowMs !== null &&
    registrationNowMs > effectiveRegistrationClose.getTime();
  const blockSelfRegister =
    isSelfRegistrationClosed && !isRegistered;

  const registrationFooterLabel = isPaid
    ? "SUDAH TERDAFTAR (LUNAS)"
    : waitingPaymentVerify
      ? "MENUNGGU VERIFIKASI PEMBAYARAN"
      : needsPayRegistrationFee
        ? "BAYAR BIAYA PENDAFTARAN"
        : showStickyPayCta
          ? "KONFIRMASI PEMBAYARAN & UPLOAD"
          : regNorm === "REJECTED"
          ? "PENDAFTARAN DITOLAK"
          : isApprovedLike
            ? (inferredParticipantFee > 0 || eventMayRequireFee) && !eventFeeBilling
              ? "SUDAH TERDAFTAR (DISETUJUI) — CEK MENU PEMBAYARAN"
              : "SUDAH TERDAFTAR (DISETUJUI)"
            : isRegistered
              ? "SUDAH TERDAFTAR (PENDING)"
              : blockSelfRegister
                ? "PENDAFTARAN DITUTUP"
                : "DAFTAR SEKARANG";

  const canTapFooter =
    !isRegistering &&
    !isProcessingPayment &&
    !isPaid &&
    !waitingPaymentVerify &&
    !isPendingMember &&
    !isRejected &&
    ((!isRegistered && !blockSelfRegister) || showStickyPayCta);

  const footerMutedRegistered =
    isPaid ||
    (isRegistered &&
      !showStickyPayCta &&
      !waitingPaymentVerify &&
      !needsPayRegistrationFee);

  const footerBtnClass = `${styles.registerBtn} ${
    footerMutedRegistered ? styles.registered : ""
  } ${showStickyPayCta ? styles.payReady : ""} ${
    waitingPaymentVerify ? styles.waitingVerify : ""
  }`;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.heroContent}>
          <div className={styles.heroIconWrapper}>
            {isUKT ? <Award size={64} className={styles.heroIcon} /> : <Trophy size={64} className={styles.heroIcon} />}
          </div>
          <h1 className={styles.title}>{event.title}</h1>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <Calendar size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Waktu mulai</p>
              <p className={styles.infoValue}>
                {new Date(event.startDate).toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
          <div className={styles.infoRow}>
            <Calendar size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Batas pendaftaran mandiri</p>
              <p className={styles.infoValue}>
                {event.registrationCloseAt
                  ? new Date(event.registrationCloseAt).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })
                  : `Sama dengan waktu mulai (${new Date(event.startDate).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })})`}
              </p>
            </div>
          </div>
          <div className={styles.infoRow}>
            <MapPin size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Lokasi</p>
              <p className={styles.infoValue}>{event.location || 'Indonesia'}</p>
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Deskripsi Kegiatan</h2>
          <p className={styles.description}>
            {event.description || 'Tidak ada deskripsi tersedia untuk kegiatan ini.'}
          </p>
        </section>

        {isRegistered &&
        isApprovedLike &&
        !isPaid &&
        !isRejected ? (
          <>
            {waitingPaymentVerify ? (
              <section className={styles.section} aria-live="polite">
                <div className={styles.paymentWaitingBox}>
                  <p className={styles.paymentWaitingTitle}>Menunggu verifikasi</p>
                  <p>
                    Bendahara sedang meninjau pembayaran Anda. Nominal harus sama dengan tagihan resmi.
                  </p>
                  {eventFeeBilling?.amount != null ? (
                    <span className={styles.paymentWaitingAmount}>
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        Number(eventFeeBilling.amount),
                      )}
                    </span>
                  ) : null}
                </div>
              </section>
            ) : null}

            {needsPayRegistrationFee && eventFeeBilling ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Pembayaran</h2>
                <div className={styles.paymentCard}>
                  <p className={styles.paymentCardTitle}>Nominal yang harus dibayar</p>
                  <p className={styles.paymentCardAmount}>
                    Rp{" "}
                    {new Intl.NumberFormat("id-ID").format(
                      Number(eventFeeBilling.amount),
                    )}
                  </p>
                  {typeof eventFeeBilling.baseFeeAmount === "number" &&
                  typeof eventFeeBilling.uniqueTail === "number" ? (
                    <p className={styles.paymentCardHint}>
                      Biaya kategori Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        Math.round(eventFeeBilling.baseFeeAmount),
                      )}{" "}
                      + kode unik Rp {eventFeeBilling.uniqueTail}. Gunakan nominal persis
                      ini untuk transfer, tunai, atau QRIS.
                    </p>
                  ) : (
                    <p className={styles.paymentCardHint}>
                      Gunakan nominal di atas. Untuk upload bukti, pilih metode Transfer
                      pada langkah berikutnya.
                    </p>
                  )}
                  <button
                    type="button"
                    className={styles.paymentCardBtn}
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Wallet size={18} aria-hidden />
                    Lanjutkan pembayaran
                  </button>
                  <button
                    type="button"
                    className={`${styles.paymentCardBtn} ${styles.paymentCardBtnSecondary}`}
                    onClick={() => router.push("/billing")}
                  >
                    Buka halaman Pembayaran
                  </button>
                </div>
              </section>
            ) : null}

            {!needsPayRegistrationFee &&
            !waitingPaymentVerify &&
            !eventFeeBilling &&
            (inferredParticipantFee > 0 || eventMayRequireFee) ? (
              <section className={styles.section}>
                <div className={styles.paymentPendingBox}>
                  <p className={styles.paymentPendingTitle}>Tagihan belum tersedia</p>
                  <p>
                    {inferredParticipantFee > 0 ? (
                      <>
                        Untuk peserta Anda, biaya kategori sekitar{" "}
                        <strong className={styles.paymentPendingGold}>
                          Rp {new Intl.NumberFormat("id-ID").format(inferredParticipantFee)}
                        </strong>
                        . Tagihan resmi (nominal tepat dengan kode unik) ada di aplikasi —
                        buka menu{" "}
                        <strong className={styles.paymentPendingGold}>Pembayaran</strong>.
                      </>
                    ) : (
                      <>
                        Agenda ini memiliki{" "}
                        <strong className={styles.paymentPendingGold}>
                          biaya kategori peserta
                        </strong>
                        . Buka menu{" "}
                        <strong className={styles.paymentPendingGold}>Pembayaran</strong> untuk
                        melihat tagihan Anda (konfirmasi & upload bukti dari sana atau di sini
                        ketika tagihan sudah muncul).
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    className={`${styles.paymentCardBtn} ${styles.paymentCardBtnSecondary} ${styles.paymentCardSpaced}`}
                    onClick={() => router.push("/billing")}
                  >
                    Ke menu Pembayaran
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {event.categories && event.categories.length > 0 && (
          <section className={styles.section} ref={categorySectionRef}>
            <h2 className={styles.sectionTitle}>{isUKT ? 'Ujian Kenaikan Sabuk' : 'Kategori Lomba'}</h2>
            <div className={styles.categoryList}>
              {event.categories
                .filter((cat: { id: string }) => {
                  if (!isRegistered) return true;
                  const cid = userRegistration.categoryId;
                  if (cid) return cat.id === cid;
                  /** Kategori tidak tercantum pada pendaftaran — tetap tampilkan daftar dari agenda agar ada nominal. */
                  return true;
                })
                .map((cat: { id: string; name: string; fee: number }) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <div 
                      key={cat.id} 
                      className={`${styles.categoryItem} ${isSelected ? styles.selected : ''} ${isRegistered ? styles.disabled : ''}`}
                      onClick={() => !isRegistered && setSelectedCategoryId(cat.id)}
                    >
                      <span className={styles.catName}>{cat.name}</span>
                      <span className={styles.catFee}>
                        Rp {new Intl.NumberFormat('id-ID').format(cat.fee)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={footerBtnClass}
          disabled={!canTapFooter}
          onClick={() => {
            if (needsPayRegistrationFee && eventFeeBilling?.id) {
              setShowPaymentModal(true);
              return;
            }
            if (needsPayRegistrationFee || showStickyPayCta) {
              router.push("/billing");
              return;
            }
            void handleRegister();
          }}
        >
          {isRegistering ? (
            <Loader2 className={styles.spinner} size={20} />
          ) : isProcessingPayment ? (
            <Loader2 className={styles.spinner} size={20} />
          ) : isPaid ? (
            <>
              <CircleCheck size={20} /> {registrationFooterLabel}
            </>
          ) : needsPayRegistrationFee ? (
            <>
              <Wallet size={20} /> {registrationFooterLabel}
            </>
          ) : showStickyPayCta ? (
            <>
              <Wallet size={20} /> {registrationFooterLabel}
            </>
          ) : waitingPaymentVerify || isPendingMember ? (
            <>
              <CircleCheck size={20} /> {registrationFooterLabel}
            </>
          ) : isApprovedLike && !showStickyPayCta ? (
            <>
              <CircleCheck size={20} /> {registrationFooterLabel}
            </>
          ) : (
            registrationFooterLabel
          )}
        </button>
      </footer>

      <AnimatePresence>
        {showPaymentModal && needsPayRegistrationFee && eventFeeBilling && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.modalOverlay}
              onClick={() => {
                if (!isProcessingPayment) {
                  setShowPaymentModal(false);
                  setProofFile(null);
                }
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={styles.modalSheet}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Konfirmasi pembayaran</h3>
              <div className={styles.modalSummary}>
                <span>Nominal tagihan</span>
                <div className={styles.modalAmountGroup}>
                  <span className={styles.modalAmount}>
                    Rp{" "}
                    {new Intl.NumberFormat("id-ID").format(
                      Number(eventFeeBilling.amount),
                    )}
                  </span>
                  <button 
                    className={styles.copyBtn} 
                    onClick={() => handleCopy(Math.round(Number(eventFeeBilling.amount)).toString(), "amount")}
                    title="Salin nominal"
                  >
                    {copiedKey === "amount" ? <Check size={14} className={styles.copyIconCheck} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <p className={styles.methodLabel}>Pilih metode pembayaran</p>
              <div className={styles.methods}>
                {[
                  { id: "VA", label: "Virtual Account (Dojo)", icon: <Landmark size={20} /> },
                  { id: "QRIS", label: "QRIS / E-Wallet", icon: <QrCode size={20} /> },
                  { id: "TRANSFER", label: "Transfer bank / e-wallet (upload bukti)", icon: <Upload size={20} /> },
                  { id: "CASH", label: "Tunai ke Bendahara Dojo", icon: <Banknote size={20} /> },
                ].map((method) => (
                  <div
                    key={method.id}
                    role="button"
                    tabIndex={0}
                    className={`${styles.methodItem} ${selectedPaymentMethod === method.id ? styles.methodSelected : ""}`}
                    onClick={() => {
                      setSelectedPaymentMethod(method.id);
                      if (method.id !== "TRANSFER") setProofFile(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedPaymentMethod(method.id);
                      }
                    }}
                  >
                    <div className={styles.methodIcon}>{method.icon}</div>
                    <span className={styles.methodText}>{method.label}</span>
                    {selectedPaymentMethod === method.id && (
                      <Check size={14} className={styles.checkIcon} />
                    )}
                  </div>
                ))}
              </div>

               {selectedPaymentMethod === "VA" && (
                <div className={styles.vaPanel}>
                  <div className={styles.vaInfoBox}>
                    <div className={styles.vaIconWrapper}>
                      <Landmark size={32} />
                    </div>
                    <h4 className={styles.vaTitle}>Virtual Account Dojo</h4>
                    <p className={styles.vaDescription}>
                      Fitur Virtual Account otomatis akan tersedia setelah integrasi Payment Gateway selesai.
                    </p>
                    <div className={styles.vaNote}>
                      <p>Untuk saat ini, silakan gunakan metode <strong>Transfer</strong> atau <strong>QRIS</strong> untuk konfirmasi instan, atau pilih <strong>Tunai</strong> untuk lapor ke Bendahara Dojo.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === "QRIS" && (
                <div className={styles.qrisPanel}>
                  <div className={styles.qrisExactAmountGroup}>
                    <p className={styles.qrisExactAmount}>
                      Bayar tepat: Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        Number(eventFeeBilling.amount),
                      )}
                    </p>
                    <button 
                      className={styles.copyBtn} 
                      onClick={() => handleCopy(Math.round(Number(eventFeeBilling.amount)).toString(), "amount")}
                      title="Salin nominal"
                    >
                      {copiedKey === "amount" ? <Check size={14} className={styles.copyIconCheck} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className={styles.qrisImageWrapper}>
                    <Image
                      src="/payments/qris-static.png"
                      alt="QRIS INKAI STORES — satukan pembayaran"
                      width={320}
                      height={320}
                      className={styles.qrisImage}
                      priority
                      sizes="(max-width: 500px) 90vw, 280px"
                    />
                    <a 
                      href="/payments/qris-static.png" 
                      download="QRIS-INKAI.png" 
                      className={styles.downloadBtn}
                    >
                      <Download size={16} />
                      <span>Simpan QRIS</span>
                    </a>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === "TRANSFER" && (
                <div className={styles.transferPanel}>
                  <div className={styles.bankCard}>
                    <p className={styles.bankLabel}>Transfer ke Rekening Bendahara:</p>
                    <div className={styles.bankInfo}>
                      <div className={styles.bankMain}>
                        <div className={styles.bankHeader}>
                          <span className={styles.bankName}>Mandiri</span>
                        </div>
                        <div className={styles.accountNumberGroup}>
                          <span className={styles.accountNumber}>1400024546344</span>
                          <button 
                            className={styles.copyBtn} 
                            onClick={() => handleCopy("1400024546344", "account")}
                            title="Salin nomor rekening"
                          >
                            {copiedKey === "account" ? <Check size={14} className={styles.copyIconCheck} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <span className={styles.accountName}>a/n Habibur Rahman</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`${styles.proofUpload} ${isDragging ? styles.proofUploadActive : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFileChange(f);
                    }}
                  >
                    <label className={styles.proofLabel}>Bukti pembayaran (wajib)</label>
                    
                    {!proofFile ? (
                      <div className={styles.dropZone} onClick={() => document.getElementById("event-pay-proof")?.click()}>
                        <Upload size={24} className={styles.dropIcon} />
                        <p className={styles.dropText}>Pilih file atau tarik ke sini</p>
                        <p className={styles.dropSubtext}>PNG, JPG atau PDF (Maks. 5MB)</p>
                      </div>
                    ) : (
                      <div className={styles.previewCard}>
                        {proofPreview ? (
                          <div className={styles.previewImageWrapper}>
                            <img src={proofPreview} alt="Preview" className={styles.previewImage} />
                          </div>
                        ) : (
                          <div className={styles.fileIconWrapper}>
                            <Upload size={24} />
                            <span className={styles.fileName}>{proofFile.name}</span>
                          </div>
                        )}
                        <button 
                          className={styles.removeProofBtn} 
                          onClick={() => handleFileChange(null)}
                          type="button"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    <input
                      id="event-pay-proof"
                      type="file"
                      className={styles.proofInput}
                      accept="image/*,.pdf,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        handleFileChange(f ?? null);
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                className={styles.confirmBtn}
                disabled={isProcessingPayment}
                onClick={() => void handlePayEventFee()}
              >
                {isProcessingPayment ? (
                  <Loader2 className={styles.spinner} size={20} />
                ) : (
                  "LANJUTKAN PEMBAYARAN"
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
