import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menuva — WebAR Restaurant Ordering",
  description: "Order food at your table with augmented reality",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div id="screen-container">{children}</div>
      </body>
    </html>
  );
}