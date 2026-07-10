'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Users, 
  ChevronLeft, 
  Search, 
  UserCheck,
  Loader2,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  MessageSquare,
  Phone,
  MoreVertical,
  UserPlus,
  Square,
  CheckSquare,
  Trash2,
  Receipt,
  Copy,
  ExternalLink,
  Download,
  Filter,
  ArrowUpDown,
  Coins,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getAssetUrl } from '@/lib/api';
import { beltRingVisual } from '@/lib/beltRing';
import toast from 'react-hot-toast';
import AdminModalPortal from '@/components/admin/AdminModalPortal';
import { useAuth } from '@/context/AuthContext';

function isRegistrationApprovedForReport(status: string | undefined): boolean {
  return status === 'APPROVED' || status === 'SUCCESS' || status === 'PAID';
}

/** Cuplikan Kyu/Dan dari `currentRank` untuk laporan WhatsApp ringkas. */
function shortRankLabel(rank: string | null | undefined): string {
  const r = String(rank ?? '').trim();
  if (!r) return '';
  const kyu = r.match(/kyu\s*\d+/i);
  if (kyu) {
    const n = kyu[0].replace(/\s+/g, ' ');
    return n.replace(/^kyu/i, 'Kyu');
  }
  const dan = r.match(/dan\s*\d+/i);
  if (dan) {
    const n = dan[0].replace(/\s+/g, ' ');
    return n.replace(/^dan/i, 'Dan');
  }
  return '';
}

function participantAmountForBranchReport(p: {
  id?: string;
  category?: { fee?: number | null };
  member?: {
    billings?: Array<{
      registrationId?: string | null;
      status?: string;
      amount?: number | null;
      uniqueTail?: number | null;
    }>;
  };
}): number {
  const billing = p.member?.billings?.find((b) => b.registrationId === p.id);
  if (billing?.status === 'PAID' && billing.amount != null) {
    const n = Number(billing.amount);
    return Number.isFinite(n) ? n : 0;
  }
  if (
    billing?.amount != null &&
    (billing.status === 'PENDING' || billing.status === 'WAITING_VERIFICATION')
  ) {
    const n = Number(billing.amount);
    return Number.isFinite(n) ? n : 0;
  }
  const fee = Number(p.category?.fee ?? 0);
  return Number.isFinite(fee) ? fee : 0;
}

const REGISTRAR_ROLES = new Set([
  'ADMINISTRATOR',
  'ADMIN_PUSAT',
  'ADMIN_PROVINCE',
  'ADMIN_BRANCH',
  'ADMIN_DOJO',
]);

