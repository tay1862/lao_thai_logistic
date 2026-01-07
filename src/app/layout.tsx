import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thai-Lao Logistics | ລະບົບຕິດຕາມພັດສະດຸ",
  description: "ລະບົບຈັດການຂົນສົ່ງພັດສະດຸລະຫວ່າງໄທ-ລາວ | Cross-border logistics management between Thailand and Laos",
  keywords: ["logistics", "tracking", "Thailand", "Laos", "COD", "parcel"],
  authors: [{ name: "Thai-Lao Logistics" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lo">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
