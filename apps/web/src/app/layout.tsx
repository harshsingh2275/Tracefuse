import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TraceFuse — Financial Crime Investigation Cockpit",
    template: "%s — TraceFuse",
  },
  description:
    "AI-powered financial crime detection platform. Reconstruct multi-hop money trails, syndicate networks, and case evidence for regulatory compliance.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
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