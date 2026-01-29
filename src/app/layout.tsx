import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as standard modern font
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // Assuming shadcn installed sonner based on package.json

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quavity",
  description: "Performance & Workload Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background text-foreground">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
