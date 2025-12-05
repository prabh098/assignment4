import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Enable CORS for local dev
app.use(cors());
app.use(express.json());

// Resolve absolute path to /public and serve it statically
const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

/**
 * PART 1: Search existing image by name
 * Example: GET /api/getImage?name=tom -> { filename: "tom.jpg" } if present
 */
app.get('/api/getImage', (req, res) => {
  const raw = (req.query.name || '').toString().trim().toLowerCase();
  if (!raw) return res.status(400).json({ error: 'Missing ?name=' });

  const filename = `${raw}.jpg`;
  const filePath = path.join(publicDir, filename);

  if (fs.existsSync(filePath)) {
    return res.json({ filename });
  } else {
    return res.status(404).json({ error: `Image for '${raw}' not found`, filename: null });
  }
});

/**
 * PART 2: Upload API with Multer 2.x
 * Accepts a file field named "file" and a query parameter ?name=...
 * Saves/overwrites /public/<name>.jpg
 */
const uploadsDir = path.resolve('./uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer temp storage; files are moved into /public after validation
const upload = multer({ dest: uploadsDir });

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const raw = (req.query.name || '').toString().trim().toLowerCase();
    if (!raw) {
      // Clean up temp file if it exists
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing ?name=' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Missing file field named "file"' });
    }

    // We standardize on .jpg filenames per assignment
    const destFilename = `${raw}.jpg`;
    const destPath = path.join(publicDir, destFilename);

    // Move/overwrite the uploaded file into /public
    fs.renameSync(req.file.path, destPath);

    return res.json({
      ok: true,
      filename: destFilename,
      message: `Saved ${destFilename} to /public`
    });
  } catch (e) {
    console.error('[upload] error:', e);
    // Attempt cleanup of temp file
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    return res.status(500).json({ error: 'Failed to save file' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Static images served from ${publicDir}`);
});
