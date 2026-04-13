import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AnimatedBackground } from "@/components/animated-background";
import { Header } from "@/components/header";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = host.startsWith("http") ? host : `${protocol}://${host}`;

  return {
    metadataBase: new URL(baseUrl),
    title: "LV Team Builder",
    description: "Golf team management with fair team generation and multi-user check-in",
    manifest: "/manifest.json",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
    openGraph: {
      title: "LV Team Builder",
      description: "Golf team management with fair team generation and multi-user check-in",
      images: ["/og-image.png"],
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
        <meta name="theme-color" content="#166534" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <Providers>
          <AnimatedBackground />
          <Header />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
