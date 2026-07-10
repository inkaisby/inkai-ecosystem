"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ReadMoreIcon,
  User,
  LayoutDashboard,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PublicMarkdown, {
  PublicMarkdownPreview,
  shouldShowReadMore,
  stripMarkdownTitle,
} from "@/components/PublicMarkdown/PublicMarkdown";
import PublicBottomNav from "@/components/PublicBottomNav/PublicBottomNav";
import ScrollButtons from "@/components/ScrollButtons/ScrollButtons";
import {
  fetchPublicNavTabs,
  fetchPublicCarousel,
  getTabTitle,
  halamanPath,
  type NavTabItem,
  type CarouselItem,
} from "@/lib/publicNavContent";
import styles from "./PublicLanding.module.css";

export default function PublicLandingPage() {
  const [tabs, setTabs] = useState<NavTabItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/register");
    router.prefetch("/dashboard");
    router.prefetch("/store");
  }, [router]);

  useEffect(() => {
    tabs.forEach((tab) => router.prefetch(halamanPath(tab.slug)));
  }, [tabs, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [navTabs, carousel] = await Promise.all([
        fetchPublicNavTabs(),
        fetchPublicCarousel(),
      ]);
      if (!cancelled) {
        setTabs(navTabs);
        setCarouselItems(carousel);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tabs.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop;
      setIsCollapsed(scrollPos > 60);

      let currentActive = "home";
      for (const tab of tabs) {
        const ref = sectionRefs.current[tab.slug];
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom > 140) {
            currentActive = tab.slug;
            break;
          }
        }
      }
      setActiveTab(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabs]);

  useEffect(() => {
    const activeBtn = document.getElementById(`tab-btn-${activeTab}`);
    if (activeBtn && tabContainerRef.current) {
      const container = tabContainerRef.current;
      const scrollLeft =
        activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeTab]);

  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselItems]);

  const handleTabClick = (slug: string) => {
    setActiveTab(slug);
    const target = sectionRefs.current[slug];
    if (target) {
      const headerOffset = 110;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const loginHref = user ? "/dashboard" : "/login";

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.ambientOrbAmber} />
        <div className={styles.ambientOrbBlue} />
      </div>

      <header className={styles.stickyHeader}>
        <div className={styles.headerBar}>
          <div className={styles.brand}>
            <Image src="/logo.png" alt="INKAI Logo" width={34} height={34} priority unoptimized />
            <div>
              <h1 className={styles.brandTitle}>INKAI JAWA TIMUR</h1>
              <p className={styles.brandSubtitle}>Digital Ecosystem</p>
            </div>
          </div>

          <Link
            href={loginHref}
            prefetch
            className={`${styles.loginLink} ${isCollapsed ? styles.loginBtnCollapsed : styles.loginBtnExpanded}`}
            aria-label={user ? "Dashboard" : "Masuk"}
          >
            {user ? <LayoutDashboard size={14} /> : <User size={14} />}
            {!isCollapsed && <span>{user ? "Dashboard" : "Masuk"}</span>}
          </Link>
        </div>

        <div className={styles.tabBarWrap}>
          <div ref={tabContainerRef} className={styles.tabScroll}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-btn-${tab.slug}`}
                onClick={() => handleTabClick(tab.slug)}
                className={`${styles.tabBtn} ${activeTab === tab.slug ? styles.tabBtnActive : ""}`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className={styles.tabFadeRight} aria-hidden="true" />
        </div>
      </header>

      <main className={styles.main}>
        {carouselItems.length > 0 && (
          <div className={styles.carousel}>
            <div className={styles.carouselAspect}>
              <AnimatePresence mode="wait">
                {carouselItems.map(
                  (item, index) =>
                    index === carouselIndex && (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                        className={styles.carouselSlide}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          unoptimized
                          className={styles.carouselImage}
                        />
                        <div className={styles.carouselOverlay} />
                        <div className={styles.carouselCaption}>
                          <span className={styles.carouselBadge}>Info Terpopuler</span>
                          <h2 className={styles.carouselTitle}>{item.title}</h2>
                        </div>
                      </motion.div>
                    )
                )}
              </AnimatePresence>

              {carouselItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setCarouselIndex(
                        (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
                      )
                    }
                    className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
                    aria-label="Berita sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCarouselIndex((prev) => (prev + 1) % carouselItems.length)
                    }
                    className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                    aria-label="Berita berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {carouselItems.length > 1 && (
              <div className={styles.carouselDots}>
                {carouselItems.map((_, idx) => (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => setCarouselIndex(idx)}
                    onKeyDown={(e) => e.key === "Enter" && setCarouselIndex(idx)}
                    className={`${styles.carouselDot} ${carouselIndex === idx ? styles.carouselDotActive : ""}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.ctaGrid}>
          <Link href="/register" prefetch className={`${styles.ctaCard} ${styles.ctaRegister}`}>
            <div className={styles.ctaIconWrap}>
              <User size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span className={styles.ctaLabel}>Daftar Anggota</span>
          </Link>

          <Link href="/dojo" prefetch className={`${styles.ctaCard} ${styles.ctaDojo}`}>
            <div className={styles.ctaIconWrap}>
              <MapPin size={20} color="#fbbf24" strokeWidth={2.5} />
            </div>
            <span className={`${styles.ctaLabel} ${styles.ctaLabelMuted}`}>Cari Dojo</span>
          </Link>

          <Link href="/store" prefetch className={`${styles.ctaCard} ${styles.ctaStore}`}>
            <div className={styles.ctaIconWrap}>
              <ShoppingBag size={20} color="#fbbf24" strokeWidth={2.5} />
            </div>
            <span className={`${styles.ctaLabel} ${styles.ctaLabelMuted}`}>INKAI Store</span>
          </Link>
        </div>

        <div className={styles.sections}>
          {tabs.map((tab) => (
            <article
              key={tab.id}
              ref={(el) => {
                sectionRefs.current[tab.slug] = el;
              }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionAccent} aria-hidden="true" />
              <div className={styles.sectionBody}>
                <h2 className={styles.sectionTitle}>
                  {getTabTitle(tab.content) || tab.name}
                </h2>
                {shouldShowReadMore(tab.content) ? (
                  <>
                    <PublicMarkdownPreview content={tab.content} />
                    <Link
                      href={halamanPath(tab.slug)}
                      prefetch
                      className={styles.readMoreLink}
                    >
                      Baca Selengkapnya
                      <ReadMoreIcon size={14} />
                    </Link>
                  </>
                ) : (
                  <PublicMarkdown content={stripMarkdownTitle(tab.content)} />
                )}
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerAccent} aria-hidden="true" />
        <div className={styles.footerLogo}>
          <Image src="/logo.png" alt="" width={28} height={28} unoptimized aria-hidden />
        </div>
        <p className={styles.footerCopy}>© 2026 Institut Karate-Do Indonesia (INKAI)</p>
        <p className={styles.footerSub}>All Rights Reserved</p>
        <a href="https://inkai.or.id" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
          inkai.or.id
        </a>
      </footer>

      <ScrollButtons />
      <PublicBottomNav activeSlug={activeTab} />
    </div>
  );
}
