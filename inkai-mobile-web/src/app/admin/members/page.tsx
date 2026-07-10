"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserMinus,
  Mail,
  Phone,
  Loader2,
  X,
  ArrowLeft,
  MapPin,
  ChevronDown,
  Calendar,
  Trash2,
  Pencil,
  UserPlus,
  Eye,
  Award,
  ExternalLink,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, getAssetUrl } from "@/lib/api";
import toast from "react-hot-toast";
import { MemberItemSkeleton } from "@/components/admin/Skeleton";
import AdminModalPortal from "@/components/admin/AdminModalPortal";
import { useAuth } from "@/context/AuthContext";

const ADMIN_BELT_RANK_OPTIONS: readonly string[] = [
  "Putih (Kyu 10)",
  "Putih (Kyu 9)",
  "Kuning (Kyu 8)",
  "Kuning (Kyu 7)",
  "Hijau (Kyu 6)",
  "Biru (Kyu 5)",
  "Biru (Kyu 4)",
  "Coklat (Kyu 3)",
  "Coklat (Kyu 2)",
  "Coklat (Kyu 1)",
  ...Array.from({ length: 10 }, (_, i) => `Hitam (DAN ${i + 1})`),
];

/** Selaras kebijakan backend: ADMIN_DOJO tidak mengatur NIA/sabuk; cabang ↑ & pusat boleh. */
function adminMayEditMemberNiaAndSabuk(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  const roles = (user as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return false;
  const names = roles
    .map((r: unknown) =>
      typeof r === "string" ? r : ((r as { name?: string })?.name ?? ""),
    )
    .filter(Boolean);
  const elevated = new Set([
    "ADMINISTRATOR",
    "ADMIN_PUSAT",
    "ADMIN_PROVINCE",
    "ADMIN_BRANCH",
    "ADMIN",
  ]);
  return names.some((n) => elevated.has(String(n)));
}

function AdminMemberRankSelect({
  value,
  disabled,
  onChange,
  className,
}: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  className?: string;
}) {
  const needsLegacy = Boolean(
    value && !ADMIN_BELT_RANK_OPTIONS.includes(value),
  );
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        style={{ colorScheme: "dark" }}
      >
        {needsLegacy ? (
          <option value={value}>{`${value} (nilai saat ini)`}</option>
        ) : null}
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
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  );
}

