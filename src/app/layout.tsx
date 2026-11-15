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
  description: "Kết Quả Xổ Số Miền Nam, Kết Quả Xổ Số Miền Bắc",
  metadataBase: new URL("https://www.Visothap.net"),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    siteName: "Visothap.net",
    images: [],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
                var baseTargetWidth = 1280;

                function applyScale() {
                  var rawWidth = window.innerWidth || window.screen.width;
                  var scrollW = (document.documentElement && document.documentElement.scrollWidth) || 0;
                  var targetWidth = Math.max(baseTargetWidth, scrollW);

                  if (rawWidth > 0 && rawWidth < targetWidth) {
                    var scale = Number((rawWidth / targetWidth).toFixed(4));
                    var content = 'width=' + targetWidth + ', initial-scale=' + scale + ', minimum-scale=' + scale + ', maximum-scale=3.0, user-scalable=yes';
                    var metas = document.querySelectorAll('meta[name="viewport"]');
                    if (metas.length > 0) {
                      metas.forEach(function(m) {
                        if (m.getAttribute('content') !== content) {
                          m.setAttribute('content', content);
                        }
                      });
                    } else {
                      var meta = document.createElement('meta');
                      meta.name = 'viewport';
                      meta.content = content;
                      document.head.appendChild(meta);
                    }
                  }
                }

                applyScale();

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', applyScale);
                }

                setTimeout(applyScale, 50);
                setTimeout(applyScale, 200);

                window.addEventListener('orientationchange', function() {
                  setTimeout(applyScale, 200);
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
