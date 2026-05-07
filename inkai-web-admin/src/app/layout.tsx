import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "INKAI Admin Portal",
  description: "Portal Administrasi Institut Karate-do Indonesia",
};

import SidebarWrapper from "@/components/SidebarWrapper";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e24',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '14px',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
            },
            success: {
              iconTheme: {
                primary: '#f59e0b',
                secondary: '#000',
              },
            },
          }}
        />
        <SidebarWrapper>
          {children}
        </SidebarWrapper>
      </body>
    </html>
  );
}

