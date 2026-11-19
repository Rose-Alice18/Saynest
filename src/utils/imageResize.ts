// Shrink a photo before uploading it for page scanning.
//
// Phone photos are often 4-10 MB. Text stays readable at ~1600px on the long
// side, which brings a photo down to a few hundred KB and uploads much faster
// on mobile data. createImageBitmap applies the photo's rotation (EXIF), so
// pages shot in portrait arrive the right way up.

export interface PreparedImage {
  /** base64 data, without the "data:...;base64," prefix */
  data: string;
  mimeType: 'image/jpeg';
  /** For showing a preview */
  dataUrl: string;
}

const MAX_SIDE = 1600;

export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('That file is not an image. Choose a photo of a page.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // e.g. HEIC photos in browsers that can't decode them
    throw new Error("This photo format isn't supported here. Try a JPEG or PNG, or take a screenshot of it.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the photo.');
  // White background so transparent PNGs don't turn black as JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { data: dataUrl.slice(dataUrl.indexOf(',') + 1), mimeType: 'image/jpeg', dataUrl };
}
