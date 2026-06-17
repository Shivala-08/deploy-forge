import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "DeployForge — Ship everything. Host forever.",
  description:
    "Connect GitHub. Push code. DeployForge handles the rest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
