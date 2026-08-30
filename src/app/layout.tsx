import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Kantumruy_Pro } from "next/font/google";
import "./globals.css";
import TRPCProvider from "./_trpc/Provider";

const helvetica = localFont({
  src: [
    {
      path: "../fonts/helvetica-light-587ebe5a59211.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/Helvetica.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Helvetica-Oblique.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/Helvetica-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/Helvetica-BoldOblique.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-helvetica",
});

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
      className={`${helvetica.variable} ${kantum.variable} ${helvetica.className} antialiased`}
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
