import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
// Fonts ship with the app (no Google Fonts request): faster on weak data, and
// the comic bursts always get the font they were drawn for.
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/bangers/400.css";
import "@fontsource/noto-sans-malayalam/malayalam-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kavala",
  description: "Your friendly neighbourhood, trying to do better, one small step at a time.",
  appleWebApp: { capable: true, title: "Kavala", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
