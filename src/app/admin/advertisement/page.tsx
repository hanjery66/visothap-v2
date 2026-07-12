"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { trpc } from "@/app/_trpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  Upload,
  Loader2,
  ImagePlus,
  Plus,
  AlertCircle,
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
      title: ad.title,
      position: ad.position,
      image: ad.image,
      status: ad.status,
    });
  };

  const handleCreateNew = () => {
    setSelectedFile(null);
    setFormAd({
      title: "",
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

  const handleDelete = (id: string, title: string) => {
    if (
      confirm(
        `Are you sure you want to delete the advertisement banner "${title}"?`,
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAd || !formAd.title || !formAd.position || !formAd.image) {
      toast.error("Please fill in all required fields and upload an image.");
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
      title: formAd.title,
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
      header: "Banner",
      cell: ({ row }) => {
        const image = row.getValue("image") as string;
        const title = row.getValue("title") as string;
        return (
          <div className="relative group w-12 h-12 rounded  overflow-hidden flex items-center justify-center shadow-md">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-200"
                unoptimized
              />
            ) : (
              <span className="text-xs text-zinc-650 font-bold uppercase">
                No Pic
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("title")}>
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "position",
      header: "Display Position",
      cell: ({ row }) => {
        const pos = row.getValue("position") as string;
        const colorMap: Record<string, string> = {
          Left: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          Right: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          Center: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        };
        const colorClass = colorMap[pos] || " border-zinc-700";
        return (
          <span
            className={`px-2 py-0.5 rounded  uppercase border ${colorClass}`}
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
              className={` w-10 text-left ${ad.status ? "text-primary" : "text-zinc-500"}`}
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
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => handleDelete(ad.id, ad.title)}
              size="icon"
              title="Delete Banner"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        {!formAd && (
          <Button
            onClick={handleCreateNew}
            size="sm"
            className="flex items-center gap-1.5 font-bold shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Banner
          </Button>
        )}
      </div>

      {/* Editing / Creating Ad Form Overlay */}
      {formAd && (
        <Card className="rounded-xl flex flex-col gap-4">
          <div className="absolute top-0 left-0 w-full h-[3px] animate-pulse" />
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className=" text-primary flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-primary" />
              {formAd.id
                ? "Modify Advertisement Banner"
                : "Create New Advertisement Banner"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSaveAd} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <Label htmlFor="ad-title" className=" font-bold">
                    Advertisement Title
                  </Label>
                  <Input
                    id="ad-title"
                    type="text"
                    placeholder="Enter advertisement campaign/title"
                    value={formAd.title || ""}
                    onChange={(e) =>
                      setFormAd({ ...formAd, title: e.target.value })
                    }
                    required
                    className="focus:border-pritext-primary"
                  />
                </div>

                {/* Position */}
                <div className="flex flex-col gap-1">
                  <Label htmlFor="ad-position" className="text-xs font-bold">
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
                    <SelectTrigger className="w-full">
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

                {/* Premium File Upload and URL Preview Section */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <Label className=" font-bold">
                    Banner Advertisement Image
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Visual Dropzone / File Picker */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="md:col-span-2 border border-primary/30 border-dashed hover:border-primary/50  rounded-xs p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[120px] group relative"
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
                          <Loader2 className="h-8 w-8 text-primary animate-spin" />
                          <span className="text-sm  font-medium">
                            Processing file upload...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-center">
                          <div className="p-2 rounded-full  text-primary  group-hover:text-primary transition-colors">
                            <Upload className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-semibold text-primary">
                            Click to select image file
                          </span>
                          <span className="text-sm text-primary/50">
                            JPG, PNG, WEBP, GIF up to 5MB
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Image Preview Block */}
                    <div className="w-full h-[120px] rounded-xs border border-primary/30  overflow-hidden flex items-center justify-center relative group">
                      {formAd.image ? (
                        <>
                          <Image
                            src={formAd.image}
                            alt="Upload preview"
                            fill
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                            <span className="text-sm text-zinc-300 font-bold uppercase truncate max-w-full">
                              {formAd.image.startsWith("/uploads/")
                                ? "Uploaded Locally"
                                : "External URL"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-primary/50 text-center p-2">
                          <ImagePlus className="h-7 w-7" />
                          <span className=" uppercase">
                            No Image Loaded
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Image Link Fallback (for flexibility) */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <Label
                    htmlFor="ad-image-url"
                    className="text-xs text-zinc-500 font-semibold flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3 text-zinc-650" />
                    Or paste direct external Image URL Link
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
                    className="focus:border-primary text-xs font-mono "
                  />
                </div>

                {/* Status Switch in Form */}
                <div className="flex items-center gap-3">
                  <Label htmlFor="form-status" className="text-xs  font-bold">
                    Visibility Status
                  </Label>
                  <div className="flex items-center gap-2  border border-primary/30  px-3 py-1.5 rounded-xs shadow-sm">
                    <Switch
                      id="form-status"
                      checked={formAd.status ?? true}
                      onCheckedChange={(checked) =>
                        setFormAd({ ...formAd, status: checked })
                      }
                    />
                    <span
                      className={`text-xs font-bold ${(formAd.status ?? true) ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {(formAd.status ?? true) ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 border-t border-primary/30 pt-4 mt-2">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="px-4 font-semibold text-xs border border-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="px-5 font-bold text-xs"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    "Save Advertisement"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
