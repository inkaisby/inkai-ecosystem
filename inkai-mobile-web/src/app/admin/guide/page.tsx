"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScrollText,
  Loader2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  FALLBACK_MEMBER_GUIDE,
  fetchMemberGuideResolved,
  type MemberWelcomeGuideJson,
} from "@/lib/memberGuide";

type ItemRow = { heading: string; text: string };

type GuideForm = {
  version: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  footer: string;
  primaryCtaLabel: string;
  fullGuideLinkLabel: string;
  fullGuidePath: string;
  items: ItemRow[];
};

function guideToForm(g: MemberWelcomeGuideJson): GuideForm {
  return {
    version: g.version,
    enabled: g.enabled !== false,
    title: g.title,
    subtitle: g.subtitle ?? "",
    footer: g.footer ?? "",
    primaryCtaLabel: g.primaryCtaLabel ?? "",
    fullGuideLinkLabel: g.fullGuideLinkLabel ?? "",
    fullGuidePath: g.fullGuidePath ?? "/guide",
    items:
      g.items?.length > 0
        ? g.items.map((i) => ({ heading: i.heading, text: i.text }))
        : [{ heading: "", text: "" }],
  };
}

function formToPayload(f: GuideForm): MemberWelcomeGuideJson {
  const items = f.items
    .map((i) => ({
      heading: i.heading.trim(),
      text: i.text.trim(),
    }))
    .filter((i) => i.heading.length > 0 && i.text.length > 0);

  const payload: MemberWelcomeGuideJson = {
    version: f.version.trim(),
    enabled: f.enabled,
    title: f.title.trim(),
    items,
  };
  if (f.subtitle.trim()) payload.subtitle = f.subtitle.trim();
  if (f.footer.trim()) payload.footer = f.footer.trim();
  if (f.primaryCtaLabel.trim()) payload.primaryCtaLabel = f.primaryCtaLabel.trim();
  if (f.fullGuideLinkLabel.trim())
    payload.fullGuideLinkLabel = f.fullGuideLinkLabel.trim();
  const path = f.fullGuidePath.trim() || "/guide";
  payload.fullGuidePath = path;
  return payload;
}

const inputClass =
  "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50";
const labelClass =
  "text-xs text-gray-500 uppercase font-bold tracking-widest mb-2 block";

