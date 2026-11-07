/**
 * Public media lives on Vercel Blob when NEXT_PUBLIC_MEDIA_BASE_URL is set
 * (e.g. https://….public.blob.vercel-storage.com). Otherwise paths stay
 * relative and resolve from /public during local development.
 */
export function mediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}
