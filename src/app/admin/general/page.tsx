"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  FileText,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { ensureError } from "@/lib/utils";

export default function GeneralPage() {
  const utils = trpc.useUtils();

  // Load the live settings details from the database
  const {
    data: settings,
    isLoading,
    error,
  } = trpc.getGeneralSettings.useQuery();

  // Editable settings inputs states
  const [logo, setLogo] = useState("");
  const [fullLogo, setFullLogo] = useState("");
  const [leftFooterContent, setLeftFooterContent] = useState("");
  const [rightFooterContent, setRightFooterContent] = useState("");

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedFullLogoFile, setSelectedFullLogoFile] = useState<File | null>(
    null,
  );

  // Upload progress indicators
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFullLogo, setUploadingFullLogo] = useState(false);

  // Hidden file input element binders
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fullLogoInputRef = useRef<HTMLInputElement>(null);

  // Bind live variables once loaded
  useEffect(() => {
    if (settings) {
      // Only update state if no file is currently selected (no blob URL)
      if (!selectedLogoFile && !logo.startsWith("blob:")) {
        setLogo(settings.logo || "");
      }
      if (!selectedFullLogoFile && !fullLogo.startsWith("blob:")) {
        setFullLogo(settings.fullLogo || "");
      }
      if (leftFooterContent !== (settings.leftFooterContent || ""))
        setLeftFooterContent(settings.leftFooterContent || "");
      if (rightFooterContent !== (settings.rightFooterContent || ""))
        setRightFooterContent(settings.rightFooterContent || "");
    }
  }, [settings]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (logo.startsWith("blob:")) {
        URL.revokeObjectURL(logo);
      }
      if (fullLogo.startsWith("blob:")) {
        URL.revokeObjectURL(fullLogo);
      }
    };
  }, [logo, fullLogo]);

  // Upload handler for mini logo
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (logo.startsWith("blob:")) {
      URL.revokeObjectURL(logo);
    }

    setSelectedLogoFile(file);
    const localUrl = URL.createObjectURL(file);
    setLogo(localUrl);
    toast.success("Mini emblem logo selected!");
  };

  // Upload handler for header logo
  const handleUploadFullLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fullLogo.startsWith("blob:")) {
      URL.revokeObjectURL(fullLogo);
    }

    setSelectedFullLogoFile(file);
    const localUrl = URL.createObjectURL(file);
    setFullLogo(localUrl);
    toast.success("Header full logo selected!");
  };

  // Mutation to save layout settings
  const saveMutation = trpc.saveGeneralSettings.useMutation({
    onSuccess: () => {
      if (logo.startsWith("blob:")) {
        URL.revokeObjectURL(logo);
      }
      if (fullLogo.startsWith("blob:")) {
        URL.revokeObjectURL(fullLogo);
      }
      setSelectedLogoFile(null);
      setSelectedFullLogoFile(null);
      toast.success("General layout configuration saved successfully!");
      utils.getGeneralSettings.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save configuration details.");
    },
  });

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !logo.trim() ||
      !fullLogo.trim() ||
      !leftFooterContent.trim() ||
      !rightFooterContent.trim()
    ) {
      toast.error("Please fill in all layout configuration parameters.");
      return;
    }

    let finalLogo = logo;
    let finalFullLogo = fullLogo;

    if (selectedLogoFile) {
      setUploadingLogo(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedLogoFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Logo upload failed");

        const data = await res.json();
        if (data.url) {
          finalLogo = data.url;
        } else {
          throw new Error(data.error || "Invalid response");
        }
      } catch (err: unknown) {
        const error = ensureError(err);
        console.error(error);
        toast.error(error.message || "Failed to upload emblem logo.");
        setUploadingLogo(false);
        return;
      } finally {
        setUploadingLogo(false);
      }
    }

    if (selectedFullLogoFile) {
      setUploadingFullLogo(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFullLogoFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Header logo upload failed");

        const data = await res.json();
        if (data.url) {
          finalFullLogo = data.url;
        } else {
          throw new Error(data.error || "Invalid response");
        }
      } catch (err: unknown) {
        const error = ensureError(err);
        console.error(error);
        toast.error(error.message || "Failed to upload header logo.");
        setUploadingFullLogo(false);
        return;
      } finally {
        setUploadingFullLogo(false);
      }
    }

    saveMutation.mutate({
      logo: finalLogo.trim(),
      fullLogo: finalFullLogo.trim(),
      leftFooterContent: leftFooterContent.trim(),
      rightFooterContent: rightFooterContent.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl">
        <div className="border-b  pb-4">
          <div className="h-6 bg-zinc-850 rounded w-48 mb-2" />
          <div className="h-4 bg-zinc-850 rounded w-72" />
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <div className="h-48  border border-zinc-850 rounded-xl" />
          <div className="h-48  border border-zinc-850 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4  text-primary text-sm rounded-xl flex items-center gap-2">
        <span>❌ Failed to load layout configuration: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-sans tracking-tight">
          General Layout Settings
        </h2>
        <p className="text-xs mt-1">
          Configure logo image references and HTML footer content sections
          stored in the database.
        </p>
      </div>

      <form onSubmit={handleUpdateGeneral} className="flex flex-col gap-6">
        {/* LOGO REFERENCES PANEL */}
        <Card className="rounded-xl flex flex-col gap-4">
          <div className="absolute top-0 left-0 w-full h-[3px] animate-pulse" />
          <CardHeader className="px-6 pt-5 pb-0 flex flex-row items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">
                System Brand Logos
              </CardTitle>
              <p className="text-[10px] text-zinc-500 font-medium">
                Manage image source routes for emblem logos and main header
                displays.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MINI LOGO (EMBLEM) CARD */}
              <div className="flex flex-col gap-3 p-4 border border-primary/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="logo-path"
                    className="text-[11px]  font-bold uppercase tracking-wide"
                  >
                    Mini Emblem Logo
                  </Label>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase">
                    Square Ratio
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  {/* Live circular/rounded-square preview box */}
                  <div className="h-14 w-14 rounded-lg border border-primary/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                    {logo ? (
                      <Image
                        src={logo}
                        alt="Mini emblem logo"
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[8px] font-bold text-zinc-650 uppercase">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        id="logo-path"
                        type="text"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        className="focus:border-primary flex-1"
                        placeholder="E.g. /logo.png"
                        required
                      />

                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleUploadLogo}
                        accept="image/*"
                        className="hidden"
                      />

                      <Button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        variant="outline"
                        size="icon"
                        className="shrink-0 cursor-pointer"
                        title="Upload Emblem Image"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <span className="text-[9px] text-zinc-600 leading-normal">
                      Accepts standard formats (PNG, SVG, JPG, WEBP).
                    </span>
                  </div>
                </div>
              </div>

              {/* HEADER LOGO (FULL TEXT) CARD */}
              <div className="flex flex-col gap-3 p-4 border border-primary/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="full-logo-path"
                    className="text-[11px]  font-bold uppercase tracking-wide"
                  >
                    Header Full Logo
                  </Label>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase">
                    Horizontal Banner
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  {/* Live rectangular preview box */}
                  <div className="h-14 w-28 rounded-lg border border-primary/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                    {fullLogo ? (
                      <Image
                        src={fullLogo}
                        alt="Header logo"
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[8px] font-bold text-zinc-650 uppercase">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        id="full-logo-path"
                        type="text"
                        value={fullLogo}
                        onChange={(e) => setFullLogo(e.target.value)}
                        className="focus:border-primary flex-1"
                        placeholder="E.g. /full-logo.png"
                        required
                      />

                      <input
                        type="file"
                        ref={fullLogoInputRef}
                        onChange={handleUploadFullLogo}
                        accept="image/*"
                        className="hidden"
                      />

                      <Button
                        type="button"
                        onClick={() => fullLogoInputRef.current?.click()}
                        disabled={uploadingFullLogo}
                        variant="outline"
                        size="icon"
                        className="shrink-0 cursor-pointer"
                        title="Upload Header Image"
                      >
                        {uploadingFullLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <span className="text-[9px] text-zinc-600 leading-normal">
                      Optimized for horizontal menu banners.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FOOTER HTML CONFIGURATION PANEL */}
        <Card className="rounded-xl flex flex-col gap-4">
          <div className="absolute top-0 left-0 w-full h-[3px] animate-pulse" />
          <CardHeader className="px-6 pt-5 pb-0 flex flex-row items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold ">
                Footer HTML Content Markup
              </CardTitle>
              <p className="text-[10px] text-zinc-500 font-medium">
                Inject raw HTML text templates into public landing footers
                (Copyrights and Hotline metadata).
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <Label
                  htmlFor="left-footer-markup"
                  className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide"
                >
                  Left Footer Content (HTML)
                </Label>
                <textarea
                  id="left-footer-markup"
                  value={leftFooterContent}
                  onChange={(e) => setLeftFooterContent(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-primary/30 px-3 py-2 text-xs shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
                  placeholder="E.g. <p>© 2026 VISOTHAP. All rights reserved.</p>"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <Label
                  htmlFor="right-footer-markup"
                  className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide"
                >
                  Right Footer Content (HTML)
                </Label>
                <textarea
                  id="right-footer-markup"
                  value={rightFooterContent}
                  onChange={(e) => setRightFooterContent(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-primary/30 px-3 py-2 text-xs shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
                  placeholder="E.g. <p>Contact: info@visothap.net</p>"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end gap-2 border-t border-primary/30 pt-4">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-5 font-bold text-xs"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving configuration...
              </>
            ) : (
              <>
                Save General Configuration
                <Sparkles className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
