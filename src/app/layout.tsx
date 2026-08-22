import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TopNav } from "@/components/nav/TopNav";
import { DetailPanel } from "@/components/detail/DetailPanel";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${workSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-void-950 text-ink-0 overflow-hidden">
        <Providers>
          <TopNav />
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">{children}</main>
          <DetailPanel />
        </Providers>
      </body>
    </html>
  );
}
