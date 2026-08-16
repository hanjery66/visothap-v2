"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
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
  const [fullLogo, setFullLogo] = useState("");
  const [leftFooterContent, setLeftFooterContent] = useState("");
  const [rightFooterContent, setRightFooterContent] = useState("");

  const [selectedFullLogoFile, setSelectedFullLogoFile] = useState<File | null>(
    null,
  );

  // Upload progress indicators
  const [uploadingFullLogo, setUploadingFullLogo] = useState(false);

  // Hidden file input element binder
  const fullLogoInputRef = useRef<HTMLInputElement>(null);

  // Bind live variables once loaded
  useEffect(() => {
    if (settings) {
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
      if (fullLogo.startsWith("blob:")) {
        URL.revokeObjectURL(fullLogo);
      }
    };
  }, [fullLogo]);

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
      if (fullLogo.startsWith("blob:")) {
        URL.revokeObjectURL(fullLogo);
      }
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
      !fullLogo.trim() ||
      !leftFooterContent.trim() ||
      !rightFooterContent.trim()
    ) {
      toast.error("Please fill in all layout configuration parameters.");
      return;
    }

    let finalFullLogo = fullLogo;

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
      logo: settings?.logo || "/logo.png",
      fullLogo: finalFullLogo.trim(),
      leftFooterContent: leftFooterContent.trim(),
      rightFooterContent: rightFooterContent.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl">
        <div className="h-28 border border-zinc-200 rounded animate-pulse bg-zinc-50/50" />
        <div className="h-48 border border-zinc-200 rounded animate-pulse bg-zinc-50/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded flex items-center gap-2">
        <span>❌ Failed to load layout configuration: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <form onSubmit={handleUpdateGeneral} className="flex flex-col gap-6">
        {/* LOGO SECTION */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-semibold tracking-wide text-foreground">
            Header Logo
          </Label>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 border border-zinc-200 rounded bg-zinc-50/40">
            {/* Live rectangular preview box */}
            <div className="h-20 w-48 sm:w-56 rounded border border-zinc-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
              {fullLogo ? (
                <Image
                  src={fullLogo}
                  alt="Header logo"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-zinc-400">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">No image</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <input
                type="file"
                ref={fullLogoInputRef}
                onChange={handleUploadFullLogo}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => fullLogoInputRef.current?.click()}
                  disabled={uploadingFullLogo}
                  variant="outline"
                  className="cursor-pointer gap-2 font-semibold"
                >
                  {uploadingFullLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-primary" />
                      Select New Logo
                    </>
                  )}
                </Button>

                {selectedFullLogoFile && (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ {selectedFullLogoFile.name}
                  </span>
                )}
              </div>

              <span className="text-xs text-zinc-500 leading-normal">
                Accepts standard image formats (PNG, SVG, JPG, WEBP). Recommended height: 40–80px.
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER HTML CONFIGURATION SECTION */}
        <div className="flex flex-col gap-4">
          <Label className="text-sm font-semibold tracking-wide text-foreground">
            Footer HTML Content Markup
          </Label>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <Label
                htmlFor="left-footer-markup"
                className="text-xs font-medium text-zinc-600 tracking-wide"
              >
                Left Footer Content (HTML)
              </Label>
              <textarea
                id="left-footer-markup"
                value={leftFooterContent}
                onChange={(e) => setLeftFooterContent(e.target.value)}
                rows={3}
                className="flex w-full rounded border border-zinc-200 px-3 py-2 text-sm shadow-xs transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                placeholder="E.g. <p>© 2026 VISOTHAP. All rights reserved.</p>"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <Label
                htmlFor="right-footer-markup"
                className="text-xs font-medium text-zinc-600 tracking-wide"
              >
                Right Footer Content (HTML)
              </Label>
              <textarea
                id="right-footer-markup"
                value={rightFooterContent}
                onChange={(e) => setRightFooterContent(e.target.value)}
                rows={3}
                className="flex w-full rounded border border-zinc-200 px-3 py-2 text-sm shadow-xs transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                placeholder="E.g. <p>Contact: info@visothap.net</p>"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-zinc-200">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-5 font-bold text-xs"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving ...
              </>
            ) : (
              <>
                Save
                <Sparkles className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
