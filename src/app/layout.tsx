import type { Metadata, Viewport } from "next";
import { Kantumruy_Pro } from "next/font/google";
import "./globals.css";
import TRPCProvider from "./_trpc/Provider";

const kantum = Kantumruy_Pro({
  variable: "--font-kantum",
  subsets: ["khmer", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "Visothap",
  description: "Visothap - The place where you can find the best products",
};

export const viewport: Viewport = {
  width: 1170,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${kantum.variable} ${kantum.className} antialiased`}
      suppressHydrationWarning={true}
    >
      <body className="min-h-full flex flex-col w-full">
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
