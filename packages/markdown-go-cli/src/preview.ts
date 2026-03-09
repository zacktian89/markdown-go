import { exec } from "node:child_process";
import fs from "node:fs";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const FILE_ROUTE_PREFIX = "/__file__/";
const preferredPorts = [5174, 5175, 5176, 5177, 5178, 5179, 5180];
const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

type RunPreviewOptions = {
  args: string[];
  packageRoot: string;
  packageVersion: string;
};

export function printPreviewUsage(packageVersion: string) {
  console.log(`markdown-go v${packageVersion}

Usage:
  markdown-go <markdown-file>
  markdown-go "<markdown-string>" --is-string

Options:
  --is-string   Treat <input> as a markdown string
  -h, --help    Show this help message
  -v, --version Print CLI version`);
}

function normalizePathForUrl(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

function toRoutePath(filePath: string) {
  return `${FILE_ROUTE_PREFIX}${encodeURIComponent(normalizePathForUrl(path.resolve(filePath)))}`;
}

function fromRoutePath(routePath: string | null) {
  if (!routePath || routePath === "/") {
    return null;
  }

  if (routePath.startsWith(FILE_ROUTE_PREFIX)) {
    return path.normalize(decodeURIComponent(routePath.slice(FILE_ROUTE_PREFIX.length)));
  }

  const relativePath = routePath.startsWith("/") ? routePath.slice(1) : routePath;
  return path.resolve(process.cwd(), relativePath);
}

function openInBrowser(targetUrl: string) {
  const command = process.platform === "win32"
    ? `start "" "${targetUrl}"`
    : process.platform === "darwin"
      ? `open "${targetUrl}"`
      : `xdg-open "${targetUrl}"`;

  exec(command, (error) => {
    if (error) {
      console.warn(`Could not auto-open browser (${error.message}). Please open ${targetUrl} manually.`);
    }
  });
}

async function isServerRunning(port: number) {
  return new Promise<boolean>((resolve) => {
    const request = http.get(`http://localhost:${port}/api/init`, { timeout: 500 }, (response) => {
      resolve(response.statusCode === 200);
    });

    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

function getMimeType(filePath: string) {
  return contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function resolveStaticPath(webRoot: string, urlPath: string) {
  const requested = decodeURIComponent(urlPath.replace(/^\/+/, ""));
  const resolvedPath = path.resolve(webRoot, requested);
  if (!resolvedPath.startsWith(webRoot)) {
    return null;
  }
  return resolvedPath;
}

function isSpaRoute(urlPath: string) {
  return urlPath === "/" || urlPath.startsWith(FILE_ROUTE_PREFIX) || urlPath.toLowerCase().endsWith(".md") || !path.extname(urlPath);
}

async function loadThemes(themesDir: string) {
  const customThemes: unknown[] = [];
  if (!fs.existsSync(themesDir)) {
    return customThemes;
  }

  const files = fs.readdirSync(themesDir).filter((file) => file.endsWith(".js") || file.endsWith(".mjs") || file.endsWith(".cjs"));
  for (const file of files) {
    try {
      const modulePath = pathToFileURL(path.join(themesDir, file)).href;
      const loaded = await import(modulePath);
      if (loaded.preset) {
        customThemes.push(loaded.preset);
      } else if (loaded.default) {
        customThemes.push(loaded.default);
      }
    } catch (error) {
      console.warn(`Could not load custom theme ${file}:`, error);
    }
  }

  return customThemes;
}

export async function runPreviewCommand(options: RunPreviewOptions) {
  const webRoot = path.join(options.packageRoot, "dist", "web");
  const themesDir = path.join(options.packageRoot, "dist", "theme");
  const { values, positionals } = parseArgs({
    args: options.args,
    options: {
      "is-string": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" }
    },
    strict: false
  });

  if (values.version) {
    console.log(options.packageVersion);
    return;
  }

  if (values.help) {
    printPreviewUsage(options.packageVersion);
    return;
  }

  const inputArg = positionals[0];
  if (!inputArg) {
    printPreviewUsage(options.packageVersion);
    process.exitCode = 1;
    return;
  }

  const isStringInput = Boolean(values["is-string"]);
  let markdownContent = "";
  let markdownFilePath: string | null = null;
  let baseDir = process.cwd();
  let initialRoutePath = "/";

  if (isStringInput) {
    markdownContent = inputArg;
  } else {
    markdownFilePath = path.resolve(process.cwd(), inputArg);
    if (!fs.existsSync(markdownFilePath) || !fs.statSync(markdownFilePath).isFile()) {
      console.error(`Error: File not found at ${markdownFilePath}`);
      process.exitCode = 1;
      return;
    }

    markdownContent = fs.readFileSync(markdownFilePath, "utf-8");
    baseDir = path.dirname(markdownFilePath);
    initialRoutePath = toRoutePath(markdownFilePath);
  }

  console.log("Starting Local Preview Server...");

  for (const port of preferredPorts) {
    if (await isServerRunning(port)) {
      const targetUrl = `http://localhost:${port}${initialRoutePath === "/" ? "" : initialRoutePath}`;
      console.log(`Found existing preview server on port ${port}.`);
      console.log(`Opening in existing service: ${targetUrl}`);
      openInBrowser(targetUrl);
      return;
    }
  }

  const customThemes = await loadThemes(themesDir);
  const clients = new Set<ServerResponse>();

  const resolveMarkdownRequest = (routePath: string | null) => {
    if (!routePath || routePath === "/") {
      return {
        content: markdownContent,
        absolutePath: markdownFilePath,
        routePath: initialRoutePath
      };
    }

    const requestedPath = fromRoutePath(routePath);
    if (!requestedPath || !fs.existsSync(requestedPath) || !fs.statSync(requestedPath).isFile()) {
      return null;
    }

    return {
      content: fs.readFileSync(requestedPath, "utf-8"),
      absolutePath: requestedPath,
      routePath: toRoutePath(requestedPath)
    };
  };

  const pushUpdate = (absolutePath: string, content: string) => {
    const payload = JSON.stringify({
      type: "update",
      path: toRoutePath(absolutePath),
      fullPath: absolutePath,
      originalPath: absolutePath,
      content
    });

    for (const client of clients) {
      client.write(`data: ${payload}\n\n`);
    }
  };

  let watcher: fs.FSWatcher | null = null;
  if (markdownFilePath) {
    try {
      watcher = fs.watch(baseDir, { recursive: true, persistent: true }, (_eventType, filename) => {
        if (!filename || !filename.toLowerCase().endsWith(".md")) {
          return;
        }

        setTimeout(() => {
          try {
            const changedPath = path.resolve(baseDir, filename);
            if (!fs.existsSync(changedPath) || !fs.statSync(changedPath).isFile()) {
              return;
            }

            const nextContent = fs.readFileSync(changedPath, "utf-8");
            if (markdownFilePath && path.resolve(changedPath) === markdownFilePath) {
              markdownContent = nextContent;
            }
            console.log(`File ${filename} changed. Pushing update...`);
            pushUpdate(changedPath, nextContent);
          } catch {
            // Ignore transient file lock errors while the editor writes.
          }
        }, 100);
      });
    } catch (error) {
      console.warn(`File watching is unavailable for ${baseDir}:`, error);
    }
  }

  const server = http.createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const urlPath = requestUrl.pathname;

    if (urlPath === "/api/init") {
      const requestedPath = requestUrl.searchParams.get("path");
      const resolved = resolveMarkdownRequest(requestedPath);
      if (!resolved) {
        response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "Markdown file not found" }));
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        content: resolved.content,
        path: resolved.routePath,
        originalPath: isStringInput ? "String Input" : resolved.absolutePath,
        fullPath: resolved.absolutePath,
        themes: customThemes
      }));
      return;
    }

    if (urlPath === "/api/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });
      response.write("retry: 1000\n\n");
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }

    if (urlPath === "/api/image") {
      const imgPathParam = requestUrl.searchParams.get("path");
      const docPathParam = requestUrl.searchParams.get("docPath");
      if (imgPathParam) {
        try {
          const decodedSrc = decodeURIComponent(imgPathParam);
          if (decodedSrc.startsWith("http://") || decodedSrc.startsWith("https://")) {
            const upstream = await fetch(decodedSrc);
            if (upstream.ok) {
              const arrayBuffer = await upstream.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const mimeType = upstream.headers.get("content-type") || "image/jpeg";
              response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
              response.end(JSON.stringify({ base64: `data:${mimeType};base64,${buffer.toString("base64")}` }));
              return;
            }
          } else {
            let resolveDir = baseDir;
            const resolvedDocumentPath = fromRoutePath(docPathParam);
            if (resolvedDocumentPath) {
              resolveDir = path.dirname(resolvedDocumentPath);
            }

            const absoluteImagePath = path.resolve(resolveDir, decodedSrc);
            if (fs.existsSync(absoluteImagePath) && fs.statSync(absoluteImagePath).isFile()) {
              const extension = path.extname(absoluteImagePath).toLowerCase();
              const mimeType = contentTypes[extension] ?? "image/jpeg";
              const imageData = fs.readFileSync(absoluteImagePath);
              response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
              response.end(JSON.stringify({ base64: `data:${mimeType};base64,${imageData.toString("base64")}` }));
              return;
            }
          }
        } catch (error) {
          console.warn("API error processing image:", error);
        }
      }

      response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Image not found" }));
      return;
    }

    if (isSpaRoute(urlPath)) {
      const indexPath = path.join(webRoot, "index.html");
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(fs.readFileSync(indexPath, "utf-8"));
      return;
    }

    const staticFilePath = resolveStaticPath(webRoot, urlPath);
    if (!staticFilePath || !fs.existsSync(staticFilePath) || !fs.statSync(staticFilePath).isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": getMimeType(staticFilePath) });
    fs.createReadStream(staticFilePath).pipe(response);
  });

  const listen = async () => {
    for (let port = preferredPorts[0]; port < preferredPorts[0] + 20; port += 1) {
      try {
        await new Promise<void>((resolve, reject) => {
          const onError = (error: NodeJS.ErrnoException) => {
            server.off("listening", onListening);
            reject(error);
          };
          const onListening = () => {
            server.off("error", onError);
            resolve();
          };

          server.once("error", onError);
          server.once("listening", onListening);
          server.listen(port);
        });

        return port;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") {
          throw error;
        }
      }
    }

    throw new Error("Could not find an open port for markdown-go preview server.");
  };

  try {
    const port = await listen();
    const targetUrl = `http://localhost:${port}${initialRoutePath === "/" ? "" : initialRoutePath}`;
    if (markdownFilePath) {
      console.log(`Watching for changes in: ${markdownFilePath}`);
    }
    console.log(`Live Preview Server Running at: ${targetUrl}`);
    openInBrowser(targetUrl);
  } catch (error) {
    watcher?.close();
    server.close();
    console.error("Fatal starting markdown-go preview:", error);
    process.exitCode = 1;
    return;
  }

  const shutdown = () => {
    watcher?.close();
    for (const client of clients) {
      client.end();
    }
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
