/**
 * Ethos85 API Server
 *
 * POST /api/calculate-blend  – ethanol blend math
 * POST /api/analyze-log      – bootmod3 / MHD CSV datalog analysis
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { calculateBlend } from './utils/blendMath.js';
import { analyzeLog } from './utils/logAnalyzer.js';

const app  = express();
const PORT = process.env.API_PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────

// Open CORS for all origins — this is a local dev tool, not a public API.
// Restricting to localhost:5173 breaks access from phones/tablets on the same LAN.
app.use(cors());
app.use(express.json());

// Multer: keep CSV in memory.
// Accept any MIME type as long as the filename ends in .csv — iOS and Android
// often send text/plain, application/vnd.ms-excel, or application/octet-stream
// for CSV files, not the canonical text/csv.
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are accepted.'));
    }
  },
});

// ─── POST /api/calculate-blend ───────────────────────────────────────────────

app.post('/api/calculate-blend', (req, res) => {
  try {
    const {
      current_gallons,         currentFuel,
      current_ethanol_percent, currentE,
      target_ethanol_percent,  targetE,
      tank_size,               tankSize,
    } = req.body;

    const result = calculateBlend({
      current_gallons:         current_gallons         ?? currentFuel,
      current_ethanol_percent: current_ethanol_percent ?? currentE,
      target_ethanol_percent:  target_ethanol_percent  ?? targetE,
      tank_size:               tank_size               ?? tankSize,
      precision_mode:          req.body.precision_mode ?? req.body.precisionMode ?? false,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── POST /api/analyze-log ───────────────────────────────────────────────────

app.post('/api/analyze-log', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Send the CSV as multipart/form-data with field name "file".',
      });
    }

    // car_details is a JSON string appended as a non-file field in the multipart form
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

// ─── Global error handler ────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ success: false, error: err.message });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ethos85 API server running on http://0.0.0.0:${PORT}`);
});
