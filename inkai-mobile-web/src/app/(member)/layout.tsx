"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = new Set(["/", "/register", "/register-parent", "/forgot-password"]);

function normalizePathname(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export default function MemberSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const normalized = normalizePathname(pathname ?? "/");
  const isPublic = PUBLIC_PATHS.has(normalized);

  useEffect(() => {
    if (isPublic) return;
    if (!isAuthLoading && !user) {
      router.replace("/");
    }
  }, [isPublic, isAuthLoading, user, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (isAuthLoading || !user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "var(--background-dark)",
        }}
      >
        <Loader2 className="animate-spin" size={40} aria-label="Memuat…" />
      </div>
    );
  }

  return <>{children}</>;
}
