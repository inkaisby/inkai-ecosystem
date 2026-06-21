"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  User,
  LayoutDashboard,
  MapPin,
  Download,
  BookOpen,
  Award,
  Users,
  Target,
  Home as HomeIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { getPublicApiV1Base } from "@/lib/publicApiBase";
import styles from "./PublicLanding.module.css";

interface TabItem {
  id: string;
  name: string;
  slug: string;
  content: string;
  order: number;
}

interface CarouselItem {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string | null;
}

const FALLBACK_TABS: TabItem[] = [
  {
    id: "1",
    name: "Home",
    slug: "home",
    content: "# Selamat Datang di INKAI\n\nInstitut Karate-Do Indonesia (INKAI) adalah salah satu perguruan karate tertua dan terbesar di Indonesia. Perguruan ini berkomitmen membentuk generasi berkarakter, tangguh, dan berprestasi.\n\n### Pengumuman Terbaru\n- **Ujian DAN Wilayah Jawa Barat**: Bandung, 15 Juli 2026\n- **Rakernas PP INKAI**: Jakarta, 22 Agustus 2026\n\n### Prestasi Utama\n- Juara Umum Piala Panglima TNI 2025\n- 5 Medali Emas Kejuaraan Karate Asia Pasifik 2026",
    order: 0,
  },
  {
    id: "2",
    name: "Sejarah",
    slug: "sejarah",
    content: "# Sejarah INKAI\n\nInstitut Karate-Do Indonesia (INKAI) didirikan pada tanggal **15 April 1971** oleh para tokoh senior karate nasional.\n\nSejak awal pembentukannya, INKAI secara konsisten mendidik karateka tangguh berlandaskan Janji INKAI dan integritas bela diri karate-do.\n\nKini INKAI tersebar di 38 Provinsi di Indonesia dengan jutaan anggota aktif serta ribuan dojo di seluruh pelosok negeri.",
    order: 1,
  },
  {
    id: "3",
    name: "Makna Lambang",
    slug: "makna-lambang",
    content: "# Makna Lambang INKAI\n\nLogo INKAI melambangkan filosofi terdalam karate-do:\n\n1. **Bulatan Merah**\n   Keberanian hati suci dan semangat yang membara.\n2. **Karateka yang Berlutut**\n   Kesetiaan, kedisiplinan, serta kerendahan hati kesatria.\n3. **Huruf INKAI**\n   Identitas persatuan nasional Institut Karate-Do Indonesia.",
    order: 2,
  },
  {
    id: "4",
    name: "Struktur Organisasi",
    slug: "struktur-organisasi",
    content: "# Struktur Organisasi PP INKAI\n\n### Dewan Guru\n- **Ketua Dewan Guru:** Shihan H. Syahril\n- **Anggota:** Shihan Agus, Shihan Bambang\n\n### Pengurus Pusat (PP)\n- **Ketua Umum:** Laksdya TNI Shihan Ivan\n- **Sekretaris Umum:** Sensei Dedi\n- **Bendahara Umum:** Sensei Rika",
    order: 3,
  },
  {
    id: "5",
    name: "Visi & Misi",
    slug: "visi-misi",
    content: "# Visi & Misi INKAI\n\n### Visi\nMenjadikan INKAI sebagai organisasi karate yang modern, berkarakter, solid, dan berprestasi tingkat dunia.\n\n### Misi\n1. Membina fisik dan mental karateka berlandaskan integritas.\n2. Melaksanakan tata kelola organisasi secara transparan dan akuntabel.\n3. Melahirkan atlet berkelas internasional.",
    order: 4,
  },
];

const FALLBACK_CAROUSEL: CarouselItem[] = [
  {
    id: "c1",
    title: "Kejurnas INKAI 2026 Segera Digelar di Jakarta",
    imageUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "c2",
    title: "Gashuku Nasional Bali: Persiapan Ujian DAN Akbar",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
  },
];

const BOTTOM_NAV = [
  { slug: "home", label: "Home", icon: HomeIcon },
  { slug: "sejarah", label: "Sejarah", icon: BookOpen },
  { slug: "makna-lambang", label: "Lambang", icon: Award },
  { slug: "struktur-organisasi", label: "Struktur", icon: Users },
  { slug: "visi-misi", label: "Visi", icon: Target },
] as const;

