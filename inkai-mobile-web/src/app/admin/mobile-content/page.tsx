"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Layers,
  Calendar,
  Compass,
  Users,
  Eye,
  FileText,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type TabId = "home" | "sejarah" | "lambang" | "organisasi" | "visi-misi" | "carousel";

const inputClass =
  "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50";
const labelClass =
  "text-xs text-gray-500 uppercase font-bold tracking-widest mb-2 block";

export default function MobileContentEditor() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Raw Database Tab Data
  const [dbTabs, setDbTabs] = useState<any[]>([]);

  // Structured Form States
  const [homeForm, setHomeForm] = useState({ heroTitle: "", subtitle: "", teksSambutan: "" });
  const [sejarahForm, setSejarahForm] = useState<Array<{ tahun: string; judul: string; deskripsi: string }>>([]);
  const [lambangForm, setLambangForm] = useState<Array<{ simbol: string; makna: string }>>([]);
  const [organisasiForm, setOrganisasiForm] = useState<Array<{ level: string; anggota: Array<{ nama: string; jabatan: string; foto: string }> }>>([]);
  const [visiMisiForm, setVisiMisiForm] = useState({ visi: "", misi: [] as string[] });
  
  // Carousel state
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [carouselForm, setCarouselForm] = useState({ id: "", title: "", imageUrl: "", targetUrl: "", order: 0, isActive: true });
  const [isEditingCarousel, setIsEditingCarousel] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const hasAccess = isAdmin && Array.isArray(user?.roles) && user.roles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === "ADMINISTRATOR" || roleName === "ADMIN_PUSAT";
    });
    if (!hasAccess) {
      router.replace("/admin");
      return;
    }
    fetchData();
  }, [authLoading, user, isAdmin, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tabsRes, carouselRes] = await Promise.all([
        api.navTabs.getAll({ all: "true" }),
        api.newsCarousel.getAll({ all: "true" })
      ]);

      if (tabsRes.status === "success") {
        setDbTabs(tabsRes.data);
        
        // Parse individual page contents
        const homeTab = tabsRes.data.find((t: any) => t.slug === "home");
        if (homeTab) {
          try {
            const parsed = JSON.parse(homeTab.content);
            setHomeForm({
              heroTitle: parsed.heroTitle || "",
              subtitle: parsed.subtitle || "",
              teksSambutan: parsed.teksSambutan || ""
            });
          } catch {
            setHomeForm({ heroTitle: "Selamat Datang di INKAI", subtitle: "Institut Karate-Do Indonesia", teksSambutan: homeTab.content });
          }
        }

        const sejarahTab = tabsRes.data.find((t: any) => t.slug === "sejarah");
        if (sejarahTab) {
          try {
            const parsed = JSON.parse(sejarahTab.content);
            setSejarahForm(Array.isArray(parsed.timeline) ? parsed.timeline : []);
          } catch {
            setSejarahForm([{ tahun: "1971", judul: "Pendirian INKAI", deskripsi: sejarahTab.content }]);
          }
        }

        const lambangTab = tabsRes.data.find((t: any) => t.slug === "makna-lambang");
        if (lambangTab) {
          try {
            const parsed = JSON.parse(lambangTab.content);
            setLambangForm(Array.isArray(parsed.simbolMakna) ? parsed.simbolMakna : []);
          } catch {
            setLambangForm([{ simbol: "Bulatan Merah", makna: lambangTab.content }]);
          }
        }

        const orgTab = tabsRes.data.find((t: any) => t.slug === "struktur-organisasi");
        if (orgTab) {
          try {
            const parsed = JSON.parse(orgTab.content);
            setOrganisasiForm(Array.isArray(parsed.struktur) ? parsed.struktur : []);
          } catch {
            setOrganisasiForm([{ level: "Dewan Guru", anggota: [{ nama: "Shihan H. Syahril", jabatan: "Ketua Dewan Guru", foto: "" }] }]);
          }
        }

        const vmTab = tabsRes.data.find((t: any) => t.slug === "visi-misi");
        if (vmTab) {
          try {
            const parsed = JSON.parse(vmTab.content);
            setVisiMisiForm({
              visi: parsed.visi || "",
              misi: Array.isArray(parsed.misi) ? parsed.misi : []
            });
          } catch {
            setVisiMisiForm({ visi: "Menjadi perguruan terbaik", misi: [vmTab.content] });
          }
        }
      }

      if (carouselRes.status === "success") {
        setCarouselItems(carouselRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data konten");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTab = async (slug: string, contentData: any) => {
    const matched = dbTabs.find((t) => t.slug === slug);
    if (!matched) {
      toast.error(`Tab ${slug} tidak ditemukan di database.`);
      return;
    }
    setSaving(true);
    try {
      await api.navTabs.update(matched.id, {
        content: JSON.stringify(contentData)
      });
      toast.success("Berhasil memperbarui konten!");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  // Timeline handlers
  const addTimelineItem = () => {
    setSejarahForm([...sejarahForm, { tahun: "", judul: "", deskripsi: "" }]);
  };
  const removeTimelineItem = (idx: number) => {
    setSejarahForm(sejarahForm.filter((_, i) => i !== idx));
  };
  const updateTimelineItem = (idx: number, field: string, val: string) => {
    const updated = [...sejarahForm];
    updated[idx] = { ...updated[idx], [field]: val };
    setSejarahForm(updated);
  };

  // Simbol Makna handlers
  const addLambangItem = () => {
    setLambangForm([...lambangForm, { simbol: "", makna: "" }]);
  };
  const removeLambangItem = (idx: number) => {
    setLambangForm(lambangForm.filter((_, i) => i !== idx));
  };
  const updateLambangItem = (idx: number, field: string, val: string) => {
    const updated = [...lambangForm];
    updated[idx] = { ...updated[idx], [field]: val };
    setLambangForm(updated);
  };

  // Organisasi Level handlers
  const addOrgLevel = () => {
    setOrganisasiForm([...organisasiForm, { level: "", anggota: [] }]);
  };
  const removeOrgLevel = (lvlIdx: number) => {
    setOrganisasiForm(organisasiForm.filter((_, i) => i !== lvlIdx));
  };
  const addOrgMember = (lvlIdx: number) => {
    const updated = [...organisasiForm];
    updated[lvlIdx].anggota.push({ nama: "", jabatan: "", foto: "" });
    setOrganisasiForm(updated);
  };
  const removeOrgMember = (lvlIdx: number, memIdx: number) => {
    const updated = [...organisasiForm];
    updated[lvlIdx].anggota = updated[lvlIdx].anggota.filter((_, i) => i !== memIdx);
    setOrganisasiForm(updated);
  };
  const updateOrgMember = (lvlIdx: number, memIdx: number, field: string, val: string) => {
    const updated = [...organisasiForm];
    updated[lvlIdx].anggota[memIdx] = { ...updated[lvlIdx].anggota[memIdx], [field]: val };
    setOrganisasiForm(updated);
  };

  // Visi Misi handlers
  const addMisiItem = () => {
    setVisiMisiForm({ ...visiMisiForm, misi: [...visiMisiForm.misi, ""] });
  };
  const removeMisiItem = (idx: number) => {
    setVisiMisiForm({ ...visiMisiForm, misi: visiMisiForm.misi.filter((_, i) => i !== idx) });
  };
  const updateMisiItem = (idx: number, val: string) => {
    const updatedMisi = [...visiMisiForm.misi];
    updatedMisi[idx] = val;
    setVisiMisiForm({ ...visiMisiForm, misi: updatedMisi });
  };

  // Carousel actions
  const handleSaveCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carouselForm.title || !carouselForm.imageUrl) {
      toast.error("Judul & Gambar Slide wajib diisi!");
      return;
    }
    setSaving(true);
    try {
      if (isEditingCarousel) {
        await api.newsCarousel.update(carouselForm.id, carouselForm);
        toast.success("Berhasil memperbarui slide!");
      } else {
        await api.newsCarousel.create(carouselForm);
        toast.success("Berhasil menambah slide!");
      }
      setCarouselForm({ id: "", title: "", imageUrl: "", targetUrl: "", order: 0, isActive: true });
      setIsEditingCarousel(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan slide");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCarousel = (item: any) => {
    setCarouselForm({
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      targetUrl: item.targetUrl || "",
      order: item.order || 0,
      isActive: item.isActive !== false
    });
    setIsEditingCarousel(true);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleDeleteCarousel = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus slide ini?")) return;
    try {
      await api.newsCarousel.delete(id);
      toast.success("Slide berhasil dihapus!");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus slide");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16 px-4">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-white uppercase tracking-wider">
          Kelola Konten Mobile
        </h2>
        <p className="text-xs text-gray-500">
          Ubah konten visual dan informasi yang ditampilkan pada aplikasi mobile anggota INKAI.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-white/5">
        {(
          [
            { id: "home", label: "Home", icon: Compass },
            { id: "sejarah", label: "Sejarah", icon: Calendar },
            { id: "lambang", label: "Lambang", icon: Layers },
            { id: "organisasi", label: "Organisasi", icon: Users },
            { id: "visi-misi", label: "Visi & Misi", icon: FileText },
            { id: "carousel", label: "Carousel", icon: ImageIcon }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all border ${
                activeTab === tab.id
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panel */}
      <div className="glass-card p-6 border-white/5 space-y-6">
        {/* 1. HOME TAB */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Editor Home Screen</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Hero Title</label>
                <input
                  type="text"
                  value={homeForm.heroTitle}
                  onChange={(e) => setHomeForm({ ...homeForm, heroTitle: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: Selamat Datang di INKAI"
                />
              </div>
              <div>
                <label className={labelClass}>Hero Subtitle</label>
                <input
                  type="text"
                  value={homeForm.subtitle}
                  onChange={(e) => setHomeForm({ ...homeForm, subtitle: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: Perguruan Karate Tertua & Terbesar"
                />
              </div>
              <div>
                <label className={labelClass}>Teks Sambutan</label>
                <textarea
                  rows={6}
                  value={homeForm.teksSambutan}
                  onChange={(e) => setHomeForm({ ...homeForm, teksSambutan: e.target.value })}
                  className={`${inputClass} resize-y`}
                  placeholder="Kalimat pembuka & selamat datang untuk anggota..."
                />
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveTab("home", homeForm)}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Simpan Home Screen</span>
            </button>
          </div>
        )}

        {/* 2. SEJARAH TIMELINE TAB */}
        {activeTab === "sejarah" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Timeline Sejarah</h3>
              <button
                type="button"
                onClick={addTimelineItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 text-xs font-bold text-amber-500 hover:bg-amber-500/10"
              >
                <Plus size={14} />
                Tambah Peristiwa
              </button>
            </div>

            <div className="space-y-4">
              {sejarahForm.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic text-xs">Belum ada peristiwa dalam timeline.</div>
              ) : (
                sejarahForm.map((item, idx) => (
                  <div key={idx} className="p-4 bg-black/20 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-500/70">Peristiwa #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTimelineItem(idx)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Tahun</label>
                        <input
                          type="text"
                          value={item.tahun}
                          onChange={(e) => updateTimelineItem(idx, "tahun", e.target.value)}
                          className={inputClass}
                          placeholder="Contoh: 1971"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelClass}>Judul Peristiwa</label>
                        <input
                          type="text"
                          value={item.judul}
                          onChange={(e) => updateTimelineItem(idx, "judul", e.target.value)}
                          className={inputClass}
                          placeholder="Nama peristiwa..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Deskripsi Lengkap</label>
                      <textarea
                        rows={2}
                        value={item.deskripsi}
                        onChange={(e) => updateTimelineItem(idx, "deskripsi", e.target.value)}
                        className={`${inputClass} resize-y`}
                        placeholder="Detail sejarah singkat..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveTab("sejarah", { timeline: sejarahForm })}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Simpan Timeline Sejarah</span>
            </button>
          </div>
        )}

        {/* 3. MAKNA LAMBANG TAB */}
        {activeTab === "lambang" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simbol & Makna Lambang</h3>
              <button
                type="button"
                onClick={addLambangItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 text-xs font-bold text-amber-500 hover:bg-amber-500/10"
              >
                <Plus size={14} />
                Tambah Simbol
              </button>
            </div>

            <div className="space-y-4">
              {lambangForm.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic text-xs">Belum ada makna lambang terdefinisi.</div>
              ) : (
                lambangForm.map((item, idx) => (
                  <div key={idx} className="p-4 bg-black/20 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-500/70">Elemen Lambang #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeLambangItem(idx)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                      <label className={labelClass}>Simbol / Nama Bagian</label>
                      <input
                        type="text"
                        value={item.simbol}
                        onChange={(e) => updateLambangItem(idx, "simbol", e.target.value)}
                        className={inputClass}
                        placeholder="Contoh: Bulatan Merah (Hinomaru)"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Arti & Filosofi</label>
                      <textarea
                        rows={2}
                        value={item.makna}
                        onChange={(e) => updateLambangItem(idx, "makna", e.target.value)}
                        className={`${inputClass} resize-y`}
                        placeholder="Filosofi dibalik simbol lambang..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveTab("makna-lambang", { simbolMakna: lambangForm })}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Simpan Filosofi Lambang</span>
            </button>
          </div>
        )}

        {/* 4. STRUKTUR ORGANISASI TAB */}
        {activeTab === "organisasi" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Struktur Organisasi</h3>
              <button
                type="button"
                onClick={addOrgLevel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 text-xs font-bold text-amber-500 hover:bg-amber-500/10"
              >
                <Plus size={14} />
                Tambah Tingkatan (Level)
              </button>
            </div>

            <div className="space-y-6">
              {organisasiForm.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic text-xs">Belum ada tingkatan kepengurusan.</div>
              ) : (
                organisasiForm.map((levelObj, lvlIdx) => (
                  <div key={lvlIdx} className="p-5 bg-black/30 border border-white/10 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 mr-4">
                        <label className={labelClass}>Nama Tingkat Kepengurusan / Dewan</label>
                        <input
                          type="text"
                          value={levelObj.level}
                          onChange={(e) => {
                            const updated = [...organisasiForm];
                            updated[lvlIdx].level = e.target.value;
                            setOrganisasiForm(updated);
                          }}
                          className={inputClass}
                          placeholder="Contoh: Dewan Guru atau Pengurus Pusat"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOrgLevel(lvlIdx)}
                        className="mt-6 p-2 rounded-xl text-red-500 hover:bg-red-500/10"
                        title="Hapus Level"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">Anggota Organisasi</span>
                        <button
                          type="button"
                          onClick={() => addOrgMember(lvlIdx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-amber-500 hover:bg-white/10"
                        >
                          <Plus size={12} />
                          Tambah Anggota
                        </button>
                      </div>

                      {levelObj.anggota.map((member, memIdx) => (
                        <div key={memIdx} className="p-3 bg-black/10 border border-white/5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Nama Lengkap</label>
                            <input
                              type="text"
                              value={member.nama}
                              onChange={(e) => updateOrgMember(lvlIdx, memIdx, "nama", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                              placeholder="Nama..."
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Jabatan</label>
                            <input
                              type="text"
                              value={member.jabatan}
                              onChange={(e) => updateOrgMember(lvlIdx, memIdx, "jabatan", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                              placeholder="Jabatan..."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 block mb-1">URL Foto (Opsional)</label>
                              <input
                                type="text"
                                value={member.foto}
                                onChange={(e) => updateOrgMember(lvlIdx, memIdx, "foto", e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                                placeholder="http://..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOrgMember(lvlIdx, memIdx)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveTab("struktur-organisasi", { struktur: organisasiForm })}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Simpan Struktur Organisasi</span>
            </button>
          </div>
        )}

        {/* 5. VISI MISI TAB */}
        {activeTab === "visi-misi" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Visi & Misi Perguruan</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Pernyataan Visi</label>
                <textarea
                  rows={3}
                  value={visiMisiForm.visi}
                  onChange={(e) => setVisiMisiForm({ ...visiMisiForm, visi: e.target.value })}
                  className={`${inputClass} resize-y`}
                  placeholder="Visi organisasi..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>Daftar Misi</label>
                  <button
                    type="button"
                    onClick={addMisiItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 text-xs font-bold text-amber-500 hover:bg-amber-500/10"
                  >
                    <Plus size={14} />
                    Tambah Misi
                  </button>
                </div>

                {visiMisiForm.misi.map((misi, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-amber-500 shrink-0 w-6 text-center">{idx + 1}</span>
                    <input
                      type="text"
                      value={misi}
                      onChange={(e) => updateMisiItem(idx, e.target.value)}
                      className={inputClass}
                      placeholder={`Poin misi ke-${idx + 1}...`}
                    />
                    <button
                      type="button"
                      onClick={() => removeMisiItem(idx)}
                      className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveTab("visi-misi", { visi: visiMisiForm.visi, misi: visiMisiForm.misi })}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Simpan Visi & Misi</span>
            </button>
          </div>
        )}

        {/* 6. CAROUSEL CRUD TAB */}
        {activeTab === "carousel" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isEditingCarousel ? "Edit Slide" : "Tambah Slide Baru"}
            </h3>

            <form onSubmit={handleSaveCarousel} className="p-4 bg-black/20 border border-white/5 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Judul Slide</label>
                  <input
                    type="text"
                    value={carouselForm.title}
                    onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                    className={inputClass}
                    placeholder="Judul info utama..."
                  />
                </div>
                <div>
                  <label className={labelClass}>URL Gambar</label>
                  <input
                    type="text"
                    value={carouselForm.imageUrl}
                    onChange={(e) => setCarouselForm({ ...carouselForm, imageUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className={labelClass}>URL Link Target (Opsional)</label>
                  <input
                    type="text"
                    value={carouselForm.targetUrl}
                    onChange={(e) => setCarouselForm({ ...carouselForm, targetUrl: e.target.value })}
                    className={inputClass}
                    placeholder="Halaman/web tujuan ketika di-klik..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Urutan</label>
                    <input
                      type="number"
                      value={carouselForm.order}
                      onChange={(e) => setCarouselForm({ ...carouselForm, order: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center justify-center pb-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                      <input
                        type="checkbox"
                        checked={carouselForm.isActive}
                        onChange={(e) => setCarouselForm({ ...carouselForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-amber-500"
                      />
                      Aktif
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>{isEditingCarousel ? "Update Slide" : "Tambah Slide"}</span>
                </button>
                {isEditingCarousel && (
                  <button
                    type="button"
                    onClick={() => {
                      setCarouselForm({ id: "", title: "", imageUrl: "", targetUrl: "", order: 0, isActive: true });
                      setIsEditingCarousel(false);
                    }}
                    className="px-4 py-3 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:bg-white/5"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>

            {/* List Carousel Slides */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Slide Aktif</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carouselItems.map((item) => (
                  <div key={item.id} className="glass-card overflow-hidden border-white/5 bg-black/20 flex flex-col justify-between">
                    <div className="relative h-32 w-full bg-gray-900 flex items-center justify-center">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon size={32} className="text-gray-700" />
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.isActive !== false ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                          {item.isActive !== false ? "Aktif" : "Nonaktif"}
                        </span>
                        <span className="text-[9px] font-black bg-black/60 text-amber-500 border border-white/10 px-2 py-0.5 rounded-full">
                          Order: {item.order}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase truncate">{item.title}</h4>
                        {item.targetUrl && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 truncate">
                            <LinkIcon size={10} />
                            <span>{item.targetUrl}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCarousel(item)}
                          className="flex-1 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase text-amber-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCarousel(item.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/10 hover:bg-red-500/5 text-[10px] font-black uppercase text-red-500"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
