"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Package,
  ShoppingBag,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import BottomNav from "@/components/BottomNav/BottomNav";
import ScrollButtons from "@/components/ScrollButtons/ScrollButtons";
import CustomToast from "@/components/CustomToast/CustomToast";
import styles from "./Store.module.css";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
}


function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.inventory.getAll();
      if (res.status === "success" && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch {
      setError("Gagal memuat katalog produk. Periksa koneksi Anda.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleBuy = (product: Product) => {
    if (product.stock <= 0) return;

    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/store")}`);
      return;
    }

    setToast({
      show: true,
      message: `Fitur checkout "${product.name}" segera hadir. Hubungi pengurus dojo untuk pemesanan.`,
      type: "info",
    });
  };

  const mainClass = user ? `${styles.main} ${styles.mainWithNav}` : styles.main;
  const footerClass = user ? `${styles.footer} ${styles.footerWithNav}` : styles.footer;

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
          <p className={styles.headerTitle}>INKAI Store</p>
          <p className={styles.headerSubtitle}>Marketplace Resmi</p>
        </div>
        <ShoppingBag size={20} color="var(--primary-gold)" aria-hidden />
      </header>

      <main className={mainClass}>
        <div className={styles.hero}>
          <p className={styles.heroTitle}>Peralatan & Merchandise INKAI</p>
          <p className={styles.heroText}>
            Jelajahi katalog tanpa login. Untuk membeli atau checkout, silakan masuk ke akun
            anggota terlebih dahulu.
          </p>
        </div>

        {loading && (
          <div className={styles.loading}>
            <Loader2 className="animate-spin" size={32} aria-label="Memuat produk…" />
            <span>Memuat katalog…</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.error}>
            <AlertCircle size={32} />
            <p>{error}</p>
            <button type="button" className={styles.retryBtn} onClick={() => void fetchProducts()}>
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className={styles.empty}>
            <Package size={40} strokeWidth={1.5} />
            <p>Belum ada produk di katalog. Cek kembali nanti.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className={styles.grid}>
            {products.map((product) => {
              const outOfStock = product.stock <= 0;
              const lowStock = product.stock > 0 && product.stock < 10;

              return (
                <article key={product.id} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        unoptimized
                        className={styles.cardImage}
                      />
                    ) : (
                      <div className={styles.cardImageFallback}>
                        <Package size={28} />
                      </div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardName}>{product.name}</h2>
                    <p className={styles.cardPrice}>{formatIdr(product.price)}</p>
                    <p
                      className={`${styles.cardStock} ${lowStock ? styles.cardStockLow : ""}`}
                    >
                      {outOfStock ? "Stok habis" : `Stok: ${product.stock}`}
                    </p>
                    <button
                      type="button"
                      className={styles.buyBtn}
                      disabled={outOfStock}
                      onClick={() => handleBuy(product)}
                    >
                      <ShoppingCart size={14} />
                      {outOfStock ? "Habis" : user ? "Beli" : "Beli — Masuk"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className={footerClass}>
        <p className={styles.footerCopy}>© 2026 Institut Karate-Do Indonesia (INKAI)</p>
      </footer>

      <ScrollButtons compact={!user} />
      {user && <BottomNav />}

      <CustomToast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
