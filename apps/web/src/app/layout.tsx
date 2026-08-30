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
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0d14] text-[#f3f4f6]">
        {children}
      </body>
    </html>
  );
}
