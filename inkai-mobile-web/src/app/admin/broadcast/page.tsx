'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  History, 
  Bell,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function BroadcastPage() {
  const [formData, setFormData] = useState({ title: '', content: '', type: 'INFO' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.notifications.broadcast(formData);
      setSuccess(true);
      setFormData({ title: '', content: '', type: 'INFO' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <MessageSquare size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Komunikasi Organisasi</span>
          </div>
          <h2 className="text-3xl font-bold">Broadcast & Informasi</h2>
          <p className="text-gray-500 mt-1">Kirim pengumuman resmi ke seluruh anggota secara real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Create Broadcast Form */}
        <div className="xl:col-span-2 glass-card space-y-6 bg-gradient-to-br from-[#1e1e24] to-transparent">
          <div className="flex items-center gap-3 pb-6 border-b border-white/5">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Send size={24} />
            </div>
            <h3 className="font-bold text-xl">Buat Pesan Baru</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2 block">Judul Pengumuman</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul pesan..." 
                className="w-full bg-black-20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2 block">Isi Pesan</label>
              <textarea 
                rows={6}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Tuliskan detail pengumuman di sini..." 
                className="w-full bg-black-20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2 block">Kategori</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-black-20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                >
                  <option value="INFO">Informasi Umum</option>
                  <option value="WARNING">Peringatan Penting</option>
                  <option value="SUCCESS">Berita Prestasi</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2 block">Metode Utama</label>
                <div className="flex gap-2">
                  <div className="flex-1 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    <Bell size={14} /> Aplikasi Mobile
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : success ? (
                <><CheckCircle size={20} /> TERKIRIM!</>
              ) : (
                <><Send size={18} /> KIRIM PENGUMUMAN SEKARANG</>
              )}
            </button>
          </form>
        </div>

        {/* Broadcast Tip */}
        <div className="space-y-6">
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <History size={20} />
              <h3 className="font-bold">Tips Broadcast</h3>
            </div>
            <ul className="text-xs text-gray-500 space-y-3 list-disc pl-4">
              <li>Pastikan judul pesan singkat dan padat.</li>
              <li>Gunakan bahasa resmi organisasi.</li>
              <li>Informasi yang dikirim akan otomatis muncul di notifikasi aplikasi mobile seluruh anggota.</li>
              <li>Pesan yang sudah dikirim tidak dapat ditarik kembali.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
