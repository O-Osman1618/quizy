// Reports which story images/audio exist locally under public/stories/<id>/
// or remotely on Vercel Blob when NEXT_PUBLIC_MEDIA_BASE_URL is set.
// Usage: node scripts/check-story-assets.mjs
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envFile = join(root, ".env.local");
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";
const stories = JSON.parse(
  readFileSync(join(root, "data", "stories.json"), "utf8"),
);

let missingTotal = 0;
let total = 0;

async function remoteOk(path) {
  try {
    const res = await fetch(`${mediaBase}${path}`, { method: "HEAD" });
    if (res.ok) return true;
    const get = await fetch(`${mediaBase}${path}`, {
      headers: { Range: "bytes=0-0" },
    });
    return get.ok || get.status === 206;
  } catch {
    return false;
  }
}

for (const story of stories) {
  const localBase = join(root, "public", "stories", story.id);
  const wanted = [];
  const add = (kind, file, what) => {
    if (file) wanted.push({ kind, file, what });
  };

  add("images", story.cover, "غلاف القصة");
  for (const page of story.pages) {
    add("images", page.image, `صورة صفحة ${page.id}`);
    add("audio", page.audio, `سرد صفحة ${page.id}`);
    add("audio", page.sfx, `مؤثر صفحة ${page.id}`);
    if (page.question) {
      add("audio", page.question.audio, `سؤال صفحة ${page.id}`);
      for (const answer of page.question.answers ?? []) {
        add(
          "audio",
          answer.audio,
          `إجابة ${answer.id} لسؤال صفحة ${page.id}`,
        );
      }
    }
  }
  story.quiz.forEach((q, i) => {
    add("audio", q.audio, `سؤال الاختبار ${i + 1}`);
    for (const answer of q.answers ?? []) {
      add("audio", answer.audio, `إجابة ${answer.id} للاختبار ${i + 1}`);
    }
  });

  console.log(
    `\n${story.title}  (${story.id})` +
      (mediaBase ? `  [blob ${mediaBase}]` : "  [local public/]"),
  );

  for (const { kind, file, what } of wanted) {
    total++;
    const path = `/stories/${story.id}/${kind}/${file}`;
    const local = existsSync(join(localBase, kind, file));
    const remote = mediaBase ? await remoteOk(path) : false;
    const ok = local || remote;
    if (!ok) missingTotal++;
    const where = local ? "local" : remote ? "blob" : "missing";
    console.log(`  ${ok ? "✅" : "❌"} ${kind}/${file}  — ${what}  (${where})`);
  }
}

console.log(
  `\n${total - missingTotal} of ${total} files found` +
    (missingTotal
      ? ` (${missingTotal} missing: placeholders/browser voice are used)`
      : " — all set!"),
);
