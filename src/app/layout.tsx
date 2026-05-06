import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Hub – All your companies, one CRM",
  description: "Multi-tenant CRM for managing every company you launch.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen" style={{ backgroundColor: "#08090a", color: "#f7f8f8" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
