"use client";

import Link from "next/link";
import {
  Home as HomeIcon,
  BookOpen,
  Award,
  Users,
  Target,
  type LucideIcon,
} from "lucide-react";
import { PUBLIC_BOTTOM_NAV, halamanPath } from "@/lib/publicNavContent";
import styles from "./PublicBottomNav.module.css";

const ICONS: Record<string, LucideIcon> = {
  home: HomeIcon,
  sejarah: BookOpen,
  "makna-lambang": Award,
  "struktur-organisasi": Users,
  "visi-misi": Target,
};

interface PublicBottomNavProps {
  activeSlug: string;
}

export default function PublicBottomNav({ activeSlug }: PublicBottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Navigasi halaman">
      {PUBLIC_BOTTOM_NAV.map(({ slug, label }) => {
        const Icon = ICONS[slug] ?? HomeIcon;
        const isActive = activeSlug === slug;

        return (
          <Link
            key={slug}
            href={halamanPath(slug)}
            prefetch
            className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.icon}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
