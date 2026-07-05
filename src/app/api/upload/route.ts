import { NextRequest, NextResponse } from "next/server";
import { uploadFileToS3 } from "@/lib/s3";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate clean, secure unique name
    const ext = path.extname(file.name) || ".png";
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueFilename = `${baseName}${ext}`;

    // Upload to Vercel Blob
    const fileUrl = await uploadFileToS3(
      uniqueFilename,
      buffer,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error("Vercel Blob upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save uploaded image to Vercel Blob." },
      { status: 500 }
    );
  }
}
