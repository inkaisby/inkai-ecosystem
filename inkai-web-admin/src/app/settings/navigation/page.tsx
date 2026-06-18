'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface TabItem {
  id: string;
  name: string;
  slug: string;
  content: string;
  order: number;
  isActive: boolean;
}

export default function NavigationSettingsPage() {
  const router = useRouter();
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTab, setEditingTab] = useState<Partial<TabItem> | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    try {
      setLoading(true);
      const res = await api.navTabs.getAll(true);
      if (res.status === 'success') {
        setTabs(res.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data navigasi');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tab: TabItem) => {
    setEditingTab({ ...tab });
    setIsNew(false);
  };

  const handleCreateNew = () => {
    setEditingTab({
      name: '',
      slug: '',
      content: '',
      order: tabs.length,
      isActive: true
    });
    setIsNew(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tab navigasi ini?')) return;
    try {
      const res = await api.navTabs.delete(id);
      if (res.status === 'success') {
        toast.success('Tab navigasi berhasil dihapus');
        fetchTabs();
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus tab');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTab?.name || !editingTab?.slug) {
      toast.error('Nama dan slug wajib diisi');
      return;
    }
    
    try {
      setSaving(true);
      let res;
      if (isNew) {
        res = await api.navTabs.create(editingTab);
      } else {
        res = await api.navTabs.update(editingTab.id!, editingTab);
      }

      if (res.status === 'success') {
        toast.success(isNew ? 'Tab navigasi berhasil dibuat' : 'Perubahan berhasil disimpan');
        setEditingTab(null);
        fetchTabs();
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tabs.length) return;

    const currentTab = tabs[index];
    const targetTab = tabs[newIndex];

    try {
      // Swap order attributes
      await api.navTabs.update(currentTab.id, { order: targetTab.order });
      await api.navTabs.update(targetTab.id, { order: currentTab.order });
      toast.success('Urutan berhasil diubah');
      fetchTabs();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menukar urutan');
    }
  };

  if (loading && tabs.length === 0) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/settings')}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Globe size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Pengaturan Konten</span>
          </div>
          <h2 className="text-3xl font-bold">Tab Navigasi Publik</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Side: List of tabs */}
        <div className="xl:col-span-1 space-y-4">
          <div className="glass-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Daftar Tab</h3>
              <button 
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 transition"
              >
                <Plus size={14} />
                Tambah
              </button>
            </div>

            <div className="space-y-3">
              {tabs.map((tab, idx) => (
                <div 
                  key={tab.id}
                  className={`p-4 bg-white/5 hover:bg-white/10 rounded-2xl border transition flex items-center justify-between ${
                    editingTab?.id === tab.id ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{tab.name}</span>
                      {!tab.isActive && (
                        <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase">Draft</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Slug: /{tab.slug}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === tabs.length - 1}
                      className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition"
                    >
                      <MoveDown size={14} />
                    </button>
                    <button 
                      onClick={() => handleEdit(tab)}
                      className="p-1.5 text-gray-400 hover:text-amber-500 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(tab.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form Edit Content */}
        <div className="xl:col-span-2">
          {editingTab ? (
            <div className="glass-card">
              <h3 className="text-xl font-bold mb-6">
                {isNew ? 'Tambah Tab Baru' : `Kelola Konten: "${editingTab.name}"`}
              </h3>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Nama Menu Tab</label>
                    <input 
                      type="text" 
                      value={editingTab.name || ''}
                      onChange={(e) => setEditingTab({ ...editingTab, name: e.target.value })}
                      placeholder="Contoh: Sejarah"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Slug URL</label>
                    <input 
                      type="text" 
                      value={editingTab.slug || ''}
                      onChange={(e) => setEditingTab({ ...editingTab, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                      placeholder="Contoh: sejarah"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Konten Halaman (Rich Text / Markdown)</label>
                    <span className="text-[10px] text-gray-500">Mendukung format Markdown (# Judul, - Poin)</span>
                  </div>
                  <textarea 
                    value={editingTab.content || ''}
                    onChange={(e) => setEditingTab({ ...editingTab, content: e.target.value })}
                    rows={12}
                    placeholder="Tulis konten halaman di sini..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/50 font-mono"
                    required
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTab({ ...editingTab, isActive: !editingTab.isActive })}
                      className={`p-1 bg-white/5 rounded-lg border transition ${
                        editingTab.isActive ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-gray-500 border-white/10'
                      }`}
                    >
                      {editingTab.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <span className="text-sm font-semibold text-gray-300">
                      {editingTab.isActive ? 'Publik (Aktif)' : 'Draf (Disembunyikan)'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/5 pt-6">
                  <button 
                    type="button"
                    onClick={() => setEditingTab(null)}
                    className="px-5 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-amber-500 text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-400 transition"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center min-h-[40vh] border-dashed border-white/10">
              <Globe size={40} className="text-gray-600 mb-4 animate-pulse" />
              <p className="text-sm text-gray-500">Pilih tab navigasi di sebelah kiri atau buat tab baru untuk mengelola konten.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
