'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Send, 
  Loader2, 
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function AdminChatRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const convRes = await api.chat.getConversations();
        const currentConv = convRes.data.find((c: any) => c.id === id);
        if (currentConv) {
          setConversation(currentConv);
        }

        const msgRes = await api.chat.getMessages(id as string);
        setMessages(msgRes.data || []);
        setTimeout(() => scrollToBottom('auto'), 100);
      } catch (err) {
        console.error('Failed to fetch chat data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Realtime subscription
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${id}`,
        },
        (payload) => {
          const newMessage = payload.new;
          // Check if message already exists to avoid duplicates
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Handle keyboard popup on mobile
  useEffect(() => {
    if (isFocused) {
      setTimeout(() => scrollToBottom('smooth'), 300);
    }
  }, [isFocused]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX
    setSending(true);

    try {
      const res = await api.chat.sendMessage({
        conversationId: id as string,
        content
      });
      
      if (res.status === 'success') {
        setMessages(prev => [...prev, res.data]);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch (err) {
      toast.error('Gagal mengirim pesan');
      setNewMessage(content); // Restore message on failure
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = conversation?.participants?.find((p: any) => p.id !== user?.id);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8F9FA] text-[#1A1A1A] overflow-hidden safe-bottom">
      {/* Header */}
      <div className="shrink-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-5 py-4 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 active:scale-90 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black uppercase shadow-md">
            {otherParticipant?.fullName?.charAt(0) || (loading ? '...' : '?')}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black uppercase tracking-tight leading-none mb-1 truncate text-gray-900">
              {otherParticipant?.fullName || (loading ? 'Memuat...' : 'User')}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors active:scale-90">
            <Phone size={18} />
          </button>
          <button className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors active:scale-90">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#F0F2F5] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent_40%)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Memuat percakapan...</p>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id || index}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                  isMe 
                    ? 'bg-amber-500 text-black rounded-tr-none shadow-amber-500/10' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-gray-200/50'
                }`}>
                  {msg.content}
                  <div className={`text-[8px] mt-1.5 font-black uppercase tracking-widest opacity-50 flex items-center gap-1 ${
                    isMe ? 'text-black justify-end' : 'text-gray-400'
                  }`}>
                    {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <div className="w-1 h-1 rounded-full bg-black/20" />}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-20">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-6">
              <Send size={32} className="text-gray-400" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Belum ada pesan</p>
            <p className="text-[10px] font-bold mt-2 text-gray-400">Kirim pesan pertama untuk memulai obrolan</p>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 bg-white border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <form 
          onSubmit={handleSend}
          className="flex items-end gap-2 max-w-4xl mx-auto"
        >
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-[1.5rem] px-4 py-1.5 focus-within:border-amber-500/50 focus-within:bg-white transition-all flex items-end shadow-inner">
            <textarea 
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ketik pesan..." 
              className="flex-1 bg-transparent border-none py-2.5 text-sm focus:outline-none resize-none max-h-32 custom-scrollbar text-gray-800 placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as any);
                }
              }}
            />
          </div>
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20 active:scale-90 disabled:opacity-50 disabled:active:scale-100 transition-all shrink-0 mb-0.5"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} fill="currentColor" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
