"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Loader2, Search } from "lucide-react";
import styles from "./Messages.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Messages() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const chats = [
    {
      id: "1",
      name: "Admin Cabang Surabaya",
      lastMessage: "Harap segera verifikasi dokumen pendaftaran.",
      time: "10:30",
      unread: 2,
      avatar: "/logo.png"
    },
    {
      id: "2",
      name: "Senpai Rahman",
      lastMessage: "Latihan hari ini diundur ke jam 4 sore.",
      time: "08:15",
      unread: 0,
      avatar: "/logo.png"
    },
    {
      id: "3",
      name: "Admin Pusat",
      lastMessage: "Selamat! Kenaikan tingkat Anda telah divalidasi.",
      time: "Kemarin",
      unread: 0,
      avatar: "/logo.png"
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Pesan</h1>
      </header>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Cari pesan..." className={styles.searchInput} />
        </div>
      </div>

      <div className={styles.list}>
        {chats.map((chat, i) => (
          <motion.div 
            key={chat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={styles.chatItem}
            onClick={() => router.push(`/messages/${chat.id}`)}
          >
            <div className={styles.avatarWrapper}>
              <Image src={chat.avatar} alt={chat.name} width={50} height={50} className={styles.avatar} />
            </div>
            <div className={styles.chatContent}>
              <div className={styles.chatHeader}>
                <h3 className={styles.chatName}>{chat.name}</h3>
                <span className={styles.chatTime}>{chat.time}</span>
              </div>
              <div className={styles.chatBottom}>
                <p className={styles.lastMessage}>{chat.lastMessage}</p>
                {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}
