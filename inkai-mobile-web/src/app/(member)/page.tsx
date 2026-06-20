"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  Compass,
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

// Fallback dynamic tab contents in case DB / API call fails
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

export default function PublicLandingPage() {
  const [tabs, setTabs] = useState<TabItem[]>(FALLBACK_TABS);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(FALLBACK_CAROUSEL);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch tabs & carousel from backend API
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

  // Handle Scroll to collapse Login button & Scroll-Spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop;

      // Collapse login button
      if (scrollPos > 60) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }

      // Scroll Spy logic
      let currentActive = "home";
      for (const tab of tabs) {
        const ref = sectionRefs.current[tab.slug];
        if (ref) {
          const rect = ref.getBoundingClientRect();
          // Adjust offset for sticky headers
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

  // Center the active tab in the horizontally scrollable Tab Bar
  useEffect(() => {
    const activeBtn = document.getElementById(`tab-btn-${activeTab}`);
    if (activeBtn && tabContainerRef.current) {
      const container = tabContainerRef.current;
      const scrollLeft =
        activeBtn.offsetLeft -
        container.offsetWidth / 2 +
        activeBtn.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeTab]);

  // Auto-play news carousel every 5 seconds
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

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Helper function to render simple markdown content
  const renderMarkdown = (text: string) => {
    return text.split("\n\n").map((paragraph, index) => {
      if (paragraph.startsWith("# ")) {
        return (
          <h2
            key={index}
            className="text-xl font-extrabold tracking-wide uppercase border-b border-[rgba(255,255,255,0.05)] pb-3 mb-4 mt-6"
            style={{ color: "var(--primary-gold)" }}
          >
            {paragraph.replace("# ", "")}
          </h2>
        );
      }
      if (paragraph.startsWith("### ")) {
        return (
          <h3 key={index} className="text-base font-black tracking-wider uppercase text-white mt-6 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
            {paragraph.replace("### ", "")}
          </h3>
        );
      }
      if (paragraph.startsWith("- ")) {
        const isAnnouncement = text.toLowerCase().includes("pengumuman");
        const isAchievement = text.toLowerCase().includes("prestasi");

        return (
          <div key={index} className="flex flex-col gap-3 my-3">
            {paragraph
              .split("\n")
              .filter((line) => line.trim() !== "")
              .map((line, idx) => {
                const cleanLine = line.replace("- ", "");
                const parts = cleanLine.split("**");
                
                // Select appropriate icon
                let iconEmoji = "📝";
                if (isAnnouncement) {
                  if (cleanLine.toLowerCase().includes("ujian") || cleanLine.toLowerCase().includes("jadwal") || cleanLine.toLowerCase().includes("wilayah")) {
                    iconEmoji = "📅"; // Calendar/Schedule
                  } else if (cleanLine.toLowerCase().includes("rakernas") || cleanLine.toLowerCase().includes("rapat")) {
                    iconEmoji = "🏢"; // Meeting/Office
                  } else {
                    iconEmoji = "📢"; // General Announcement
                  }
                } else if (isAchievement) {
                  if (cleanLine.toLowerCase().includes("juara") || cleanLine.toLowerCase().includes("piala") || cleanLine.toLowerCase().includes("emas")) {
                    iconEmoji = "🏆"; // Trophy
                  } else {
                    iconEmoji = "🏅"; // Medal
                  }
                }

                return (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      boxShadow: "0 4px 20px -2px rgba(0,0,0,0.2)",
                    }}
                  >
                    <span className="text-lg shrink-0 mt-0.5 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.2)]">
                      {iconEmoji}
                    </span>
                    <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      {parts.map((part, pIdx) =>
                        pIdx % 2 === 1 ? (
                          <strong key={pIdx} className="text-white font-extrabold tracking-wide">
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        );
      }
      return (
        <p key={index} className="text-gray-300 text-sm leading-relaxed mb-4">
          {paragraph.split("**").map((part, pIdx) =>
            pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div
      className="flex flex-col w-full max-w-full overflow-x-hidden"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background-dark)",
        color: "var(--text-light)",
        position: "relative",
      }}
    >
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "80%",
            height: "50%",
            backgroundColor: "var(--ambient-orb-amber)",
            filter: "blur(120px)",
            borderRadius: "50%",
            opacity: 0.12,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "-10%",
            width: "60%",
            height: "40%",
            backgroundColor: "var(--ambient-orb-blue)",
            filter: "blur(100px)",
            borderRadius: "50%",
            opacity: 0.1,
          }}
        />
      </div>

      {/* STICKY HEADER & NAV TAB BAR */}
      <div className="sticky top-0 z-50 flex flex-col w-full max-w-full overflow-hidden">
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-[rgba(10,10,12,0.85)] border-b border-[rgba(255,255,255,0.05)]"
          style={{ backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)" }}
        >
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="INKAI Logo" width={34} height={34} priority unoptimized />
            <div>
              <h1 className="text-sm font-black tracking-widest text-white uppercase">INKAI</h1>
              <p className="text-[8px] text-gray-500 font-extrabold uppercase tracking-widest">Digital Ecosystem</p>
            </div>
          </div>

          {/* Login Button with Dynamic Morphing */}
          <button
            onClick={() => {
              if (user) {
                router.push("/dashboard");
              } else {
                router.push("/login");
              }
            }}
            className={`btn-login flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ${
              isCollapsed ? "w-10 h-10 p-0 rounded-full" : "px-4 py-2.5 rounded-full"
            }`}
            style={{
              backgroundColor: "var(--primary-gold)",
              color: "#000",
              boxShadow: "0 4px 15px -4px rgba(245,158,11,0.4)",
              fontWeight: "900",
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            {user ? (
              <>
                <LayoutDashboard size={14} />
                {!isCollapsed && <span className="btn-text uppercase">Dashboard</span>}
              </>
            ) : (
              <>
                <User size={14} />
                {!isCollapsed && <span className="btn-text uppercase">Masuk</span>}
              </>
            )}
          </button>
        </div>

        {/* Dynamic Sticky Tab Navigation Bar */}
        <div
          className="relative w-full max-w-full bg-[rgba(10,10,12,0.95)] border-b border-[rgba(255,255,255,0.03)] overflow-hidden"
          style={{ backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)" }}
        >
          <div
            ref={tabContainerRef}
            className="tab-scroll flex gap-2 overflow-x-auto px-4 py-2 w-full min-w-0"
            style={{
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-btn-${tab.slug}`}
                onClick={() => handleTabClick(tab.slug)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                  activeTab === tab.slug
                    ? "bg-white text-black font-extrabold scale-105"
                    : "text-gray-400 hover:text-white bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)]"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          {/* Fade Overlay Right */}
          <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-[#0a0a0c] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* MAIN CONTENT VIEWPORT */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto px-4 pt-6 pb-24 flex flex-col flex-grow">
        {/* CAROUSEL BERITA SECTION */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.03)] mb-8 bg-[#111115]">
          <div className="relative w-full aspect-[16/9] overflow-hidden">
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
                      className="absolute inset-0 w-full h-full"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-[rgba(0,0,0,0.5)] to-transparent" />
                      <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col">
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1.5">
                          Info Terpopuler
                        </span>
                        <h2 className="text-sm font-extrabold text-white leading-snug line-clamp-2">
                          {item.title}
                        </h2>
                      </div>
                    </motion.div>
                  )
              )}
            </AnimatePresence>

            {/* Left/Right Carousel Controls */}
            {carouselItems.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCarouselIndex(
                      (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
                    )
                  }
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[rgba(0,0,0,0.45)] hover:bg-[rgba(0,0,0,0.65)] flex items-center justify-center text-white border border-[rgba(255,255,255,0.05)] transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setCarouselIndex((prev) => (prev + 1) % carouselItems.length)
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[rgba(0,0,0,0.45)] hover:bg-[rgba(0,0,0,0.65)] flex items-center justify-center text-white border border-[rgba(255,255,255,0.05)] transition"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
          {/* Dots Indicator */}
          {carouselItems.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
              {carouselItems.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    carouselIndex === idx ? "w-4 bg-amber-500" : "w-1.5 bg-gray-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA QUICK ACTIONS SECTION */}
        <div className="grid grid-cols-3 gap-3.5 mb-8">
          <button
            onClick={() => router.push("/register")}
            className="flex flex-col items-center justify-between p-4.5 rounded-3xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.3)",
              height: "100px",
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <User size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black tracking-wider uppercase text-white text-center w-full leading-tight">
              Daftar Anggota
            </span>
          </button>

          <button
            onClick={() => router.push("/dojo")}
            className="flex flex-col items-center justify-between p-4.5 rounded-3xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 10px 25px -5px rgba(30, 27, 75, 0.4)",
              height: "100px",
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
              <MapPin size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black tracking-wider uppercase text-gray-200 text-center w-full leading-tight">
              Cari Dojo
            </span>
          </button>

          <a
            href="https://inkai.or.id"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-between p-4.5 rounded-3xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group relative overflow-hidden text-center"
            style={{
              background: "linear-gradient(135deg, #111115 0%, #1c1917 100%)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
              height: "100px",
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0 group-hover:scale-110 transition-transform">
              <Download size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black tracking-wider uppercase text-gray-400 text-center w-full leading-tight">
              Situs Pusat
            </span>
          </a>
        </div>

        {/* SCROLLABLE SECTIONS (Tabs content vertically stacked) */}
        <div className="flex flex-col gap-12 mt-4">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => {
                sectionRefs.current[tab.slug] = el;
              }}
              className="glass-card p-6 shadow-xl relative overflow-hidden"
              style={{
                borderRadius: "2rem",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              {/* Decorative side bar matching INKAI colors */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-red-600" />
              
              <div className="pl-2">
                {renderMarkdown(tab.content)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER SECTION */}
      <footer className="mt-auto py-8 pb-28 bg-[#08080a] border-t border-[rgba(255,255,255,0.03)] text-center relative z-20">
        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
          © 2026 Institut Karate-Do Indonesia (INKAI)
        </p>
        <p className="text-[7px] text-gray-600 font-extrabold uppercase tracking-widest mt-1.5">
          All Rights Reserved.
        </p>
      </footer>

      {/* BOTTOM NAVIGATION BAR FOR VISITOR */}
      <nav 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex justify-around items-center z-50 py-3"
        style={{
          backgroundColor: "rgba(10, 10, 12, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
          paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          onClick={() => handleTabClick("home")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${
            activeTab === "home" ? "text-amber-500 scale-105" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-center p-1 rounded-xl">
            <HomeIcon size={18} className={activeTab === "home" ? "stroke-[2.5]" : "stroke-[2]"} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-wider text-center">Home</span>
        </button>

        <button
          onClick={() => handleTabClick("sejarah")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${
            activeTab === "sejarah" ? "text-amber-500 scale-105" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-center p-1 rounded-xl">
            <BookOpen size={18} className={activeTab === "sejarah" ? "stroke-[2.5]" : "stroke-[2]"} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-wider text-center">Sejarah</span>
        </button>

        <button
          onClick={() => handleTabClick("makna-lambang")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${
            activeTab === "makna-lambang" ? "text-amber-500 scale-105" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-center p-1 rounded-xl">
            <Award size={18} className={activeTab === "makna-lambang" ? "stroke-[2.5]" : "stroke-[2]"} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-wider text-center">Lambang</span>
        </button>

        <button
          onClick={() => handleTabClick("struktur-organisasi")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${
            activeTab === "struktur-organisasi" ? "text-amber-500 scale-105" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-center p-1 rounded-xl">
            <Users size={18} className={activeTab === "struktur-organisasi" ? "stroke-[2.5]" : "stroke-[2]"} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-wider text-center">Struktur</span>
        </button>

        <button
          onClick={() => handleTabClick("visi-misi")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${
            activeTab === "visi-misi" ? "text-amber-500 scale-105" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-center p-1 rounded-xl">
            <Target size={18} className={activeTab === "visi-misi" ? "stroke-[2.5]" : "stroke-[2]"} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-wider text-center">Visi Misi</span>
        </button>
      </nav>
    </div>
  );
}
