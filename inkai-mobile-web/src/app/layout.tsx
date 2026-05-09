import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import PWARegistration from "@/components/PWARegistration";

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
                  background: 'rgba(20, 20, 25, 0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '12px',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
                  fontWeight: '600',
                  letterSpacing: '0.02em',
                },
                success: {
                  iconTheme: {
                    primary: '#F59E0B',
                    secondary: '#000',
                  },
                },
                error: {
                  style: {
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    background: 'rgba(20, 5, 5, 0.9)',
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

