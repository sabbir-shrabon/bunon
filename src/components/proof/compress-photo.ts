/**
 * 1. Purpose: Client-side photo compression utility reducing images to ~150-250 KB WebP/JPEG.
 * 2. Spec Ref: Database Schema Section 4 Private Proof Upload Flow Step 1.
 * 3. Called By: CreateProofView.
 * 4. Calls: HTML5 Canvas API.
 */

export async function compressPhoto(
  file: Blob,
  maxDimension = 1280,
  quality = 0.85
): Promise<Blob> {
  const img = new Image();
  const tempUrl = URL.createObjectURL(file);
  img.src = tempUrl;

  await new Promise((res) => {
    img.onload = res;
  });

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((compressed) => {
      URL.revokeObjectURL(tempUrl);
      resolve(compressed || file);
    }, 'image/jpeg', quality);
  });
}
