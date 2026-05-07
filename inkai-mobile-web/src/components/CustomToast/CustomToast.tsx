"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { useEffect } from "react";
import styles from "./CustomToast.module.css";

export type ToastType = 'success' | 'error' | 'info';

interface CustomToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export default function CustomToast({ message, type, isVisible, onClose }: CustomToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className={styles.iconSuccess} />;
      case 'error': return <AlertCircle className={styles.iconError} />;
      default: return <Info className={styles.iconInfo} />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 20, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={styles.toast}
        >
          <div className={styles.iconWrapper}>{getIcon()}</div>
          <p className={styles.message}>{message}</p>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
