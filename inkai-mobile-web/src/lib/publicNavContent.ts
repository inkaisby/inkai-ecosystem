import axios from "axios";
import { getPublicApiV1Base } from "@/lib/publicApiBase";

export interface NavTabItem {
  id: string;
  name: string;
  slug: string;
  content: string;
  order: number;
}

export interface CarouselItem {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string | null;
}

export const FALLBACK_NAV_TABS: NavTabItem[] = [
  {
    id: "1",
    name: "Home",
    slug: "home",
    content:
      "# Selamat Datang di INKAI\n\nInstitut Karate-Do Indonesia (INKAI) adalah salah satu perguruan karate tertua dan terbesar di Indonesia. Perguruan ini berkomitmen membentuk generasi berkarakter, tangguh, dan berprestasi.\n\n### Pengumuman Terbaru\n- **Ujian DAN Wilayah Jawa Barat**: Bandung, 15 Juli 2026\n- **Rakernas PP INKAI**: Jakarta, 22 Agustus 2026\n\n### Prestasi Utama\n- Juara Umum Piala Panglima TNI 2025\n- 5 Medali Emas Kejuaraan Karate Asia Pasifik 2026",
    order: 0,
  },
  {
    id: "2",
    name: "Sejarah",
    slug: "sejarah",
    content:
      "# Sejarah INKAI\n\nInstitut Karate-Do Indonesia (INKAI) didirikan pada tanggal **15 April 1971** oleh para tokoh senior karate nasional.\n\nSejak awal pembentukannya, INKAI secara konsisten mendidik karateka tangguh berlandaskan Janji INKAI dan integritas bela diri karate-do.\n\nKini INKAI tersebar di 38 Provinsi di Indonesia dengan jutaan anggota aktif serta ribuan dojo di seluruh pelosok negeri.",
    order: 1,
  },
  {
    id: "3",
    name: "Makna Lambang",
    slug: "makna-lambang",
    content:
      "# Makna Lambang INKAI\n\nLogo INKAI melambangkan filosofi terdalam karate-do:\n\n1. **Bulatan Merah**\n   Keberanian hati suci dan semangat yang membara.\n2. **Karateka yang Berlutut**\n   Kesetiaan, kedisiplinan, serta kerendahan hati kesatria.\n3. **Huruf INKAI**\n   Identitas persatuan nasional Institut Karate-Do Indonesia.",
    order: 2,
  },
  {
    id: "4",
    name: "Struktur Organisasi",
    slug: "struktur-organisasi",
    content:
      "# Struktur Organisasi PP INKAI\n\n### Dewan Guru\n- **Ketua Dewan Guru:** Shihan H. Syahril\n- **Anggota:** Shihan Agus, Shihan Bambang\n\n### Pengurus Pusat (PP)\n- **Ketua Umum:** Laksdya TNI Shihan Ivan\n- **Sekretaris Umum:** Sensei Dedi\n- **Bendahara Umum:** Sensei Rika",
    order: 3,
  },
  {
    id: "5",
    name: "Visi & Misi",
    slug: "visi-misi",
    content:
      "# Visi & Misi INKAI\n\n### Visi\nMenjadikan INKAI sebagai organisasi karate yang modern, berkarakter, solid, dan berprestasi tingkat dunia.\n\n### Misi\n1. Membina fisik dan mental karateka berlandaskan integritas.\n2. Melaksanakan tata kelola organisasi secara transparan dan akuntabel.\n3. Melahirkan atlet berkelas internasional.",
    order: 4,
  },
];

export const FALLBACK_CAROUSEL: CarouselItem[] = [
  {
    id: "c1",
    title: "Kejurnas INKAI 2026 Segera Digelar di Jakarta",
    imageUrl:
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "c2",
    title: "Gashuku Nasional Bali: Persiapan Ujian DAN Akbar",
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
  },
];

export const PUBLIC_BOTTOM_NAV = [
  { slug: "home", label: "Home" },
  { slug: "sejarah", label: "Sejarah" },
  { slug: "makna-lambang", label: "Lambang" },
  { slug: "struktur-organisasi", label: "Struktur" },
  { slug: "visi-misi", label: "Visi" },
] as const;

export function halamanPath(slug: string): string {
  return `/halaman/${slug}`;
}

export function getTabTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

export function getContentPreview(content: string, maxLen = 200): string {
  const blocks = content.split("\n\n");
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const text = trimmed
      .replace(/\*\*/g, "")
      .replace(/^-\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!text) continue;
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen).trim()}…`;
  }
  return "";
}

export async function fetchPublicNavTabs(): Promise<NavTabItem[]> {
  const baseUrl = getPublicApiV1Base();
  try {
    const tabRes = await axios.get(`${baseUrl}/nav-tabs`);
    if (tabRes.data.status === "success" && tabRes.data.data.length > 0) {
      return tabRes.data.data;
    }
  } catch {
    /* fallback */
  }
  return FALLBACK_NAV_TABS;
}

export async function fetchPublicCarousel(): Promise<CarouselItem[]> {
  const baseUrl = getPublicApiV1Base();
  try {
    const carouselRes = await axios.get(`${baseUrl}/news-carousel`);
    if (carouselRes.data.status === "success" && carouselRes.data.data.length > 0) {
      return carouselRes.data.data;
    }
  } catch {
    /* fallback */
  }
  return FALLBACK_CAROUSEL;
}

export function findNavTabBySlug(tabs: NavTabItem[], slug: string): NavTabItem | undefined {
  return tabs.find((t) => t.slug === slug);
}