export default function AdminMemberGuidePage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const [form, setForm] = useState<GuideForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.replace("/dashboard");
      return;
    }
    let cancelled = false;
    fetchMemberGuideResolved().then((g) => {
      if (!cancelled) {
        setForm(guideToForm(g));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, isAdmin, router]);

  const loadDefault = () => {
    setForm(guideToForm(FALLBACK_MEMBER_GUIDE));
    toast.success("Form diisi dari contoh bawaan. Silakan ubah teks lalu simpan.");
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) =>
      prev ? { ...prev, items: [...prev.items, { heading: "", text: "" }] } : prev,
    );
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      if (!prev || prev.items.length <= 1) return prev;
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items };
    });
  };

  const save = async () => {
    if (!form) return;
    const payload = formToPayload(form);
    if (!payload.version) {
      toast.error('Isi "Versi" (nomor saja, contoh: 1 atau 2).');
      return;
    }
    if (!payload.title) {
      toast.error("Judul utama tidak boleh kosong.");
      return;
    }
    if (payload.items.length === 0) {
      toast.error(
        "Minimal satu poin panduan: isi Judul singkat dan Penjelasan di setiap baris.",
      );
      return;
    }
    setSaving(true);
    try {
      await api.memberGuide.save(payload as unknown as Record<string, unknown>);
      toast.success(
        "Tersimpan. Jika Anda mengubah isi penting, naikkan Versi (mis. 2 → 3) agar popup panduan muncul lagi ke anggota yang sudah menutupnya.",
      );
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "message" in e.response.data
          ? String((e.response.data as { message?: string }).message)
          : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <ScrollText size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">
              Konten app anggota
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Panduan mobile (anggota)</h2>
          <p className="text-gray-500 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
            Ubah teks di bawah seperti mengisi formulir biasa —{" "}
            <strong className="text-gray-400">tidak perlu mengedit kode</strong>.
            Yang tampil di aplikasi anggota: popup sambutan (jika diaktifkan) dan halaman
            Panduan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-3 w-full max-w-full">
          <button
            type="button"
            onClick={loadDefault}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--surface-row-border)] bg-[var(--surface-row-bg)] text-[var(--text-light)] shadow-sm text-sm font-semibold hover:brightness-[0.96] px-3 py-2.5 min-h-[44px] text-center leading-snug sm:px-4 sm:shrink-0"
          >
            <RotateCcw size={18} className="shrink-0" aria-hidden />
            <span>Muat contoh bawaan</span>
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50 px-3 py-2.5 min-h-[44px] text-center leading-snug sm:px-5 sm:shrink-0"
          >
            {saving ? (
              <Loader2 className="animate-spin shrink-0" size={18} />
            ) : (
              <Save size={18} className="shrink-0" aria-hidden />
            )}
            <span>Simpan ke server</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 text-sm text-[var(--text-muted)]">
        <Info className="shrink-0 text-amber-500 mt-0.5" size={20} />
        <div className="space-y-2">
          <p>
            <strong className="text-[var(--primary-gold)]">Versi:</strong> setiap kali Anda mengubah
            isi penting, ganti nomor ini (contoh 1 → 2). Anggota yang sudah menekan
            &quot;Mengerti&quot; akan melihat popup lagi dengan teks baru.
          </p>
          <p>
            <strong className="text-[var(--primary-gold)]">Poin panduan:</strong> tiap blok punya
            judul kecil (mis. &quot;Dashboard&quot;) dan penjelasan satu atau dua kalimat.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Versi (wajib)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.version}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, version: e.target.value } : f))
              }
              className={inputClass}
              placeholder="Contoh: 2"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, enabled: e.target.checked } : f))
                }
                className="w-5 h-5 rounded border-white/20 bg-black/40 text-amber-500 focus:ring-amber-500/40"
              />
              Tampilkan panduan (popup &amp; halaman)
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>Judul utama</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, title: e.target.value } : f))
            }
            className={inputClass}
            placeholder="Contoh: Panduan singkat"
          />
        </div>

        <div>
          <label className={labelClass}>Pembuka (opsional)</label>
          <textarea
            rows={2}
            value={form.subtitle}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, subtitle: e.target.value } : f))
            }
            className={`${inputClass} resize-y min-h-[72px]`}
            placeholder="Kalimat pengantar di bawah judul..."
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Poin panduan
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-xs font-bold text-amber-400 hover:bg-white/5"
            >
              <Plus size={16} />
              Tambah poin
            </button>
          </div>
          {form.items.map((row, index) => (
            <div
              key={index}
              className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3"
            >
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-bold text-gray-500">
                  Poin {index + 1}
                </span>
                {form.items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                    aria-label={`Hapus poin ${index + 1}`}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : null}
              </div>
              <div>
                <label className={labelClass}>Judul singkat</label>
                <input
                  type="text"
                  value={row.heading}
                  onChange={(e) => updateItem(index, "heading", e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: Dashboard"
                />
              </div>
              <div>
                <label className={labelClass}>Penjelasan</label>
                <textarea
                  rows={3}
                  value={row.text}
                  onChange={(e) => updateItem(index, "text", e.target.value)}
                  className={`${inputClass} resize-y`}
                  placeholder="Jelaskan singkat untuk anggota..."
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className={labelClass}>Penutup (opsional)</label>
          <textarea
            rows={2}
            value={form.footer}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, footer: e.target.value } : f))
            }
            className={`${inputClass} resize-y min-h-[72px]`}
            placeholder="Catatan di akhir halaman panduan..."
          />
        </div>

        <div className="border-t border-white/10 pt-8 space-y-6">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Teks tombol popup (opsional)
          </p>
          <div>
            <label className={labelClass}>Tombol utama (tutup popup)</label>
            <input
              type="text"
              value={form.primaryCtaLabel}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, primaryCtaLabel: e.target.value } : f))
              }
              className={inputClass}
              placeholder="Contoh: Mengerti, jangan tampilkan lagi"
            />
          </div>
          <div>
            <label className={labelClass}>Tombol kedua — label</label>
            <input
              type="text"
              value={form.fullGuideLinkLabel}
              onChange={(e) =>
                setForm((f) =>
                  f ? { ...f, fullGuideLinkLabel: e.target.value } : f,
                )
              }
              className={inputClass}
              placeholder="Contoh: Buka halaman panduan"
            />
          </div>
          <div>
            <label className={labelClass}>Tombol kedua — halaman tujuan</label>
            <input
              type="text"
              value={form.fullGuidePath}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, fullGuidePath: e.target.value } : f))
              }
              className={inputClass}
              placeholder="/guide"
            />
            <p className="text-xs text-gray-600 mt-2">
              Biasanya dibiarkan <code className="text-amber-500/80">/guide</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
