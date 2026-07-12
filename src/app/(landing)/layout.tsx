"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Home } from "lucide-react";
import type { GeneralSettings } from "@/types";

function LandingHeaderAndNav({
  settings,
}: {
  settings: GeneralSettings | undefined;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Sync current query param 'table'
  const tableParam = searchParams.get("table") || "Thông Tin Kết Quả";

  const navigations = [
    { label: "Xổ Số Trực Tiếp", value: "Thông Tin Kết Quả" },
    { label: "Sổ Kết Quả Miền Đông", value: "Sổ Kết Quả Miền Đông" },
    { label: "Sổ Kết Quả Miền Trung", value: "Sổ Kết Quả Miền Trung" },
    { label: "Sổ Kết Quả Miền Nam", value: "Sổ Kết Quả Miền Nam" },
    { label: "Sổ Kết Quả Miền Bắc", value: "Sổ Kết Quả Miền Bắc" },
  ];

  const handleNavClick = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("table", value);

    // Reset date in home if clicked
    if (value === "Thông Tin Kết Quả") {
      params.delete("date");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      {/* Top logo header */}
      <header className=" py-4 ">
        <div className=" w-[1170px] mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            {settings?.fullLogo ? (
              <div className="relative h-12 w-auto">
                <Image
                  src={settings.fullLogo}
                  alt="Logo Header"
                  height={50}
                  width={50}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-12 flex items-center justify-center font-bold text-2xl text-primary tracking-wide font-mono">
                Logo
              </div>
            )}
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="dark">
              <Link href="/admin" className="flex items-center gap-1.5">
                <LayoutDashboard size={16} strokeWidth={2.5} />
                Admin Board
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <nav className="border border-primary backdrop-blur-2xl sticky top-0 z-50 rounded-xs  overflow-hidden">
        <div className="w-[1170px] mx-auto">
          <ul className="flex flex-row w-full justify-between items-stretch">
            {navigations.map((nav, index) => {
              const isSelected = tableParam === nav.value;
              return (
                <li
                  key={nav.value}
                  onClick={() => handleNavClick(nav.value)}
                  className={`text-primary-foreground flex-1 text-center py-2 cursor-pointer text-base font-semibold transition-all duration-200  flex items-center justify-center gap-2  last:border-0 ${isSelected ? "bg-primary" : "!text-primary hover:bg-primary/10"}`}
                >
                  {nav.label}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: settings } = trpc.getGeneralSettings.useQuery();
  const [scale, setScale] = useState(1);
  const [rawHeight, setRawHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamically update site favicon based on custom database settings
  useEffect(() => {
    if (settings?.logo) {
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.logo;
    }
  }, [settings?.logo]);

  useEffect(() => {
    // Dynamic scale calculator
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1170) {
        setScale(width / 1170);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Dynamic height observer using ResizeObserver
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setRawHeight(entry.target.clientHeight);
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const scaledWidth = 1170 * scale;
  const scaledHeight = rawHeight * scale;

  return (
    <div className="min-h-screen overflow-x-clip w-full flex flex-col justify-start items-center">
      <div
        style={{
          width: `${scaledWidth}px`,
          height: scale < 1 && scaledHeight ? `${scaledHeight}px` : "auto",
          overflow: scale < 1 ? "hidden" : "visible",
          position: "relative",
        }}
        className="flex justify-start items-start"
      >
        <div
          ref={containerRef}
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            width: "1170px",
            minWidth: "1170px",
            position: "relative",
            minHeight: scale < 1 ? `calc(100vh / ${scale})` : "auto",
          }}
          className="flex flex-col"
        >
          <Suspense
            fallback={
              <div className=" border-b py-4 shadow-sm">
                <div className="w-[1170px] mx-auto px-4 flex justify-between items-center">
                  <div className="h-12 flex items-center justify-center font-bold text-2xl text-cyan-600 tracking-wide font-mono">
                    Logo
                  </div>
                </div>
              </div>
            }
          >
            <LandingHeaderAndNav settings={settings} />
          </Suspense>

          {/* Content body */}
          <main className="flex-1 w-[1170px] mx-auto py-6">
            <Suspense
              fallback={
                <div className="bg-white rounded-xs  shadow-sm border border-zinc-100 p-8 text-center text-zinc-500 font-medium flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#15bece]"></div>
                  Loading data...
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>

      {/* Footer: Always w-full of the screen width, outside the scaled wrapper */}
      <footer className="w-full bg-primary text-primary-foreground py-4 md:py-10 lg:py-20 border-t text-sm mt-auto">
        <div
          className={`w-full max-w-[1170px] mx-auto px-6 flex ${scale < 1
            ? "flex-col gap-2 text-center"
            : "flex-row justify-between items-center gap-4"
            }`}
        >
          <div
            className="text-xs md:text-base"
            dangerouslySetInnerHTML={{
              __html:
                settings?.leftFooterContent ||
                "<p>© 2026 VISOTHAP. All rights reserved.</p>",
            }}
          />
          <div
            className={`text-xs md:text-base  font-medium ${scale < 1 ? "text-center" : "text-right"}`}
            dangerouslySetInnerHTML={{
              __html:
                settings?.rightFooterContent ||
                "<p>Contact: info@visothap.net | Hotline: 1900 6868</p>",
            }}
          />
        </div>
      </footer>
    </div>
  );
}
