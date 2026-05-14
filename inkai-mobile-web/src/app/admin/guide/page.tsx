"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Loader2, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  FALLBACK_MEMBER_GUIDE,
  fetchMemberGuideResolved,
} from "@/lib/memberGuide";

export default function AdminMemberGuidePage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const [raw, setRaw] = useState("");
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
        setRaw(JSON.stringify(g, null, 2));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, isAdmin, router]);

  const loadDefault = () => {
    setRaw(JSON.stringify(FALLBACK_MEMBER_GUIDE, null, 2));
    toast.success("Diisi dari bawaan file guide/member-welcome.json");
  };

  const save = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      toast.error("JSON tidak valid — periksa koma dan tanda kutip");
      return;
    }
    setSaving(true);
    try {
      await api.memberGuide.save(parsed as Record<string, unknown>);
      toast.success(
        "Tersimpan. Ubah field version (mis. 1 → 2) agar popup panduan tampil lagi bagi yang sudah menutupnya.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <ScrollText size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">
              Konten app anggota
            </span>
          </div>
          <h2 className="text-3xl font-bold">Panduan mobile (anggota)</h2>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Mengedit teks popup sambutan dan halaman /guide. Wajib field:{" "}
            <code className="text-amber-500/90">version</code>,{" "}
            <code className="text-amber-500/90">title</code>,{" "}
            <code className="text-amber-500/90">items</code> (array judul & teks).
            Setelah mengubah isi penting, naikkan{" "}
            <code className="text-amber-500/90">version</code> agar anggota
            melihat popup lagi.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadDefault}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/5"
          >
            <RotateCcw size={18} />
            Muat bawaan
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Simpan ke server
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121215] overflow-hidden">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[480px] p-4 font-mono text-sm text-gray-200 bg-transparent focus:outline-none resize-y"
          aria-label="JSON panduan anggota"
        />
      </div>
    </div>
  );
}