function AdminMemberListCard({
  member,
  saving,
  onOpenDetail,
  patchMemberInline,
  onToggleStatus,
  onDelete,
  canEditNiaSabuk,
  onPreviewDoc,
}: {
  member: any;
  saving: boolean;
  onOpenDetail: (m: any) => void;
  patchMemberInline: (
    id: string,
    body: Partial<{ nia: string; currentRank: string }>,
  ) => Promise<boolean>;
  onToggleStatus: (m: any) => void;
  onDelete: (id: string) => void;
  canEditNiaSabuk: boolean;
  onPreviewDoc: (url: string, title: string) => void;
}) {
  const [niaLocal, setNiaLocal] = useState(() => member.nia ?? "");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setNiaLocal(member.nia ?? "");
  }, [member.id, member.nia]);

  const rankValue = member.currentRank || "Putih (Kyu 10)";
  const photoUrl = member.photoUrl || member.user?.photoUrl;
  const photoSrc = photoUrl && !imageError ? getAssetUrl(photoUrl) : "";

  return (
    <div
      className={`glass-card p-4 border-white/5 relative ${saving ? "opacity-70 pointer-events-none" : ""}`}
    >
      {saving ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-black/20">
          <Loader2 size={22} className="animate-spin text-amber-500" />
        </div>
      ) : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onOpenDetail(member)}
          className="shrink-0 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/10 overflow-hidden"
          style={{ width: "40px", height: "40px" }}
          title="Detail anggota"
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={member.fullName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-amber-500 font-bold text-xs">
              {member.fullName?.charAt(0)}
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <button
            type="button"
            onClick={() => onOpenDetail(member)}
            className="text-left w-full touch-manipulation"
            title="Buka detail"
          >
            <h4 className="text-xs font-bold text-white truncate">
              {member.fullName}
            </h4>
          </button>

          <div className="space-y-2">
            <div>
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">
                NIA
              </label>
              {canEditNiaSabuk ? (
                <input
                  type="text"
                  value={niaLocal}
                  disabled={saving}
                  onChange={(e) => setNiaLocal(e.target.value)}
                  onBlur={async () => {
                    const t = niaLocal.trim();
                    const cur = (member.nia ?? "").trim();
                    if (t === cur) return;
                    const ok = await patchMemberInline(member.id, {
                      nia: niaLocal,
                    });
                    if (!ok) setNiaLocal(member.nia ?? "");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Nomor induk"
                  className="glass-input w-full px-3 py-2 text-[11px] font-mono focus-outline-none"
                />
              ) : (
                <div className="glass-input w-full px-3 py-2 text-[11px] font-mono text-gray-300 border-white/10 opacity-80">
                  {(member.nia ?? "").trim() !== "" ? member.nia : "—"}
                </div>
              )}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">
                Sabuk & Kyu
              </label>
              {canEditNiaSabuk ? (
                <AdminMemberRankSelect
                  value={rankValue}
                  disabled={saving}
                  onChange={(next) => {
                    if (next === rankValue) return;
                    void patchMemberInline(member.id, { currentRank: next });
                  }}
                  className="glass-input w-full px-3 py-2 text-[11px] appearance-none cursor-pointer font-bold focus-outline-none"
                />
              ) : (
                <div className="glass-input w-full px-3 py-2 text-[11px] font-bold text-amber-500/95 border-white/10 opacity-90">
                  {rankValue}
                </div>
              )}
            </div>
            {!canEditNiaSabuk ? (
              <p className="text-[9px] text-gray-500 leading-snug">
                NIA dan sabuk/Kyu diatur pengurus cabang atau pusat.
              </p>
            ) : null}
          </div>

          <p className="text-[9px] text-gray-500 leading-snug pt-0.5">
            Ranting:{" "}
            <span className="text-gray-400 font-medium">
              {member.dojo?.name || "Umum"}
            </span>
          </p>

          <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 items-center mt-2">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-black mr-1">Dokumen:</span>
            {member.birthCertificateUrl ? (
              <button
                type="button"
                title="Pratinjau Akte Lahir / Ijazah"
                className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-[9px] font-bold tracking-wider transition-all uppercase cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewDoc(member.birthCertificateUrl, 'Akte Lahir / Ijazah');
                }}
              >
                Akte
              </button>
            ) : null}
            {member.bpjsCardUrl ? (
              <button
                type="button"
                title="Pratinjau Kartu BPJS"
                className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 text-[9px] font-bold tracking-wider transition-all uppercase cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewDoc(member.bpjsCardUrl, 'Kartu BPJS');
                }}
              >
                BPJS
              </button>
            ) : null}
            {!member.birthCertificateUrl && !member.bpjsCardUrl && (
              <span className="text-[9px] text-gray-500 italic">Belum di-upload</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(member);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              member.status === "Active"
                ? "border-green-500/20 text-green-500 hover:bg-green-500/10"
                : "border-red-500/20 text-red-500 hover:bg-red-500/10"
            }`}
            title={member.status === "Active" ? "Non-Aktifkan" : "Aktifkan"}
          >
            {member.status === "Active" ? (
              <UserCheck size={14} />
            ) : (
              <UserMinus size={14} />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(member.id);
            }}
            className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminMemberTableRow({
  member,
  saving,
  onOpenDetail,
  onEdit,
  patchMemberInline,
  onToggleStatus,
  onDelete,
  canEditNiaSabuk,
  rowNumber,
  onPreviewDoc,
}: {
  member: any;
  saving: boolean;
  onOpenDetail: (m: any) => void;
  onEdit: (m: any) => void;
  patchMemberInline: (
    id: string,
    body: Partial<{ nia: string; currentRank: string }>,
  ) => Promise<boolean>;
  onToggleStatus: (m: any) => void;
  onDelete: (id: string) => void;
  canEditNiaSabuk: boolean;
  rowNumber: number;
  onPreviewDoc: (url: string, title: string) => void;
}) {
  const [niaLocal, setNiaLocal] = useState(() => member.nia ?? "");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setNiaLocal(member.nia ?? "");
  }, [member.id, member.nia]);

  const rankValue = member.currentRank || "Putih (Kyu 10)";
  const photoUrl = member.photoUrl || member.user?.photoUrl;
  const photoSrc = photoUrl && !imageError ? getAssetUrl(photoUrl) : "";

  return (
    <tr className={`hover:bg-white/[0.01] transition-all group border-b border-white/5 relative ${saving ? "opacity-70 pointer-events-none" : ""}`}>
      <td className="py-4 pl-4 pr-2 text-left text-xs font-semibold text-gray-500 font-mono w-12">
        {rowNumber}
      </td>
      <td className="py-4 px-6 text-left">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenDetail(member)}
            className="shrink-0 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/10 overflow-hidden"
            style={{ width: "32px", height: "32px" }}
            title="Detail anggota"
          >
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={member.fullName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-amber-500 font-bold text-xs">
                {member.fullName?.charAt(0)}
              </span>
            )}
          </button>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onOpenDetail(member)}
              className="text-left font-bold text-white hover:text-amber-500 transition-colors text-xs truncate max-w-[200px]"
              title="Buka detail"
            >
              {member.fullName}
            </button>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-left">
        {canEditNiaSabuk ? (
          <input
            type="text"
            value={niaLocal}
            disabled={saving}
            onChange={(e) => setNiaLocal(e.target.value)}
            onBlur={async () => {
              const t = niaLocal.trim();
              const cur = (member.nia ?? "").trim();
              if (t === cur) return;
              const ok = await patchMemberInline(member.id, {
                nia: niaLocal,
              });
              if (!ok) setNiaLocal(member.nia ?? "");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Nomor induk"
            className="glass-input px-2.5 py-1.5 text-[11px] font-mono focus:outline-none w-40"
          />
        ) : (
          <span className="text-[11px] font-mono text-gray-300 opacity-80">
            {(member.nia ?? "").trim() !== "" ? member.nia : "—"}
          </span>
        )}
      </td>
      <td className="py-4 px-4 text-left">
        {canEditNiaSabuk ? (
          <AdminMemberRankSelect
            value={rankValue}
            disabled={saving}
            onChange={(next) => {
              if (next === rankValue) return;
              void patchMemberInline(member.id, { currentRank: next });
            }}
            className="glass-input px-2.5 py-1.5 text-[11px] appearance-none cursor-pointer font-bold focus-outline-none w-48"
          />
        ) : (
          <span className="text-[11px] font-bold text-amber-500/95 opacity-90">
            {rankValue}
          </span>
        )}
      </td>
      <td className="py-4 px-4 text-left text-xs text-gray-400">
        {member.dojo?.name || "Umum"}
      </td>
      <td className="py-4 px-4 text-center">
        <span
          className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
            member.status === "Active"
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {member.status === "Active" ? "Aktif" : "Non-Aktif"}
        </span>
      </td>
      <td className="py-4 px-4 text-center">
        <div className="flex items-center gap-1.5 justify-center">
          {member.birthCertificateUrl ? (
            <button
              type="button"
              title="Pratinjau Akte Lahir / Ijazah"
              className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-[9px] font-bold tracking-wider transition-all uppercase cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewDoc(member.birthCertificateUrl, 'Akte Lahir / Ijazah');
              }}
            >
              Akte
            </button>
          ) : null}
          {member.bpjsCardUrl ? (
            <button
              type="button"
              title="Pratinjau Kartu BPJS"
              className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 text-[9px] font-bold tracking-wider transition-all uppercase cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewDoc(member.bpjsCardUrl, 'Kartu BPJS');
              }}
            >
              BPJS
            </button>
          ) : null}
          {!member.birthCertificateUrl && !member.bpjsCardUrl && (
            <span className="text-[10px] text-gray-500 font-mono">—</span>
          )}
        </div>
      </td>
      <td className="py-4 px-6 text-center">
        <div className="flex justify-center items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenDetail(member)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
            title="Detail"
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/10 text-gray-400 hover:text-amber-500 transition-all border border-white/10"
            title="Ubah Data"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onToggleStatus(member)}
            className={`p-2 rounded-xl border transition-all ${
              member.status === "Active"
                ? "border-green-500/20 bg-green-500/5 text-green-500 hover:bg-green-500/10"
                : "border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10"
            }`}
            title={member.status === "Active" ? "Non-Aktifkan" : "Aktifkan"}
          >
            {member.status === "Active" ? (
              <UserCheck size={14} />
            ) : (
              <UserMinus size={14} />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(member.id)}
            className="p-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 transition-all"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

const getMemberKpiCategory = (member: any): string => {
  const rank = String(member.currentRank || "").toUpperCase();
  if (rank.includes("HITAM") || rank.includes("DAN")) {
    return "hitam";
  }
  
  const kyuMatch = rank.match(/KYU\s+(\d+)/);
  let kyuNum = 0;
  if (kyuMatch) {
    kyuNum = parseInt(kyuMatch[1], 10);
  } else {
    if (rank.includes("PUTIH") || rank.includes("10")) kyuNum = 10;
    else if (rank.includes("9")) kyuNum = 9;
    else if (rank.includes("8")) kyuNum = 8;
    else if (rank.includes("7")) kyuNum = 7;
    else if (rank.includes("6")) kyuNum = 6;
    else if (rank.includes("5")) kyuNum = 5;
    else if (rank.includes("4")) kyuNum = 4;
    else if (rank.includes("3")) kyuNum = 3;
    else if (rank.includes("2")) kyuNum = 2;
    else if (rank.includes("1")) kyuNum = 1;
  }

  if (kyuNum === 10 || kyuNum === 9) return "kyu10";
  if (kyuNum === 8) return "kyu8";
  if (kyuNum === 7) return "kyu7";
  if (kyuNum === 6) return "kyu6";
  if (kyuNum === 5 || kyuNum === 4) return "kyu5_4";
  if (kyuNum === 3 || kyuNum === 2 || kyuNum === 1) return "kyu3_2_1";
  
  if (rank.includes("PUTIH")) return "kyu10";
  if (rank.includes("KUNING")) {
    if (rank.includes("7")) return "kyu7";
    return "kyu8";
  }
  if (rank.includes("ORANGE") || rank.includes("ORANYE")) return "kyu7";
  if (rank.includes("HIJAU")) return "kyu6";
  if (rank.includes("BIRU")) return "kyu5_4";
  if (rank.includes("COKLAT")) return "kyu3_2_1";

  return "";
};

function MembersContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const dojoId = searchParams.get("dojoId") || user?.managedDojoId;
  const dojoName = searchParams.get("dojoName") || user?.managedDojoName;
  const branchId = searchParams.get("branchId");
  const provinceId = searchParams.get("provinceId");
  const memberId = searchParams.get("memberId");

  const canEditNiaSabuk = useMemo(
    () => adminMayEditMemberNiaAndSabuk(user),
    [user],
  );

  const [allDojoMembers, setAllDojoMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dojoInfo, setDojoInfo] = useState<any | null>(null);
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

  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const stats = useMemo(() => {
    let hitam = 0;
    let nonAktif = 0;
    let kyu10 = 0;
    let kyu8 = 0;
    let kyu7 = 0;
    let kyu6 = 0;
    let kyu5_4 = 0;
    let kyu3_2_1 = 0;
    
    allDojoMembers.forEach((m: any) => {
      if (m.status !== "Active") {
        nonAktif++;
      }
      
      const cat = getMemberKpiCategory(m);
      if (cat === "hitam") hitam++;
      else if (cat === "kyu10") kyu10++;
      else if (cat === "kyu8") kyu8++;
      else if (cat === "kyu7") kyu7++;
      else if (cat === "kyu6") kyu6++;
      else if (cat === "kyu5_4") kyu5_4++;
      else if (cat === "kyu3_2_1") kyu3_2_1++;
    });

    return { hitam, nonAktif, kyu10, kyu8, kyu7, kyu6, kyu5_4, kyu3_2_1 };
  }, [allDojoMembers]);

  const filteredMembers = useMemo(() => {
    let result = [...allDojoMembers];
    
    if (search.trim() !== "") {
      const q = search.toLowerCase().trim();
      result = result.filter(m => 
        (m.fullName || "").toLowerCase().includes(q) ||
        (m.nia || "").toLowerCase().includes(q) ||
        (m.nik || "").toLowerCase().includes(q) ||
        (m.user?.email || "").toLowerCase().includes(q)
      );
    }
    
    if (selectedKpi === "aktif") {
      result = result.filter(m => m.status === "Active");
    } else if (selectedKpi === "non-aktif") {
      result = result.filter(m => m.status !== "Active");
    } else if (selectedKpi === "hitam") {
      result = result.filter(m => getMemberKpiCategory(m) === "hitam");
    } else if (selectedKpi === "kyu10") {
      result = result.filter(m => getMemberKpiCategory(m) === "kyu10");
    } else if (selectedKpi === "kyu8") {
      result = result.filter(m => getMemberKpiCategory(m) === "kyu8");
    } else if (selectedKpi === "kyu7") {
      result = result.filter(m => getMemberKpiCategory(m) === "kyu7");
    } else if (selectedKpi === "kyu6") {
      result = result.filter(m => getMemberKpiCategory(m) === "kyu6");
    } else if (selectedKpi === "kyu5_4") {
      result = result.filter(m => getMemberKpiCategory(m) === "kyu5_4");
    } else if (selectedKpi === "kyu3_2_1") {
      result = result.filter(m => getMemberKpiCategory(m) === "kyu3_2_1");
    }
    
    return result;
  }, [allDojoMembers, search, selectedKpi]);

  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const meta = useMemo(() => {
    return {
      total: filteredMembers.length,
      page: currentPage,
      limit: pageSize
    };
  }, [filteredMembers.length, currentPage, pageSize]);

  // Modal states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("123456");
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showRankEditModal, setShowRankEditModal] = useState(false);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const [editingRank, setEditingRank] = useState<any | null>(null);
  const [rankEditForm, setRankEditForm] = useState({
    rank: "",
    date: "",
    location: "",
    isVerified: true,
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listSavingId, setListSavingId] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [provisionLoginBusy, setProvisionLoginBusy] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "Laki-laki",
    birthDate: "",
    currentRank: "Putih (Kyu 10)",
    nia: "",
    email: "",
    password: "",
    dojoId: dojoId || "",
  });
  const [provinces, setProvinces] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [dojos, setDojos] = useState<any[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const patchMemberInline = useCallback(
    async (
      memberId: string,
      body: any,
    ): Promise<boolean> => {
      setListSavingId(memberId);
      try {
        const resPayload: any = await api.members.update(memberId, body as any);
        const updated = resPayload?.data ?? resPayload;
        setAllDojoMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, ...updated } : m)),
        );
        setSelectedMember((sm: any) =>
          sm && sm.id === memberId ? { ...sm, ...updated } : sm,
        );
        toast.success("Perubahan disimpan");
        return true;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || "Gagal menyimpan";
        toast.error(msg);
        return false;
      } finally {
        setListSavingId(null);
      }
    },
    [],
  );

  const openMemberDetail = useCallback(async (member: any) => {
    setSelectedMember(member);
    setShowDetailModal(true);
    setMemberDetailLoading(true);
    try {
      const res = await api.members.getDetail(member.id);
      setSelectedMember(res.data);
    } catch (err: any) {
      toast.error(err?.message || "Gagal memuat detail anggota");
    } finally {
      setMemberDetailLoading(false);
    }
  }, []);

  const handleProvisionLogin = useCallback(async () => {
    if (!selectedMember?.id) return;
    setProvisionLoginBusy(true);
    try {
      const res: any = await api.members.provisionLogin(selectedMember.id);
      const payload = res?.data ?? res;
      toast.success(
        payload?.email
          ? `Akun dibuat: ${payload.email} (sandi awal 123456)`
          : res?.message || "Akun login berhasil dibuat",
      );
      const refreshed = await api.members.getDetail(selectedMember.id);
      setSelectedMember(refreshed.data);
      setAllDojoMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id
            ? {
                ...m,
                userId: payload?.userId ?? refreshed.data?.userId,
                user: {
                  ...(m.user || {}),
                  email: payload?.email ?? refreshed.data?.user?.email,
                },
              }
            : m,
        ),
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal membuat akun login";
      toast.error(msg);
    } finally {
      setProvisionLoginBusy(false);
    }
  }, [selectedMember]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 1000 };
      if (dojoId) params.dojoId = dojoId;

      const response = await api.members.getAll(params);
      setAllDojoMembers(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dojoId]);

  useEffect(() => {
    fetchMembers();
    if (dojoId) {
      const fetchDojoInfo = async () => {
        try {
          const response = await api.org.getDojoDetail(dojoId);
          setDojoInfo(response.data);
        } catch (err) {
          console.error("Failed to fetch dojo info", err);
        }
      };
      fetchDojoInfo();
    } else {
      setDojoInfo(null);
    }
  }, [dojoId]);

  useEffect(() => {
    if (!memberId) return;
    setMemberDetailLoading(true);
    api.members
      .getDetail(memberId)
      .then((res: any) => {
        setSelectedMember(res.data);
        setShowDetailModal(true);
      })
      .catch((err) => {
        console.error("Failed to fetch member detail", err);
      })
      .finally(() => setMemberDetailLoading(false));
  }, [memberId]);

  useEffect(() => {
    if (!showDetailModal) {
      setShowRankEditModal(false);
      setEditingRank(null);
      setMemberDetailLoading(false);
    }
  }, [showDetailModal]);

  useEffect(() => {
    if (searchParams.get("showAdd") === "true") {
      setShowAddModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (showAddModal && (!dojoId || isEdit)) {
      api.org.getProvinces().then((res: any) => setProvinces(res.data));
    }
  }, [showAddModal, dojoId, isEdit]);

  useEffect(() => {
    if (selectedProvinceId) {
      api.org.getBranches(selectedProvinceId).then((res: any) => {
        setBranches(res.data);
      });
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedBranchId) {
      api.org.getDojos(selectedBranchId).then((res: any) => {
        setDojos(res.data);
      });
    }
  }, [selectedBranchId]);

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const headers = ["No", "Nama Anggota", "NIA", "NIK", "Sabuk & Kyu", "Dojo", "Status", "Email", "No. HP"];
    const rows = filteredMembers.map((m, index) => [
      index + 1,
      m.fullName || "",
      m.nia || "-",
      m.nik || "-",
      m.currentRank || "-",
      m.dojo?.name || "-",
      m.status === "Active" ? "AKTIF" : "NON-AKTIF",
      m.user?.email || "-",
      m.phoneNumber || "-"
    ]);
    
    // Convert to CSV string safely
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Daftar_Anggota_${dojoName || "INKAI"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ekspor CSV berhasil diunduh");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleBack = () => {
    if (user?.managedDojoId) {
      router.push("/admin");
      return;
    }
    if (branchId && provinceId) {
      router.push(
        `/admin/organization?branchId=${branchId}&provinceId=${provinceId}`,
      );
    } else {
      router.push("/admin/organization");
    }
  };

  const handleEdit = (member: any) => {
    setEditId(member.id);
    setIsEdit(true);
    setFormData({
      fullName: member.fullName,
      gender: member.gender || "Laki-laki",
      birthDate: member.birthDate ? member.birthDate.split("T")[0] : "",
      currentRank: member.currentRank || "Putih",
      nia: member.nia || "",
      email: member.user?.email || "",
      password: "",
      dojoId: member.dojoId || user?.managedDojoId || "",
    });

    // Pre-fill hierarchy for editing
    if (member.dojo?.branch?.provinceId) {
      setSelectedProvinceId(member.dojo.branch.provinceId);
      // We need to fetch branches and dojos for these to work,
      // but the useEffects will handle it once the IDs are set.
      setSelectedBranchId(member.dojo.branchId);
    }

    const dateOnly = member.birthDate ? member.birthDate.split("T")[0] : "";
    setDateInput(dateOnly ? dateOnly.split("-").reverse().join("/") : "");
    setShowDetailModal(false);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      gender: "Laki-laki",
      birthDate: "",
      currentRank: "Putih (Kyu 10)",
      nia: "",
      email: "",
      password: "",
      dojoId: dojoId || user?.managedDojoId || "",
    });
    setDateInput("");
    setIsEdit(false);
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    setEditId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!editId) return;
    try {
      await api.members.delete(editId);
      toast.success("Anggota berhasil dihapus");
      setShowDeleteModal(false);
      setShowDetailModal(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus anggota");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedMember || !resetPasswordValue) return;
    setIsSubmitting(true);
    try {
      await api.members.update(selectedMember.id, {
        password: resetPasswordValue,
      } as any);
      toast.success(`Sandi ${selectedMember.fullName} berhasil direset!`);
      setShowResetModal(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal reset sandi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: any) => {
    const newStatus = member.status === "Active" ? "Non Active" : "Active";
    try {
      await api.members.update(member.id, { status: newStatus });
      toast.success(
        `Status anggota diubah menjadi ${newStatus === "Active" ? "Aktif" : "Non-Aktif"}`,
      );

      // Update local state if needed or just refetch
      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember({ ...selectedMember, status: newStatus });
      }
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status");
    }
  };

  const openRankEditModal = (rankRow: any) => {
    setEditingRank(rankRow);
    setRankEditForm({
      rank: rankRow.rank || "",
      date: rankRow.date ? String(rankRow.date).split("T")[0] : "",
      location: rankRow.location ?? "",
      isVerified: !!rankRow.isVerified,
    });
    setShowRankEditModal(true);
  };

  const handleSaveMemberRank = async () => {
    if (!selectedMember || !editingRank) return;
    const r = rankEditForm.rank.trim();
    if (!r) {
      toast.error("Nama tingkatan wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.members.updateMemberRank(selectedMember.id, editingRank.id, {
        rank: r,
        date: rankEditForm.date,
        location: rankEditForm.location.trim() || null,
        isVerified: rankEditForm.isVerified,
      });
      const refreshed = await api.members.getDetail(selectedMember.id);
      setSelectedMember(refreshed.data);
      setShowRankEditModal(false);
      setEditingRank(null);
      toast.success("Riwayat kenaikan tingkat diperbarui");
      fetchMembers();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.message === "string" ? err.message : "Gagal menyimpan");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* Premium Confirm Modal */}
      {showDeleteModal && (
        <AdminModalPortal>
          <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
            <div className="glass-card-opaque w-full max-w-sm p-8 text-center border border-white/10 shadow-2xl">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">
                Hapus Anggota?
              </h3>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Tindakan ini akan menonaktifkan keanggotaan secara permanen.
                Anda yakin?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Ya, Hapus Sekarang
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}
      {/* Header Area */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-amber-500 mb-0.5">
                <Users size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">
                  {searchParams.get("title") ||
                    (dojoId ? `Dojo ${dojoName}` : 
                     user?.roles?.[0] === 'ADMINISTRATOR' || user?.roles?.[0] === 'ADMIN_PUSAT' ? 'Database Nasional' :
                     user?.roles?.[0] === 'ADMIN_PROVINCE' ? `Database Provinsi ${user?.managedProvinceName || ''}` :
                     user?.roles?.[0] === 'ADMIN_BRANCH' ? `Database Cabang ${user?.managedBranchName || ''}` :
                     user?.roles?.[0] === 'ADMIN_DOJO' ? `Database Dojo ${user?.managedDojoName || ''}` :
                     'Database Anggota')}
                </span>
              </div>
              <h2 className="text-xl font-black uppercase text-white truncate leading-tight">
                {dojoId ? dojoName : 
                 user?.roles?.[0] === 'ADMINISTRATOR' || user?.roles?.[0] === 'ADMIN_PUSAT' ? 'Seluruh Anggota' :
                 user?.roles?.[0] === 'ADMIN_PROVINCE' ? `Anggota Provinsi` :
                 user?.roles?.[0] === 'ADMIN_BRANCH' ? `Anggota Cabang` :
                 user?.roles?.[0] === 'ADMIN_DOJO' ? `Anggota Dojo` :
                 'Daftar Anggota'}
              </h2>
            </div>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all">
              <Download size={18} />
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-amber-500/20"
        >
          <Plus size={20} />
          Tambah Anggota
        </button>

        <button
          onClick={() => setShowBulkModal(true)}
          className="btn-secondary w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] border-dashed border-white/20"
        >
          <Download size={14} />
          Input Massal (Teks/Excel)
        </button>

        {dojoId && (
          <div className="grid grid-cols-2 gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-gray-500 leading-none mb-1">
                  Wilayah
                </p>
                <p className="text-[11px] font-bold text-gray-300 uppercase truncate">
                  {dojoInfo?.kecamatan || "..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                <Phone size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-gray-500 leading-none mb-1">
                  Kontak
                </p>
                <p className="text-[11px] font-bold text-amber-500 uppercase truncate">
                  {dojoInfo?.phoneNumber || "..."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4">
        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "aktif" ? null : "aktif");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-aktif ${
            selectedKpi === "aktif" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <UserCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Aktif</p>
            <h4 className="text-lg font-black leading-tight">
              {allDojoMembers.filter(m => m.status === "Active").length || "0"}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "kyu10" ? null : "kyu10");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-kyu10 ${
            selectedKpi === "kyu10" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Kyu 10</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.kyu10}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "kyu8" ? null : "kyu8");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-kyu8 ${
            selectedKpi === "kyu8" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Kyu 8</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.kyu8}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "kyu7" ? null : "kyu7");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-kyu7 ${
            selectedKpi === "kyu7" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Kyu 7</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.kyu7}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "kyu6" ? null : "kyu6");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-kyu6 ${
            selectedKpi === "kyu6" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Kyu 6</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.kyu6}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "kyu5_4" ? null : "kyu5_4");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-kyu5_4 ${
            selectedKpi === "kyu5_4" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Kyu 5-4</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.kyu5_4}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "kyu3_2_1" ? null : "kyu3_2_1");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-kyu3_2_1 ${
            selectedKpi === "kyu3_2_1" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Kyu 3-1</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.kyu3_2_1}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "hitam" ? null : "hitam");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-hitam ${
            selectedKpi === "hitam" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">DAN</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.hitam}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedKpi(prev => prev === "non-aktif" ? null : "non-aktif");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-3 py-3 px-3 text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] border rounded-2xl kpi-button kpi-non-aktif ${
            selectedKpi === "non-aktif" ? "selected" : ""
          }`}
        >
          <div className="p-2 icon-container rounded-lg shrink-0">
            <UserMinus size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider truncate">Non-Aktif</p>
            <h4 className="text-lg font-black leading-tight">
              {stats.nonAktif}
            </h4>
          </div>
        </button>
      </div>

      {/* Filter & List Area */}
      <div className="space-y-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={16}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Nama, NIA, NIK, atau Email..."
              className="glass-input w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500/50 transition-all text-white"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1 text-xs py-2.5">
              <Search size={16} />
              Cari Anggota
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-2 hover:border-amber-500/30 transition-all text-white border border-white/10"
              title="Ekspor ke CSV"
            >
              <Download size={14} />
              Ekspor CSV
            </button>
            {dojoId && (
              <button
                type="button"
                onClick={() => router.push("/admin/members")}
                className="btn-secondary text-xs py-2.5 px-3"
                title="Hapus Filter Dojo"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3 relative min-h-[200px]">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <MemberItemSkeleton key={i} />
              ))}
            </div>
          ) : paginatedMembers.length > 0 ? (
            <>
              {/* Card List - Mobile/Tablet */}
              <div className="space-y-3 lg:hidden">
                {paginatedMembers.map((member) => (
                  <AdminMemberListCard
                    key={member.id}
                    member={member}
                    saving={listSavingId === member.id}
                    onOpenDetail={openMemberDetail}
                    patchMemberInline={patchMemberInline}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    canEditNiaSabuk={canEditNiaSabuk}
                    onPreviewDoc={(url, title) => setPreviewDoc({ url, title })}
                  />
                ))}
              </div>

              {/* Table List - Desktop/Large screens */}
              <div className="hidden lg:block glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold bg-white/[0.01]">
                      <tr>
                        <th className="py-4 pl-4 pr-2 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-left w-12">No.</th>
                        <th className="py-4 px-6 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-left">Nama Anggota</th>
                        <th className="py-4 px-4 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-left w-48">NIA</th>
                        <th className="py-4 px-4 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-left w-56">Sabuk & Kyu</th>
                        <th className="py-4 px-4 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-left">Dojo / Ranting</th>
                        <th className="py-4 px-4 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-center w-28">Status</th>
                        <th className="py-4 px-4 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-center w-36">Dokumen</th>
                        <th className="py-4 px-6 font-semibold text-[10px] text-gray-500 uppercase tracking-wider text-center w-52">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedMembers.map((member, index) => {
                        const saving = listSavingId === member.id;
                        const rowNumber = (meta.page - 1) * pageSize + index + 1;
                        return (
                          <AdminMemberTableRow
                            key={member.id}
                            member={member}
                            saving={saving}
                            onOpenDetail={openMemberDetail}
                            onEdit={handleEdit}
                            patchMemberInline={patchMemberInline}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDelete}
                            canEditNiaSabuk={canEditNiaSabuk}
                            rowNumber={rowNumber}
                            onPreviewDoc={(url, title) => setPreviewDoc({ url, title })}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            !loading && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center glass-card border-white/5 bg-white/[0.01]">
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl mb-4">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Anggota Tidak Ditemukan</h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  {search ? `Tidak ada hasil pencarian untuk "${search}". Coba periksa kembali ejaan nama, NIA, NIK, atau email.` : "Tidak ada anggota dalam kategori filter ini."}
                </p>
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-1">
          <div className="flex items-center gap-4">
            <p className="text-[10px] text-gray-500 uppercase font-black">
              Total: <span className="text-white">{meta.total}</span> Anggota
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-black uppercase">Tampilkan:</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const nextLimit = Number(e.target.value);
                    setPageSize(nextLimit);
                    setCurrentPage(1);
                  }}
                  className="glass-input px-2.5 py-1 text-[10px] font-bold appearance-none cursor-pointer pr-7 focus:outline-none"
                  style={{ colorScheme: "dark" }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 disabled:opacity-20 transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center px-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-gray-400">
              Halaman {currentPage} dari {Math.max(1, Math.ceil(meta.total / pageSize))}
            </div>
            <button
              disabled={currentPage * pageSize >= meta.total}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 disabled:opacity-20 transition-all active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      {showAddModal && (
        <AdminModalPortal>
          <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
            <div className="modal-gradient w-full max-w-lg p-5 rounded-2xl shadow-2xl border border-white-10 max-h-[95vh] overflow-y-auto animate-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-widest text-white">
                  {isEdit ? "Ubah Anggota" : "Anggota Baru"}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white-5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  try {
                    if (isEdit && editId) {
                      let payload = { ...(formData as any) };
                      if (!canEditNiaSabuk) {
                        delete payload.nia;
                        delete payload.currentRank;
                      }
                      await api.members.update(editId, payload);
                    } else {
                      let payload = { ...(formData as any) };
                      if (!canEditNiaSabuk) {
                        delete payload.nia;
                        delete payload.currentRank;
                      }
                      await api.members.create(payload);
                    }
                    setShowAddModal(false);
                    resetForm();
                    fetchMembers();
                    toast.success(
                      isEdit
                        ? "Data anggota berhasil diperbarui!"
                        : "Anggota baru berhasil terdaftar!",
                    );
                  } catch (err: any) {
                    const msg =
                      err.response?.data?.message ||
                      err.message ||
                      "Gagal memproses data";
                    toast.error(msg);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-10 font-black uppercase text-amber-500 tracking-widest mb-2 block ml-1 opacity-80">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fullName: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="CONTOH: BUDI SANTOSO"
                      className="glass-input w-full px-4 py-3 text-sm focus-outline-none uppercase font-bold tracking-tight"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">
                        Jenis Kelamin
                      </label>
                      <div className="relative">
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer font-bold focus-outline-none"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">
                        Tanggal Lahir
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="DD/MM/YYYY"
                          readOnly
                          value={
                            dateInput ||
                            (formData.birthDate
                              ? formData.birthDate
                                  .split("-")
                                  .reverse()
                                  .join("/")
                              : "")
                          }
                          onClick={(e) => {
                            const input = e.currentTarget.nextElementSibling
                              ?.nextElementSibling as HTMLInputElement;
                            if (input && input.showPicker) input.showPicker();
                          }}
                          className="glass-input w-full px-4 py-3 text-sm cursor-pointer font-bold focus-outline-none"
                        />
                        <Calendar
                          size={16}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                        <input
                          type="date"
                          className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                          value={formData.birthDate}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              birthDate: e.target.value,
                            });
                            setDateInput(
                              e.target.value.split("-").reverse().join("/"),
                            );
                          }}
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={
                        !canEditNiaSabuk ? "pointer-events-none opacity-80" : ""
                      }
                    >
                      <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">
                        Sabuk
                      </label>
                      <AdminMemberRankSelect
                        value={formData.currentRank}
                        disabled={!canEditNiaSabuk}
                        onChange={(currentRank) =>
                          setFormData({ ...formData, currentRank })
                        }
                        className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer font-bold focus-outline-none"
                      />
                    </div>
                    <div
                      className={
                        !canEditNiaSabuk ? "pointer-events-none opacity-80" : ""
                      }
                    >
                      <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">
                        NIA (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.nia}
                        readOnly={!canEditNiaSabuk}
                        disabled={!canEditNiaSabuk}
                        onChange={(e) =>
                          setFormData({ ...formData, nia: e.target.value })
                        }
                        placeholder="Nomor Induk"
                        className="glass-input w-full px-4 py-3 text-sm font-bold focus-outline-none"
                      />
                    </div>
                  </div>
                  {!canEditNiaSabuk ? (
                    <p className="text-[10px] text-gray-500 leading-relaxed px-1 -mt-2">
                      Sebagai pengurus dojo/ranting Anda tidak dapat mengubah
                      NIA atau sabuk di sini. Hubungi pengurus cabang atau
                      pusat.
                    </p>
                  ) : null}

                  <div className="pt-5 border-t border-white-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-amber-500" />
                      <label className="text-10 font-black uppercase text-amber-500 tracking-widest block leading-none">
                        Kredensial Login
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="nama@email.com"
                          className="glass-input w-full px-4 py-3 text-sm font-bold focus-outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-10 font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1 opacity-80">
                          {isEdit ? "Sandi Baru" : "Kata Sandi"}
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder={
                            isEdit ? "Kosongkan jika tetap" : "Min. 6 karakter"
                          }
                          className="glass-input w-full px-4 py-3 text-sm font-bold focus-outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {user?.managedDojoId ? (
                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/10 space-y-4">
                      <div>
                        <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1.5">
                          Dojo Sekarang
                        </p>
                        <p className="text-sm font-black text-amber-500 uppercase leading-none">
                          {user.managedDojoName}
                        </p>
                      </div>
                    </div>
                  ) : (!dojoId || isEdit ? (
                    <div className="space-y-4 pt-5 border-t border-white-5">
                      <label className="text-10 font-black uppercase text-gray-500 tracking-widest block ml-1 opacity-80">
                        Penempatan Dojo
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <select
                            value={selectedProvinceId}
                            onChange={(e) => {
                              setSelectedProvinceId(e.target.value);
                              setSelectedBranchId("");
                              setDojos([]);
                              setFormData((prev) => ({ ...prev, dojoId: "" }));
                            }}
                            required
                            className="glass-input w-full px-4 py-3 text-sm appearance-none font-bold focus-outline-none"
                            style={{ colorScheme: "dark" }}
                          >
                            <option value="">Provinsi...</option>
                            {provinces.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                          />
                        </div>
                        <div className="relative">
                          <select
                            value={selectedBranchId}
                            onChange={(e) => {
                              setSelectedBranchId(e.target.value);
                              setFormData((prev) => ({ ...prev, dojoId: "" }));
                            }}
                            required
                            disabled={!selectedProvinceId}
                            className="glass-input w-full px-4 py-3 text-sm appearance-none disabled:opacity-30 font-bold focus-outline-none"
                            style={{ colorScheme: "dark" }}
                          >
                            <option value="">Pengcab...</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <select
                          value={formData.dojoId}
                          onChange={(e) =>
                            setFormData({ ...formData, dojoId: e.target.value })
                          }
                          required
                          disabled={!selectedBranchId}
                          className="glass-input w-full px-4 py-3 text-sm appearance-none disabled:opacity-30 font-bold focus-outline-none"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="">Pilih Dojo...</option>
                          {dojos.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/10 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1.5">
                            Wilayah
                          </p>
                          <p className="text-[12px] font-black text-gray-200 uppercase leading-none">
                            {isEdit
                              ? selectedMember?.dojo?.branch?.province?.name
                              : dojoInfo?.branch?.province?.name || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1.5">
                            Pengcab
                          </p>
                          <p className="text-[12px] font-black text-gray-200 uppercase leading-none">
                            {isEdit
                              ? selectedMember?.dojo?.branch?.name
                              : dojoInfo?.branch?.name || "-"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1.5">
                          Dojo Sekarang
                        </p>
                        <p className="text-sm font-black text-amber-500 uppercase leading-none">
                          {isEdit ? selectedMember?.dojo?.name : dojoName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-widest"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (!dojoId && !formData.dojoId)}
                    className="btn-primary flex-[1.5] py-3 shadow-amber-20 text-xs font-black uppercase tracking-widest"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        ...
                      </>
                    ) : isEdit ? (
                      "Simpan"
                    ) : (
                      "Daftar"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* Member Detail Modal */}
      {showDetailModal && selectedMember && (
        <AdminModalPortal>
          <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
            <div 
              className="glass-card-opaque w-full max-w-2xl p-0 animate-in"
              style={{ maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px' }}
            >
              {/* Modal Header/Banner */}
              <div className="h-32 bg-amber-500 relative">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black-20 hover:bg-black-40 text-white rounded-full backdrop-blur-md transition-all z-10"
                >
                  <X size={20} />
                </button>
                <div className="absolute -bottom-12 left-8">
                  <button
                    type="button"
                    onClick={() => window.open(`/v/${selectedMember.id}`, "_blank")}
                    title="Buka Kartu Anggota (Profil)"
                    className="w-24 h-24 rounded-2xl bg-dark-card p-1 border-4 border-white-5 shadow-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer block text-left"
                  >
                    {selectedMember.photoUrl || selectedMember.user?.photoUrl ? (
                      <img
                        src={getAssetUrl(selectedMember.photoUrl || selectedMember.user?.photoUrl)}
                        alt={selectedMember.fullName}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-amber-500 flex items-center justify-center font-bold text-black text-3xl">
                        {selectedMember.fullName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-16 pb-8 mobile-hpad">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-1">
                      {selectedMember.fullName}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0-5 bg-amber-500-10 text-amber-500 rounded text-xs font-bold uppercase border border-amber-500-20">
                        {selectedMember.currentRank}
                      </span>
                      <span className="text-gray-500 text-xs font-mono">
                        {selectedMember.nia || "Belum ada NIA"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${selectedMember.status === "Active" ? "bg-green-500 shadow-lg" : "bg-red-500"}`}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${selectedMember.status === "Active" ? "text-green-500" : "text-red-500"}`}
                      >
                        {selectedMember.status === "Active"
                          ? "Aktif"
                          : "Non-Aktif"}
                      </span>
                    </div>
                    <p className="text-10 text-gray-500 uppercase font-black">
                      Status Keanggotaan
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-3">
                        Informasi Personal
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 bg-white-5 rounded-lg">
                            <Users size={16} className="text-amber-500" />
                          </div>
                          <div>
                            <p className="text-10 text-gray-500 uppercase">
                              Jenis Kelamin
                            </p>
                            <p className="text-sm font-medium">
                              {selectedMember.gender || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 bg-white-5 rounded-lg">
                            <Calendar size={16} className="text-amber-500" />
                          </div>
                          <div>
                            <p className="text-10 text-gray-500 uppercase">
                              Tanggal Lahir
                            </p>
                            <p className="text-sm font-medium">
                              {selectedMember.birthDate
                                ? new Date(
                                    selectedMember.birthDate,
                                  ).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-3">
                        Wilayah & Dojo
                      </p>
                      <div className="p-4 bg-white-5 rounded-2xl border border-white-5 space-y-4">
                        <div>
                          <p className="text-10 text-gray-500 uppercase">
                            Provinsi
                          </p>
                          <p className="text-sm font-bold text-gray-200">
                            {selectedMember.dojo?.branch?.province?.name || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-10 text-gray-500 uppercase">
                            Pengcab
                          </p>
                          <p className="text-sm font-bold text-gray-200">
                            {selectedMember.dojo?.branch?.name || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-10 text-gray-500 uppercase">
                            Dojo
                          </p>
                          <p className="text-sm font-bold text-amber-500">
                            {selectedMember.dojo?.name || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-3">
                    Akun aplikasi (login)
                  </p>
                  {selectedMember.userId ? (
                    <div className="space-y-1">
                      <p className="text-10 text-gray-500 uppercase">Email</p>
                      <p className="text-sm font-bold text-amber-500 break-all">
                        {selectedMember.user?.email ?? "—"}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                        Anggota dapat login dengan email ini atau NIA (jika
                        terdaftar).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Belum ada akun login. Satu klik membuat email sintetis{" "}
                        <span className="font-mono text-gray-300">
                          {selectedMember.nia
                            ? `${String(selectedMember.nia).replace(/\./g, "").toLowerCase()}@inkai.id`
                            : `m.${String(selectedMember.id).replace(/-/g, "").toLowerCase()}@inkai.id`}
                        </span>{" "}
                        dan sandi awal{" "}
                        <span className="font-bold text-amber-500/90">123456</span>
                        .
                      </p>
                      <button
                        type="button"
                        disabled={provisionLoginBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleProvisionLogin();
                        }}
                        className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        {provisionLoginBusy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <UserPlus size={14} />
                        )}
                        Buat akun login
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-1">
                      Kebijakan & Dispensasi
                    </p>
                    <p className="text-xs text-gray-300 font-bold mb-1">
                      Dispensasi Tunggakan Iuran
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Izinkan anggota ini mendaftar event meskipun memiliki tunggakan iuran bulanan.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={listSavingId === selectedMember.id}
                    onClick={async () => {
                      const nextVal = !selectedMember.allowEventWithoutDues;
                      await patchMemberInline(selectedMember.id, {
                        allowEventWithoutDues: nextVal
                      } as any);
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border ${
                      selectedMember.allowEventWithoutDues
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {listSavingId === selectedMember.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : selectedMember.allowEventWithoutDues ? (
                      "AKTIF"
                    ) : (
                      "MATI"
                    )}
                  </button>
                </div>

                <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">
                      Pengaturan Keuangan
                    </p>
                    <p className="text-xs text-gray-300 font-bold mb-1">
                      Nominal Iuran Bulanan
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Atur besaran nominal iuran bulanan kustom khusus untuk anggota ini.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', pointerEvents: 'none' }}>Rp</span>
                      <input
                        type="number"
                        defaultValue={selectedMember.monthlyDuesAmount ?? 50000}
                        id={`dues-amount-${selectedMember.id}`}
                        placeholder="50000"
                        className="glass-input"
                        style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px', height: '42px', fontSize: '13px', fontWeight: 'bold' }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={listSavingId === selectedMember.id}
                      onClick={async () => {
                        const inputEl = document.getElementById(`dues-amount-${selectedMember.id}`) as HTMLInputElement;
                        const newAmount = inputEl ? Number(inputEl.value) : 50000;
                        await patchMemberInline(selectedMember.id, {
                          monthlyDuesAmount: newAmount
                        } as any);
                      }}
                      className="btn-primary"
                      style={{ padding: '0 24px', height: '42px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {listSavingId === selectedMember.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "SIMPAN"
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-10 border-t border-white/10 pt-8">
                  <p className="text-10 font-black uppercase text-gray-500 tracking-widest mb-4">
                    Riwayat kenaikan tingkat
                  </p>
                  {memberDetailLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2
                        className="animate-spin text-amber-500"
                        size={28}
                      />
                    </div>
                  ) : Array.isArray(selectedMember.ranks) &&
                    selectedMember.ranks.length > 0 ? (
                    <>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {selectedMember.ranks.map((r: any) => (
                          <div
                            key={r.id}
                            className="flex items-start justify-between gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white">
                                {r.rank}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {r.date
                                  ? new Date(r.date).toLocaleDateString(
                                      "id-ID",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )
                                  : "-"}{" "}
                                · Lokasi:{" "}
                                {(r.location && String(r.location).trim()) ||
                                  "—"}
                              </p>
                              <p className="text-[10px] mt-1 font-bold uppercase tracking-wider text-amber-500/80">
                                {r.isVerified
                                  ? "Terverifikasi"
                                  : "Belum terverifikasi"}
                              </p>
                            </div>
                            {canEditNiaSabuk ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRankEditModal(r);
                                }}
                                className="shrink-0 p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25 hover:bg-amber-500/25 transition-all"
                                title="Perbaiki data tingkat"
                                aria-label="Edit riwayat tingkat"
                              >
                                <Pencil size={16} />
                              </button>
                            ) : (
                              <span className="shrink-0 text-[9px] text-gray-600 font-black uppercase tracking-wider self-center max-w-[72px] text-right leading-tight">
                                Hanya pusat/cabang
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-600 mt-3 italic">
                        {canEditNiaSabuk
                          ? "Admin dapat memperbaiki lokasi, tanggal, atau nama tingkat bila ada kesalahan dari pengajuan anggota."
                          : "Riwayat sabuk bersifat laporan; penyuntingan hanya oleh pengurus cabang atau pusat."}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 leading-relaxed py-2">
                      Belum ada baris riwayat tingkat. Data di sini muncul
                      setelah pengajuan kenaikan sabuk disetujui di Antrean
                      Kerja, atau dapat ditambah/diperbaiki lewat edit riwayat
                      jika fitur tersedia.
                    </p>
                  )}
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="btn-secondary flex-1 min-w-[120px] py-3 text-xs font-bold"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(selectedMember.id);
                    }}
                    className="flex-1 min-w-[140px] py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(selectedMember);
                    }}
                    className={`flex-1 min-w-[140px] py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      selectedMember.status === "Active"
                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                        : "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                    }`}
                  >
                    {selectedMember.status === "Active" ? (
                      <UserMinus size={14} />
                    ) : (
                      <UserCheck size={14} />
                    )}
                    {selectedMember.status === "Active"
                      ? "Non-Aktif"
                      : "Aktifkan"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResetPasswordValue("123456");
                      setShowResetModal(true);
                    }}
                    disabled={isSubmitting || !selectedMember.userId}
                    title={
                      !selectedMember.userId
                        ? "Buat akun login terlebih dahulu"
                        : undefined
                    }
                    className="flex-1 min-w-[140px] py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/5 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <UserCheck size={14} />
                    Reset Sandi
                  </button>
                  <button
                    onClick={() => handleEdit(selectedMember)}
                    className="btn-primary flex-1 min-w-[160px] py-3 shadow-amber-20 text-xs"
                  >
                    Ubah Data
                  </button>
                </div>
              </div>

              {/* Premium Input Modal (Reset Password) */}
              {showResetModal && (
                <AdminModalPortal>
                  <div className="admin-modal-overlay admin-modal-overlay--dialog admin-modal-overlay--stack animate-in fade-in">
                    <div className="glass-card-opaque w-full max-w-sm p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
                      <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserCheck size={32} />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2 text-center">
                        Reset Sandi
                      </h3>
                      <p className="text-xs text-gray-500 mb-6 text-center uppercase font-bold tracking-widest">
                        {selectedMember?.fullName}
                      </p>

                      <div className="mb-8">
                        <label className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-3 block opacity-80">
                          Sandi Baru
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={resetPasswordValue}
                          onChange={(e) =>
                            setResetPasswordValue(e.target.value)
                          }
                          placeholder="123456"
                          className="glass-input w-full px-5 py-4 text-center text-lg font-black tracking-[0.3em] focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={handleResetPassword}
                          disabled={isSubmitting}
                          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3"
                        >
                          {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <UserCheck size={20} />
                          )}
                          Simpan Sandi
                        </button>
                        <button
                          onClick={() => setShowResetModal(false)}
                          className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black uppercase tracking-widest transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                </AdminModalPortal>
              )}

              {showRankEditModal && editingRank && selectedMember && (
                <AdminModalPortal>
                  <div className="admin-modal-overlay admin-modal-overlay--dialog admin-modal-overlay--stack animate-in fade-in">
                    <div className="glass-card-opaque w-full max-w-md p-6 border border-white/15 shadow-2xl animate-in zoom-in-95">
                      <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">
                        Edit riwayat tingkat
                      </h3>
                      <p className="text-[10px] text-gray-500 mb-6 uppercase font-bold tracking-wider">
                        {selectedMember.fullName}
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-amber-500 tracking-widest block mb-2">
                            Tingkatan
                          </label>
                          <input
                            type="text"
                            value={rankEditForm.rank}
                            onChange={(e) =>
                              setRankEditForm({
                                ...rankEditForm,
                                rank: e.target.value,
                              })
                            }
                            className="glass-input w-full px-4 py-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">
                            Tanggal
                          </label>
                          <input
                            type="date"
                            value={rankEditForm.date}
                            onChange={(e) =>
                              setRankEditForm({
                                ...rankEditForm,
                                date: e.target.value,
                              })
                            }
                            className="glass-input w-full px-4 py-3 text-sm"
                            style={{ colorScheme: "dark" }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">
                            Lokasi
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Dojo Pusat, Jakarta"
                            value={rankEditForm.location}
                            onChange={(e) =>
                              setRankEditForm({
                                ...rankEditForm,
                                location: e.target.value,
                              })
                            }
                            className="glass-input w-full px-4 py-3 text-sm"
                          />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={rankEditForm.isVerified}
                            onChange={(e) =>
                              setRankEditForm({
                                ...rankEditForm,
                                isVerified: e.target.checked,
                              })
                            }
                            className="rounded border-white/20"
                          />
                          <span>Terverifikasi pusat</span>
                        </label>
                      </div>

                      <div className="flex gap-3 mt-8">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRankEditModal(false);
                            setEditingRank(null);
                          }}
                          disabled={isSubmitting}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveMemberRank}
                          disabled={isSubmitting}
                          className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : null}
                          Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                </AdminModalPortal>
              )}
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <AdminModalPortal>
          <div className="admin-modal-overlay admin-modal-overlay--dialog animate-in fade-in">
            <div className="modal-gradient w-full max-w-2xl p-6 rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] flex flex-col animate-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-white">
                    Impor Massal
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                    Tempel data dari Excel atau Teks
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-1.5 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 space-y-2">
                  <p className="text-[9px] font-black uppercase text-amber-500">
                    Petunjuk Format:
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Format per baris:{" "}
                    <code className="text-amber-500">
                      NIA [tab] Nama [tab] Tempat, Tgl Lahir [tab] P/L [tab]
                      Alamat
                    </code>
                    <br />
                    Contoh:{" "}
                    <code className="text-gray-500">
                      26.37619 [tab] Beatrix Sharon [tab] Surabaya, 28 Februari
                      2011 [tab] P [tab] Alamat...
                    </code>
                  </p>
                  {!canEditNiaSabuk ? (
                    <p className="text-[10px] text-gray-500 leading-relaxed border-t border-amber-500/10 pt-2 mt-2">
                      Akun Anda (pengurus dojo/ranting): kolom NIA pada impor
                      akan diabaikan sistem; tingkat sabuk baru anggota diset
                      Putih Kyu awal sampai dicatat pusat/cabang.
                    </p>
                  ) : null}
                </div>

                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Tempel data di sini..."
                  className="flex-1 w-full bg-black-40 border border-white/10 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-amber-500/50 text-gray-300 resize-none"
                />

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">
                    Pilih Dojo Tujuan
                  </label>
                  <div className="relative">
                    <select
                      value={formData.dojoId}
                      onChange={(e) =>
                        setFormData({ ...formData, dojoId: e.target.value })
                      }
                      className="glass-input w-full px-4 py-3 text-xs appearance-none font-bold"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">Pilih Dojo...</option>
                      {dojos.length > 0 ? (
                        dojos.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))
                      ) : dojoId ? (
                        <option value={dojoId}>{dojoName}</option>
                      ) : null}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold uppercase"
                >
                  Batal
                </button>
                <button
                  disabled={
                    isBulkImporting || !bulkText.trim() || !formData.dojoId
                  }
                  onClick={async () => {
                    setIsBulkImporting(true);
                    try {
                      const lines = bulkText
                        .split("\n")
                        .filter((l) => l.trim() !== "");
                      const membersToImport = lines
                        .map((line) => {
                          // Split by tab or multiple spaces
                          const cols = line
                            .split(/\t| {2,}/)
                            .map((c) => c.trim());
                          if (cols.length < 2) return null;

                          // Map based on the user's provided structure
                          // NO. INDUK | NAMA | TEMPAT TANGGAL LAHIR | JENIS KELAMIN | ALAMAT
                          const [
                            nia,
                            fullName,
                            birthInfo,
                            genderCode,
                            address,
                          ] = cols;

                          // Parsing date like "Surabaya, 28 Februari 2011"
                          let birthDate = undefined;
                          if (birthInfo && birthInfo.includes(",")) {
                            const datePart = birthInfo.split(",")[1].trim();
                            const months = [
                              "januari",
                              "februari",
                              "maret",
                              "april",
                              "mei",
                              "juni",
                              "juli",
                              "agustus",
                              "september",
                              "oktober",
                              "november",
                              "desember",
                            ];
                            const dp = datePart.split(" ");
                            if (dp.length === 3) {
                              const monthIdx = months.indexOf(
                                dp[1].toLowerCase(),
                              );
                              if (monthIdx !== -1) {
                                birthDate = new Date(
                                  parseInt(dp[2]),
                                  monthIdx,
                                  parseInt(dp[0]),
                                ).toISOString();
                              }
                            }
                          }

                          return {
                            nia: nia || undefined,
                            fullName: fullName?.toUpperCase(),
                            birthDate,
                            gender:
                              genderCode?.toUpperCase() === "P"
                                ? "Perempuan"
                                : "Laki-laki",
                            address: address?.toUpperCase(),
                            dojoId: formData.dojoId,
                            status: "Active",
                          };
                        })
                        .filter(Boolean);

                      if (membersToImport.length === 0) {
                        throw new Error(
                          "Tidak ada data yang valid untuk diimpor",
                        );
                      }

                      const res = await api.members.bulkCreate({
                        members: membersToImport,
                      });
                      toast.success(
                        res.message ||
                          `Berhasil mengimpor ${res.data.success} anggota`,
                      );

                      if (res.data.failed > 0) {
                        console.error(
                          "Beberapa data gagal diimpor:",
                          res.data.errors,
                        );
                      }

                      setShowBulkModal(false);
                      setBulkText("");
                      fetchMembers();
                    } catch (err: any) {
                      toast.error(err.message || "Gagal mengimpor data");
                    } finally {
                      setIsBulkImporting(false);
                    }
                  }}
                  className="btn-primary flex-[1.5] py-3 text-xs font-black uppercase tracking-widest"
                >
                  {isBulkImporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    `Impor ${bulkText.split("\n").filter((l) => l.trim()).length} Baris`
                  )}
                </button>
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}

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
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-amber-500" size={40} />
        </div>
      }
    >
      <MembersContent />
    </Suspense>
  );
}
