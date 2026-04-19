import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menuva — WebAR Restaurant Ordering",
  description: "Order food at your table with augmented reality",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Menuva",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F7F6F3",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload critical fonts */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" 
          as="style"
        />
        {/* Critical CSS for faster first paint */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --accent: #C8760A;
            --bg: #FFFFFF;
            --surface: #F7F6F3;
            --border: #E8E6E1;
            --ink: #1A1918;
            --ink-2: #6B6560;
            --ink-3: #A39E99;
          }
          #screen-container {
            opacity: 0;
            animation: fadeIn 0.2s ease forwards;
          }
          @keyframes fadeIn {
            to { opacity: 1; }
          }
        `}} />
      </head>
      <body>
        <div id="screen-container">{children}</div>
      </body>
    </html>
  );
}