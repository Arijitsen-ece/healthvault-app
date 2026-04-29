const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  original_filename: string;
};

export function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<CloudinaryResult> {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(fd);
  });
}

/**
 * Build an optimized Cloudinary URL with q_auto, f_auto, and a width transform.
 * Falls back to original URL if not a Cloudinary image.
 */
export function cldThumb(url: string | undefined, width = 500): string {
  if (!url) return "";
  // only transform image URLs (not raw/pdf)
  if (!url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/q_auto,f_auto,w_${width}/`);
}

/**
 * Smart-detect a record category from a file name.
 */
export function detectCategory(name: string): "Prescription" | "Report" | "Scan" {
  const n = name.toLowerCase();
  if (/(rx|prescription|medicine|tablet|dose)/.test(n)) return "Prescription";
  if (/(scan|mri|ct|x-?ray|xray|ultrasound|sonograph|radiolog)/.test(n)) return "Scan";
  return "Report";
}
