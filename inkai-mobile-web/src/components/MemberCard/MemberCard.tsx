"use client";

import { QRCodeSVG } from "qrcode.react";
import styles from "./MemberCard.module.css";
import { Shield, MapPin } from "lucide-react";
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
      {/* Decorative Elements */}
      <div className={styles.glow} />
      <Shield className={styles.watermark} size={200} />
      
      <div className={styles.content}>
        <div className={styles.mainInfo}>
          <div className={styles.header}>
            <div className={styles.logoBadge}>I</div>
            <div className={styles.headerText}>
              <span className={styles.cardType}>KARTU ANGGOTA DIGITAL</span>
              <span className={styles.orgName}>INKAI INDONESIA</span>
            </div>
          </div>
          
          <div className={styles.memberDetails}>
            <h1 className={styles.name}>{name}</h1>
            <div className={styles.niaWrapper}>
              <span className={styles.niaLabel}>NIA</span>
              <h2 className={styles.niaValue}>{nia}</h2>
            </div>
            <div className={styles.dojoWrapper}>
              <MapPin size={10} className={styles.dojoIcon} />
              <p className={styles.dojoName}>{dojo}</p>
            </div>
          </div>
        </div>

        <div className={styles.qrSection}>
          <div className={styles.qrGlass}>
            <div className={styles.qrInner}>
              <QRCodeSVG 
                value={qrValue || nia || "N/A"} 
                size={80} 
                bgColor="transparent"
                fgColor="#f59e0b"
                includeMargin={false}
                level="M"
              />
            </div>
          </div>
          <span className={styles.scanText}>SCAN UNTUK VERIFIKASI</span>
        </div>
      </div>

      {/* Chip-like element */}
      <div className={styles.chip} />
    </motion.div>
  );
}
