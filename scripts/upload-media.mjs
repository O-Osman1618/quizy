#!/usr/bin/env node
/**
 * Upload public/stories/** and public/audio/** to a public Vercel Blob store.
 *
 * Usage:
 *   node scripts/upload-media.mjs
 *   node scripts/upload-media.mjs --force
 *
 * Needs BLOB_READ_WRITE_TOKEN in .env.local (or the environment).
 */
import { head, put } from "@vercel/blob";
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { loadEnv, root } from "./load-env.mjs";

const force = process.argv.includes("--force");

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === ".DS_Store") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function contentType(file) {
  return CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

async function alreadyUploaded(pathname, token) {
  try {
    const info = await head(pathname, { token });
    return info.url;
  } catch {
    return null;
  }
}

async function main() {
  loadEnv();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("Missing BLOB_READ_WRITE_TOKEN (set it in .env.local).");
    process.exit(1);
  }

  const roots = [join(root, "public", "stories"), join(root, "public", "audio")];
  const files = roots.flatMap((dir) => walkFiles(dir));
  if (files.length === 0) {
    console.error("No files found under public/stories or public/audio.");
    process.exit(1);
  }

  let uploaded = 0;
  let skipped = 0;
  let baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";

  for (const file of files) {
    const pathname = relative(join(root, "public"), file).split("\\").join("/");
    if (!force) {
      const existing = await alreadyUploaded(pathname, token);
      if (existing) {
        skipped++;
        console.log(`skip  ${pathname}`);
        if (!baseUrl) {
          try {
            baseUrl = new URL(existing).origin;
          } catch {
            /* ignore */
          }
        }
        continue;
      }
    }

    const blob = await put(pathname, createReadStream(file), {
      access: "public",
      token,
      contentType: contentType(file),
      addRandomSuffix: false,
      allowOverwrite: force,
      multipart: true,
    });
    uploaded++;
    console.log(`put   ${pathname}`);
    console.log(`      ${blob.url}`);
    if (!baseUrl) {
      try {
        baseUrl = new URL(blob.url).origin;
      } catch {
        /* ignore */
      }
    }
  }

  console.log(`\ndone: ${uploaded} uploaded, ${skipped} skipped`);
  if (baseUrl) {
    console.log(`\nAdd to .env.local and Vercel env:\nNEXT_PUBLIC_MEDIA_BASE_URL=${baseUrl}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
