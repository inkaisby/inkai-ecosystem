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
  Image as ImageIcon
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface CarouselItem {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string | null;
  order: number;
  isActive: boolean;
}

export default function CarouselSettingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<CarouselItem> | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.newsCarousel.getAll(true);
      if (res.status === 'success') {
        setItems(res.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data carousel');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: CarouselItem) => {
    setEditingItem({ ...item });
    setIsNew(false);
  };

  const handleCreateNew = () => {
    setEditingItem({
      title: '',
      imageUrl: '',
      targetUrl: '',
      order: items.length,
      isActive: true
    });
    setIsNew(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus slide carousel ini?')) return;
    try {
      const res = await api.newsCarousel.delete(id);
      if (res.status === 'success') {
        toast.success('Slide carousel berhasil dihapus');
        fetchItems();
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus slide');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.imageUrl) {
      toast.error('Judul dan URL Gambar wajib diisi');
      return;
    }
    
    try {
      setSaving(true);
      let res;
      if (isNew) {
        res = await api.newsCarousel.create(editingItem);
      } else {
        res = await api.newsCarousel.update(editingItem.id!, editingItem);
      }

      if (res.status === 'success') {
        toast.success(isNew ? 'Slide carousel berhasil dibuat' : 'Perubahan berhasil disimpan');
        setEditingItem(null);
        fetchItems();
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) {
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
            <ImageIcon size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Pengaturan Konten</span>
          </div>
          <h2 className="text-3xl font-bold">Berita Carousel</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Side: List of items */}
        <div className="xl:col-span-1 space-y-4">
          <div className="glass-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Daftar Berita</h3>
              <button 
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 transition"
              >
                <Plus size={14} />
                Tambah
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 bg-white/5 hover:bg-white/10 rounded-2xl border transition flex items-center gap-4 ${
                    editingItem?.id === item.id ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={16} /></div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate block">{item.title}</span>
                    </div>
                    {!item.isActive && (
                      <span className="inline-block mt-1 text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase">Draft</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-amber-500 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
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
          {editingItem ? (
            <div className="glass-card">
              <h3 className="text-xl font-bold mb-6">
                {isNew ? 'Tambah Slide Carousel' : 'Edit Slide Carousel'}
              </h3>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Judul Berita</label>
                  <input 
                    type="text" 
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Contoh: Kejurnas INKAI 2026 Segera Digelar"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Link Tujuan (Opsional)</label>
                    <input 
                      type="text" 
                      value={editingItem.targetUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, targetUrl: e.target.value })}
                      placeholder="Contoh: /events"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Urutan Tampil (Order)</label>
                    <input 
                      type="number" 
                      value={editingItem.order !== undefined ? editingItem.order : 0}
                      onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 0 })}
                      placeholder="Contoh: 0"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">URL Gambar Banner (Rasio 16:9)</label>
                  <input 
                    type="text" 
                    value={editingItem.imageUrl || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                    placeholder="Contoh: https://images.unsplash.com/... atau path lokal /uploads/..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    required
                  />
                  {editingItem.imageUrl && (
                    <div className="mt-3 relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                      <img src={editingItem.imageUrl} alt="Banner Preview" className="object-cover w-full h-full" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, isActive: !editingItem.isActive })}
                      className={`p-1 bg-white/5 rounded-lg border transition ${
                        editingItem.isActive ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-gray-500 border-white/10'
                      }`}
                    >
                      {editingItem.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <span className="text-sm font-semibold text-gray-300">
                      {editingItem.isActive ? 'Publik (Aktif)' : 'Draf (Disembunyikan)'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/5 pt-6">
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
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
                    Simpan Slide
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center min-h-[40vh] border-dashed border-white/10">
              <ImageIcon size={40} className="text-gray-600 mb-4 animate-pulse" />
              <p className="text-sm text-gray-500">Pilih slide berita di sebelah kiri atau buat slide baru untuk mengelola carousel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
