import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ThemeManager } from "@/components/ThemeManager";
import { AppShell } from "@/components/AppShell";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Little Log · Baby Tracker",
  description:
    "Track diapers, feedings, sleep and more for your baby — simple, fast and works on any phone.",
  applicationName: "Little Log",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Little Log",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d14" },
  ],
};

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeScript = `
(function(){try{
  var raw = localStorage.getItem('baby-tracker:data:v1');
  var pref = 'system';
  if(raw){var d = JSON.parse(raw); if(d && d.settings && d.settings.theme) pref = d.settings.theme;}
  var mq = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(pref === 'dark' || (pref === 'system' && mq)) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <StoreProvider>
          <ThemeManager />
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
