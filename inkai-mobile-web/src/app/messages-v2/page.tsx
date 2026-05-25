"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plus, MessageCircle, ArrowLeft, User } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Participant {
  id: string;
  fullName: string;
  email: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
}

interface Conversation {
  id: string;
  updatedAt: string;
  participants: Participant[];
  messages: Message[];
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<Participant[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.chat.getConversations();
      if (res.status === "success") {
        setConversations(res.data);
      }
    } catch (error) {
      toast.error("Gagal memuat pesan");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await api.members.getAll({ limit: 50, search: memberSearchQuery });
      if (res.status === "success") {
        setMembers(res.data.data || res.data); // Adjust based on actual pagination struct
      }
    } catch (error) {
      toast.error("Gagal memuat kontak");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchMembers();
    }
  }, [isModalOpen, memberSearchQuery]);

  const startConversation = async (participantId: string) => {
    try {
      const res = await api.chat.createConversation(participantId);
      if (res.status === "success") {
        setIsModalOpen(false);
        router.push(`/messages/${res.data.id}`);
      }
    } catch (error) {
      toast.error("Gagal memulai percakapan");
    }
  };

  const getOtherParticipant = (participants: Participant[]) => {
    return participants.find((p) => p.id !== user?.id) || participants[0];
  };

  const filteredConversations = conversations.filter((c) => {
    const other = getOtherParticipant(c.participants);
    return other?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const parseMessageContent = (content: string) => {
    try {
      if (content.startsWith("{")) {
        const parsed = JSON.parse(content);
        if (parsed.type === "image") return "📷 Foto";
        if (parsed.type === "video") return "🎥 Video";
        if (parsed.type === "file") return "📄 Dokumen";
        return parsed.text || "Pesan Media";
      }
    } catch (e) {
      // Not JSON
    }
    return content;
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 p-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Pesan</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Cari pesan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-800 text-white pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-neutral-500 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="p-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p>Belum ada percakapan.</p>
          </div>
        ) : (
          filteredConversations.map((conv, index) => {
            const otherUser = getOtherParticipant(conv.participants);
            const lastMessage = conv.messages?.[0];

            return (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={conv.id}
                onClick={() => router.push(`/messages/${conv.id}`)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-900 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {otherUser?.fullName || "Pengguna"}
                    </h3>
                    <span className="text-xs text-neutral-500 flex-shrink-0">
                      {lastMessage
                        ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 truncate">
                    {lastMessage ? parseMessageContent(lastMessage.content) : "Mulai percakapan..."}
                  </p>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* FAB New Message */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-yellow-500 text-black rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20 z-50"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Modal New Chat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-neutral-900 rounded-t-3xl sm:rounded-3xl p-6 border border-neutral-800 shadow-2xl h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mulai Chat Baru</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                Tutup
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Cari anggota..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-2">
              {loadingMembers ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                </div>
              ) : members.length === 0 ? (
                <p className="text-center text-neutral-500 py-10">Tidak ada anggota ditemukan</p>
              ) : (
                members.map((member) => {
                  if (member.id === user?.id) return null;
                  return (
                    <button
                      key={member.id}
                      onClick={() => startConversation(member.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all text-left border border-transparent hover:border-neutral-700"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-neutral-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{member.fullName}</h4>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