export default function PublicLandingPage() {
  const [tabs, setTabs] = useState<TabItem[]>(FALLBACK_TABS);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(FALLBACK_CAROUSEL);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const baseUrl = getPublicApiV1Base();
      try {
        const tabRes = await axios.get(`${baseUrl}/nav-tabs`);
        if (tabRes.data.status === "success" && tabRes.data.data.length > 0) {
          setTabs(tabRes.data.data);
        }
      } catch (e) {
        console.warn("Failed to fetch nav tabs, using fallback:", e);
      }

      try {
        const carouselRes = await axios.get(`${baseUrl}/news-carousel`);
        if (carouselRes.data.status === "success" && carouselRes.data.data.length > 0) {
          setCarouselItems(carouselRes.data.data);
        }
      } catch (e) {
        console.warn("Failed to fetch news carousel, using fallback:", e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
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

    window.addEventListener("scroll", handleScroll);
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

  const renderInlineBold = (raw: string) =>
    raw.split("**").map((part, pIdx) =>
      pIdx % 2 === 1 ? (
        <strong key={pIdx} className={styles.mdStrong}>
          {part}
        </strong>
      ) : (
        part
      )
    );

  const pickListIcon = (cleanLine: string, context: string) => {
    const lower = cleanLine.toLowerCase();
    if (context.includes("pengumuman")) {
      if (lower.includes("ujian") || lower.includes("jadwal") || lower.includes("wilayah")) return "📅";
      if (lower.includes("rakernas") || lower.includes("rapat")) return "🏢";
      return "📢";
    }
    if (context.includes("prestasi")) {
      if (lower.includes("juara") || lower.includes("piala") || lower.includes("emas")) return "🏆";
      return "🏅";
    }
    return "•";
  };

  const renderListBlock = (lines: string[], blockIndex: number, context: string) => {
    const isRich = context.toLowerCase().includes("pengumuman") || context.toLowerCase().includes("prestasi");

    return (
      <div key={`list-${blockIndex}`} className={styles.mdList}>
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^- /, "");
          const icon = isRich ? pickListIcon(cleanLine, context.toLowerCase()) : "•";

          return (
            <div key={idx} className={styles.mdListItem}>
              {isRich ? (
                <span className={styles.mdListIcon}>{icon}</span>
              ) : (
                <span className={styles.mdListBullet} />
              )}
              <div className={styles.mdListText}>{renderInlineBold(cleanLine)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderNumberedBlock = (lines: string[], blockIndex: number) => (
    <div key={`num-${blockIndex}`} className={styles.mdList}>
      {lines.map((line, idx) => {
        const match = line.match(/^(\d+)\.\s*(.*)/);
        if (!match) return null;
        const [, num, content] = match;

        return (
          <div key={idx} className={styles.mdListItem}>
            <span className={styles.mdNumber}>{num}</span>
            <div className={styles.mdListText}>{renderInlineBold(content)}</div>
          </div>
        );
      })}
    </div>
  );

  const renderMarkdown = (text: string): ReactNode[] => {
    const blocks = text.split("\n\n");

    return blocks.flatMap((block, blockIndex) => {
      const lines = block.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) return [];

      if (lines[0].startsWith("# ")) {
        return [
          <h2 key={`h2-${blockIndex}`} className={styles.mdH2}>
            {lines[0].replace("# ", "")}
          </h2>,
          ...renderMarkdown(lines.slice(1).join("\n\n")),
        ];
      }

      if (lines[0].startsWith("### ")) {
        const heading = lines[0].replace("### ", "");
        const rest = lines.slice(1).join("\n\n");
        return [
          <h3 key={`h3-${blockIndex}`} className={styles.mdH3}>
            <span className={styles.mdH3Bar} />
            {heading}
          </h3>,
          ...(rest ? renderMarkdown(rest) : []),
        ];
      }

      if (lines.every((line) => line.startsWith("- "))) {
        return [renderListBlock(lines, blockIndex, text)];
      }

      if (lines.some((line) => /^\d+\.\s/.test(line))) {
        return [renderNumberedBlock(lines, blockIndex)];
      }

      return [
        <p key={`p-${blockIndex}`} className={styles.mdP}>
          {block.split("**").map((part, pIdx) =>
            pIdx % 2 === 1 ? (
              <strong key={pIdx} className={styles.mdStrong}>
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>,
      ];
    });
  };

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
              <h1 className={styles.brandTitle}>INKAI</h1>
              <p className={styles.brandSubtitle}>Digital Ecosystem</p>
            </div>
          </div>

          <button
            onClick={() => router.push(user ? "/dashboard" : "/login")}
            className={`${styles.loginBtn} ${isCollapsed ? styles.loginBtnCollapsed : styles.loginBtnExpanded}`}
            aria-label={user ? "Dashboard" : "Masuk"}
          >
            {user ? <LayoutDashboard size={14} /> : <User size={14} />}
            {!isCollapsed && <span>{user ? "Dashboard" : "Masuk"}</span>}
          </button>
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

        <div className={styles.ctaGrid}>
          <button
            type="button"
            onClick={() => router.push("/register")}
            className={`${styles.ctaCard} ${styles.ctaRegister}`}
          >
            <div className={styles.ctaIconWrap}>
              <User size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span className={styles.ctaLabel}>Daftar Anggota</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dojo")}
            className={`${styles.ctaCard} ${styles.ctaDojo}`}
          >
            <div className={styles.ctaIconWrap}>
              <MapPin size={20} color="#fbbf24" strokeWidth={2.5} />
            </div>
            <span className={`${styles.ctaLabel} ${styles.ctaLabelMuted}`}>Cari Dojo</span>
          </button>

          <a
            href="https://inkai.or.id"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.ctaCard} ${styles.ctaSite}`}
          >
            <div className={styles.ctaIconWrap}>
              <Download size={20} color="#a1a1aa" strokeWidth={2.5} />
            </div>
            <span className={`${styles.ctaLabel} ${styles.ctaLabelMuted}`}>Situs Pusat</span>
          </a>
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
              <div className={styles.sectionBody}>{renderMarkdown(tab.content)}</div>
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

      <nav className={styles.bottomNav} aria-label="Navigasi halaman">
        {BOTTOM_NAV.map(({ slug, label, icon: Icon }) => {
          const isActive = activeTab === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => handleTabClick(slug)}
              className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.bottomNavIcon}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className={styles.bottomNavLabel}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
