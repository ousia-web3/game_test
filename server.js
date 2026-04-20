const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const sqlite3 = require('sqlite3').verbose();

const HOST = "127.0.0.1";
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "leaderboard.db");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite DB (Simulating Online DB layer)
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error("Database Error:", err.message);
  else {
    db.run(`CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT,
      score INTEGER,
      distance INTEGER,
      topSpeed REAL,
      seedLife INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, name: "stairs-of-the-hero-db" });
    }

    if (url.pathname === "/api/scores" && req.method === "GET") {
      db.all(`SELECT * FROM scores ORDER BY score DESC, distance DESC LIMIT 20`, [], (err, rows) => {
        if (err) return sendJson(res, 500, { error: "DB Error" });
        return sendJson(res, 200, { scores: rows });
      });
      return;
    }

    if (url.pathname === "/api/scores" && req.method === "POST") {
      const payload = await readJsonBody(req);
      const r = normalizeScore(payload);
      
      const sql = `INSERT INTO scores (nickname, score, distance, topSpeed, seedLife) VALUES (?, ?, ?, ?, ?)`;
      db.run(sql, [r.nickname, r.score, r.distance, r.topSpeed, r.seedLife], function(err) {
        if (err) return sendJson(res, 500, { error: "DB Insert Error" });
        
        // return updated leaderboard
        db.all(`SELECT * FROM scores ORDER BY score DESC, distance DESC LIMIT 20`, [], (err, rows) => {
          if (err) return sendJson(res, 500, { error: "DB Error" });
          return sendJson(res, 201, { ok: true, score: r, scores: rows });
        });
      });
      return;
    }

    if (req.method !== "GET") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

function normalizeScore(payload) {
  const nickname = String(payload.nickname || "").trim().slice(0, 12) || "익명 용사";
  const score = clampNumber(payload.score, 0, 999999);
  const distance = clampNumber(payload.distance, 0, 999999);
  const topSpeed = clampDecimal(payload.topSpeed, 0, 999, 1);
  const seedLife = clampNumber(payload.seedLife, 1, 5);
  return { nickname, score, distance, topSpeed, seedLife };
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function clampDecimal(value, min, max, digits) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  const factor = 10 ** digits;
  const rounded = Math.round(number * factor) / factor;
  return Math.max(min, Math.min(max, rounded));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (err) { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function serveStatic(pathname, res) {
  const cleanedPath = pathname === "/" ? "/index.html" : pathname;
  const targetPath = path.normalize(path.join(PUBLIC_DIR, cleanedPath));

  if (!targetPath.startsWith(PUBLIC_DIR)) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    return sendJson(res, 404, { error: "Not found" });
  }

  const ext = path.extname(targetPath).toLowerCase();
  const type = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(targetPath).pipe(res);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
