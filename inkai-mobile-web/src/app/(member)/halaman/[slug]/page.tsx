"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import PublicMarkdown from "@/components/PublicMarkdown/PublicMarkdown";
import PublicBottomNav from "@/components/PublicBottomNav/PublicBottomNav";
import ScrollButtons from "@/components/ScrollButtons/ScrollButtons";
import {
  fetchPublicNavTabs,
  findNavTabBySlug,
  getTabTitle,
  halamanPath,
  type NavTabItem,
} from "@/lib/publicNavContent";
import styles from "./NavPage.module.css";

export default function NavHalamanPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [tabs, setTabs] = useState<NavTabItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchPublicNavTabs();
      if (!cancelled) {
        setTabs(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const tab = findNavTabBySlug(tabs, slug);
  const title = tab ? getTabTitle(tab.content) || tab.name : "";

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.loading}>
          <Loader2 className="animate-spin" size={32} aria-label="Memuat…" />
        </div>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className={styles.shell}>
        <header className={styles.headerBar}>
          <Link href="/" className={styles.backBtn} aria-label="Kembali ke beranda">
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.headerText}>
            <p className={styles.headerTitle}>Halaman tidak ditemukan</p>
          </div>
        </header>
        <main className={styles.main}>
          <p className={styles.notFound}>Konten navigasi tidak tersedia.</p>
          <Link href="/" className={styles.homeLink}>
            Kembali ke Beranda
          </Link>
        </main>
      </div>
    );
  }

  const otherTabs = tabs.filter((t) => t.slug !== slug);

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.ambientOrbAmber} />
      </div>

      <header className={styles.headerBar}>
        <Link href="/" className={styles.backBtn} aria-label="Kembali ke beranda">
          <ArrowLeft size={18} />
        </Link>
        <div className={styles.headerText}>
          <p className={styles.headerTitle}>{title}</p>
          <p className={styles.headerSubtitle}>{tab.name}</p>
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.contentCard}>
          <div className={styles.contentAccent} aria-hidden="true" />
          <div className={styles.contentBody}>
            <PublicMarkdown content={tab.content} />
          </div>
        </article>

        {otherTabs.length > 0 && (
          <section className={styles.related} aria-label="Halaman terkait">
            <h2 className={styles.relatedTitle}>Navigasi Lainnya</h2>
            <div className={styles.relatedList}>
              {otherTabs.map((item) => (
                <Link
                  key={item.id}
                  href={halamanPath(item.slug)}
                  prefetch
                  className={styles.relatedLink}
                >
                  <span>{item.name}</span>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <ScrollButtons />
      <PublicBottomNav activeSlug={slug} />
    </div>
  );
}
