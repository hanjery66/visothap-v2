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
  Home,
  Check,
} from "lucide-react";
import { ensureError } from "@/lib/utils";
import JoditEditor from "@/components/ui/jodit-editor";

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
        {/* Top Header / Breadcrumb matching screenshot */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              General
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Home className="w-3.5 h-3.5" />
              <span>/</span>
              <span>General</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 font-semibold text-xs flex items-center gap-1.5"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Update
              </>
            )}
          </Button>
        </div>

        {/* LEFT FOOTER CONTENT */}
        <div className="flex flex-col gap-2 text-left">
          <Label className="text-sm font-medium text-zinc-700 tracking-wide">
            Left footer content
          </Label>
          <JoditEditor
            value={leftFooterContent}
            onChange={setLeftFooterContent}
            placeholder="Enter left footer content..."
          />
        </div>

        {/* RIGHT FOOTER CONTENT */}
        <div className="flex flex-col gap-2 text-left">
          <Label className="text-sm font-medium text-zinc-700 tracking-wide">
            Right footer content
          </Label>
          <JoditEditor
            value={rightFooterContent}
            onChange={setRightFooterContent}
            placeholder="Enter right footer content..."
          />
        </div>

        {/* LOGO SECTION */}
        <div className="flex flex-col gap-2 text-left">
          <Label className="text-sm font-medium text-zinc-700 tracking-wide">
            Logo
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

        {/* Action Button at bottom */}
        <div className="flex justify-end pt-4 border-t border-zinc-200">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-5 font-bold text-xs"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating ...
              </>
            ) : (
              <>
                Update
                <Sparkles className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
