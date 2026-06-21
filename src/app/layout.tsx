import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TRPCProvider from "./_trpc/Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visothap",
  description: "Visothap - The place where you can find the best products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased w-full overflow-x-clip`}
      suppressHydrationWarning={true}
    >
      <head>
        <meta name="viewport" content="width=1170" />
      </head>
      <body className="min-h-full flex flex-col w-full overflow-x-clip">
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
