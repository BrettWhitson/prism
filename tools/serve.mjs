// Local static server for the demo. No dependencies.
//
// Serves the project root (so the demo reaches src/ and node_modules/tether) with correct MIME types and
// `Cache-Control: no-store`, so edits show up on reload.
//
// Usage:  node tools/serve.mjs [port]      (default port 8650; open http://localhost:8650/demo/)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const port = Number(process.argv[2] ?? process.env.PORT ?? 8650);

/** Map a request URL to a file inside the project, refusing anything that escapes it. */
async function resolveFile(requestUrl) {
  const { pathname } = new URL(requestUrl, "http://localhost");
  const filePath = path.resolve(ROOT, `.${decodeURIComponent(pathname)}`);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return null;
  try {
    const info = await stat(filePath);
    return info.isDirectory() ? path.join(filePath, "index.html") : filePath;
  } catch {
    return null;
  }
}

createServer(async (request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/") {
    response.writeHead(302, { Location: "/demo/" });
    response.end();
    return;
  }
  const filePath = await resolveFile(request.url);
  const body = filePath && (await readFile(filePath).catch(() => null));
  if (!body) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type":
      MIME_TYPES[path.extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  response.end(body);
}).listen(port, () =>
  console.log(`Prism demo: http://localhost:${port}/demo/`),
);
