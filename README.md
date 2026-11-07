# quizy

Kids Arabic quiz + interactive stories.

## Media (Vercel Blob)

Story images/audio and quiz narration MP3s are stored in a **public** Vercel Blob store, not in `public/`.

1. Set in `.env.local` (and in the Vercel project env for Preview/Production):

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
NEXT_PUBLIC_MEDIA_BASE_URL=https://<store>.public.blob.vercel-storage.com
```

`NEXT_PUBLIC_MEDIA_BASE_URL` is the Blob host only (no trailing path). Derive it from any uploaded file URL by stripping `/stories/...` or `/audio/...`.

2. Place new files under `public/stories/...` or `public/audio/...`, then upload:

```bash
node scripts/upload-media.mjs
# overwrite existing paths:
node scripts/upload-media.mjs --force
```

3. After a successful upload you can delete the local copies; the app loads media via `NEXT_PUBLIC_MEDIA_BASE_URL`.
