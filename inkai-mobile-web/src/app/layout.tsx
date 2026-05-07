import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0C",
};

export const metadata: Metadata = {
  title: "INKAI Mobile",
  description: "Portal Anggota INKAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <div className="mobile-wrapper">
          <main className="mobile-content">
            <AuthProvider>
              {children}
            </AuthProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
