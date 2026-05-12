"use client";

import { Home, Map as MapIcon, Shield, User, Award, ShieldCheck } from "lucide-react";
import styles from "./BottomNav.module.css";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const roles = user?.roles || [];
  const primaryRole = roles.includes('ADMIN_PUSAT') || roles.includes('ADMINISTRATOR') ? 'ADMIN_PUSAT' : 
                     roles.includes('ADMIN_PROVINCE') ? 'ADMIN_PROVINCE' :
                     roles.includes('ADMIN_BRANCH') ? 'ADMIN_BRANCH' :
                     roles.includes('ADMIN_DOJO') ? 'ADMIN_DOJO' : 'MEMBER';

  const navItems = [
    { icon: <Home size={20} />, label: "Home", path: "/admin" },
    { icon: <User size={20} />, label: "Anggota", path: "/admin/members" },
    { icon: <Award size={20} />, label: "Event", path: "/admin/events" },
    { icon: <ShieldCheck size={20} />, label: "Verifikasi", path: "/admin/verification" },
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
