import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import PWARegistration from "@/components/PWARegistration";
import AutomaticClockTheme from "@/components/AutomaticClockTheme/AutomaticClockTheme";

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
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <Script id="inkai-clock-phase-boot" strategy="beforeInteractive">
          {`(function(){try{var p=window.location.pathname||'';var admin=p.indexOf('/admin')===0;var phase=admin?'night':(new Date().getHours()<12?'day':'night');document.documentElement.setAttribute('data-clock-phase',phase);document.documentElement.style.colorScheme=phase==='day'?'light':'dark';}catch(e){}})();`}
        </Script>
        <AutomaticClockTheme />
        <div className="mobile-wrapper">
          <main className="mobile-content">
            <AuthProvider>
              <PWARegistration />
              {children}
            </AuthProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(10, 10, 12, 0.8)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 191, 0, 0.2)',
                  fontSize: '13px',
                  borderRadius: '20px',
                  padding: '14px 24px',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  fontWeight: '700',
                  letterSpacing: '0.01em',
                  maxWidth: '350px',
                },
                success: {
                  style: {
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: 'rgba(10, 15, 12, 0.85)',
                  },
                  iconTheme: {
                    primary: '#22C55E',
                    secondary: '#fff',
                  },
                },
                error: {
                  style: {
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(20, 10, 10, 0.85)',
                  },
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                }
              }}
            />
          </main>
        </div>
      </body>
    </html>
  );
}

