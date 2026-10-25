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
      className={`h-full ${helvetica.variable} ${kantum.variable} ${helvetica.className} antialiased`}
      suppressHydrationWarning={true}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function setAppHeight() {
                  var h = window.innerHeight;
                  document.documentElement.style.setProperty('--app-height', h + 'px');
                }
                setAppHeight();
                window.addEventListener('resize', setAppHeight);
                window.addEventListener('orientationchange', function() {
                  setTimeout(setAppHeight, 150);
                });

                function adjustViewport() {
                  var targetWidth = 1170;
                  var screenWidth = window.screen.width;
                  if (window.innerWidth && window.innerWidth > 0 && window.innerWidth < screenWidth) {
                    screenWidth = window.innerWidth;
                  }
                  if (screenWidth < targetWidth) {
                    var scale = screenWidth / targetWidth;
                    var content = 'width=' + targetWidth + ', initial-scale=' + scale + ', minimum-scale=' + (scale * 0.5) + ', maximum-scale=3.0, user-scalable=yes';
                    var metas = document.querySelectorAll('meta[name="viewport"]');
                    if (metas.length > 0) {
                      metas.forEach(function(m) {
                        m.setAttribute('content', content);
                      });
                    } else {
                      var meta = document.createElement('meta');
                      meta.name = 'viewport';
                      meta.content = content;
                      document.head.appendChild(meta);
                    }
                  }
                }

                adjustViewport();
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', adjustViewport);
                }
                window.addEventListener('resize', adjustViewport);
                window.addEventListener('orientationchange', function() {
                  setTimeout(adjustViewport, 150);
                });
              })();
            `,
          }}
        />
      </head>
      <body className="h-full min-h-full flex flex-col w-full">
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
