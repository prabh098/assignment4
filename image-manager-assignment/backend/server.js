import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Enable CORS for local dev with a Vite/React or static frontend
app.use(cors());
app.use(express.json());

// Static hosting for images in /public (e.g., http://localhost:3000/tom.jpg)
const publicDir = path.resolve('./public');
app.use(express.static(publicDir));

// Existing route: returns a filename by query (e.g., ?name=tom => 'tom.jpg')
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

// Multer setup: store uploads to a temporary folder before renaming
const upload = multer({ dest: 'uploads/' });

// New route: accepts file and ?name= to overwrite the canonical file inside /public
app.post('/api/upload', upload.single('file'), (req, res) => {
  const raw = (req.query.name || '').toString().trim().toLowerCase();
  if (!raw) return res.status(400).json({ error: 'Missing ?name=' });
  if (!req.file) return res.status(400).json({ error: 'Missing file field named "file"' });

  // Enforce .jpg extension per assignment examples (tom.jpg, jerry.jpg, dog.jpg)
  const destFilename = `${raw}.jpg`;
  const destPath = path.join(publicDir, destFilename);

  try {
    // Replace (move) uploaded file into /public with the canonical name, overwriting if exists
    fs.renameSync(req.file.path, destPath);
    return res.json({ ok: true, filename: destFilename, message: `Saved ${destFilename} to /public` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save file' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Static images served from ${publicDir}`);
});
