"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, FileText, Video, X, Loader2, MessageCircle } from "lucide-react";
import api, { getAssetUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { compressImage } from "@/lib/imageUtils";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender?: {
    id: string;
    fullName: string;
  };
}

export default function ChatRoomPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.conversationId;
  
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    setupRealtime();

    return () => {
      supabase.removeAllChannels();
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.chat.getMessages(conversationId);
      if (res.status === "success") {
        setMessages(res.data);
      }
    } catch (error) {
      toast.error("Gagal memuat obrolan");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Optimistically updating the list, prevent duplicate from own send
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText("");
    await sendMessage(textToSend);
  };

  const sendMessage = async (content: string) => {
    try {
      setSending(true);
      const res = await api.chat.sendMessage({ conversationId, content });
      if (res.status === "success") {
        // Realtime will catch it, or we can manually add if we want instant feedback
        setMessages((prev) => {
          if (prev.find((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (error) {
      toast.error("Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowAttachmentMenu(false);
    setUploadingMedia(true);

    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        try {
          fileToUpload = await compressImage(file, 190);
        } catch (err) {
          console.error("Chat image compression failed", err);
        }
      }
      const formData = new FormData();
      formData.append("file", fileToUpload);

      // Using the generic upload auth endpoint (which usually uploads and returns URL)
      const uploadRes = await api.auth.uploadFile(formData);
      
      if (uploadRes.status === "success" && uploadRes.data?.fileUrl) {
        let type = "file";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";

        const messageContent = JSON.stringify({
          type,
          url: uploadRes.data.fileUrl,
          fileName: file.name,
        });

        await sendMessage(messageContent);
      } else {
        toast.error("Gagal mengunggah file");
      }
    } catch (error) {
      toast.error("Gagal mengunggah file");
      console.error(error);
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderMessageContent = (content: string) => {
    try {
      if (content.startsWith("{")) {
        const parsed = JSON.parse(content);
        if (parsed.type === "image") {
          return (
            <div className="mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getAssetUrl(parsed.url)} alt="Image attachment" className="rounded-lg max-w-full h-auto max-h-64 object-cover" />
            </div>
          );
        }
        if (parsed.type === "video") {
          return (
            <div className="mt-1">
              <video src={getAssetUrl(parsed.url)} controls className="rounded-lg max-w-full max-h-64" />
            </div>
          );
        }
        if (parsed.type === "file") {
          return (
            <a href={getAssetUrl(parsed.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 p-3 bg-black/20 rounded-lg text-blue-300 hover:text-blue-200 transition-colors">
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span className="truncate max-w-[200px]">{parsed.fileName || "Download Document"}</span>
            </a>
          );
        }
      }
    } catch (e) {
      // not a JSON string, fallback to text
    }

    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0A0A0C] text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 p-4 pt-6 flex items-center gap-3 z-20">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
             <span className="font-bold text-yellow-500">C</span>
          </div>
          <div className="min-w-0">
             <h2 className="font-semibold truncate">Chat</h2>
             <p className="text-xs text-neutral-400 truncate">Pesan Real-time</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-4 space-y-4 relative scroll-smooth">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-neutral-600" />
              </div>
              <p>Mulai percakapan sekarang</p>
           </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const showTail = idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && msg.sender?.fullName && (
                   <span className="text-xs text-neutral-500 ml-2 mb-1">{msg.sender.fullName}</span>
                )}
                <div
                  className={`relative max-w-[80%] p-3 shadow-sm ${
                    isMe
                      ? "bg-yellow-500 text-black rounded-2xl rounded-tr-sm"
                      : "bg-neutral-800 text-white rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {renderMessageContent(msg.content)}
                  <div className={`text-[10px] mt-1 text-right ${isMe ? "text-yellow-800" : "text-neutral-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        {uploadingMedia && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="bg-yellow-500/50 text-black rounded-2xl rounded-tr-sm p-3 flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-sm">Mengunggah...</span>
              </div>
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-neutral-900 border-t border-neutral-800 p-3 pb-8 relative z-20">
        <AnimatePresence>
          {showAttachmentMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-20 left-4 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-xl p-2 flex gap-2"
            >
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-3 hover:bg-neutral-700 rounded-xl transition-colors min-w-[70px]">
                 <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <ImageIcon className="w-5 h-5" />
                 </div>
                 <span className="text-xs">Foto</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-3 hover:bg-neutral-700 rounded-xl transition-colors min-w-[70px]">
                 <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Video className="w-5 h-5" />
                 </div>
                 <span className="text-xs">Video</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-3 hover:bg-neutral-700 rounded-xl transition-colors min-w-[70px]">
                 <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <FileText className="w-5 h-5" />
                 </div>
                 <span className="text-xs">File</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className={`p-3 rounded-full transition-colors flex-shrink-0 ${showAttachmentMenu ? 'bg-yellow-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
          >
            {showAttachmentMenu ? <X className="w-6 h-6" /> : <Paperclip className="w-6 h-6" />}
          </button>
          
          <div className="flex-1 bg-neutral-800 rounded-3xl border border-neutral-700 overflow-hidden flex items-center">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder="Tulis pesan..."
              className="w-full bg-transparent text-white px-4 py-3 focus:outline-none resize-none max-h-32 min-h-[48px]"
              rows={1}
              style={{
                 height: "48px"
              }}
            />
          </div>

          <button
            onClick={handleSendText}
            disabled={!inputText.trim() || sending}
            className="p-3 rounded-full bg-yellow-500 text-black disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all flex-shrink-0"
          >
            {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
      />
    </div>
  );
}
