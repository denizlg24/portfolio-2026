import type { Metadata } from "next";
import { Calistoga, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const calistoga = Calistoga({
  subsets: ["latin"],
  variable: "--font-calistoga",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Deniz Lopes Güneş | Software Engineer",
    template: "%s | Deniz Lopes Güneş",
  },
  description:
    "Software engineer from Portugal with a background in competitive sports. Co-founder and developer at Ocean Informatix, building modern web applications and digital experiences.",
  keywords: [
    "Deniz Lopes Güneş",
    "Software Engineer",
    "Web Developer",
    "Portugal",
    "Ocean Informatix",
    "Full Stack Developer",
    "FEUP",
  ],
  authors: [{ name: "Deniz Lopes Güneş" }],
  creator: "Deniz Lopes Güneş",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://denizlg24.com",
    title: "Deniz Lopes Güneş | Software Engineer",
    description:
      "Software engineer from Portugal with a background in competitive sports. Co-founder and developer at Ocean Informatix, building modern web applications and digital experiences.",
    siteName: "Deniz Lopes Güneş Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deniz Lopes Güneş | Software Engineer",
    description:
      "Software engineer from Portugal with a background in competitive sports. Co-founder and developer at Ocean Informatix.",
    creator: "@denizlg24",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${calistoga.variable} antialiased min-h-screen font-inter bg-background text-foreground mt-26`}
      >
        <Header />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
