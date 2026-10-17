/**
 * Utility helper to handle Cloudinary uploads with maximum reliability.
 * Supports:
 *  - Automatic image compression for large photos (> 800KB)
 *  - Proper resourceType routing (raw for PDFs, auto for images/documents)
 *  - Direct browser-to-Cloudinary upload via 'nlitedu_mobile_unsigned'
 *  - Automatic seamless fallback to server-side '/api/upload' if direct upload is blocked by ad-blockers or network restrictions
 */

export async function compressImageIfNeeded(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<File> {
  // Only compress images that are larger than 800 KB
  if (!file.type.startsWith("image/") || file.size <= 800 * 1024) {
    return file;
  }

  // Return original file if running in non-browser environment
  if (typeof window === "undefined" || !window.document) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // Don't use if compression didn't reduce size
            } else {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".jpg"),
                { type: "image/jpeg", lastModified: Date.now() }
              );
              resolve(compressedFile);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function uploadToCloudinary(rawFile: File): Promise<string> {
  // 1. Auto-compress large images to speed up uploads and avoid network limits
  const file = await compressImageIfNeeded(rawFile);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dx1ywq1pi";
  let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "nlitedu_mobile_unsigned";
  if (uploadPreset === "nlitedu_uploads") {
    // 'nlitedu_uploads' is a signed preset and rejects unsigned direct uploads with 400
    uploadPreset = "nlitedu_mobile_unsigned";
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const resourceType = isPdf ? "raw" : "auto";

  // 2. Attempt direct upload to Cloudinary
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (uploadRes.ok) {
      const cloudData = await uploadRes.json();
      if (cloudData.secure_url) {
        return cloudData.secure_url;
      }
    } else {
      const errData = await uploadRes.json().catch(() => ({}));
      console.warn("Direct Cloudinary upload failed:", errData);
    }
  } catch (directError) {
    console.warn("Direct Cloudinary upload failed (possibly ad-blocker or network error), trying server fallback:", directError);
  }

  // 3. Fallback to server-side API route '/api/upload'
  try {
    const apiFormData = new FormData();
    apiFormData.append("file", file);

    const fallbackRes = await fetch("/api/upload", {
      method: "POST",
      body: apiFormData,
    });

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      if (fallbackData.secure_url) {
        return fallbackData.secure_url;
      }
    } else {
      const errorJson = await fallbackRes.json().catch(() => ({}));
      throw new Error(errorJson.error || "Server upload fallback failed.");
    }
  } catch (fallbackError: any) {
    console.error("All upload mechanisms failed:", fallbackError);
    throw new Error(
      fallbackError.message || "Failed to upload file to Cloudinary. Please check your internet connection."
    );
  }

  throw new Error("Unable to obtain secure upload URL.");
}
