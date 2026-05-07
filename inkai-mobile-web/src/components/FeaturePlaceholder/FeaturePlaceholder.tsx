"use client";

import { ArrowLeft, Construction, Loader2 } from "lucide-react";
import styles from "./Placeholder.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PlaceholderProps {
  title: string;
}

export default function FeaturePlaceholder({ title }: PlaceholderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Construction size={64} className={styles.icon} />
        </div>
        <h2 className={styles.heading}>Fitur Segera Hadir</h2>
        <p className={styles.text}>
          Halaman <strong>{title}</strong> sedang dalam tahap sinkronisasi dengan aplikasi mobile. 
          Mohon tunggu pembaruan selanjutnya!
        </p>
        <button className={styles.backHomeBtn} onClick={() => router.push("/dashboard")}>
          Kembali ke Beranda
        </button>
      </div>

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}
