import express from 'express';
import cors from 'cors';
import { calculateBlend } from '../server/utils/blendMath.js';

const app = express();
app.use(cors());
app.use(express.json());

app.all('/api/calculate-blend', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
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

export default app;
