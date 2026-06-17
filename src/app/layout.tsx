import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/crm/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRM Hub – All your companies, one CRM",
  description: "Multi-tenant CRM for managing every company you launch.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased" style={{ backgroundColor: "#08090a", color: "#f7f8f8" }} suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
