'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Search, 
  Loader2, 
  MessageSquare,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminMessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.chat.getConversations();
        setConversations(res.data || []);
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants?.find((p: any) => p.id !== user?.id);
    return otherParticipant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen adm-bg text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 adm-chrome-soft backdrop-blur-xl border-b border-white/5 px-0 py-4 pt-[env(safe-area-inset-top,24px)]">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 leading-none mb-1">Pesan</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Percakapan Admin</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Cari nama..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
      </div>

      <div className="py-5 px-0 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Memuat pesan...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conv, index) => {
            const otherParticipant = conv.participants?.find((p: any) => p.id !== user?.id);
            const lastMessage = conv.messages?.[0];
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={conv.id}
                onClick={() => router.push(`/admin/messages/${conv.id}`)}
                className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all shadow-xl relative overflow-hidden group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/10 shrink-0">
                  <span className="text-amber-500 font-black text-lg uppercase">
                    {otherParticipant?.fullName?.charAt(0) || '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black text-white uppercase truncate tracking-tight pr-2">
                      {otherParticipant?.fullName || 'Anonim'}
                    </h4>
                    {lastMessage && (
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={8} />
                        {new Date(lastMessage.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium truncate leading-relaxed">
                    {lastMessage?.content || 'Belum ada pesan'}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-20 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
            <MessageSquare className="mx-auto text-gray-800 mb-3" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Belum ada percakapan</p>
          </div>
        )}
      </div>
    </div>
  );
}
