"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { trpc } from "@/app/_trpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pencil,
  Trash2,
  Upload,
  Loader2,
  ImagePlus,
  Plus,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ads } from "@/db/schema";
import { ensureError } from "@/lib/utils";

export default function AdvertisementPage() {
  const {
    data: ads = [],
    isLoading,
    error,
    refetch,
  } = trpc.getAdvertisements.useQuery();

  const [formAd, setFormAd] = useState<Partial<Ads> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC Mutations
  const toggleStatusMutation = trpc.toggleAdStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Advertisement status updated!");
    },
    onError: (err) => {
      toast.error("Failed to toggle status: " + err.message);
    },
  });

  const saveMutation = trpc.saveAdvertisement.useMutation({
    onSuccess: () => {
      refetch();
      if (formAd?.image?.startsWith("blob:")) {
        URL.revokeObjectURL(formAd.image);
      }
      setSelectedFile(null);
      setFormAd(null);
      toast.success("Advertisement banner successfully saved!");
    },
    onError: (err) => {
      toast.error("Failed to save advertisement: " + err.message);
    },
  });

  const deleteMutation = trpc.deleteAdvertisement.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Advertisement successfully deleted!");
    },
    onError: (err) => {
      toast.error("Failed to delete advertisement: " + err.message);
    },
  });

  const handleToggleAdStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, status: !currentStatus });
  };

  const handleEdit = (ad: Ads) => {
    setSelectedFile(null);
    setFormAd({
      id: ad.id,
      position: ad.position,
      image: ad.image,
      status: ad.status,
    });
  };

  const handleCreateNew = () => {
    setSelectedFile(null);
    setFormAd({
      position: "Left",
      image: "",
      status: true,
    });
  };

  const handleCancel = () => {
    if (formAd?.image?.startsWith("blob:")) {
      URL.revokeObjectURL(formAd.image);
    }
    setSelectedFile(null);
    setFormAd(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this advertisement banner?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAd || !formAd.position || !formAd.image) {
      toast.error("Please select a position and upload an image.");
      return;
    }

    let finalImageUrl = formAd.image;

    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to upload image.");
        }

        const data = await res.json();
        if (data.url) {
          finalImageUrl = data.url;
        }
      } catch (err: unknown) {
        const error = ensureError(err);
        console.error("Upload error:", error);
        toast.error(
          error.message || "Failed to upload image. Please try again.",
        );
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    saveMutation.mutate({
      id: formAd.id,
      position: formAd.position,
      image: finalImageUrl,
      status: formAd.status ?? true,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setFormAd((prev) => (prev ? { ...prev, image: localUrl } : null));
    toast.success("Image selected successfully!");
  };

  const columns: ColumnDef<Ads>[] = [
    {
      accessorKey: "image",
      header: "Banner Preview",
      cell: ({ row }) => {
        const image = row.getValue("image") as string;
        return (
          <div className="relative group w-16 h-12 rounded overflow-hidden flex items-center justify-center border border-zinc-200 bg-zinc-50 shadow-xs">
            {image ? (
              <Image
                src={image}
                alt="Banner"
                fill
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                unoptimized
              />
            ) : (
              <span className="text-[10px] text-zinc-400 font-bold uppercase">
                No Pic
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Display Position",
      cell: ({ row }) => {
        const pos = row.getValue("position") as string;
        const colorMap: Record<string, string> = {
          Left: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          Right: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          Center: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        };
        const colorClass = colorMap[pos] || " border-zinc-200";
        return (
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase border ${colorClass}`}
          >
            {pos} Column
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const ad = row.original;
        return (
          <div className="flex justify-center items-center gap-2">
            <Switch
              checked={ad.status}
              onCheckedChange={() => handleToggleAdStatus(ad.id, ad.status)}
            />
            <span
              className={`w-12 text-left text-xs font-medium ${ad.status ? "text-primary font-semibold" : "text-zinc-400"}`}
            >
              {ad.status ? "Active" : "Hidden"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const ad = row.original;
        return (
          <div className="flex justify-center items-center gap-2">
            <Button
              onClick={() => handleEdit(ad)}
              size="icon"
              title="Edit Banner"
              variant={"outline"}
              className="h-8 w-8 rounded"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => handleDelete(ad.id)}
              size="icon"
              title="Delete Banner"
              variant="outline"
              className="h-8 w-8 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6">
      {!formAd && (
        <div className="flex justify-between items-center">
          <Button
            onClick={handleCreateNew}
            size="sm"
            className="flex items-center gap-1.5 font-bold shadow-xs rounded"
          >
            <Plus className="h-4 w-4" />
            Add Banner
          </Button>
        </div>
      )}

      {/* Editing / Creating Ad Form Overlay */}
      {formAd && (
        <form onSubmit={handleSaveAd} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Position */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ad-position" className="text-xs font-medium text-zinc-600">
                    Display Position
                  </Label>
                  <Select
                    value={formAd.position || "Left"}
                    onValueChange={(value) =>
                      setFormAd({
                        ...formAd,
                        position: value as Ads["position"],
                      })
                    }
                  >
                    <SelectTrigger className="w-full rounded bg-white">
                      <SelectValue placeholder="Display Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Left">Left Column</SelectItem>
                        <SelectItem value="Right">Right Column</SelectItem>
                        <SelectItem value="Center">Center Row</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Switch in Form */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="form-status" className="text-xs font-medium text-zinc-600">
                    Visibility Status
                  </Label>
                  <div className="flex items-center gap-2 border border-zinc-200 bg-white px-3 py-1.5 rounded h-9 shadow-xs">
                    <Switch
                      id="form-status"
                      checked={formAd.status ?? true}
                      onCheckedChange={(checked) =>
                        setFormAd({ ...formAd, status: checked })
                      }
                    />
                    <span
                      className={`text-xs font-semibold ${(formAd.status ?? true) ? "text-primary" : "text-zinc-400"}`}
                    >
                      {(formAd.status ?? true) ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>

                {/* File Upload and URL Preview Section */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <Label className="text-xs font-medium text-zinc-600">
                    Banner Advertisement Image
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Visual Dropzone / File Picker */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="md:col-span-2 border border-zinc-200 border-dashed hover:border-primary/50 bg-white rounded p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[120px] group relative"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                          <span className="text-xs font-medium text-zinc-600">
                            Processing file upload...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-center">
                          <div className="p-2 rounded text-primary group-hover:text-primary transition-colors">
                            <Upload className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            Click to select image file
                          </span>
                          <span className="text-xs text-zinc-400">
                            JPG, PNG, WEBP, GIF up to 5MB
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Image Preview Block */}
                    <div className="w-full h-[120px] rounded border border-zinc-200 bg-white overflow-hidden flex items-center justify-center relative group">
                      {formAd.image ? (
                        <>
                          <Image
                            src={formAd.image}
                            alt="Upload preview"
                            fill
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white">
                            <span className="text-xs font-bold uppercase truncate max-w-full">
                              {formAd.image.startsWith("/uploads/")
                                ? "Uploaded Locally"
                                : "Image Loaded"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-400 text-center p-2">
                          <ImagePlus className="h-6 w-6" />
                          <span className="text-[10px] font-bold uppercase">
                            No Image Loaded
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Image Link Fallback */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <Label
                    htmlFor="ad-image-url"
                    className="text-xs text-zinc-500 font-medium flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3 text-zinc-400" />
                    Or paste direct image URL
                  </Label>
                  <Input
                    id="ad-image-url"
                    type="text"
                    placeholder="https://example.com/banner-image.png"
                    value={formAd.image || ""}
                    onChange={(e) =>
                      setFormAd({ ...formAd, image: e.target.value })
                    }
                    required
                    className="focus:border-primary text-xs font-mono bg-white"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 mt-2">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="px-4 font-semibold text-xs rounded"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="px-5 font-bold text-xs rounded"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      Save Advertisement
                      <Sparkles className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </form>
      )}

      {/* Ads List Table */}
      <DataTable
        columns={columns}
        data={ads as unknown as Ads[]}
        isLoading={isLoading}
        error={error}
        emptyMessage="No advertisements found in the database."
      />
    </div>
  );
}
