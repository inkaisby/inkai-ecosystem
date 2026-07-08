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
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import styles from "./MobileContent.module.css";

type TabId = "home" | "sejarah" | "lambang" | "organisasi" | "visi-misi" | "carousel";

export default function MobileContentEditor() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Raw Database Tab Data
  const [dbTabs, setDbTabs] = useState<any[]>([]);

  // Structured Form States (with added optional foto urls)
  const [homeForm, setHomeForm] = useState({ heroTitle: "", subtitle: "", teksSambutan: "", foto: "" });
  const [sejarahForm, setSejarahForm] = useState<Array<{ tahun: string; judul: string; deskripsi: string; foto?: string }>>([]);
  const [lambangForm, setLambangForm] = useState<Array<{ simbol: string; makna: string; foto?: string }>>([]);
  const [organisasiForm, setOrganisasiForm] = useState<Array<{ level: string; anggota: Array<{ nama: string; jabatan: string; foto: string }> }>>([]);
  const [visiMisiForm, setVisiMisiForm] = useState({ visi: "", misi: [] as string[] });
  
  // Carousel state
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [carouselForm, setCarouselForm] = useState({ id: "", title: "", imageUrl: "", targetUrl: "", order: 0, isActive: true });
  const [isEditingCarousel, setIsEditingCarousel] = useState(false);

  // Upload state
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Mouse drag scroll support for desktop/simulator
  const tabRef = React.useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - tabRef.current.offsetLeft);
    setScrollLeftState(tabRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !tabRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tabRef.current.scrollLeft = scrollLeftState - walk;
  };

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
        
        const homeTab = tabsRes.data.find((t: any) => t.slug === "home");
        if (homeTab) {
          try {
            const parsed = JSON.parse(homeTab.content);
            setHomeForm({
              heroTitle: parsed.heroTitle || "",
              subtitle: parsed.subtitle || "",
              teksSambutan: parsed.teksSambutan || "",
              foto: parsed.foto || ""
            });
          } catch {
            setHomeForm({ heroTitle: "Selamat Datang di INKAI", subtitle: "Institut Karate-Do Indonesia", teksSambutan: homeTab.content, foto: "" });
          }
        }

        const sejarahTab = tabsRes.data.find((t: any) => t.slug === "sejarah");
        if (sejarahTab) {
          try {
            const parsed = JSON.parse(sejarahTab.content);
            setSejarahForm(Array.isArray(parsed.timeline) ? parsed.timeline : []);
          } catch {
            setSejarahForm([{ tahun: "1971", judul: "Pendirian INKAI", deskripsi: sejarahTab.content, foto: "" }]);
          }
        }

        const lambangTab = tabsRes.data.find((t: any) => t.slug === "makna-lambang");
        if (lambangTab) {
          try {
            const parsed = JSON.parse(lambangTab.content);
            setLambangForm(Array.isArray(parsed.simbolMakna) ? parsed.simbolMakna : []);
          } catch {
            setLambangForm([{ simbol: "Bulatan Merah", makna: lambangTab.content, foto: "" }]);
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

  // Image Upload Action
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void,
    fieldId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldId);
    const fd = new FormData();
    fd.append("file", file);

    try {
      toast.loading("Mengunggah gambar...", { id: "upload" });
      const res = await api.auth.uploadFile(fd);
      const url = res?.fileUrl || res?.data?.url || "";
      if (url) {
        onSuccess(url);
        toast.success("Gambar berhasil diunggah!", { id: "upload" });
      } else {
        toast.error("Upload gagal: URL tidak valid", { id: "upload" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunggah gambar", { id: "upload" });
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  const renderImageUpload = (value: string, onChange: (val: string) => void, fieldId: string) => {
    const isBusy = uploadingField === fieldId;
    return (
      <div className={styles.uploadWidget}>
        <div className={styles.uploadPreview}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className={styles.uploadPreviewImg} />
          ) : (
            <ImageIcon size={18} className="text-gray-500" />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.input}
          placeholder="URL Gambar (atau klik upload)"
          style={{ flex: 1 }}
        />
        <label className={styles.uploadBtn}>
          {isBusy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          <span>{isBusy ? "Unggah..." : "Upload"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageFileChange(e, onChange, fieldId)}
            style={{ display: "none" }}
            disabled={isBusy}
          />
        </label>
      </div>
    );
  };

  // Timeline handlers
  const addTimelineItem = () => {
    setSejarahForm([...sejarahForm, { tahun: "", judul: "", deskripsi: "", foto: "" }]);
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
    setLambangForm([...lambangForm, { simbol: "", makna: "", foto: "" }]);
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
    <div className={styles.container}>
      {/* Title */}
      <div className={styles.titleSection}>
        <h2 className={styles.title}>Kelola Konten Mobile</h2>
        <p className={styles.subtitle}>
          Ubah konten visual dan informasi yang ditampilkan pada aplikasi mobile anggota INKAI.
        </p>
      </div>

      {/* Tab Navigation */}
      <div 
        ref={tabRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: isMouseDown ? "grabbing" : "grab" }}
        className={styles.tabScroll}
      >
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
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ""}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panel */}
      <div className="glass-card p-6 border-white/5">
        <div className={styles.panel}>
          {/* 1. HOME TAB */}
          {activeTab === "home" && (
            <>
              <h3 className={styles.sectionTitle}>Editor Home Screen</h3>
              <div className={styles.formList}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Hero Title</label>
                  <input
                    type="text"
                    value={homeForm.heroTitle}
                    onChange={(e) => setHomeForm({ ...homeForm, heroTitle: e.target.value })}
                    className={styles.input}
                    placeholder="Contoh: Selamat Datang di INKAI"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Hero Subtitle</label>
                  <input
                    type="text"
                    value={homeForm.subtitle}
                    onChange={(e) => setHomeForm({ ...homeForm, subtitle: e.target.value })}
                    className={styles.input}
                    placeholder="Contoh: Perguruan Karate Tertua & Terbesar"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Banner / Gambar Latar</label>
                  {renderImageUpload(homeForm.foto, (val) => setHomeForm({ ...homeForm, foto: val }), "home-banner")}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Teks Sambutan</label>
                  <textarea
                    rows={6}
                    value={homeForm.teksSambutan}
                    onChange={(e) => setHomeForm({ ...homeForm, teksSambutan: e.target.value })}
                    className={styles.textarea}
                    placeholder="Kalimat pembuka & selamat datang untuk anggota..."
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveTab("home", homeForm)}
                className={styles.btnPrimary}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Simpan Home Screen</span>
              </button>
            </>
          )}

          {/* 2. SEJARAH TIMELINE TAB */}
          {activeTab === "sejarah" && (
            <>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Timeline Sejarah</h3>
                <button type="button" onClick={addTimelineItem} className={styles.btnSecondary}>
                  <Plus size={14} />
                  Tambah Peristiwa
                </button>
              </div>

              <div className={styles.cardList}>
                {sejarahForm.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic text-xs">Belum ada peristiwa dalam timeline.</div>
                ) : (
                  sejarahForm.map((item, idx) => (
                    <div key={idx} className={styles.cardItem}>
                      <div className={styles.cardHeader}>
                        <span className={styles.cardIndex}>Peristiwa #{idx + 1}</span>
                        <button type="button" onClick={() => removeTimelineItem(idx)} className={styles.btnTrash}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={styles.grid3}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Tahun</label>
                          <input
                            type="text"
                            value={item.tahun}
                            onChange={(e) => updateTimelineItem(idx, "tahun", e.target.value)}
                            className={styles.input}
                            placeholder="Contoh: 1971"
                          />
                        </div>
                        <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                          <label className={styles.label}>Judul Peristiwa</label>
                          <input
                            type="text"
                            value={item.judul}
                            onChange={(e) => updateTimelineItem(idx, "judul", e.target.value)}
                            className={styles.input}
                            placeholder="Nama peristiwa..."
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Gambar Peristiwa (Opsional)</label>
                        {renderImageUpload(item.foto || "", (val) => updateTimelineItem(idx, "foto", val), `sejarah-${idx}`)}
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Deskripsi Lengkap</label>
                        <textarea
                          rows={2}
                          value={item.deskripsi}
                          onChange={(e) => updateTimelineItem(idx, "deskripsi", e.target.value)}
                          className={styles.textarea}
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
                className={styles.btnPrimary}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Simpan Timeline Sejarah</span>
              </button>
            </>
          )}

          {/* 3. MAKNA LAMBANG TAB */}
          {activeTab === "lambang" && (
            <>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Simbol & Makna Lambang</h3>
                <button type="button" onClick={addLambangItem} className={styles.btnSecondary}>
                  <Plus size={14} />
                  Tambah Simbol
                </button>
              </div>

              <div className={styles.cardList}>
                {lambangForm.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic text-xs">Belum ada makna lambang terdefinisi.</div>
                ) : (
                  lambangForm.map((item, idx) => (
                    <div key={idx} className={styles.cardItem}>
                      <div className={styles.cardHeader}>
                        <span className={styles.cardIndex}>Elemen Lambang #{idx + 1}</span>
                        <button type="button" onClick={() => removeLambangItem(idx)} className={styles.btnTrash}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Simbol / Nama Bagian</label>
                        <input
                          type="text"
                          value={item.simbol}
                          onChange={(e) => updateLambangItem(idx, "simbol", e.target.value)}
                          className={styles.input}
                          placeholder="Contoh: Bulatan Merah (Hinomaru)"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Visual / Icon Simbol (Opsional)</label>
                        {renderImageUpload(item.foto || "", (val) => updateLambangItem(idx, "foto", val), `lambang-${idx}`)}
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Arti & Filosofi</label>
                        <textarea
                          rows={2}
                          value={item.makna}
                          onChange={(e) => updateLambangItem(idx, "makna", e.target.value)}
                          className={styles.textarea}
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
                className={styles.btnPrimary}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Simpan Filosofi Lambang</span>
              </button>
            </>
          )}

          {/* 4. STRUKTUR ORGANISASI TAB */}
          {activeTab === "organisasi" && (
            <>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Struktur Organisasi</h3>
                <button type="button" onClick={addOrgLevel} className={styles.btnSecondary}>
                  <Plus size={14} />
                  Tambah Tingkatan (Level)
                </button>
              </div>

              <div className={styles.cardList}>
                {organisasiForm.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic text-xs">Belum ada tingkatan kepengurusan.</div>
                ) : (
                  organisasiForm.map((levelObj, lvlIdx) => (
                    <div key={lvlIdx} className={styles.orgLevelCard}>
                      <div className={styles.orgLevelHeader}>
                        <div className={styles.orgLevelTitleInput}>
                          <label className={styles.label}>Nama Tingkat Kepengurusan / Dewan</label>
                          <input
                            type="text"
                            value={levelObj.level}
                            onChange={(e) => {
                              const updated = [...organisasiForm];
                              updated[lvlIdx].level = e.target.value;
                              setOrganisasiForm(updated);
                            }}
                            className={styles.input}
                            placeholder="Contoh: Dewan Guru atau Pengurus Pusat"
                          />
                        </div>
                        <button type="button" onClick={() => removeOrgLevel(lvlIdx)} className={styles.btnTrash} title="Hapus Level">
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className={styles.orgMemberList}>
                        <div className={styles.orgMemberHeader}>
                          <span className={styles.label}>Anggota Organisasi</span>
                          <button type="button" onClick={() => addOrgMember(lvlIdx)} className={styles.btnSecondary}>
                            <Plus size={12} />
                            Tambah Anggota
                          </button>
                        </div>

                        {levelObj.anggota.map((member, memIdx) => (
                          <div key={memIdx} className={styles.orgMemberRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Nama Lengkap</label>
                              <input
                                type="text"
                                value={member.nama}
                                onChange={(e) => updateOrgMember(lvlIdx, memIdx, "nama", e.target.value)}
                                className={styles.input}
                                placeholder="Nama..."
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Jabatan</label>
                              <input
                                type="text"
                                value={member.jabatan}
                                onChange={(e) => updateOrgMember(lvlIdx, memIdx, "jabatan", e.target.value)}
                                className={styles.input}
                                placeholder="Jabatan..."
                              />
                            </div>
                            <div className={styles.memberFieldWrap}>
                              <label className={styles.label}>Foto Anggota</label>
                              {renderImageUpload(
                                member.foto,
                                (val) => updateOrgMember(lvlIdx, memIdx, "foto", val),
                                `org-${lvlIdx}-${memIdx}`
                              )}
                              <div className={styles.memberActionRow}>
                                <span />
                                <button type="button" onClick={() => removeOrgMember(lvlIdx, memIdx)} className={styles.btnTrash}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
                className={styles.btnPrimary}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Simpan Struktur Organisasi</span>
              </button>
            </>
          )}

          {/* 5. VISI MISI TAB */}
          {activeTab === "visi-misi" && (
            <>
              <h3 className={styles.sectionTitle}>Visi & Misi Perguruan</h3>
              <div className={styles.formList}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Pernyataan Visi</label>
                  <textarea
                    rows={3}
                    value={visiMisiForm.visi}
                    onChange={(e) => setVisiMisiForm({ ...visiMisiForm, visi: e.target.value })}
                    className={styles.textarea}
                    placeholder="Visi organisasi..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.sectionHeader}>
                    <label className={styles.label}>Daftar Misi</label>
                    <button type="button" onClick={addMisiItem} className={styles.btnSecondary}>
                      <Plus size={14} />
                      Tambah Misi
                    </button>
                  </div>

                  <div className={styles.cardList}>
                    {visiMisiForm.misi.map((misi, idx) => (
                      <div key={idx} className={styles.misiRow}>
                        <span className={styles.misiIndex}>{idx + 1}</span>
                        <input
                          type="text"
                          value={misi}
                          onChange={(e) => updateMisiItem(idx, e.target.value)}
                          className={styles.input}
                          placeholder={`Poin misi ke-${idx + 1}...`}
                        />
                        <button type="button" onClick={() => removeMisiItem(idx)} className={styles.btnTrash}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveTab("visi-misi", { visi: visiMisiForm.visi, misi: visiMisiForm.misi })}
                className={styles.btnPrimary}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Simpan Visi & Misi</span>
              </button>
            </>
          )}

          {/* 6. CAROUSEL CRUD TAB */}
          {activeTab === "carousel" && (
            <>
              <h3 className={styles.sectionTitle}>
                {isEditingCarousel ? "Edit Slide" : "Tambah Slide Baru"}
              </h3>

              <form onSubmit={handleSaveCarousel} className={styles.cardItem}>
                <div className={styles.carouselFormRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Judul Slide</label>
                    <input
                      type="text"
                      value={carouselForm.title}
                      onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                      className={styles.input}
                      placeholder="Judul info utama..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Gambar Slide</label>
                    {renderImageUpload(
                      carouselForm.imageUrl,
                      (val) => setCarouselForm({ ...carouselForm, imageUrl: val }),
                      "carousel-slide"
                    )}
                  </div>
                </div>

                <div className={styles.carouselFormRow3}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>URL Link Target (Opsional)</label>
                    <input
                      type="text"
                      value={carouselForm.targetUrl}
                      onChange={(e) => setCarouselForm({ ...carouselForm, targetUrl: e.target.value })}
                      className={styles.input}
                      placeholder="Halaman/web tujuan ketika di-klik..."
                    />
                  </div>
                  <div className={styles.carouselOrderWrap}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Urutan</label>
                      <input
                        type="number"
                        value={carouselForm.order}
                        onChange={(e) => setCarouselForm({ ...carouselForm, order: parseInt(e.target.value) || 0 })}
                        className={styles.input}
                      />
                    </div>
                    <label className={styles.carouselCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={carouselForm.isActive}
                        onChange={(e) => setCarouselForm({ ...carouselForm, isActive: e.target.checked })}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span>Aktif</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button type="submit" disabled={saving} className={styles.btnPrimary}>
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
                      className={styles.btnSecondary}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              {/* List Carousel Slides */}
              <div className={styles.formList}>
                <h4 className={styles.label}>Daftar Slide Aktif</h4>
                <div className={styles.carouselGrid}>
                  {carouselItems.map((item) => (
                    <div key={item.id} className={styles.carouselCard}>
                      <div className={styles.carouselImageWrap}>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className={styles.carouselImg}
                          />
                        ) : (
                          <ImageIcon size={32} className="text-gray-700" />
                        )}
                        <span className={`${styles.carouselBadge} ${item.isActive !== false ? styles.carouselBadgeActive : styles.carouselBadgeInactive}`}>
                          {item.isActive !== false ? "Aktif" : "Nonaktif"}
                        </span>
                        <span className={styles.carouselOrderBadge}>
                          Order: {item.order}
                        </span>
                      </div>
                      <div className={styles.carouselInfo}>
                        <div>
                          <h4 className={styles.carouselTitle}>{item.title}</h4>
                          {item.targetUrl && (
                            <div className={styles.carouselLink}>
                              <LinkIcon size={10} />
                              <span>{item.targetUrl}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.carouselActions}>
                          <button
                            type="button"
                            onClick={() => handleEditCarousel(item)}
                            className={styles.carouselBtnEdit}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCarousel(item.id)}
                            className={styles.carouselBtnDel}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
