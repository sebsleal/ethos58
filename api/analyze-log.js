import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { analyzeLog } from '../server/utils/logAnalyzer.js';

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are accepted.'));
    }
  },
});

app.all('/api/analyze-log', upload.single('file'), (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Send the CSV as multipart/form-data with field name "file".',
      });
    }

    let carDetails = {};
    if (req.body.car_details) {
      try { carDetails = JSON.parse(req.body.car_details); } catch { /* ignore malformed */ }
    }

    const result = analyzeLog(req.file.buffer, req.file.originalname, carDetails);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(422).json({ success: false, error: err.message });
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  res.status(500).json({ success: false, error: err.message });
});

export default app;
