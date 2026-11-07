// Reports which images and audio files listed in data/stories.json exist in
// public/stories/<story-id>/{images,audio}. Usage: node scripts/check-story-assets.mjs
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stories = JSON.parse(
  readFileSync(join(root, "data", "stories.json"), "utf8"),
);

let missingTotal = 0;
let total = 0;

for (const story of stories) {
  const base = join(root, "public", "stories", story.id);
  const wanted = [];
  const add = (kind, file, what) => {
    if (file) wanted.push({ kind, file, what });
  };

  add("images", story.cover, "غلاف القصة");
  for (const page of story.pages) {
    add("images", page.image, `صورة صفحة ${page.id}`);
    add("audio", page.audio, `سرد صفحة ${page.id}`);
    add("audio", page.sfx, `مؤثر صفحة ${page.id}`);
    if (page.question) add("audio", page.question.audio, `سؤال صفحة ${page.id}`);
  }
  story.quiz.forEach((q, i) => add("audio", q.audio, `سؤال الاختبار ${i + 1}`));

  console.log(`\n${story.title}  (${story.id})`);
  for (const { kind, file, what } of wanted) {
    total++;
    const ok = existsSync(join(base, kind, file));
    if (!ok) missingTotal++;
    console.log(`  ${ok ? "✅" : "❌"} ${kind}/${file}  — ${what}`);
  }
}

console.log(
  `\n${total - missingTotal} of ${total} files found` +
    (missingTotal ? ` (${missingTotal} missing: placeholders/browser voice are used)` : " — all set!"),
);