function MemberAvatarRing({
  fullName,
  currentRank,
  photoUrl,
  sizeClass = 'w-20 h-20',
  initialClassName,
  ringClassName,
  compact,
  listStripe,
}: {
  fullName?: string;
  currentRank?: string | null;
  photoUrl?: string | null;
  /** Lingkaran (drawer / fallback); tidak dipakai jika listStripe */
  sizeClass?: string;
  initialClassName?: string;
  ringClassName?: string;
  compact?: boolean;
  /** Strip foto kiri setinggi kartu daftar */
  listStripe?: boolean;
}) {
  const ring = beltRingVisual(currentRank);
  const src = photoUrl ? getAssetUrl(photoUrl) : '';
  const initial = fullName?.charAt(0) || '?';

  if (listStripe) {
    return (
      <div
        className="relative h-full min-h-0 w-full overflow-hidden rounded-l-[2rem] bg-neutral-900/95 transition-opacity group-active:opacity-95"
        style={{
          borderLeftWidth: 4,
          borderLeftStyle: 'solid',
          borderLeftColor: ring.bg,
          boxShadow: ring.shadow,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={fullName ? `Foto ${fullName}` : 'Foto peserta'}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="relative flex h-full min-h-[4rem] items-center justify-center text-2xl font-black uppercase text-amber-500">
            {initial}
          </span>
        )}
      </div>
    );
  }

  const padClass = compact ? 'p-[2px]' : 'p-[3px]';
  const initialFallback = compact ? 'text-[10px] leading-none' : 'text-xl';

  return (
    <div
      className={`rounded-full shrink-0 flex-none box-border ${padClass} flex items-center justify-center overflow-hidden ${ringClassName ?? ''}`}
      style={{
        backgroundColor: ring.bg,
        boxShadow: ring.shadow,
        width: compact ? '2rem' : (sizeClass.includes('px') ? undefined : '3.5rem'), // Fallback if no size
        height: compact ? '2rem' : (sizeClass.includes('px') ? undefined : '3.5rem'),
        ...((typeof sizeClass === 'string' && sizeClass.includes('px')) ? { width: sizeClass, height: sizeClass } : {}),
        maxWidth: compact ? '2rem' : undefined,
        maxHeight: compact ? '2rem' : undefined,
      }}
    >
      <div className="w-full h-full max-h-full max-w-full min-w-0 min-h-0 rounded-full overflow-hidden bg-neutral-900/95 flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={fullName ? `Foto ${fullName}` : 'Foto peserta'}
            className="h-full w-full max-h-full max-w-full min-w-0 object-cover"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <span
            className={`text-amber-500 font-black uppercase ${initialClassName ?? initialFallback}`}
          >
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}

/** Helper component to ensure sizes work without Tailwind */
function FixedAvatar({ size = 56, ...props }: any) {
  return (
    <div style={{ width: size, height: size }} className="mx-auto mb-3">
       <MemberAvatarRing {...props} sizeClass={`${size}px`} ringClassName="w-full h-full" />
    </div>
  );
}

export default function EventParticipantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterDojo, setFilterDojo] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [previewDocSize, setPreviewDocSize] = useState<string | null>(null);

  useEffect(() => {
    if (!previewDoc) {
      setPreviewDocSize(null);
      return;
    }
    const controller = new AbortController();
    fetch(getAssetUrl(previewDoc.url), { method: 'HEAD', signal: controller.signal })
      .then((res) => {
        const len = res.headers.get('content-length');
        if (len) {
          const bytes = parseInt(len, 10);
          if (bytes < 1024) setPreviewDocSize(`${bytes} B`);
          else if (bytes < 1024 * 1024) setPreviewDocSize(`${(bytes / 1024).toFixed(1)} KB`);
          else setPreviewDocSize(`${(bytes / (1024 * 1024)).toFixed(1)} MB`);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [previewDoc]);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkMembers, setBulkMembers] = useState<any[]>([]);
  const [bulkMembersLoading, setBulkMembersLoading] = useState(false);
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Record<string, boolean>>({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [registrationUpdatingId, setRegistrationUpdatingId] = useState<string | null>(null);
  const [registrationDeletingId, setRegistrationDeletingId] = useState<string | null>(null);
  const [deleteRegPrompt, setDeleteRegPrompt] = useState<{
    regId: string;
    memberName: string;
  } | null>(null);

  const canBulkRegister = useMemo(() => {
    const roles = user?.roles;
    if (!Array.isArray(roles)) return false;
    return roles.some((r: string) => REGISTRAR_ROLES.has(r));
  }, [user]);

  const showInlineRegistrationActions = useMemo(() => {
    if (event?.registrationsScopedToManagedDojo !== true) return false;
    const roles = user?.roles;
    return Array.isArray(roles) && roles.includes('ADMIN_DOJO');
  }, [event?.registrationsScopedToManagedDojo, user?.roles]);

  const registeredMemberIds = useMemo(
    () => new Set(participants.map((p) => p.memberId).filter(Boolean)),
    [participants],
  );

  const selectedDrawerBilling = useMemo(() => {
    if (!selectedParticipant) return undefined;
    return selectedParticipant.member?.billings?.find(
      (b: { registrationId?: string | null }) => b.registrationId === selectedParticipant.id,
    );
  }, [selectedParticipant]);

  const canVerifyParticipantPayment =
    selectedDrawerBilling?.status === 'WAITING_VERIFICATION';
  const participantPaymentLunas = selectedDrawerBilling?.status === 'PAID';
  const participantPaymentProofUrl =
    selectedDrawerBilling?.payment &&
    typeof selectedDrawerBilling.payment === 'object' &&
    'proofUrl' in selectedDrawerBilling.payment
      ? (selectedDrawerBilling.payment as { proofUrl?: string | null }).proofUrl
      : null;

  const bulkFilteredMembers = useMemo(() => {
    const q = bulkSearch.trim().toLowerCase();
    if (!q) return bulkMembers;
    return bulkMembers.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(q) ||
        m.nia?.toLowerCase().includes(q) ||
        (m.user?.email && String(m.user.email).toLowerCase().includes(q)),
    );
  }, [bulkMembers, bulkSearch]);

  const bulkSelectedCount = useMemo(
    () => Object.entries(bulkSelectedIds).filter(([, v]) => v).length,
    [bulkSelectedIds],
  );

  const selectableBulkMembers = useMemo(
    () => bulkFilteredMembers.filter((m) => !registeredMemberIds.has(m.id)),
    [bulkFilteredMembers, registeredMemberIds],
  );

  const bulkCategoryFeeDisplay = useMemo(() => {
    if (!event?.categories?.length) return 0;
    const c = event.categories.find(
      (cat: { id: string; fee: number }) => cat.id === bulkCategoryId,
    );
    return c?.fee ?? 0;
  }, [event, bulkCategoryId]);

  const fetchBulkMembers = useCallback(async () => {
    if (!canBulkRegister) return;
    setBulkMembersLoading(true);
    try {
      const res = await api.members.getAll({ page: 1, limit: 500, search: '' });
      if (res.status === 'success') setBulkMembers(res.data || []);
    } catch {
      toast.error('Gagal memuat daftar anggota');
    } finally {
      setBulkMembersLoading(false);
    }
  }, [canBulkRegister]);

  const handleOpenBulkModal = useCallback(() => {
    if (!canBulkRegister) return;
    setBulkSearch('');
    setBulkSelectedIds({});
    const cats = event?.categories;
    if (Array.isArray(cats) && cats.length > 0) {
      setBulkCategoryId(String(cats[0].id));
    } else {
      setBulkCategoryId('');
    }
    setBulkModalOpen(true);
    void fetchBulkMembers();
  }, [canBulkRegister, event, fetchBulkMembers]);

  const toggleBulkMember = (memberId: string) => {
    if (registeredMemberIds.has(memberId)) return;
    setBulkSelectedIds((s) => ({ ...s, [memberId]: !s[memberId] }));
  };

  const toggleBulkSelectAllVisible = () => {
    if (selectableBulkMembers.length === 0) return;
    const allOn = selectableBulkMembers.every((m) => bulkSelectedIds[m.id]);
    const next = { ...bulkSelectedIds };
    for (const m of selectableBulkMembers) {
      next[m.id] = !allOn;
    }
    setBulkSelectedIds(next);
  };

  const handleBulkRegisterSubmit = async () => {
    if (!event?.id) return;
    const memberIds = Object.entries(bulkSelectedIds)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (memberIds.length === 0) {
      toast.error('Pilih minimal satu anggota.');
      return;
    }
    if (event.categories?.length > 0 && !bulkCategoryId) {
      toast.error('Pilih kategori — nominal tagihan mengikuti pengaturan cabang pada agenda.');
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await api.events.bulkRegister({
        eventId: event.id,
        memberIds,
        categoryId: event.categories?.length ? bulkCategoryId : undefined,
      });
      if (res.status === 'success') {
        const d = res.data || {};
        const nOk = Array.isArray(d.succeeded) ? d.succeeded.length : 0;
        const dup = Array.isArray(d.skippedAlreadyRegistered) ? d.skippedAlreadyRegistered.length : 0;
        const forb = Array.isArray(d.skippedForbidden) ? d.skippedForbidden.length : 0;
        const miss = Array.isArray(d.skippedNotFound) ? d.skippedNotFound.length : 0;
        if (typeof res.message === 'string') toast.success(res.message);
        else toast.success(nOk > 0 ? `Berhasil mendaftar ${nOk} anggota` : 'Permintaan selesai');
        const skips: string[] = [];
        if (dup) skips.push(`${dup} sudah terdaftar`);
        if (forb) skips.push(`${forb} di luar wilayah`);
        if (miss) skips.push(`${miss} tidak ditemukan`);
        if (skips.length > 0) toast(skips.join(' · '), { duration: 5500 });
        setBulkModalOpen(false);
        await fetchData();
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Gagal pendaftaran massal');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    const eventId = Array.isArray(id) ? id[0] : id;
    if (!eventId || eventId === 'undefined') return;

    setLoading(true);
    try {
      const response = await api.events.getDetail(eventId);
      if (response && response.status === 'success') {
        const eventData = response.data;
        setEvent(eventData);
        setParticipants(eventData.registrations || []);
        
        // Update selected participant if it was open - use ID to avoid dependency loop
        if (selectedParticipant) {
          const updated = eventData.registrations.find((p: any) => p.id === selectedParticipant.id);
          if (updated) {
            // Only update if something actually changed to avoid unnecessary re-renders
            setSelectedParticipant(updated);
          }
        }
      } else {
        toast.error(response?.message || 'Gagal memuat daftar peserta');
      }
    } catch (err: any) {
      console.error('Fetch participants error:', err);
      const msg = err.response?.data?.message || 'Gagal memuat daftar peserta';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id, selectedParticipant?.id]); // Only depend on the ID of selectedParticipant

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleVerifyPayment = async () => {
    if (!selectedParticipant) return;
    
    // Find the billing for this registration
    const billing = selectedParticipant.member?.billings?.find((b: any) => b.registrationId === selectedParticipant.id);
    
    if (!billing) {
      toast.error('Data tagihan tidak ditemukan');
      return;
    }

    if (billing.status === 'PAID') {
      toast.error('Pembayaran sudah terverifikasi');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.billing.verify({ billingId: billing.id });
      if (res.status === 'success') {
        toast.success('Pembayaran berhasil diverifikasi');
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi pembayaran');
    } finally {
      setVerifying(false);
    }
  };

  const handleWhatsAppParticipant = (p: { member?: { user?: { phoneNumber?: string | null } } }) => {
    const phone = p.member?.user?.phoneNumber;
    if (!phone) {
      toast.error('Nomor WhatsApp tidak tersedia');
      return;
    }
    let n = String(phone);
    if (n.startsWith('0')) n = '62' + n.slice(1);
    window.open(`https://wa.me/${n}`, '_blank');
  };

  const handleWhatsApp = () => {
    if (!selectedParticipant) return;
    handleWhatsAppParticipant(selectedParticipant);
  };

  const handleChatParticipant = async (p: { member?: { userId?: string | null } }) => {
    const uid = p.member?.userId;
    if (!uid) {
      toast.error('Pengguna tidak memiliki akun untuk chat');
      return;
    }

    try {
      const res = await api.chat.createConversation(uid);
      if (res.status === 'success') {
        router.push(`/admin/messages/${res.data.id}`);
      }
    } catch {
      toast.error('Gagal memulai chat');
    }
  };

  const handleChat = async () => {
    if (!selectedParticipant) return;
    await handleChatParticipant(selectedParticipant);
  };

  const buildParticipantBranchResume = useCallback(
    (p: any) => {
      const agenda = event?.title?.trim() || 'Agenda';
      const name = String(p.member?.fullName ?? '').trim() || '-';
      const nia = String(p.member?.nia ?? '').trim() || '-';
      const dojo = String(p.member?.dojo?.name ?? '').trim() || '-';
      const branch = String(p.member?.dojo?.branch?.name ?? '').trim() || '-';
      const province = String(p.member?.dojo?.branch?.province?.name ?? '').trim() || '-';
      const cat = String(p.category?.name ?? '').trim() || '-';
      let statusLine = String(p.status ?? '-');
      if (p.status === 'PAID') statusLine = 'Lunas (dibayar)';
      else if (p.status === 'APPROVED' || p.status === 'SUCCESS') statusLine = 'Disetujui';

      return [
        `📋 Laporan peserta disetujui — ${agenda}`,
        `Nama: ${name}`,
        `NIA: ${nia}`,
        `Ranting/Dojo: ${dojo}`,
        `Cabang: ${branch}`,
        `Provinsi: ${province}`,
        `Kategori: ${cat}`,
        `Status pendaftaran: ${statusLine}`,
      ].join('\n');
    },
    [event?.title],
  );

  const handleCopyParticipantResume = useCallback(
    async (p: any) => {
      if (!isRegistrationApprovedForReport(p.status)) return;
      const text = buildParticipantBranchResume(p);
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Ringkasan disalin — tempel di WhatsApp untuk lapor cabang');
      } catch {
        toast.error('Gagal menyalin (izin clipboard?)');
      }
    },
    [buildParticipantBranchResume],
  );

  const handleRegistrationStatusChange = async (
    regId: string,
    currentStatus: string,
    next: string,
  ) => {
    if (next === currentStatus) return;
    setRegistrationUpdatingId(regId);
    try {
      const res = await api.events.updateRegistration(regId, { status: next });
      if (res.status === 'success') {
        toast.success('Status peserta diperbarui');
        await fetchData();
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Gagal mengubah status');
    } finally {
      setRegistrationUpdatingId(null);
    }
  };

  const handleRegistrationCategoryChange = async (
    regId: string,
    memberId: string,
    currentCategoryName: string | null,
    nextRank: string,
  ) => {
    if (nextRank === currentCategoryName) return;
    setRegistrationUpdatingId(regId);
    try {
      // 1. Find matching category in event
      const matchingCategory = event?.categories?.find(
        (cat: any) => cat.name.toUpperCase().trim() === nextRank.toUpperCase().trim()
      );
      
      // 2. Update registration category (if matching exists)
      if (matchingCategory) {
        await api.events.updateRegistration(regId, { categoryId: matchingCategory.id });
      }
      
      // 3. Update member's rank directly to ensure synchronization
      await api.members.update(memberId, { currentRank: nextRank });
      
      toast.success('KYU / DAN Baru peserta diperbarui');
      await fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Gagal mengubah rank');
    } finally {
      setRegistrationUpdatingId(null);
    }
  };

  const openDeleteRegistrationPrompt = (regId: string, memberName: string) => {
    setDeleteRegPrompt({
      regId,
      memberName: (memberName || 'peserta ini').trim() || 'peserta ini',
    });
  };

  const executeDeleteRegistration = async () => {
    if (!deleteRegPrompt) return;
    const { regId } = deleteRegPrompt;
    setRegistrationDeletingId(regId);
    try {
      const res = await api.events.deleteRegistration(regId);
      if (res.status === 'success') {
        toast.success(typeof res.message === 'string' ? res.message : 'Pendaftaran dihapus');
        setSelectedParticipant((prev: { id: string } | null) =>
          prev?.id === regId ? null : prev,
        );
        setDeleteRegPrompt(null);
        await fetchData();
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Gagal menghapus');
    } finally {
      setRegistrationDeletingId(null);
    }
  };

  const uniqueDojos = useMemo(() => {
    const dojos = new Set<string>();
    participants.forEach((p) => {
      const name = p.member?.dojo?.name;
      if (name) dojos.add(name);
    });
    return Array.from(dojos).sort();
  }, [participants]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    participants.forEach((p) => {
      const name = p.category?.name;
      if (name) categories.add(name);
    });
    return Array.from(categories).sort();
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    const filtered = participants.filter((p) => {
      const matchesSearch =
        p.member?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.member?.nia?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'Semua' ||
        (filterStatus === 'Disetujui' &&
          (p.status === 'APPROVED' || p.status === 'SUCCESS' || p.status === 'PAID')) ||
        (filterStatus === 'Pending' && p.status === 'PENDING') ||
        (filterStatus === 'Ditolak' && p.status === 'REJECTED');

      const matchesDojo =
        filterDojo === 'Semua' || p.member?.dojo?.name === filterDojo;

      const matchesCategory =
        filterCategory === 'Semua' || p.category?.name === filterCategory;

      return matchesSearch && matchesStatus && matchesDojo && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = String(a.member?.fullName || '').localeCompare(String(b.member?.fullName || ''), 'id');
      } else if (sortBy === 'dojo') {
        comparison = String(a.member?.dojo?.name || '').localeCompare(String(b.member?.dojo?.name || ''), 'id');
      } else if (sortBy === 'category') {
        comparison = String(a.category?.name || '').localeCompare(String(b.category?.name || ''), 'id');
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'status') {
        comparison = String(a.status || '').localeCompare(String(b.status || ''), 'id');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [participants, searchTerm, filterStatus, filterDojo, filterCategory, sortBy, sortDirection]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const isAllSelected = useMemo(() => {
    if (filteredParticipants.length === 0) return false;
    return filteredParticipants.every((p) => selectedIds[p.id]);
  }, [filteredParticipants, selectedIds]);

  const handleSelectAll = () => {
    const next = { ...selectedIds };
    const allOn = filteredParticipants.every((p) => selectedIds[p.id]);
    filteredParticipants.forEach((p) => {
      next[p.id] = !allOn;
    });
    setSelectedIds(next);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBulkApprove = async () => {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) return;
    setBulkProcessing(true);
    let successCount = 0;
    try {
      for (const regId of ids) {
        const p = participants.find((x) => x.id === regId);
        if (p && p.status !== 'PAID' && p.status !== 'SUCCESS') {
          await api.events.updateRegistration(regId, { status: 'APPROVED' });
          successCount++;
        }
      }
      toast.success(`Berhasil menyetujui ${successCount} peserta`);
      setSelectedIds({});
      await fetchData();
    } catch (err) {
      toast.error('Gagal memperbarui status beberapa peserta');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) return;
    setBulkProcessing(true);
    let successCount = 0;
    try {
      for (const regId of ids) {
        const p = participants.find((x) => x.id === regId);
        if (p && p.status !== 'PAID' && p.status !== 'SUCCESS') {
          await api.events.updateRegistration(regId, { status: 'REJECTED' });
          successCount++;
        }
      }
      toast.success(`Berhasil menolak ${successCount} peserta`);
      setSelectedIds({});
      await fetchData();
    } catch (err) {
      toast.error('Gagal memperbarui status beberapa peserta');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) return;
    if (!window.confirm(`Hapus ${ids.length} pendaftaran terpilih secara permanen?`)) return;
    setBulkProcessing(true);
    let successCount = 0;
    try {
      for (const regId of ids) {
        const p = participants.find((x) => x.id === regId);
        if (p && p.status !== 'PAID' && p.status !== 'SUCCESS') {
          await api.events.deleteRegistration(regId);
          successCount++;
        }
      }
      toast.success(`Berhasil menghapus ${successCount} pendaftaran`);
      setSelectedIds({});
      await fetchData();
    } catch (err) {
      toast.error('Gagal menghapus beberapa pendaftaran');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkVerifyPayment = async () => {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) return;
    setBulkProcessing(true);
    let successCount = 0;
    try {
      for (const regId of ids) {
        const p = participants.find((x) => x.id === regId);
        if (p) {
          const billing = p.member?.billings?.find((b: any) => b.registrationId === p.id);
          if (billing && billing.status === 'WAITING_VERIFICATION') {
            await api.billing.verify({ billingId: billing.id });
            successCount++;
          }
        }
      }
      toast.success(`Berhasil memverifikasi ${successCount} pembayaran`);
      setSelectedIds({});
      await fetchData();
    } catch (err) {
      toast.error('Gagal memverifikasi beberapa pembayaran');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['No', 'Nama Lengkap', 'NIA', 'Dojo/Ranting', 'Kategori', 'Status Pendaftaran', 'Biaya', 'Status Pembayaran', 'Tanggal Daftar'];
    const rows = filteredParticipants.map((p, index) => {
      const billing = p.member?.billings?.find((b: any) => b.registrationId === p.id);
      return [
        index + 1,
        p.member?.fullName || 'Anonim',
        p.member?.nia || '-',
        p.member?.dojo?.name || 'Pusat',
        p.category?.name || '-',
        p.status || '-',
        p.category?.fee || 0,
        billing?.status || 'UNPAID',
        new Date(p.createdAt).toLocaleDateString('id-ID'),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `peserta_event_${event?.title?.toLowerCase().replace(/\s+/g, '_') || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ekspor CSV berhasil diunduh');
  };

  const scopedDojoLabel =
    participants.find((p) => p.member?.dojo?.name)?.member?.dojo?.name ||
    user?.managedDojoName ||
    'dojo Anda';

  const approvedParticipantsForReport = useMemo(() => {
    const rows = participants.filter((p) => isRegistrationApprovedForReport(p.status));
    return [...rows].sort((a, b) =>
      String(a.member?.fullName || '').localeCompare(String(b.member?.fullName || ''), 'id'),
    );
  }, [participants]);

  const buildBranchWhatsAppAggregateReport = useCallback(() => {
    const agenda = event?.title?.trim() || 'Agenda';
    const dojoLine = String(scopedDojoLabel || '').trim() || '-';
    const lines = approvedParticipantsForReport.map((p, i) => {
      const name = String(p.member?.fullName ?? '').trim() || '-';
      const rk = shortRankLabel(p.member?.currentRank);
      const suffix = rk ? ` ${rk}` : '';
      return `${i + 1}. ${name}${suffix}`;
    });
    let total = 0;
    for (const p of approvedParticipantsForReport) {
      total += participantAmountForBranchReport(p);
    }
    const totalFmt = new Intl.NumberFormat('id-ID').format(Math.round(total));
    const body = [
      agenda,
      `Ranting/Dojo: ${dojoLine}`,
      '',
      'Peserta yang terdaftar',
      ...lines,
      '…',
      '',
      `Total pembayaran Rp ${totalFmt}`,
    ].join('\n');
    return body;
  }, [
    approvedParticipantsForReport,
    event?.title,
    scopedDojoLabel,
  ]);

  const handleCopyBranchAggregateReport = useCallback(async () => {
    if (approvedParticipantsForReport.length === 0) {
      toast.error('Belum ada peserta disetujui untuk dilaporkan');
      return;
    }
    const text = buildBranchWhatsAppAggregateReport();
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Laporan cabang disalin — tempel di WhatsApp');
    } catch {
      toast.error('Gagal menyalin (izin clipboard?)');
    }
  }, [
    approvedParticipantsForReport.length,
    buildBranchWhatsAppAggregateReport,
  ]);

  const selfRegisteredParticipants = useMemo(() => {
    const rows = participants.filter(
      (p) =>
        p.registeredByUserId &&
        p.member?.userId &&
        p.registeredByUserId === p.member.userId,
    );
    return [...rows].sort((a, b) =>
      String(a.member?.fullName || '').localeCompare(String(b.member?.fullName || ''), 'id'),
    );
  }, [participants]);

  const kpiStats = useMemo(() => {
    const total = participants.length;
    const disetujuiLunas = participants.filter(
      (p) => p.status === 'APPROVED' || p.status === 'SUCCESS' || p.status === 'PAID'
    ).length;
    const pending = participants.filter((p) => p.status === 'PENDING').length;
    const ditolak = participants.filter((p) => p.status === 'REJECTED').length;

    let totalTagihan = 0;
    let totalTerbayar = 0;

    participants.forEach((p) => {
      const amt = participantAmountForBranchReport(p);
      totalTagihan += amt;

      const isPaid =
        p.status === 'PAID' ||
        p.status === 'SUCCESS' ||
        p.member?.billings?.some(
          (b: any) => b.registrationId === p.id && b.status === 'PAID'
        );
      if (isPaid) {
        totalTerbayar += amt;
      }
    });

    return {
      total,
      disetujuiLunas,
      pending,
      ditolak,
      totalTagihan,
      totalTerbayar,
    };
  }, [participants]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25 text-[9px] font-black uppercase">
            <CheckCircle2 size={10} />
            Lunas
          </div>
        );
      case 'APPROVED':
      case 'SUCCESS':
        return (
          <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 text-[9px] font-black uppercase">
            <CheckCircle2 size={10} />
            Disetujui
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[9px] font-black uppercase">
            <Clock size={10} />
            Pending
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 text-[9px] font-black uppercase">
            <XCircle size={10} />
            Ditolak
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-black uppercase">
            {status}
          </div>
        );
    }
  };

  const selectedCount = useMemo(() => {
    return Object.entries(selectedIds).filter(([, v]) => v).length;
  }, [selectedIds]);

  return (
    <>
      <div className="pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.push('/admin/events')}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all hover:bg-white/10"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 leading-none mb-1">Manajemen Peserta</h1>
            <p className="text-[10px] font-bold text-gray-500 truncate uppercase tracking-widest">{event?.title || 'Loading...'}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all hover:bg-white/10 hover:text-white"
              title="Ekspor CSV"
            >
              <Download size={20} />
            </button>
            {canBulkRegister && (
              <button
                type="button"
                onClick={handleOpenBulkModal}
                className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 active:scale-90 transition-all hover:bg-amber-500/25"
                title="Daftarkan beberapa anggota sekaligus"
              >
                <UserPlus size={20} />
              </button>
            )}
            {showInlineRegistrationActions && approvedParticipantsForReport.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleCopyBranchAggregateReport()}
                className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/35 text-sky-400 active:scale-90 transition-all"
                title="Salin laporan cabang (WhatsApp)"
                aria-label="Salin laporan cabang untuk WhatsApp"
              >
                <Copy size={20} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {/* Expanded KPI Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-[var(--card-dark)] border border-[var(--border-light)] p-4 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 blur-xl" />
            <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider mb-1">Total Peserta</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[var(--text-light)] tracking-tight">{kpiStats.total}</span>
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Orang</span>
            </div>
          </div>

          <div className="bg-[var(--card-dark)] border border-[var(--border-light)] p-4 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full -mr-8 -mt-8 blur-xl" />
            <p className="text-[9px] font-black uppercase text-green-500/60 tracking-wider mb-1">Disetujui/Lunas</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-green-500 tracking-tight">{kpiStats.disetujuiLunas}</span>
              <span className="text-[9px] font-bold text-green-500/40 uppercase">Orang</span>
            </div>
          </div>

          <div className="bg-[var(--card-dark)] border border-[var(--border-light)] p-4 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-8 -mt-8 blur-xl" />
            <p className="text-[9px] font-black uppercase text-amber-500/60 tracking-wider mb-1">Menunggu</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-500 tracking-tight">{kpiStats.pending}</span>
              <span className="text-[9px] font-bold text-amber-500/40 uppercase">Orang</span>
            </div>
          </div>

          <div className="bg-[var(--card-dark)] border border-[var(--border-light)] p-4 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full -mr-8 -mt-8 blur-xl" />
            <p className="text-[9px] font-black uppercase text-red-500/60 tracking-wider mb-1">Ditolak</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-red-500 tracking-tight">{kpiStats.ditolak}</span>
              <span className="text-[9px] font-bold text-red-500/40 uppercase">Orang</span>
            </div>
          </div>

          <div className="bg-[var(--card-dark)] border border-[var(--border-light)] p-4 rounded-2xl shadow-xl relative overflow-hidden group md:col-span-1">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -mr-8 -mt-8 blur-xl" />
            <p className="text-[9px] font-black uppercase text-blue-400/60 tracking-wider mb-1">Total Tagihan</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-blue-400 truncate">Rp {kpiStats.totalTagihan.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="bg-[var(--card-dark)] border border-[var(--border-light)] p-4 rounded-2xl shadow-xl relative overflow-hidden group md:col-span-1">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-8 -mt-8 blur-xl" />
            <p className="text-[9px] font-black uppercase text-emerald-400/60 tracking-wider mb-1">Total Terbayar</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-emerald-400 truncate">Rp {kpiStats.totalTerbayar.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar (Moved under KPI cards and made larger) */}
        <div className="bg-[var(--card-dark)] border border-[var(--border-light)] p-5 rounded-2xl mb-8 space-y-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau NIA..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 transition-all text-white placeholder-gray-500"
              />
            </div>

            {/* Dojo Filter */}
            <div className="relative">
              <select
                value={filterDojo}
                onChange={(e) => setFilterDojo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 transition-all text-gray-300 appearance-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="Semua">Semua Dojo ({uniqueDojos.length})</option>
                {uniqueDojos.map((dojo) => (
                  <option key={dojo} value={dojo}>{dojo}</option>
                ))}
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 transition-all text-gray-300 appearance-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="Semua">Semua Kategori ({uniqueCategories.length})</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 justify-start overflow-x-auto no-scrollbar pt-1">
            {['Semua', 'Pending', 'Disetujui', 'Ditolak'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                  filterStatus === s 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                    : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {event?.registrationsScopedToManagedDojo === true && (
            <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.07] px-4 py-3">
              <p className="text-[11px] font-bold text-[var(--text-light)] leading-snug tracking-tight">
                <span className="font-black text-sky-300">{scopedDojoLabel}</span>
                {selfRegisteredParticipants.length > 0 ? (
                  <>
                    , {selfRegisteredParticipants.length} peserta yang mendaftar mandiri, yaitu:
                    <ol className="mt-2 ml-4 list-decimal space-y-1 font-semibold opacity-95">
                      {selfRegisteredParticipants.map((p) => (
                        <li key={p.id}>{p.member?.fullName ?? '—'}</li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <> — belum ada peserta mandiri dari aplikasi yang tercatat.</>
                )}
              </p>
            </div>
          )}

          {/* Bulk Action Toolbar */}
          <AdminModalPortal>
            <AnimatePresence>
              {selectedCount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--card-dark)] border border-amber-500/30 rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center gap-4 w-[90%] max-w-4xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-black font-black text-xs px-2.5 py-1 rounded-lg">
                      {selectedCount}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--text-light)]">
                      Peserta Terpilih
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-end flex-1 w-full">
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkProcessing}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-green-500 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={handleBulkReject}
                      disabled={bulkProcessing}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={handleBulkVerifyPayment}
                      disabled={bulkProcessing}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      Verifikasi Bayar
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkProcessing}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-red-600 border border-red-500/20 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setSelectedIds({})}
                      disabled={bulkProcessing}
                      className="px-3.5 py-2 bg-white/5 border border-white/10 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                    >
                      Batal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </AdminModalPortal>

          {/* Desktop Table View (lg screens and above) */}
          <div className="hidden lg:block bg-[var(--card-dark)] border border-[var(--border-light)] rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--glass-bg)] border-b border-[var(--border-light)] text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-black">
                    <th className="py-4 px-4 text-center w-12">
                      <button 
                        type="button" 
                        onClick={handleSelectAll} 
                        className="text-gray-400 hover:text-white"
                      >
                        {isAllSelected ? (
                          <CheckSquare size={16} className="text-amber-500" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-2 text-center w-10">No</th>
                    <th className="py-4 px-4 cursor-pointer hover:text-[var(--text-light)]" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">
                        Peserta <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-4 cursor-pointer hover:text-[var(--text-light)]" onClick={() => handleSort('dojo')}>
                      <div className="flex items-center gap-1.5">
                        Dojo / Ranting <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-4 text-left">
                      KYU / DAN Lama
                    </th>
                    <th className="py-4 px-4 text-left w-48">
                      KYU / DAN Baru
                    </th>
                    <th className="py-4 px-4 text-center w-36">Dokumen</th>
                    <th className="py-4 px-4">Pembayaran</th>
                    <th className="py-4 px-4 cursor-pointer hover:text-[var(--text-light)]" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1.5">
                        Tgl Daftar <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-4 cursor-pointer hover:text-[var(--text-light)]" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1.5">
                        Status <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <Loader2 className="animate-spin text-amber-500" size={32} />
                          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Memuat data...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredParticipants.length > 0 ? (
                    filteredParticipants.map((p, idx) => {
                      const isSelected = !!selectedIds[p.id];
                      const statusLocked = p.status === 'PAID' || p.status === 'SUCCESS';
                      const selectValue = ['PENDING', 'APPROVED', 'REJECTED'].includes(p.status)
                        ? p.status
                        : 'PENDING';
                      const rowBusy =
                        registrationUpdatingId === p.id || registrationDeletingId === p.id;
                      
                      const eventFee = Number(p.category?.fee ?? 0);
                      const billing = p.member?.billings?.find(
                        (b: any) => b.registrationId === p.id,
                      );
                      const showPaymentIcon = eventFee > 0 || !!billing;
                      let payHighlight: 'waiting' | 'paid' | 'pending' | null = null;
                      if (billing?.status === 'WAITING_VERIFICATION') payHighlight = 'waiting';
                      else if (billing?.status === 'PAID' || p.status === 'PAID' || p.status === 'SUCCESS') payHighlight = 'paid';
                      else if (billing?.status === 'PENDING' || (showPaymentIcon && eventFee > 0)) payHighlight = 'pending';

                      const receiptBtnClass =
                        payHighlight === 'waiting'
                          ? 'text-amber-400 border-amber-500/40 bg-amber-500/[0.12]'
                          : payHighlight === 'paid'
                            ? 'text-emerald-400 border-emerald-500/35 bg-emerald-500/[0.1]'
                            : 'text-slate-400 border-white/12 bg-white/[0.06]';

                      return (
                        <tr 
                          key={p.id}
                          className={`hover:bg-white/[0.02] border-[var(--hairline)] transition-colors ${isSelected ? 'bg-amber-500/[0.04]' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectOne(p.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-amber-500" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>

                          {/* Index */}
                          <td className="py-4 px-2 text-center text-xs font-semibold text-[var(--text-muted)] font-mono">
                            {idx + 1}
                          </td>

                          {/* Profile */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <FixedAvatar
                                size={32}
                                fullName={p.member?.fullName}
                                currentRank={p.member?.currentRank}
                                photoUrl={p.member?.user?.photoUrl}
                              />
                              <div className="min-w-0">
                                <button
                                  onClick={() => setSelectedParticipant(p)}
                                  className="text-left font-bold text-[var(--text-light)] hover:text-amber-500 transition-colors text-xs truncate max-w-[180px] uppercase block"
                                >
                                  {p.member?.fullName || 'Anonim'}
                                </button>
                                <span className="text-[9px] font-mono text-[var(--text-muted)]">{p.member?.nia || 'TANPA NIA'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Dojo */}
                          <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase">
                            {p.member?.dojo?.name || 'Pusat'}
                          </td>

                          {/* KYU / DAN Lama */}
                          <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase">
                            {p.registeredRank || p.member?.currentRank || '-'}
                          </td>

                          <td className="py-4 px-4">
                            <select
                              disabled={rowBusy}
                              value={p.category?.name || p.member?.currentRank || ''}
                              onChange={(e) => handleRegistrationCategoryChange(p.id, p.memberId, p.category?.name || p.member?.currentRank, e.target.value)}
                              className="bg-neutral-800 text-white font-black text-[11px] px-3 py-2 rounded-xl border border-white/10 uppercase focus:outline-none focus:border-amber-500 cursor-pointer max-w-[180px] disabled:opacity-50"
                              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', colorScheme: 'dark' }}
                            >
                              <option value="">Pilih Kategori</option>
                              <optgroup label="Sabuk Putih">
                                <option value="Putih (Kyu 10)">Putih (Kyu 10)</option>
                                <option value="Putih (Kyu 9)">Putih (Kyu 9)</option>
                              </optgroup>
                              <optgroup label="Sabuk Kuning">
                                <option value="Kuning (Kyu 8)">Kuning (Kyu 8)</option>
                                <option value="Kuning (Kyu 7)">Orange (Kyu 7)</option>
                              </optgroup>
                              <optgroup label="Sabuk Hijau">
                                <option value="Hijau (Kyu 6)">Hijau (Kyu 6)</option>
                              </optgroup>
                              <optgroup label="Sabuk Biru">
                                <option value="Biru (Kyu 5)">Biru (Kyu 5)</option>
                                <option value="Biru (Kyu 4)">Biru (Kyu 4)</option>
                              </optgroup>
                              <optgroup label="Sabuk Coklat">
                                <option value="Coklat (Kyu 3)">Coklat (Kyu 3)</option>
                                <option value="Coklat (Kyu 2)">Coklat (Kyu 2)</option>
                                <option value="Coklat (Kyu 1)">Coklat (Kyu 1)</option>
                              </optgroup>
                              <optgroup label="Sabuk Hitam (DAN)">
                                {[...Array(10)].map((_, i) => (
                                  <option key={i} value={`Hitam (DAN ${i + 1})`}>
                                    Hitam (DAN {i + 1})
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </td>

                          {/* Documents */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              {p.member?.birthCertificateUrl ? (
                                <button
                                  type="button"
                                  title="Pratinjau Akte Lahir / Ijazah"
                                  className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-[9px] font-bold tracking-wider transition-all uppercase cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewDoc({
                                      url: p.member.birthCertificateUrl,
                                      title: 'Akte Lahir / Ijazah'
                                    });
                                  }}
                                >
                                  Akte
                                </button>
                              ) : null}
                              {p.member?.bpjsCardUrl ? (
                                <button
                                  type="button"
                                  title="Pratinjau Kartu BPJS"
                                  className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 text-[9px] font-bold tracking-wider transition-all uppercase cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewDoc({
                                      url: p.member.bpjsCardUrl,
                                      title: 'Kartu BPJS'
                                    });
                                  }}
                                >
                                  BPJS
                                </button>
                              ) : null}
                              {!p.member?.birthCertificateUrl && !p.member?.bpjsCardUrl && (
                                <span className="text-[10px] text-gray-500 font-mono">—</span>
                              )}
                            </div>
                          </td>

                          {/* Payment */}
                          <td className="py-4 px-4">
                            <div className="text-xs font-semibold">
                              <span className="text-[var(--text-light)] block">Rp {eventFee.toLocaleString('id-ID')}</span>
                              {billing && (
                                <span className={`text-[9px] font-bold uppercase ${payHighlight === 'paid' ? 'text-green-400' : payHighlight === 'waiting' ? 'text-amber-400' : 'text-gray-400'}`}>
                                  {payHighlight === 'paid' ? 'Lunas' : payHighlight === 'waiting' ? 'Verifikasi manual' : 'Belum bayar'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Registered Date */}
                          <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                            {new Date(p.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {rowBusy ? (
                              <Loader2 className="animate-spin text-amber-500" size={16} />
                            ) : statusLocked ? (
                              getStatusBadge(p.status)
                            ) : (
                              <select
                                value={selectValue}
                                disabled={registrationUpdatingId !== null || registrationDeletingId !== null}
                                onChange={(e) => {
                                  void handleRegistrationStatusChange(p.id, p.status, e.target.value);
                                }}
                                className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-[10px] font-black uppercase text-[var(--text-light)] focus:outline-none focus:border-amber-500/40 cursor-pointer disabled:opacity-50"
                                style={{ colorScheme: 'dark' }}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Setujui</option>
                                <option value="REJECTED">Tolak</option>
                              </select>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-center">
                            <div className="flex justify-center items-center gap-2.5">
                              {showPaymentIcon ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedParticipant(p)}
                                  className={`inline-flex p-2 rounded-lg border transition-colors active:scale-95 disabled:opacity-40 ${receiptBtnClass}`}
                                  title="Detail Pembayaran"
                                >
                                  <Receipt size={16} />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                disabled={!p.member?.user?.phoneNumber}
                                onClick={() => handleWhatsAppParticipant(p)}
                                className="inline-flex p-2 rounded-lg border border-white/10 bg-white/5 text-green-500 transition-colors hover:bg-white/10 active:scale-95 disabled:opacity-30"
                                title="WhatsApp"
                              >
                                <Phone size={16} />
                              </button>
                              <button
                                type="button"
                                disabled={!p.member?.userId}
                                onClick={() => void handleChatParticipant(p)}
                                className="inline-flex p-2 rounded-lg border border-white/10 bg-white/5 text-amber-500 transition-colors hover:bg-white/10 active:scale-95 disabled:opacity-30"
                                title="Chat Aplikasi"
                              >
                                <MessageSquare size={16} />
                              </button>
                              {isRegistrationApprovedForReport(p.status) ? (
                                <button
                                  type="button"
                                  onClick={() => void handleCopyParticipantResume(p)}
                                  className="inline-flex p-2 rounded-lg border border-white/10 bg-white/5 text-sky-400 transition-colors hover:bg-white/10 active:scale-95"
                                  title="Salin Ringkasan"
                                >
                                  <Copy size={16} />
                                </button>
                              ) : null}
                              {!statusLocked && (
                                <button
                                  type="button"
                                  onClick={() => openDeleteRegistrationPrompt(p.id, p.member?.fullName || '')}
                                  className="inline-flex p-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 transition-colors hover:bg-red-500/10 active:scale-95"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-20 text-center">
                        <Users className="mx-auto text-gray-800 mb-3" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Peserta tidak ditemukan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View (under lg screens) */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Memuat data...</p>
              </div>
            ) : filteredParticipants.length > 0 ? (
              filteredParticipants.map((p) => {
                const isSelected = !!selectedIds[p.id];
                const statusLocked = p.status === 'PAID' || p.status === 'SUCCESS';
                const selectValue = ['PENDING', 'APPROVED', 'REJECTED'].includes(p.status)
                  ? p.status
                  : 'PENDING';
                const rowBusy =
                  registrationUpdatingId === p.id || registrationDeletingId === p.id;

                const eventFee = Number(p.category?.fee ?? 0);
                const billing = p.member?.billings?.find(
                  (b: { registrationId?: string | null }) => b.registrationId === p.id,
                );
                const showPaymentIcon = eventFee > 0 || !!billing;
                let payHighlight: 'waiting' | 'paid' | 'pending' | null = null;
                if (billing?.status === 'WAITING_VERIFICATION') payHighlight = 'waiting';
                else if (
                  billing?.status === 'PAID' ||
                  p.status === 'PAID' ||
                  p.status === 'SUCCESS'
                )
                  payHighlight = 'paid';
                else if (billing?.status === 'PENDING' || (showPaymentIcon && eventFee > 0))
                  payHighlight = 'pending';

                const paymentTitle =
                  payHighlight === 'waiting'
                    ? 'Menunggu verifikasi pembayaran'
                    : payHighlight === 'paid'
                      ? 'Pembayaran lunas'
                      : 'Status pembayaran';

                const receiptBtnClass =
                  payHighlight === 'waiting'
                    ? 'text-amber-400 border-amber-500/40 bg-amber-500/[0.12]'
                    : payHighlight === 'paid'
                      ? 'text-emerald-400 border-emerald-500/35 bg-emerald-500/[0.1]'
                      : 'text-slate-400 border-white/12 bg-white/[0.06]';

                return (
                <motion.div 
                  key={p.id}
                  className={`bg-white/[0.03] border border-white/5 rounded-[2rem] flex min-h-[4.75rem] flex-row items-stretch overflow-hidden active:scale-[0.98] transition-all shadow-xl group ${isSelected ? 'bg-amber-500/[0.04] border-amber-500/20' : ''}`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOne(p.id);
                    }}
                    className="flex items-center pl-4 pr-1 text-gray-500 hover:text-white cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-amber-500" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>

                  <div 
                    className="w-[4.25rem] shrink-0 self-stretch cursor-pointer"
                    onClick={() => setSelectedParticipant(p)}
                  >
                    <MemberAvatarRing
                      fullName={p.member?.fullName}
                      currentRank={p.member?.currentRank}
                      photoUrl={p.member?.user?.photoUrl}
                      listStripe
                    />
                  </div>

                  <div 
                    className="flex min-w-0 flex-1 flex-col gap-1 py-3.5 pl-3 pr-2 cursor-pointer"
                    onClick={() => setSelectedParticipant(p)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-[13px] font-black text-white uppercase leading-snug tracking-tight break-words">
                        {p.member?.fullName || 'Anonim'}
                      </h4>
                      {!showInlineRegistrationActions ? getStatusBadge(p.status) : null}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                        <MapPin size={10} className="text-amber-500/50 shrink-0" />
                        {p.member?.dojo?.name || 'Pusat'}
                      </span>
                      {showInlineRegistrationActions ? (
                        <div
                          className="flex shrink-0 items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          {showPaymentIcon ? (
                            <button
                              type="button"
                              title={paymentTitle}
                              aria-label={paymentTitle}
                              onClick={() => setSelectedParticipant(p)}
                              className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors active:scale-95 disabled:opacity-40 ${receiptBtnClass}`}
                            >
                              <Receipt size={16} strokeWidth={2.25} aria-hidden />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={!p.member?.user?.phoneNumber}
                            title={
                              p.member?.user?.phoneNumber
                                ? 'WhatsApp'
                                : 'Tanpa nomor WhatsApp'
                            }
                            aria-label="WhatsApp peserta"
                            onClick={() => handleWhatsAppParticipant(p)}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-green-500 transition-colors hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                          >
                            <Phone size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            disabled={!p.member?.userId}
                            title={
                              p.member?.userId
                                ? 'Chat di aplikasi'
                                : 'Anggota tanpa akun aplikasi'
                            }
                            aria-label="Chat peserta"
                            onClick={() => void handleChatParticipant(p)}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-500 transition-colors hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                          >
                            <MessageSquare size={16} aria-hidden />
                          </button>
                          {isRegistrationApprovedForReport(p.status) ? (
                            <button
                              type="button"
                              title="Salin ringkasan untuk lapor ke cabang (tempel di WhatsApp)"
                              aria-label="Salin ringkasan peserta"
                              onClick={() => void handleCopyParticipantResume(p)}
                              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sky-400 transition-colors hover:bg-white/10 active:scale-95"
                            >
                              <Copy size={16} aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                        <Users size={10} className="text-amber-500/50 shrink-0" />
                        {p.category?.name || '-'}
                      </span>
                    </div>
                  </div>
                  
                  {showInlineRegistrationActions ? (
                    <div
                      className="flex shrink-0 flex-col items-stretch justify-center gap-1.5 self-stretch min-w-[104px] border-l border-white/[0.06] py-3.5 pr-3.5 pl-2"
                      onClick={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      {rowBusy ? (
                        <Loader2 className="animate-spin text-amber-500 mx-auto py-2" size={18} />
                      ) : (
                        <>
                          {statusLocked ? (
                            <div className="flex justify-end">{getStatusBadge(p.status)}</div>
                          ) : (
                            <select
                              aria-label={`Status untuk ${p.member?.fullName || 'peserta'}`}
                              value={selectValue}
                              disabled={
                                registrationUpdatingId !== null ||
                                registrationDeletingId !== null
                              }
                              onChange={(e) => {
                                void handleRegistrationStatusChange(
                                  p.id,
                                  p.status,
                                  e.target.value,
                                );
                              }}
                              className="w-full bg-white/10 border border-white/15 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase text-[var(--text-light)] focus:outline-none focus:border-amber-500/40 cursor-pointer disabled:opacity-50"
                              style={{ colorScheme: 'dark' }}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="APPROVED">Setujui</option>
                              <option value="REJECTED">Tolak</option>
                            </select>
                          )}
                          <button
                            type="button"
                            disabled={
                              statusLocked ||
                              registrationDeletingId !== null ||
                              registrationUpdatingId !== null
                            }
                            onClick={() =>
                              openDeleteRegistrationPrompt(
                                p.id,
                                p.member?.fullName || '',
                              )
                            }
                            className="flex items-center justify-center gap-1 rounded-lg border border-red-500/25 bg-red-500/10 py-1.5 text-[9px] font-black uppercase text-red-400 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.97]"
                          >
                            <Trash2 size={12} aria-hidden />
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex w-11 shrink-0 items-center justify-center self-stretch border-l border-white/[0.06] py-3.5 pr-3.5 pl-2 text-gray-600">
                      <MoreVertical size={14} />
                    </div>
                  )}
                </motion.div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
                <Users className="mx-auto text-gray-800 mb-3" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Peserta tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participant Detail Drawer */}
      <AdminModalPortal>
      <AnimatePresence>
        {selectedParticipant && (
          <div key="participant-drawer" className="admin-modal-overlay flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedParticipant(null)}
              className="admin-modal-backdrop-hitbox"
              aria-hidden
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="admin-modal-drawer-sheet mobile-hpad pt-6 pb-[calc(env(safe-area-inset-bottom,24px)+24px)] sm:rounded-[2.5rem] sm:border sm:border-white/10 sm:max-h-[85vh] overflow-y-auto max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 opacity-50" />
              
              <div className="flex flex-col items-center text-center mb-6">
                <FixedAvatar
                  size={100}
                  fullName={selectedParticipant.member?.fullName}
                  currentRank={selectedParticipant.member?.currentRank}
                  photoUrl={selectedParticipant.member?.user?.photoUrl}
                />
                <h3 className="text-xl font-black uppercase text-white tracking-tight leading-none mb-2">
                  {selectedParticipant.member?.fullName}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {selectedParticipant.member?.nia || 'TANPA NIA'}
                  </span>
                  {getStatusBadge(selectedParticipant.status)}
                </div>
              </div>

              <div className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 space-y-3">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">KYU / DAN Lama</p>
                      <p className="text-xs font-bold text-white uppercase">{selectedParticipant.registeredRank || selectedParticipant.member?.currentRank || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">KYU / DAN Baru</p>
                      <select
                        disabled={registrationUpdatingId === selectedParticipant.id}
                        value={selectedParticipant.category?.name || selectedParticipant.member?.currentRank || ''}
                        onChange={(e) => handleRegistrationCategoryChange(selectedParticipant.id, selectedParticipant.memberId, selectedParticipant.category?.name || selectedParticipant.member?.currentRank, e.target.value)}
                        className="bg-neutral-800 text-white font-black text-xs px-3 py-2.5 rounded-xl border border-white/10 mt-1 uppercase w-full focus:outline-none focus:border-amber-500 cursor-pointer disabled:opacity-50"
                        style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', colorScheme: 'dark' }}
                      >
                        <option value="">Pilih Kategori</option>
                        <optgroup label="Sabuk Putih">
                          <option value="Putih (Kyu 10)">Putih (Kyu 10)</option>
                          <option value="Putih (Kyu 9)">Putih (Kyu 9)</option>
                        </optgroup>
                        <optgroup label="Sabuk Kuning">
                          <option value="Kuning (Kyu 8)">Kuning (Kyu 8)</option>
                          <option value="Kuning (Kyu 7)">Orange (Kyu 7)</option>
                        </optgroup>
                        <optgroup label="Sabuk Hijau">
                          <option value="Hijau (Kyu 6)">Hijau (Kyu 6)</option>
                        </optgroup>
                        <optgroup label="Sabuk Biru">
                          <option value="Biru (Kyu 5)">Biru (Kyu 5)</option>
                          <option value="Biru (Kyu 4)">Biru (Kyu 4)</option>
                        </optgroup>
                        <optgroup label="Sabuk Coklat">
                          <option value="Coklat (Kyu 3)">Coklat (Kyu 3)</option>
                          <option value="Coklat (Kyu 2)">Coklat (Kyu 2)</option>
                          <option value="Coklat (Kyu 1)">Coklat (Kyu 1)</option>
                        </optgroup>
                        <optgroup label="Sabuk Hitam (DAN)">
                          {[...Array(10)].map((_, i) => (
                            <option key={i} value={`Hitam (DAN ${i + 1})`}>
                              Hitam (DAN {i + 1})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Biaya kategori</p>
                    <p className="text-xs font-bold text-white/90">
                      Rp {selectedParticipant.category?.fee?.toLocaleString('id-ID') || '0'}
                    </p>
                    {selectedDrawerBilling != null && selectedDrawerBilling.amount != null ? (
                      <>
                        <p className="text-[9px] text-gray-500 uppercase font-black mt-3 mb-1 tracking-widest">Nominal dibayar anggota</p>
                        <p className="text-xs font-bold text-amber-500">
                          Rp {Number(selectedDrawerBilling.amount).toLocaleString('id-ID')}
                        </p>
                        {typeof selectedDrawerBilling.uniqueTail === 'number' ? (
                          <p className="text-[9px] text-gray-500 mt-2 leading-snug normal-case font-semibold">
                            Kode unik +{selectedDrawerBilling.uniqueTail} — cocokkan dengan mutasi / bukti.
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Dojo</p>
                    <p className="text-xs font-bold text-white uppercase truncate">{selectedParticipant.member?.dojo?.name || 'Pusat'}</p>
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Tgl Daftar</p>
                    <p className="text-xs font-bold text-white uppercase">
                      {new Date(selectedParticipant.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">Asal Cabang / Provinsi</p>
                  <p className="text-xs font-bold text-white uppercase leading-relaxed">
                    {selectedParticipant.member?.dojo?.branch?.name || '-'} / {selectedParticipant.member?.dojo?.branch?.province?.name || '-'}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-6 space-y-3">
                  {participantPaymentProofUrl ? (
                    <div className="space-y-3">
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Bukti Pembayaran</p>
                      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 group relative">
                        <img 
                          src={getAssetUrl(participantPaymentProofUrl)} 
                          alt="Bukti Transfer" 
                          className="w-full h-auto max-h-[300px] object-contain cursor-zoom-in"
                          onClick={() => window.open(getAssetUrl(participantPaymentProofUrl), '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <p className="text-white text-[10px] font-bold uppercase tracking-widest">Klik untuk Zoom</p>
                        </div>
                      </div>
                      <a
                        href={getAssetUrl(participantPaymentProofUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-white/10"
                      >
                        <ExternalLink size={14} aria-hidden />
                        Lihat Full Size
                      </a>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={
                      verifying ||
                      !canVerifyParticipantPayment ||
                      participantPaymentLunas
                    }
                    className="w-full py-4 bg-amber-500 disabled:bg-gray-800 disabled:text-gray-500 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <UserCheck size={18} />
                    )}
                    {participantPaymentLunas
                      ? 'Pembayaran lunas'
                      : canVerifyParticipantPayment
                        ? 'Verifikasi pembayaran'
                        : 'Menunggu anggota ajukan / bayar'}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleWhatsApp}
                      className="py-3.5 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/10"
                    >
                      <Phone size={14} className="text-green-500" />
                      WhatsApp
                    </button>
                    <button 
                      onClick={handleChat}
                      className="py-3.5 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/10"
                    >
                      <MessageSquare size={14} className="text-amber-500" />
                      Chat
                    </button>
                  </div>
                  {!(selectedParticipant.status === 'PAID' || selectedParticipant.status === 'SUCCESS') && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        disabled={registrationUpdatingId !== null}
                        onClick={() => handleRegistrationStatusChange(selectedParticipant.id, selectedParticipant.status, 'APPROVED')}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 py-3.5 text-[10px] font-black uppercase tracking-widest text-green-400 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {registrationUpdatingId === selectedParticipant.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Setujui
                      </button>
                      <button
                        type="button"
                        disabled={registrationUpdatingId !== null}
                        onClick={() => handleRegistrationStatusChange(selectedParticipant.id, selectedParticipant.status, 'REJECTED')}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-[10px] font-black uppercase tracking-widest text-red-400 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {registrationUpdatingId === selectedParticipant.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </AdminModalPortal>

      <AdminModalPortal>
        <AnimatePresence>
          {bulkModalOpen && event && (
            <div key="bulk-register-drawer" className="admin-modal-overlay admin-modal-overlay--bottom">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !bulkSubmitting && setBulkModalOpen(false)}
                className="admin-modal-backdrop-hitbox"
                aria-hidden
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="admin-modal-drawer-sheet mobile-hpad pt-8 pb-[calc(env(safe-area-inset-bottom,24px)+24px)] max-h-[94vh] flex flex-col min-h-0"
              >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-5 opacity-50" />

                <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] text-amber-500 mb-2">
                  Daftar massal anggota
                </h2>
                <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 px-1 leading-snug">
                  Anda hanya dapat memilih anggota pada wilayah Anda. Nominal tagihan mengikuti kategori yang telah ditetapkan cabang pada agenda ini.
                </p>

                {event.categories?.length > 0 ? (
                  <div className="mb-4 shrink-0">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2 block">
                      Kategori & biaya
                    </label>
                    <select
                      value={bulkCategoryId}
                      onChange={(e) => setBulkCategoryId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold uppercase text-[var(--text-light)] appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      {event.categories.map((cat: { id: string; name: string; fee: number }) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} — Rp {Number(cat.fee).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                    {bulkCategoryId ? (
                      <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tight">
                        Per anggota:{' '}
                        <span className="text-amber-500">
                          Rp {Number(bulkCategoryFeeDisplay || 0).toLocaleString('id-ID')}
                        </span>{' '}
                        — tagihan dibuat otomatis
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-gray-500 uppercase text-center mb-4 leading-relaxed shrink-0">
                    Agenda ini tanpa kategori — biaya event tidak dihitung.
                  </p>
                )}

                <div className="relative shrink-0 mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="text"
                    placeholder="Filter nama / NIA / email..."
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex justify-between items-center mb-3 gap-3 shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Dipilih{' '}
                    <span className="text-white">{bulkSelectedCount}</span> · dapat dipilih{' '}
                    {selectableBulkMembers.length}
                  </p>
                  <button
                    type="button"
                    disabled={bulkMembersLoading || selectableBulkMembers.length === 0}
                    onClick={() => toggleBulkSelectAllVisible()}
                    className="text-[10px] font-black uppercase tracking-widest text-amber-500 disabled:opacity-40 py-2 px-1"
                  >
                    Pilih semua terlihat
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-6 pr-0.5 -mr-0.5">
                  {bulkMembersLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Loader2 className="animate-spin text-amber-500" size={28} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Memuat anggota...
                      </p>
                    </div>
                  ) : bulkFilteredMembers.length === 0 ? (
                    <div className="py-14 text-center text-[10px] font-black uppercase tracking-widest text-gray-600">
                      Tidak ada data anggota
                    </div>
                  ) : (
                    bulkFilteredMembers.map((m) => {
                      const isReg = registeredMemberIds.has(m.id);
                      const isSel = !!bulkSelectedIds[m.id];
                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={isReg || bulkSubmitting}
                          onClick={() => toggleBulkMember(m.id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-[1.35rem] border text-left transition-all ${
                            isReg
                              ? 'opacity-35 border-white/5 bg-white/[0.02] cursor-default'
                              : isSel
                                ? 'border-amber-500/40 bg-amber-500/[0.08] active:scale-[0.98]'
                                : 'border-white/8 bg-white/[0.03] active:scale-[0.98]'
                          }`}
                        >
                          <span className="shrink-0 text-gray-400">
                            {isReg ? (
                              <CheckSquare size={22} />
                            ) : isSel ? (
                              <CheckSquare size={22} className="text-amber-500" />
                            ) : (
                              <Square size={22} />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2 items-start mb-1">
                              <p className="text-[13px] font-black text-[var(--text-light)] uppercase truncate tracking-tight">
                                {m.fullName}
                              </p>
                              {isReg && (
                                <span className="shrink-0 text-[9px] font-black uppercase text-amber-600/90 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                                  Terdaftar
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase text-gray-600 tracking-wider">
                              <span>NIA {(m.nia as string | null | undefined) || '—'}</span>
                              <span className="text-gray-700">•</span>
                              <span className="truncate">{m.dojo?.name}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="shrink-0 space-y-3 pt-2 border-t border-white/10 mt-auto">
                  <button
                    type="button"
                    disabled={
                      bulkSubmitting ||
                      bulkSelectedCount === 0 ||
                      (event.categories?.length > 0 && !bulkCategoryId)
                    }
                    onClick={() => handleBulkRegisterSubmit()}
                    className="w-full py-4 bg-amber-500 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black uppercase tracking-[0.18em] text-[11px] rounded-2xl shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[52px]"
                  >
                    {bulkSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>Daftar {bulkSelectedCount} terpilih</>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={bulkSubmitting}
                    onClick={() => setBulkModalOpen(false)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AdminModalPortal>

      <AdminModalPortal>
        <AnimatePresence>
          {deleteRegPrompt && (
            <motion.div
              key="delete-reg-confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="admin-modal-overlay admin-modal-overlay--dialog admin-modal-overlay--stack"
              role="presentation"
              onClick={() => {
                if (registrationDeletingId === null) setDeleteRegPrompt(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="admin-modal-dialog-panel relative"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-reg-title"
                aria-describedby="delete-reg-desc"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-red-500/5 blur-3xl" />

                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-red-500/20 bg-red-500/10 text-red-500 shadow-2xl shadow-red-500/10">
                  <Trash2 size={32} aria-hidden />
                </div>
                <h3
                  id="delete-reg-title"
                  className="mb-3 text-xl font-black uppercase tracking-tight text-white"
                >
                  Hapus pendaftaran?
                </h3>
                <p
                  id="delete-reg-desc"
                  className="mb-8 text-xs font-medium leading-relaxed text-gray-400"
                >
                  Pendaftaran{' '}
                  <span className="break-words font-bold text-white">
                    {deleteRegPrompt.memberName}
                  </span>{' '}
                  akan dihapus dari agenda ini. Tindakan ini{' '}
                  <span className="font-bold text-red-400">permanen</span> dan
                  tidak dapat dibatalkan.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => void executeDeleteRegistration()}
                    disabled={
                      registrationDeletingId === deleteRegPrompt.regId
                    }
                    className="w-full rounded-2xl bg-red-500 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {registrationDeletingId === deleteRegPrompt.regId
                      ? 'Menghapus...'
                      : 'Ya, hapus pendaftaran'}
                  </button>
                  <button
                    type="button"
                    disabled={registrationDeletingId === deleteRegPrompt.regId}
                    onClick={() => setDeleteRegPrompt(null)}
                    className="w-full rounded-2xl border border-white/5 bg-white/5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 transition-all active:scale-95 disabled:opacity-40"
                  >
                    Batalkan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AdminModalPortal>

      {/* Document Preview Modal */}
      <AdminModalPortal>
        <AnimatePresence>
          {previewDoc && (
            <div key="doc-preview-modal" className="admin-modal-overlay flex items-center justify-center p-4 z-[10005]">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewDoc(null)}
                className="admin-modal-backdrop-hitbox"
                aria-hidden
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="admin-modal-dialog-panel relative p-4 sm:p-6"
                style={{ maxWidth: '1200px', width: '95%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Pratinjau Dokumen: {previewDoc.title} {previewDocSize ? `(${previewDocSize})` : ''}
                  </h3>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 p-2 flex items-center justify-center w-full" style={{ height: '70vh' }}>
                  {previewDoc.url.toLowerCase().split('?')[0].endsWith('.pdf') ? (
                    <iframe 
                      src={getAssetUrl(previewDoc.url) + '#view=FitH&toolbar=0&navpanes=0'} 
                      title={previewDoc.title} 
                      className="w-full h-full rounded border-0 bg-white"
                    />
                  ) : (
                    <img 
                      src={getAssetUrl(previewDoc.url)} 
                      alt={previewDoc.title} 
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <a
                    href={getAssetUrl(previewDoc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] rounded-xl text-center active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-amber-600"
                  >
                    <ExternalLink size={14} />
                    Buka di Tab Baru
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="flex-1 py-3 bg-white/5 text-[var(--text-light)] font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 active:scale-95 transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AdminModalPortal>
    </>
  );
}
