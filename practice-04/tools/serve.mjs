import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const PORT = process.argv[2] || 5504;
const root = process.cwd();
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" };

createServer(async (req, res) => {
  try {
    const url = req.url.split("?")[0];
    const filePath = join(root, url === "/" ? "index.html" : url);
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": types[extname(filePath)] || "text/plain" });
    res.end(data);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Сервер запущен: http://127.0.0.1:${PORT}/`);
});