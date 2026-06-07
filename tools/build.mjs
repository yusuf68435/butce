// Production build — minified dist/
// Usage: npm run build
// Outputs: dist/index.html, dist/apple-tasarim.css, dist/app.js, manifest.json, service-worker.js

import {
  mkdir,
  copyFile,
  readFile,
  writeFile,
  rm,
  readdir,
  unlink,
} from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { minify as minifyJS } from "terser";
import { minify as minifyCSS } from "csso";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

async function build() {
  // Some Windows static servers hold a file handle on dist/ — try rm first,
  // fall back to clearing contents (which works while the dir handle is open).
  try {
    await rm(DIST, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== "EBUSY") throw err;
    const entries = await readdir(DIST).catch(() => []);
    for (const name of entries) {
      try {
        await rm(resolve(DIST, name), { recursive: true, force: true });
      } catch (e) {
        if (e.code === "EBUSY" || e.code === "EPERM") {
          await unlink(resolve(DIST, name)).catch(() => {});
        } else throw e;
      }
    }
  }
  await mkdir(DIST, { recursive: true });

  // CSS (Apple design file lives at repo root)
  const cssIn = await readFile(resolve(ROOT, "apple-tasarim.css"), "utf8");
  const cssOut = minifyCSS(cssIn, { restructure: true, comments: false }).css;
  await writeFile(resolve(DIST, "apple-tasarim.css"), cssOut, "utf8");

  // JS (app source lives under uygulama/)
  const jsIn = await readFile(resolve(ROOT, "uygulama", "app.js"), "utf8");
  const jsRes = await minifyJS(jsIn, {
    ecma: 2020,
    compress: {
      passes: 2,
      drop_console: false, // keep console.error for SW debugging
      pure_funcs: [],
    },
    mangle: { toplevel: false }, // top-level names are referenced from HTML
    format: { comments: false },
  });
  if (jsRes.error) throw jsRes.error;
  await writeFile(resolve(DIST, "app.js"), jsRes.code, "utf8");

  // HTML — flatten ../ paths (dist is flat) + strip ?v=N query
  let html = await readFile(resolve(ROOT, "uygulama", "index.html"), "utf8");
  html = html
    .replace(/\.\.\/apple-tasarim\.css\?v=\d+/g, "apple-tasarim.css")
    .replace(/app\.js\?v=\d+/g, "app.js")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s*\n/g, "\n");
  await writeFile(resolve(DIST, "index.html"), html, "utf8");

  // manifest — plain copy (paths are relative to its own folder)
  await copyFile(
    resolve(ROOT, "uygulama", "manifest.json"),
    resolve(DIST, "manifest.json"),
  );

  // service worker — flatten the parent-path CSS reference (dist is flat)
  const swIn = await readFile(
    resolve(ROOT, "uygulama", "service-worker.js"),
    "utf8",
  );
  const swOut = swIn.replace(/\.\.\/apple-tasarim\.css/g, "./apple-tasarim.css");
  await writeFile(resolve(DIST, "service-worker.js"), swOut, "utf8");

  // Stats
  const cssGzip = Buffer.byteLength(cssOut);
  const jsGzip = Buffer.byteLength(jsRes.code);
  const cssSrc = Buffer.byteLength(cssIn);
  const jsSrc = Buffer.byteLength(jsIn);
  console.log("\n  build complete\n");
  console.log(
    `  apple-tasarim.css   ${(cssSrc / 1024).toFixed(1)} KB  →  ${(cssGzip / 1024).toFixed(1)} KB  (-${Math.round((1 - cssGzip / cssSrc) * 100)}%)`,
  );
  console.log(
    `  app.js      ${(jsSrc / 1024).toFixed(1)} KB  →  ${(jsGzip / 1024).toFixed(1)} KB  (-${Math.round((1 - jsGzip / jsSrc) * 100)}%)`,
  );
  console.log(`  output:     ${DIST}\n`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
