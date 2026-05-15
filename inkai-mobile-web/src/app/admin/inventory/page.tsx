'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Loader2,
  Box,
  ChevronLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModalPortal from '@/components/admin/AdminModalPortal';

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProductPrompt, setDeleteProductPrompt] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [productDeletingId, setProductDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.inventory.getAll();
      setProducts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openDeleteProductPrompt = (id: string, name: string) => {
    setDeleteProductPrompt({
      id,
      name: String(name ?? 'produk ini').trim() || 'produk ini',
    });
  };

  const executeDeleteProduct = async () => {
    if (!deleteProductPrompt) return;
    const { id } = deleteProductPrompt;
    setProductDeletingId(id);
    try {
      await api.inventory.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Produk dihapus dari inventaris');
      setDeleteProductPrompt(null);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus produk');
    } finally {
      setProductDeletingId(null);
    }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-amber-500 mb-0.5">
              <Package size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">INKAI Store</span>
            </div>
            <h2 className="text-xl font-black uppercase text-white leading-tight">Inventaris</h2>
          </div>
          <button 
            className="p-2.5 rounded-xl bg-amber-500 text-black shadow-lg shadow-amber-500/20 active:scale-90 transition-all"
            title="Tambah Produk"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <p className="text-[11px] text-gray-500 leading-relaxed">Kelola stok peralatan karate, seragam, dan merchandise resmi.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={48} />
          <p className="text-gray-500 text-sm">Memuat data inventaris...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Table */}
          <div className="xl:col-span-3 glass-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Daftar Produk</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  className="w-full bg-black-20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500/50 text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="pb-4 pl-2 font-medium">Produk</th>
                    <th className="pb-4 font-medium">Harga</th>
                    <th className="pb-4 font-medium">Stok</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 text-right pr-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                            <Box size={20} className="text-gray-400" />
                          </div>
                          <span className="font-bold text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-white font-medium">
                        Rp {item.price.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.stock < 10 ? 'text-red-500' : 'text-white'}`}>
                            {item.stock}
                          </span>
                          {item.stock < 10 && <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.stock > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <Edit size={16} />
                          </button>
                          <button 
                            type="button"
                            disabled={productDeletingId !== null}
                            onClick={() => openDeleteProductPrompt(item.id, item.name)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            <div className="glass-card bg-amber-500/5 border-amber-500/20">
              <h3 className="font-bold text-amber-500 mb-4">Ringkasan Stok</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Total SKU</span>
                  <span className="text-lg font-bold text-white">{products.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Stok Menipis</span>
                  <span className="text-lg font-bold text-red-500">
                    {products.filter(p => p.stock < 10).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    <AdminModalPortal>
      <AnimatePresence>
        {deleteProductPrompt && (
          <motion.div
            key="delete-product-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="admin-modal-overlay admin-modal-overlay--dialog admin-modal-overlay--stack"
            role="presentation"
            onClick={() => {
              if (productDeletingId === null) setDeleteProductPrompt(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="admin-modal-dialog-panel relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-inv-title"
              aria-describedby="delete-inv-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-red-500/5 blur-3xl" />

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-red-500/20 bg-red-500/10 text-red-500 shadow-2xl shadow-red-500/10">
                <Trash2 size={32} aria-hidden />
              </div>
              <h3
                id="delete-inv-title"
                className="mb-3 text-xl font-black uppercase tracking-tight text-white"
              >
                Hapus produk?
              </h3>
              <p
                id="delete-inv-desc"
                className="mb-8 text-xs font-medium leading-relaxed text-gray-400"
              >
                <span className="break-words font-bold text-white">{deleteProductPrompt.name}</span>{' '}
                akan dihapus dari inventaris. Tindakan ini{' '}
                <span className="font-bold text-red-400">permanen</span>.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void executeDeleteProduct()}
                  disabled={productDeletingId === deleteProductPrompt.id}
                  className="w-full rounded-2xl bg-red-500 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {productDeletingId === deleteProductPrompt.id
                    ? 'Menghapus...'
                    : 'Ya, hapus produk'}
                </button>
                <button
                  type="button"
                  disabled={productDeletingId === deleteProductPrompt.id}
                  onClick={() => setDeleteProductPrompt(null)}
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
    </>
  );
}
