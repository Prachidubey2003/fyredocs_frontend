#!/usr/bin/env node
// check-bundle-size.mjs — runs after `vite build` and asserts
// the produced JS/CSS chunks stay under documented budgets.
//
// Pure node, no third-party deps. CI runs it after `npm run
// build`; a regression that pushes a chunk over its budget
// fails the build with a clear "what got bigger, by how much"
// message rather than letting a deploy ship a 40% larger
// bundle.
//
// Budgets are bytes-on-disk after Vite's default
// minify+gzip-friendly emit (no extra compression — that's the
// CDN's job). They're tuned for room to breathe (≈25% above
// the current measured size) so dependency updates within
// reason don't trip CI. Bumping a budget is a deliberate edit
// to this file's `BUDGETS` map — leave a comment with the
// observed measurement + the reason.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, "..", "dist");

// Budgets per chunk family. Each value is the maximum
// allowed total byte size across files matching the prefix
// (Vite emits hashed filenames like `react-vendor-a1b2c3.js`).
//
// Tune by:
//   1. Run `npm run build`.
//   2. Look at the chunk sizes in the build output.
//   3. Set the budget ≈25% above the observed value for
//      that family.
//   4. Commit a comment explaining the bump.
//
// Default ("anything else") is 250KB so a stray giant
// dependency lands here loudly rather than silently bloating
// the default vendor chunk.
const BUDGETS = {
  "react-vendor": 180 * 1024, // 180KB — react+react-dom+router+react-query
  "radix-vendor": 320 * 1024, // 320KB — 25+ Radix UI primitives (observed ≈298KB on 2026-05-17)
  "pdf-vendor": 900 * 1024, // 900KB — pdfjs-dist + pdf-lib (observed ≈830KB on 2026-05-17)
  "mermaid-vendor": 2800 * 1024, // 2.8MB — mermaid only (huge layout/parser surface; route-lazy on /docs; observed ≈2575KB on 2026-05-17)
  "charts-vendor": 520 * 1024, // 520KB — recharts + d3 deps (observed ≈475KB on 2026-05-17)
  "motion-vendor": 180 * 1024, // 180KB — framer-motion
  "index": 640 * 1024, // 640KB — app entry JS + Tailwind CSS bundle combined (observed: JS ≈453KB + CSS ≈87KB = 540KB on 2026-05-17)
  "_default": 850 * 1024, // 850KB — per-file ceiling for dynamic chunks (Shiki language grammars, WASM blobs). Largest legitimate single chunk observed: emacs-lisp at ≈780KB. NOTE: this is per-FILE max, not summed — see report logic below.
};

// The "_default" family applies to any file whose name doesn't
// start with one of the explicit BUDGETS keys. Used to catch a
// stray dep that should have been chunked but wasn't.

function familyForFile(name) {
  for (const family of Object.keys(BUDGETS)) {
    if (family === "_default") continue;
    // Vite emits `<chunk-name>-<hash>.<ext>`. Match on the
    // chunk-name prefix; the trailing hash + extension are
    // ignored.
    if (name.startsWith(family + "-") || name === family + ".js" || name === family + ".css") {
      return family;
    }
  }
  return "_default";
}

function formatBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(path.join(DIST_DIR, "assets"));
  } catch (err) {
    console.error(`check-bundle-size: cannot read ${DIST_DIR}/assets — did you run \`npm run build\`?`);
    console.error(err.message);
    process.exit(2);
  }

  // Bucket files into families. Each entry holds the
  // accumulated size + the file names that contributed.
  const buckets = new Map();
  for (const family of Object.keys(BUDGETS)) {
    buckets.set(family, { size: 0, files: [] });
  }

  for (const entry of entries) {
    if (!entry.endsWith(".js") && !entry.endsWith(".css")) continue;
    const stat = await fs.stat(path.join(DIST_DIR, "assets", entry));
    const family = familyForFile(entry);
    const bucket = buckets.get(family);
    bucket.size += stat.size;
    bucket.files.push({ name: entry, size: stat.size });
  }

  // Report + collect violations. Named families and the
  // default bucket use different invariants:
  //
  //   - Named family ("react-vendor", "pdf-vendor", …):
  //     every file in the family is part of one logical
  //     chunk that loads together. Budget on the SUM.
  //   - Default bucket ("_default"): these are independent
  //     route-/feature-lazy chunks (Shiki language grammars,
  //     per-route code-splits, etc.). They each load on
  //     demand. Budget on the LARGEST single file — a giant
  //     one chunk is the problem, not the cumulative total.
  let violations = 0;
  let totalSize = 0;
  console.log("Bundle-size budget report:");
  console.log("============================================");
  for (const [family, { size, files }] of buckets) {
    const budget = BUDGETS[family];
    totalSize += size;

    if (size === 0 && family !== "_default") {
      // Family has a budget but no files matched — likely a
      // chunk name drift. Warn, don't fail.
      console.log(`  ${family}: (no files matched — chunk renamed?)`);
      continue;
    }

    if (family === "_default") {
      // Max-size invariant for independent lazy chunks.
      let maxFile = { name: "(none)", size: 0 };
      for (const f of files) {
        if (f.size > maxFile.size) {
          maxFile = f;
        }
      }
      const status = maxFile.size > budget ? "FAIL" : "ok";
      const indicator = maxFile.size > budget ? "❌" : "✓";
      console.log(
        `  ${indicator} ${family}: largest file ${formatBytes(maxFile.size)} (${maxFile.name}) / per-file budget ${formatBytes(budget)} — ${files.length} files totalling ${formatBytes(size)} (${status})`
      );
      if (maxFile.size > budget) {
        violations++;
        // List every file over budget (not just the max)
        // so on-call sees the full impact in one pass.
        for (const f of files) {
          if (f.size > budget) {
            console.log(`      └─ over budget: ${f.name}: ${formatBytes(f.size)}`);
          }
        }
      }
      continue;
    }

    // Named family: sum-based.
    const status = size > budget ? "FAIL" : "ok";
    const indicator = size > budget ? "❌" : "✓";
    console.log(
      `  ${indicator} ${family}: ${formatBytes(size)} / budget ${formatBytes(budget)} (${status})`
    );
    if (size > budget) {
      violations++;
      for (const f of files) {
        console.log(`      └─ ${f.name}: ${formatBytes(f.size)}`);
      }
    }
  }
  console.log("============================================");
  console.log(`Total: ${formatBytes(totalSize)}`);

  if (violations > 0) {
    console.error(
      `\ncheck-bundle-size: ${violations} family/families over budget. Either trim the offending dep, ` +
        `split a chunk in vite.config.ts, or (last resort) raise the budget in ` +
        `scripts/check-bundle-size.mjs with a comment explaining why.`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("check-bundle-size: unexpected failure:", err);
  process.exit(2);
});
