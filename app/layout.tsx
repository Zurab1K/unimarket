import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ChatBotWidget from "@/components/ChatBotWidget";
import Footer from "@/components/Footer";

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UniMarket",
  description: "Student marketplace for campus buying and selling.",
  icons: {
    icon: "/unimarket-logo.png",
    shortcut: "/unimarket-logo.png",
    apple: "/unimarket-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} min-h-screen bg-[#f6f0ea] antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
          <ChatBotWidget />
        </div>
      </body>
    </html>
  );
}
