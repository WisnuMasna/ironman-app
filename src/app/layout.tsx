import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { TabBar, TabBarNav } from "@/components/ui/tab-bar";
import { ThemeBootScript } from "./theme-script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tri-plan · IRONMAN 70.3 Da Nang",
  description:
    "Periodised triathlon training plan for IRONMAN 70.3 Da Nang, 9 May 2027",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      className={`${jakarta.variable} ${barlow.variable} h-full antialiased`}
    >
      <head>
        <ThemeBootScript />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-text">
        {children}
        <Suspense fallback={<TabBarNav pathname="/" />}>
          <TabBar />
        </Suspense>
      </body>
    </html>
  );
}
