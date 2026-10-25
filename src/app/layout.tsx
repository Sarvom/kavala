import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
// Fonts ship with the app (no Google Fonts request), so they load fast on weak
// data: Nunito for the rounded game look, Noto Sans Malayalam for the Lingo word game.
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/latin-900.css";
import "@fontsource/noto-sans-malayalam/malayalam-700.css";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/lib/app/theme";

export const metadata: Metadata = {
  title: "Kavala",
  description: "Your friendly neighbourhood, trying to do better, one small step at a time.",
  appleWebApp: { capable: true, title: "Kavala", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0d14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
