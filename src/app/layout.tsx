import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/components/cart-provider";
import { FavoritesProvider } from "@/components/favorites-provider";
import { RealtimeProvider } from "@/components/realtime-provider";
import "./globals.css";

const display = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Etjoaigi Trading — Trading OS",
  description:
    "Operations console for a used office furniture trading company: intake, grading, inventory, pricing and taxonomy.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased">
        <RealtimeProvider>
          <CartProvider>
            <FavoritesProvider>
              {children}
            </FavoritesProvider>
          </CartProvider>
        </RealtimeProvider>
        <Analytics />
      </body>
    </html>
  );
}
