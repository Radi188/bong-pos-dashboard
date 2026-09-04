/** Failures reject with a dictionary key as the message; the caller translates it. */
/** Largest edge, in pixels, that an uploaded logo is stored at. */
const MAX_EDGE = 128;
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Reads an image file and returns a square-ish, downscaled PNG data URL.
 * Logos live in localStorage alongside everything else, so full-size uploads
 * would blow the quota — hence the hard resize.
 */
export function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("error.notAnImage"));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error("error.imageTooBig"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("error.imageUnreadable"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("error.imageUndecodable"));
      img.onload = () => {
        const scale = Math.min(MAX_EDGE / img.width, MAX_EDGE / img.height, 1);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("error.imageFailed"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
