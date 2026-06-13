const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const IMAGE_ENDPOINT = "https://xiaoji.baziapi.site/v1/images/generations";

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".md": "text/markdown;charset=utf-8",
  ".json": "application/json;charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/images/generations") {
      await proxyImageGeneration(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "Method not allowed", "text/plain;charset=utf-8");
      return;
    }

    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.normalize(path.join(ROOT, pathname));

    if (!filePath.startsWith(path.normalize(ROOT))) {
      send(res, 403, "Forbidden", "text/plain;charset=utf-8");
      return;
    }

    const data = await fs.readFile(filePath);
    send(res, 200, req.method === "HEAD" ? "" : data, MIME[path.extname(filePath)] || "application/octet-stream");
  } catch (error) {
    send(res, 404, "Not found", "text/plain;charset=utf-8");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Pilates coach app: http://${HOST}:${PORT}/`);
});

async function proxyImageGeneration(req, res) {
  const body = await readBody(req);
  const headers = {
    "content-type": "application/json"
  };

  const auth = req.headers.authorization;
  if (auth) headers.authorization = auth;

  const upstream = await fetch(IMAGE_ENDPOINT, {
    method: "POST",
    headers,
    body
  });

  const text = await upstream.text();
  send(res, upstream.status, text, upstream.headers.get("content-type") || "application/json;charset=utf-8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, body, type) {
  res.writeHead(status, {
    "content-type": type,
    "access-control-allow-origin": "*"
  });
  res.end(body);
}
