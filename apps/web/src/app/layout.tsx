import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceFuse — Financial Crime Investigation Cockpit",
  description: "Reconstruct the hidden network, money trail, timeline, and evidence across financial crime patterns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-linen text-ink-primary font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}