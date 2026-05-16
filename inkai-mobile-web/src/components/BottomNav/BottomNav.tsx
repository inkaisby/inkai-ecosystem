"use client";

import { Home, User, Award, ShieldCheck, ClipboardCheck } from "lucide-react";
import styles from "./BottomNav.module.css";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  
  const navItems = isAdmin ? [
    { icon: <Home size={20} />, label: "Home", path: "/admin" },
    { icon: <User size={20} />, label: "Anggota", path: "/admin/members" },
    { icon: <Award size={20} />, label: "Event", path: "/admin/events" },
    { icon: <ClipboardCheck size={20} />, label: "Absensi", path: "/admin/attendance" },
    { icon: <ShieldCheck size={20} />, label: "Antrean", path: "/admin/verification" },
    { icon: <User size={20} />, label: "Profil", path: "/profile" },
  ] : [
    { icon: <Home size={20} />, label: "Home", path: "/dashboard" },
    { icon: <User size={20} />, label: "Profil", path: "/profile" },
  ];

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link 
            key={item.label} 
            href={item.path} 
            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
          >
            <div className={styles.iconWrapper}>{item.icon}</div>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
