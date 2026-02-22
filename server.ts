import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "omni-qr-secret-key-2026";
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize Database
const db = new Database("database.sqlite");
db.pragma("foreign_keys = ON");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_path TEXT,
    primary_color TEXT DEFAULT '#0A1F44',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    access_type TEXT DEFAULT 'public',
    password_hash TEXT,
    expires_at DATETIME,
    qr_settings TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id TEXT NOT NULL,
    ip_address TEXT,
    device TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
  );
`);

const app = express();
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { orgName, email, password } = req.body;
  
  try {
    const orgId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertOrg = db.prepare("INSERT INTO organizations (id, name) VALUES (?, ?)");
    const insertUser = db.prepare("INSERT INTO users (id, organization_id, email, password_hash) VALUES (?, ?, ?, ?)");

    const transaction = db.transaction(() => {
      insertOrg.run(orgId, orgName);
      insertUser.run(userId, orgId, email, hashedPassword);
    });

    transaction();

    const token = jwt.sign({ id: userId, organization_id: orgId, email }, JWT_SECRET);
    res.json({ token, user: { id: userId, email, organization_id: orgId } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, organization_id: user.organization_id, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, organization_id: user.organization_id } });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user: any = db.prepare("SELECT id, email, organization_id, role FROM users WHERE id = ?").get(req.user.id);
  const org: any = db.prepare("SELECT * FROM organizations WHERE id = ?").get(user.organization_id);
  res.json({ user, organization: org });
});

// Folders
app.get("/api/folders", authenticateToken, (req: any, res) => {
  const folders = db.prepare("SELECT * FROM folders WHERE organization_id = ? ORDER BY created_at DESC").all(req.user.organization_id);
  res.json(folders);
});

app.post("/api/folders", authenticateToken, (req: any, res) => {
  const { name, description, access_type, password } = req.body;
  const id = uuidv4();
  const slug = name.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(2, 7);
  
  const qr_settings = JSON.stringify({
    primaryColor: "#0A1F44",
    backgroundColor: "#FFFFFF",
    embedLogo: true,
  });

  db.prepare(`
    INSERT INTO folders (id, organization_id, name, description, slug, access_type, password_hash, qr_settings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.organization_id, name, description, slug, access_type, password ? bcrypt.hashSync(password, 10) : null, qr_settings);

  res.json({ id, slug });
});

app.get("/api/folders/:id", authenticateToken, (req: any, res) => {
  const folder = db.prepare("SELECT * FROM folders WHERE id = ? AND organization_id = ?").get(req.params.id, req.user.organization_id);
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  
  const files = db.prepare("SELECT * FROM files WHERE folder_id = ?").all(folder.id);
  res.json({ ...folder, files });
});

// Public Folder View
app.get("/api/public/folders/:slug", (req, res) => {
  const folder: any = db.prepare("SELECT id, name, description, access_type, qr_settings, organization_id FROM folders WHERE slug = ?").get(req.params.slug);
  if (!folder) return res.status(404).json({ error: "Meeting not found" });

  const org: any = db.prepare("SELECT name, logo_path, primary_color FROM organizations WHERE id = ?").get(folder.organization_id);
  const files = db.prepare("SELECT id, name, mime_type, size, created_at FROM files WHERE folder_id = ?").all(folder.id);

  // Log scan
  db.prepare("INSERT INTO scans (folder_id, ip_address, device) VALUES (?, ?, ?)").run(folder.id, req.ip, req.headers['user-agent']);

  res.json({ folder, organization: org, files });
});

// File Upload
const storage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    const orgId = req.user.organization_id;
    const dir = path.join(UPLOADS_DIR, orgId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post("/api/files/upload", authenticateToken, upload.single("file"), (req: any, res) => {
  const { folder_id } = req.body;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO files (id, folder_id, name, file_path, mime_type, size)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, folder_id, req.file.originalname, req.file.path, req.file.mimetype, req.file.size);

  res.json({ id, name: req.file.originalname });
});

// File Download
app.get("/api/files/download/:id", async (req, res) => {
  const file: any = db.prepare("SELECT * FROM files WHERE id = ?").get(req.params.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  
  // In a real app, check permissions here
  res.download(file.file_path, file.name);
});

// QR Generation
app.get("/api/qr/:slug", async (req, res) => {
  const { slug } = req.params;
  const url = `${process.env.APP_URL}/f/${slug}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      width: 400,
      color: {
        dark: "#0A1F44",
        light: "#FFFFFF"
      }
    });
    res.json({ qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR" });
  }
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
