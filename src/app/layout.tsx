import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TopNav } from "@/components/nav/TopNav";
import { Footer } from "@/components/nav/Footer";
import { DetailPanel } from "@/components/detail/DetailPanel";

// Single font for the entire app — both --font-sans (body) and
// --font-display (headings) resolve to this in globals.css, so every
// existing component keeps working unchanged.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SUBMYNT — Your Subscription Universe",
  description:
    "Discover, compare and optimize every digital subscription you pay for — mapped as one living universe.",
};

export const viewport: Viewport = {
  themeColor: "#0b0906",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Lets fixed/sticky mobile chrome (header, floating controls, sponsored
  // bar) read real env(safe-area-inset-*) values instead of always 0, so
  // they can pad themselves clear of the notch/Dynamic Island and home
  // indicator instead of rendering underneath them.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-void-950 text-ink-0 overflow-hidden">
        <Providers>
          <TopNav />
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">{children}</main>
          <Footer />
          <DetailPanel />
        </Providers>
      </body>
    </html>
  );
}
