export const MAX_ATTACH_BYTES = 1024 * 1024;
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

export interface PickedTextFile {
  kind: 'text';
  name: string;
  content: string;
}

export interface PickedImageFile {
  kind: 'image';
  name: string;
  mimeType: string;
  /** Raw base64 without data: URL prefix */
  data: string;
  /** data URL for UI preview */
  previewUrl: string;
}

export type PickedFile = PickedTextFile | PickedImageFile;

function sizeError(file: File, max: number): Error {
  const label = max >= 1024 * 1024 ? `${max / (1024 * 1024)} MB` : `${max / 1024} KB`;
  return new Error(`ไฟล์ใหญ่เกิน ${label}: ${file.name}`);
}

/** Reads a user-picked file as UTF-8 text. Rejects oversized or binary files. */
export async function readTextFile(file: File): Promise<PickedTextFile> {
  if (file.size > MAX_ATTACH_BYTES) throw sizeError(file, MAX_ATTACH_BYTES);
  const content = await file.text();
  if (content.includes('\u0000') || content.includes('�')) {
    throw new Error(`ไฟล์นี้ไม่ใช่ข้อความ (text): ${file.name}`);
  }
  return { kind: 'text', name: file.name, content };
}

/** Reads an image file as base64 for multimodal Gemini parts. */
export async function readImageFile(file: File): Promise<PickedImageFile> {
  const mime = (file.type || '').toLowerCase();
  if (!IMAGE_MIME.has(mime) && !/\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
    throw new Error(`รองรับเฉพาะ PNG / JPEG / WebP / GIF: ${file.name}`);
  }
  if (file.size > MAX_IMAGE_BYTES) throw sizeError(file, MAX_IMAGE_BYTES);
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const data = btoa(binary);
  const mimeType = mime && IMAGE_MIME.has(mime) ? mime : guessMime(file.name);
  return {
    kind: 'image',
    name: file.name,
    mimeType,
    data,
    previewUrl: `data:${mimeType};base64,${data}`,
  };
}

function guessMime(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/** Auto-detect text vs image attachment. */
export async function readPickedFile(file: File): Promise<PickedFile> {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
    return readImageFile(file);
  }
  return readTextFile(file);
}
