"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Toaster } from "sonner";
import {
  BarChart2,
  Image as ImageIcon,
  Settings,
  User,
  LogOut,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionState = authClient.useSession();
  const session = sessionState.data;
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const { data: settings } = trpc.getGeneralSettings.useQuery();
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.log("sessionState:", sessionState);
    // Only set initialLoadComplete to true when we've definitely loaded the session
    // (either data exists OR there's an error)
    if (sessionState.data !== undefined || sessionState.error) {
      console.log("Setting initialLoadComplete to true");
      setInitialLoadComplete(true);
    }
  }, [sessionState.data, sessionState.error]);

  // Dynamically update site favicon based on custom database settings
  // useEffect(() => {
  //   if (settings?.logo) {
  //     let link: HTMLLinkElement | null =
  //       document.querySelector("link[rel*='icon']");
  //     if (!link) {
  //       link = document.createElement("link");
  //       link.rel = "icon";
  //       document.head.appendChild(link);
  //     }
  //     link.href = settings.logo;
  //   }
  // }, [settings?.logo]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    authClient
      .signOut({
        fetchOptions: {
          onSuccess: () => {
            router.refresh();
            router.replace("/admin/login");
          },
        },
      })
      .finally(() => {
        setLoggingOut(false);
      });
  };

  type Menu = {
    title: string;
    description: string
    href: string;
    icon: React.ReactNode;
  }

  const menus: Menu[] = [
    {
      title: "Lottery Numbers",
      description: "Create and manage lottery numbers.",
      href: "/admin",
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      title: "Advertisements",
      description: "Manage advertisements.",
      href: "/admin/advertisement",
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      title: "General Settings",
      description: "Manage general settings.",
      href: "/admin/general",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      title: "Admin Profile",
      description: "Manage admin profile.",
      href: "/admin/profile",
      icon: <User className="h-4 w-4" />,
    },
  ];


  const renderSidebarItem = (
    href: string,
    label: string,
    icon: React.ReactNode,
  ) => {
    const isActive =
      href === "/admin"
        ? pathname === "/admin" || pathname === "/admin/"
        : pathname.startsWith(href);

    return (
      <Button asChild key={href} variant={isActive ? "default" : "secondary"}>
        <Link href={href}>
          {icon}
          {label}
        </Link>
      </Button>
    );
  };

  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen w-full  flex items-center justify-center">
        {children}
      </div>
    );
  }

  // Loading session
  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col container">
      <Toaster theme="dark" closeButton position="top-right" richColors />

      {/* ── TOP HEADER BAR ── */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl flex items-center justify-between px-6 py-3 mt-4 border border-primary/30 rounded">
        {/* Left: Logo + brand name */}
        <Link href="/" className="flex items-center gap-3">
          {settings?.fullLogo ? (
            <div className="relative h-8 w-auto max-w-35 hidden sm:block ">
              <Image
                src={settings.fullLogo}
                alt="Full Logo"
                height={50}
                width={50}
                className="object-contain h-full w-full"
                unoptimized
              />
            </div>
          ) : (
            <span className=" tracking-tight text-primary hidden sm:block">
              Admin Panel
            </span>
          )}
        </Link>

        {/* Right: Sign out */}
        <Button
          onClick={handleSignOut}
          disabled={loggingOut}
          variant="default"
          size="sm"
          className="text-xs font-semibold"
        >
          <LogOut className="h-3.5 w-3.5" />
          {loggingOut ? "Logging out..." : "Sign Out"}
        </Button>
      </header>

      {/* ── BODY (sidebar + content) ── */}
      <div className="flex-1 flex overflow-y-auto">
        <main className="flex-1 mt-4">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* SIDEBAR NAVIGATION PANEL */}
            <aside className="w-full lg:w-56 rounded flex flex-col gap-1.5 shrink-0">
              <span className="font-bold mb-1 tracking-wider uppercase">
                Management
              </span>
              {menus.map((menu) => renderSidebarItem(menu.href, menu.title, menu.icon))}
            </aside>

            {/* MAIN DYNAMIC CONTENT WORKSPACE */}
            <Card className="flex-1 w-full rounded shadow-lg min-h-125">
              <CardHeader>
                <CardTitle>
                  {menus.find((m) => m.href === pathname)?.title}
                </CardTitle>
                <CardDescription>
                  {menus.find((m) => m.href === pathname)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="">
                {children}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
