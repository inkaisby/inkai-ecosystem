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
  Box
} from 'lucide-react';
import { api } from '@/lib/api';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/v1/inventory'); // Simple fetch for now
        const data = await response.json();
        setProducts(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Package size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">INKAI Store</span>
          </div>
          <h2 className="text-3xl font-bold">Manajemen Inventaris</h2>
          <p className="text-gray-500 mt-1">Kelola stok peralatan karate, seragam, dan merchandise resmi.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={18} />
          Tambah Produk Baru
        </button>
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
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500/50 text-white"
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
                          <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
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
  );
}
