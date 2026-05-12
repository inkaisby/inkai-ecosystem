"use client";

import { QRCodeSVG } from "qrcode.react";
import styles from "./MemberCard.module.css";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

interface MemberCardProps {
  nia: string;
  name: string;
  dojo: string;
  qrValue?: string;
}

export default function MemberCard({ nia, name, dojo, qrValue }: MemberCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.card}
    >
      <Shield className={styles.watermark} size={150} />
      
      <div className={styles.content}>
        <div className={styles.leftCol}>
          <div className={styles.badgeRow}>
            <div className={styles.logoBadge}>I</div>
            <span className={styles.badgeText}>KARTU ANGGOTA</span>
          </div>
          
          <div className={styles.infoBottom}>
            <h1 className={styles.name}>{name}</h1>
            <h2 className={styles.nia}>{nia}</h2>
            <p className={styles.dojo}>{dojo}</p>
          </div>
        </div>

        <div className={styles.qrContainer}>
          <div className={styles.qrWrapper}>
            {qrValue ? (
              <QRCodeSVG value={qrValue} size={100} />
            ) : (
              <div className="w-[100px] h-[100px] bg-gray-200 animate-pulse rounded-lg" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
