"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Paperclip, Loader2, Image as ImageIcon, Phone, Video } from "lucide-react";
import styles from "./ChatDetail.module.css";
import Image from "next/image";
import { motion } from "framer-motion";

interface ChatDetailProps {
  params: Promise<{ id: string }>;
}

export default function ChatDetail({ params }: ChatDetailProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for the prototype
  const chats = {
    "1": { name: "Admin Cabang Surabaya", avatar: "/logo.png", status: "Online" },
    "2": { name: "Senpai Rahman", avatar: "/logo.png", status: "Terakhir dilihat hari ini 09:00" },
    "3": { name: "Admin Pusat", avatar: "/logo.png", status: "Online" }
  };

  const chatInfo = chats[resolvedParams.id as keyof typeof chats] || { name: "Pengguna", avatar: "/logo.png", status: "Offline" };

  const [messages, setMessages] = useState([
    { id: 1, text: "Halo, ada yang bisa kami bantu?", sender: "them", time: "09:00" },
    { id: 2, text: "Saya ingin bertanya mengenai jadwal ujian.", sender: "me", time: "09:05" },
    { id: 3, text: "Jadwal ujian akan diadakan bulan depan. Pastikan dokumen sudah lengkap.", sender: "them", time: "09:10" },
  ]);

  useEffect(() => {
    setMounted(true);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputText("");

    // Simulate auto-reply for prototype
    setTimeout(() => {
      const replyMessage = {
        id: Date.now() + 1,
        text: "Terima kasih atas pesannya. Kami akan segera merespons.",
        sender: "them",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, replyMessage]);
    }, 1500);
  };

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.userInfo}>
          <Image src={chatInfo.avatar} alt={chatInfo.name} width={40} height={40} className={styles.avatar} />
          <div className={styles.userText}>
            <span className={styles.userName}>{chatInfo.name}</span>
            <span className={styles.userStatus}>{chatInfo.status}</span>
          </div>
        </div>
        <div className="flex gap-4 text-neutral-400">
          <Phone size={20} />
          <Video size={20} />
        </div>
      </header>

      <div className={styles.messagesArea}>
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${styles.messageBubble} ${msg.sender === "me" ? styles.messageSent : styles.messageReceived}`}
          >
            {msg.text}
            <span className={styles.messageTime}>{msg.time}</span>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <button className={styles.attachBtn}>
          <Paperclip size={24} />
        </button>
        <div className={styles.inputWrapper}>
          <input 
            type="text" 
            placeholder="Ketik pesan..." 
            className={styles.input}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
        </div>
        <button className={styles.sendBtn} onClick={handleSend} disabled={!inputText.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
