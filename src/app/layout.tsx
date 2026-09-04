import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import AppShell from "@/components/AppShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Geist has no Khmer glyphs; without this the UI falls back to tofu boxes in `km`.
const notoKhmer = Noto_Sans_Khmer({ variable: "--font-khmer", subsets: ["khmer"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Bong POS",
  description: "Point of sale terminal",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoKhmer.variable} antialiased`}>
        <I18nProvider>
          <StoreProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </StoreProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
