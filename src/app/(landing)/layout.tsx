"use client";

import React, { useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import type { GeneralSettings } from "@/types";

function LandingHeaderAndNav({
  settings,
}: {
  settings: GeneralSettings | undefined;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch nav labels from DB (auto-seeded on first request)
  const { data: dbNavLabels } = trpc.getNavLabels.useQuery();

  // Sync current query param 'table'
  const tableParam = searchParams.get("table");

  // Fall back to static defaults while loading
  const STATIC_NAVIGATIONS: { label: string; value: string }[] = [
    { label: "Xổ Số Trực Tiếp", value: "all" },
    { label: "Sổ Kết Quả Miền Đông", value: "first" },
    { label: "Sổ Kết Quả Miền Trung", value: "second" },
    { label: "Sổ Kết Quả Miền Nam", value: "third" },
    { label: "Sổ Kết Quả Miền Bắc", value: "fourth" },
  ];

  const navigations = dbNavLabels
    ? dbNavLabels.filter((n: { enabled: boolean }) => n.enabled)
    : STATIC_NAVIGATIONS;

  const handleNavClick = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all" || value === "Thông Tin Kết Quả") {
      params.delete("table");
      params.delete("date");
    } else {
      params.set("table", value);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <>
      {/* Top logo header */}
      <header className="mt-2 w-full">
        <div className="flex justify-between items-center w-full">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {settings?.fullLogo ? (
              <div className="relative h-12 w-auto max-w-50 sm:max-w-xs flex items-center">
                <Image
                  src={settings.fullLogo}
                  alt="Logo Header"
                  height={48}
                  width={200}
                  className="object-contain object-left h-12 w-auto"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-12 flex items-center font-bold text-2xl text-primary tracking-wide font-mono">
                Logo
              </div>
            )}
          </Link>
          {/* <div className="flex items-center gap-4 shrink-0">
            <Button asChild variant="dark">
              <Link href="/ch68" className="flex items-center gap-1.5">
                <LayoutDashboard size={16} strokeWidth={2.5} />
                Admin Board
              </Link>
            </Button>
          </div> */}
        </div>
      </header>

      {/* Nav is full width, inner ul is constrained by container */}
      <nav className="border mt-2 border-primary backdrop-blur-2xl sticky top-0 z-50 rounded  overflow-x-auto scrollbar-none w-full">
        <div className="">
          <ul className="flex flex-row w-full justify-between items-stretch">
            {(navigations as { label: string; value: string }[]).map((nav) => {
              const isHomeNav = !nav.value || nav.value === "all" || nav.value === "Thông Tin Kết Quả";
              const isSelected = !tableParam ? isHomeNav : (tableParam === nav.value || tableParam === nav.label);
              return (
                <li
                  key={nav.value || nav.label}
                  onClick={() => handleNavClick(nav.value)}
                  className={`text-primary-foreground flex-1 text-center py-2 cursor-pointer text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 last:border-0 ${isSelected ? "bg-primary" : "text-primary! hover:bg-primary/10"}`}
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

  useEffect(() => {
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return (
    <section
      className="flex-1 flex flex-col w-full"
      style={{ minHeight: "var(--app-height, 100dvh)" }}
    >
      <div className="container flex-1 flex flex-col">
        <Suspense
          fallback={
            <div className="border-b py-4 shadow-sm">
              <div className="flex justify-between items-center">
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
        <main className="flex-1 py-6">
          <Suspense
            fallback={
              <div className="bg-white rounded  shadow-sm border border-zinc-100 p-8 text-center text-zinc-500 font-medium flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#15bece]"></div>
                Loading ...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>


      {/* full-bleed breaks out of the body's container max-width → true full viewport width */}
      <div className="bg-primary text-primary-foreground w-full mt-auto">
        <div className=" flex items-center justify-between p-8">
          <div
            className="text-xs md:text-base"
            dangerouslySetInnerHTML={{
              __html:
                settings?.leftFooterContent ||
                "<p>© 2026 VISOTHAP. All rights reserved.</p>",
            }}
          />
          <div
            className="text-xs md:text-base font-medium text-center md:text-right"
            dangerouslySetInnerHTML={{
              __html:
                settings?.rightFooterContent ||
                "<p>Contact: info@visothap.net | Hotline: 1900 6868</p>",
            }}
          />
        </div>
      </div>
    </section>
  );
}
