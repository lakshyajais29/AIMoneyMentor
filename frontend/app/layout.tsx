import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AI Money Mentor — Your Personal Financial Advisor",
  description:
    "AI-powered financial mentor for Indian retail investors. Analyse your MF portfolio, plan your FIRE date, optimise your taxes, and score your financial health.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${syne.variable} bg-white min-h-screen`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
