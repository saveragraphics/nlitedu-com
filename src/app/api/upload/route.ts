import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided in upload request." }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dx1ywq1pi";
    const apiKey = process.env.CLOUDINARY_API_KEY || "266667731827964";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "tUHZ7m3F_I00W0hYbYDgmthrRjk";
    let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "nlitedu_mobile_unsigned";
    if (uploadPreset === "nlitedu_uploads") {
      uploadPreset = "nlitedu_mobile_unsigned";
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const resourceType = isPdf ? "raw" : "auto";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const blob = new Blob([buffer], { type: file.type || (isPdf ? "application/pdf" : "image/jpeg") });

    // 1. Try unsigned upload with preset
    try {
      const unsignedForm = new FormData();
      unsignedForm.append("file", blob, file.name || "upload");
      unsignedForm.append("upload_preset", uploadPreset);

      const unsignedRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
        method: "POST",
        body: unsignedForm,
      });

      if (unsignedRes.ok) {
        const data = await unsignedRes.json();
        return NextResponse.json({
          secure_url: data.secure_url,
          public_id: data.public_id,
        });
      }
    } catch (unsignedErr) {
      console.warn("Server-side unsigned upload failed, falling back to signed upload:", unsignedErr);
    }

    // 2. Fallback to signed upload using API Key and Secret
    if (apiKey && apiSecret) {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = "mobile_uploads";
      const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

      const signedForm = new FormData();
      signedForm.append("file", blob, file.name || "upload");
      signedForm.append("api_key", apiKey);
      signedForm.append("timestamp", timestamp.toString());
      signedForm.append("folder", folder);
      signedForm.append("signature", signature);

      const signedRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
        method: "POST",
        body: signedForm,
      });

      const signedData = await signedRes.json();
      if (!signedRes.ok) {
        console.error("Signed Cloudinary upload failed:", signedData);
        return NextResponse.json(
          { error: signedData.error?.message || "Cloudinary upload failed." },
          { status: signedRes.status || 400 }
        );
      }

      return NextResponse.json({
        secure_url: signedData.secure_url,
        public_id: signedData.public_id,
      });
    }

    return NextResponse.json({ error: "Failed to upload file to Cloudinary." }, { status: 500 });
  } catch (error: any) {
    console.error("API /api/upload handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during upload." },
      { status: 500 }
    );
  }
}
