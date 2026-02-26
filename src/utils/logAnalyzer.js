/**
 * Log analysis engine for Ethos85.
 *
 * Context-aware analysis — each metric only inspects rows where the car
 * is actually under demand. Coasting and idle produce naturally extreme
 * AFR/HPFP readings that are not safety concerns:
 *
 *   - During decel/coast, ECU cuts fuel → O2 sensor reads 18–22+ (not a real lean event)
 *   - At idle, HPFP runs at 300–800 psi intentionally — not a pressure drop
 *   - Light-throttle timing corrections are routine closed-loop adjustments
 *
 * Row classifications (derived from load + boost columns):
 *   COAST/IDLE: load < 50% and boost ≤ 2 psi  ← excluded from all metric analysis
 *   DEMAND:     load ≥ 50% OR boost > 2 psi   ← AFR sample collection, HPFP checked here
 *   WOT:        load ≥ 70% OR boost > 8 psi   ← AFR lean/rich events flagged here
 *
 * AFR thresholds are adjusted for ethanol content — E40 stoich is ~12.4:1,
 * so lean/rich limits scale proportionally from E0 baseline values.
 *
 * Boost unit detection: if the CSV column header contains "bar" or "kpa",
 * values are automatically converted to psi for all threshold comparisons.
 */

import { parseCsv, num, lambdaToAfr } from './csvParser.js'; // browser-compatible

// ─── Constants ───────────────────────────────────────────────────────────────

const LOAD_DEMAND = 50;   // % — minimum load for HPFP / AFR sampling
const LOAD_WOT = 70;   // % — WOT threshold for lean/rich flagging
const BOOST_DEMAND = 2;    // psi — demand threshold regardless of load
const BOOST_WOT = 8;    // psi — WOT threshold regardless of load
const LOAD_TIMING = 40;   // % — minimum load for meaningful timing corrections

// E0 baseline AFR thresholds (scaled per ethanol via getAfrThresholds)
const AFR_LEAN_RISK = 13.8;
const AFR_LEAN_CAUTION = 13.0;
const AFR_RICH_RISK = 10.0;
const AFR_RICH_CAUTION = 10.8;

const HPFP_DROP_RISK_PCT = 20;
const HPFP_DROP_CAUTION_PCT = 10;

const IAT_RISK_F = 140;
const IAT_CAUTION_F = 120;

const TIMING_RISK_DEG = -4.0;
const TIMING_CAUTION_DEG = -2.0;

// O2 sensors read 18–22+ during decel fuel cut regardless of blend.
// Chart AFR values above this threshold are excluded to clean up the display.
const FUEL_CUT_AFR = 16.5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_RANK = { Safe: 0, Caution: 1, Risk: 2 };

function worstStatus(...statuses) {
  return statuses
    .filter(Boolean)
    .reduce((worst, s) => (STATUS_RANK[s] ?? 0) > (STATUS_RANK[worst] ?? 0) ? s : worst, 'Safe');
}

function roundN(v, n) { return parseFloat(v.toFixed(n)); }

/**
 * Normalize a boost value to psi from whatever unit the CSV uses.
 */
function normalizeBoostToPsi(v, unit) {
  if (isNaN(v)) return NaN;
  if (unit === 'bar') return v * 14.5038;
  if (unit === 'kpa') return v * 0.14504;
  return v;
}

/**
 * Compute ethanol-adjusted AFR safety thresholds.
 * At higher ethanol, stoich AFR is lower — lean/rich limits scale proportionally.
 *   E0  → stoich 14.7   E40 → stoich ~12.4   E85 → stoich ~9.8
 */
function getAfrThresholds(ethanolPercent = 10) {
  const e = Math.min(85, Math.max(0, Number(ethanolPercent) || 10));
  const stoich = parseFloat((14.7 - (14.7 - 9.8) * (e / 85)).toFixed(2));
  const r = stoich / 14.7;
  return {
    stoich,
    lean_risk: parseFloat((AFR_LEAN_RISK * r).toFixed(2)),
    lean_caution: parseFloat((AFR_LEAN_CAUTION * r).toFixed(2)),
    rich_risk: parseFloat((AFR_RICH_RISK * r).toFixed(2)),
    rich_caution: parseFloat((AFR_RICH_CAUTION * r).toFixed(2)),
  };
}

function isDemand(load, boost, pedal, throttle) {
  const l = isNaN(load) ? 0 : load;
  const b = isNaN(boost) ? 0 : boost;
  const p = isNaN(pedal) ? NaN : pedal;
  const t = isNaN(throttle) ? NaN : throttle;

  // If we have pedal/throttle data, reject if both are explicitly lifted (coasting/shifting)
  if (!isNaN(p) && p < 1 && (!isNaN(t) ? t < 5 : true)) return false;

  return l >= LOAD_DEMAND || b > BOOST_DEMAND;
}

function isWot(load, boost, pedal, throttle) {
  const l = isNaN(load) ? 0 : load;
  const b = isNaN(boost) ? 0 : boost;
  const p = isNaN(pedal) ? NaN : pedal;
  const t = isNaN(throttle) ? NaN : throttle;

  // Require actual driver intent for WOT to avoid fuel-cut coasting spikes
  if (!isNaN(p) && p < 50) return false;
  if (!isNaN(t) && t < 30) return false;

  return l >= LOAD_WOT || b > BOOST_WOT;
}

// ─── AFR Analysis ────────────────────────────────────────────────────────────

function analyzeAfr(rows, columns, isLambdaAfr, thresholds, boostUnit) {
  const afrCol = columns.afr;
  const loadCol = columns.load;
  const boostCol = columns.boost;
  const targetCol = columns.afr_target;
  const pedalCol = columns.pedal;
  const throttleCol = columns.throttle;

  if (!afrCol) {
    return { actual: null, target: null, lean_events: 0, rich_events: 0, status: 'Safe', note: 'AFR column not found in log.' };
  }

  const toAfr = v => isLambdaAfr ? lambdaToAfr(v) : v;
  const { lean_risk, lean_caution, rich_risk, rich_caution } = thresholds;

  let status = 'Safe';
  let worstLean = null;
  let leanEvents = 0;
  let richEvents = 0;
  const demandAfrSamples = [];
  const targetSamples = [];

  for (const row of rows) {
    const rawAfr = num(row, afrCol);
    if (isNaN(rawAfr)) continue;

    const afr = toAfr(rawAfr);
    if (afr >= FUEL_CUT_AFR) continue;

    const load = num(row, loadCol);
    const boost = normalizeBoostToPsi(num(row, boostCol), boostUnit);
    const pedal = num(row, pedalCol);
    const throttle = num(row, throttleCol);

    // Collect demand AFR samples and target readings only at meaningful load
    if (isDemand(load, boost, pedal, throttle)) {
      demandAfrSamples.push(afr);
      if (targetCol) {
        const rawTarget = num(row, targetCol);
        if (!isNaN(rawTarget)) targetSamples.push(toAfr(rawTarget));
      }
    }

    // Only flag lean/rich at WOT — coasting 18:1+ AFR is intentional fuel cut
    if (isWot(load, boost, pedal, throttle)) {
      if (afr > lean_risk) {
        leanEvents++;
        status = 'Risk';
        if (worstLean === null || afr > worstLean) worstLean = afr;
      } else if (afr > lean_caution && status !== 'Risk') {
        leanEvents++;
        status = 'Caution';
        if (worstLean === null || afr > worstLean) worstLean = afr;
      } else if (afr < rich_risk) {
        richEvents++;
        status = 'Risk';
      } else if (afr < rich_caution && status !== 'Risk') {
        richEvents++;
        status = 'Caution';
      }
    }
  }

  const avgDemandAfr = demandAfrSamples.length
    ? demandAfrSamples.reduce((a, b) => a + b, 0) / demandAfrSamples.length
    : null;

  const avgTarget = targetSamples.length
    ? targetSamples.reduce((a, b) => a + b, 0) / targetSamples.length
    : null;

  // Show worst lean event if one occurred, otherwise avg AFR under demand
  const displayAfr = worstLean ?? avgDemandAfr;

  let note = null;
  if (leanEvents > 0) note = `${leanEvents} lean event(s) at WOT — peak ${roundN(worstLean ?? 0, 2)}:1.`;
  else if (richEvents > 0) note = `${richEvents} rich event(s) at WOT.`;

  return {
    actual: displayAfr !== null ? roundN(displayAfr, 2) : null,
    target: avgTarget !== null ? roundN(avgTarget, 2) : null,
    lean_events: leanEvents,
    rich_events: richEvents,
    status,
    note,
  };
}

// ─── HPFP Analysis ───────────────────────────────────────────────────────────

function analyzeHpfp(rows, columns, boostUnit) {
  const actualCol = columns.hpfp;
  const targetCol = columns.hpfp_target;
  const loadCol = columns.load;
  const boostCol = columns.boost;
  const pedalCol = columns.pedal;
  const throttleCol = columns.throttle;

  if (!actualCol) {
    return { actual: null, target: null, max_drop_pct: null, status: 'Safe', note: 'HPFP column not found in log.' };
  }

  const demandRows = rows.filter(r => {
    const load = num(r, loadCol);
    const boost = normalizeBoostToPsi(num(r, boostCol), boostUnit);
    const pedal = num(r, pedalCol);
    const throttle = num(r, throttleCol);
    return isDemand(load, boost, pedal, throttle);
  });

  const sourceRows = demandRows.length >= 5 ? demandRows : rows;

  const actuals = sourceRows.map(r => num(r, actualCol)).filter(v => !isNaN(v) && v > 0);
  if (actuals.length === 0) {
    return { actual: null, target: null, max_drop_pct: null, status: 'Safe', note: 'No valid HPFP readings during engine demand.' };
  }

  const avgActual = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  const peakActual = Math.max(...actuals);

  let avgTarget = null;
  if (targetCol) {
    const targets = sourceRows.map(r => num(r, targetCol)).filter(v => !isNaN(v) && v > 0);
    if (targets.length) avgTarget = targets.reduce((a, b) => a + b, 0) / targets.length;
  }

  let maxDropPct = 0;

  if (targetCol) {
    // Check the entire log for crashes, but only when target pressure is 
    // high enough (e.g. > 1000 psi) to ignore normal idle fluctuations.
    for (const row of rows) {
      const a = num(row, actualCol);
      const t = num(row, targetCol);
      if (isNaN(a) || isNaN(t) || t <= 1000 || a <= 0) continue;

      const dropPct = ((t - a) / t) * 100;
      if (dropPct > maxDropPct) maxDropPct = dropPct;
    }
  } else {
    for (const a of actuals) {
      const dropPct = ((peakActual - a) / peakActual) * 100;
      if (dropPct > maxDropPct) maxDropPct = dropPct;
    }
  }

  let status = 'Safe';
  let note = null;

  if (maxDropPct >= HPFP_DROP_RISK_PCT) {
    status = 'Risk';
    note = `HPFP dropped ${roundN(maxDropPct, 1)}% below ${avgTarget ? 'target' : 'session peak'} during engine demand.`;
  } else if (maxDropPct >= HPFP_DROP_CAUTION_PCT) {
    status = 'Caution';
    note = `HPFP dipped ${roundN(maxDropPct, 1)}% under load — monitor closely.`;
  }

  return {
    actual: roundN(avgActual, 0),
    target: avgTarget ? roundN(avgTarget, 0) : roundN(peakActual, 0),
    max_drop_pct: roundN(maxDropPct, 1),
    status,
    note,
  };
}

// ─── IAT unit detection ───────────────────────────────────────────────────────

/**
 * Read the IAT unit directly from the column header.
 * BM3/MHD export headers like "Intake Air Temp [°F]" or "IAT [°C]".
 * Returns 'F', 'C', or null when ambiguous (no unit marker in the name).
 */
function detectIatUnit(colName) {
  if (!colName) return null;
  const lower = colName.toLowerCase();
  if (lower.includes('°f') || lower.includes('[f]') || lower.includes('(f)') ||
      lower.includes('_f]') || lower.includes(' f]') || lower.includes('_fahrenheit')) return 'F';
  if (lower.includes('°c') || lower.includes('[c]') || lower.includes('(c)') ||
      lower.includes('_c]') || lower.includes(' c]') || lower.includes('_celsius')) return 'C';
  return null;
}

// ─── IAT Analysis ────────────────────────────────────────────────────────────

function analyzeIat(rows, columns, boostUnit) {
  const iatCol    = columns.iat;
  const loadCol   = columns.load;
  const boostCol  = columns.boost;
  const pedalCol  = columns.pedal;
  const throttleCol = columns.throttle;

  if (!iatCol) {
    return { value: null, unit: 'F', peak_f: null, status: 'Safe', note: 'IAT column not found in log.' };
  }

  const allValues = rows.map(r => num(r, iatCol)).filter(v => !isNaN(v));
  if (allValues.length === 0) {
    return { value: null, unit: 'F', peak_f: null, status: 'Safe', note: 'No valid IAT readings.' };
  }

  // Unit detection — column name is checked first (most reliable).
  // BM3/MHD embed the unit in the header, e.g. "Intake Air Temp [°F]".
  // Pure value-based guessing is used only when the name gives no clue:
  //   - any value > 100 → must be Fahrenheit (100°C = boiling water, impossible for IAT)
  //   - otherwise default Celsius (BMW ECU / MHD export metric by default)
  const colUnit = detectIatUnit(iatCol);
  let likelyCelsius;
  if (colUnit !== null) {
    likelyCelsius = (colUnit === 'C');
  } else {
    likelyCelsius = allValues.every(v => v <= 100);
  }
  const unit = likelyCelsius ? 'C' : 'F';
  const toF  = v => likelyCelsius ? v * 9 / 5 + 32 : v;

  // Filter to demand rows only — same pattern as HPFP.
  // Idle / heat-soak-at-rest readings are excluded so we report what the
  // engine actually sees during a pull, not a traffic-jam soak spike.
  const demandRows = rows.filter(r => {
    const load    = num(r, loadCol);
    const boost   = normalizeBoostToPsi(num(r, boostCol), boostUnit);
    const pedal   = num(r, pedalCol);
    const throttle = num(r, throttleCol);
    return isDemand(load, boost, pedal, throttle);
  });

  // Fall back to all rows if there are too few demand samples
  const sourceValues = demandRows.length >= 5
    ? demandRows.map(r => num(r, iatCol)).filter(v => !isNaN(v))
    : allValues;

  if (sourceValues.length === 0) {
    return { value: null, unit, peak_f: null, status: 'Safe', note: 'No valid IAT readings during engine demand.' };
  }

  const maxRaw = Math.max(...sourceValues);
  const peakF  = roundN(toF(maxRaw), 1);
  const context = demandRows.length >= 5 ? 'under load' : 'session peak';

  let status = 'Safe';
  let note   = null;

  if (peakF >= IAT_RISK_F) {
    status = 'Risk';
    note   = `Peak IAT of ${Math.round(peakF)}°F ${context} exceeds safe operating threshold.`;
  } else if (peakF >= IAT_CAUTION_F) {
    status = 'Caution';
    note   = `Peak IAT of ${Math.round(peakF)}°F ${context} is elevated — consider heat soak risk.`;
  }

  return {
    value:  roundN(maxRaw, 1),
    unit,
    peak_f: peakF,
    status,
    note,
  };
}

// ─── Timing Correction Analysis ──────────────────────────────────────────────

function analyzeTimingCorrections(rows, timingColumns, columns, boostUnit) {
  if (timingColumns.length === 0) {
    return {
      max_correction: null,
      cylinders: 'No timing correction columns found.',
      pull_events: 0,
      status: 'Safe',
      note: null,
    };
  }

  const loadCol = columns.load;
  const boostCol = columns.boost;
  const pedalCol = columns.pedal;
  const throttleCol = columns.throttle;

  let worstDeg = 0;
  let worstCyl = null;
  let pullEvents = 0;

  for (const row of rows) {
    const load = num(row, loadCol);
    const boost = normalizeBoostToPsi(num(row, boostCol), boostUnit);
    const pedal = num(row, pedalCol);
    const throttle = num(row, throttleCol);

    const l = isNaN(load) ? 0 : load;
    const b = isNaN(boost) ? 0 : boost;
    const p = isNaN(pedal) ? NaN : pedal;
    const t = isNaN(throttle) ? NaN : throttle;

    if (!isNaN(p) && p < 1 && (!isNaN(t) ? t < 5 : true)) continue;
    if (l < LOAD_TIMING && b <= BOOST_DEMAND) continue;

    for (const col of timingColumns) {
      const val = num(row, col);
      if (isNaN(val)) continue;
      if (val < worstDeg) {
        worstDeg = val;
        worstCyl = col;
      }
      if (val <= TIMING_CAUTION_DEG) pullEvents++;
    }
  }

  let status = 'Safe';
  if (worstDeg <= TIMING_RISK_DEG) status = 'Risk';
  else if (worstDeg <= TIMING_CAUTION_DEG) status = 'Caution';

  const cylLabel = worstCyl
    ? `${roundN(worstDeg, 1)}° on ${worstCyl}`
    : 'No corrections observed under load';

  return {
    max_correction: roundN(worstDeg, 2),
    cylinders: cylLabel,
    pull_events: pullEvents,
    status,
    note: status !== 'Safe' ? `Worst timing pull under load: ${cylLabel}.` : null,
  };
}

// ─── Chart Data ──────────────────────────────────────────────────────────────

function buildChartData(rows, columns, isLambdaAfr, boostUnit, maxPoints = 150, thresholds, timingColumns = []) {
  const { time: timeCol, afr: afrCol, afr_target: targetCol, boost: boostCol, load: loadCol, pedal: pedalCol, throttle: throttleCol, hpfp: hpfpCol, hpfp_target: hpfpTargetCol } = columns;
  const toAfr = v => isLambdaAfr ? lambdaToAfr(v) : v;
  const { lean_caution } = thresholds;

  // Pre-compute HPFP session peak for fallback when no target column exists
  let hpfpPeak = null;
  if (hpfpCol && !hpfpTargetCol) {
    const actuals = rows.map(r => num(r, hpfpCol)).filter(v => !isNaN(v) && v > 0);
    if (actuals.length) hpfpPeak = Math.max(...actuals);
  }

  // Find the single worst HPFP drop row — only that one point gets flagged on the chart
  let worstHpfpRowIdx = -1;
  if (hpfpCol) {
    let worstDrop = 0;
    for (let j = 0; j < rows.length; j++) {
      const a = num(rows[j], hpfpCol);
      if (isNaN(a) || a <= 0) continue;
      let dropPct = 0;
      if (hpfpTargetCol) {
        const t = num(rows[j], hpfpTargetCol);
        if (!isNaN(t) && t > 1000) dropPct = ((t - a) / t) * 100;
      } else if (hpfpPeak !== null) {
        dropPct = ((hpfpPeak - a) / hpfpPeak) * 100;
      }
      if (dropPct > worstDrop) { worstDrop = dropPct; worstHpfpRowIdx = j; }
    }
    // Only mark if it actually crossed the risk threshold
    if (worstDrop < HPFP_DROP_RISK_PCT) worstHpfpRowIdx = -1;
  }

  const step = Math.max(1, Math.floor(rows.length / maxPoints));
  const chartData = [];

  for (let i = 0; i < rows.length; i += step) {
    const row = rows[i];
    const rawAfr = num(row, afrCol);
    const rawTarget = num(row, targetCol);
    const rawBoost = num(row, boostCol);
    const rawTime = num(row, timeCol);

    const boostPsi = normalizeBoostToPsi(rawBoost, boostUnit);

    const afrParsed = !isNaN(rawAfr) ? toAfr(rawAfr) : NaN;
    const afrDisplay = (!isNaN(afrParsed) && afrParsed < FUEL_CUT_AFR)
      ? roundN(afrParsed, 2)
      : undefined;

    let isLeanWarning = false;
    // Only the downsampled chunk that contains the single worst HPFP row gets flagged
    const isHpfpWarning = worstHpfpRowIdx >= i && worstHpfpRowIdx < i + step;
    let isTimingWarning = false;

    // Scan all rows in this downsample chunk so we don't skip critical warnings
    for (let j = i; j < i + step && j < rows.length; j++) {
      const r = rows[j];
      const l = num(r, loadCol);
      const p = num(r, pedalCol);
      const th = num(r, throttleCol);
      const bPsi = normalizeBoostToPsi(num(r, boostCol), boostUnit);

      if (!isLeanWarning) {
        const a = toAfr(num(r, afrCol));
        if (isWot(l, bPsi, p, th) && a > lean_caution) isLeanWarning = true;
      }

      // HPFP: handled outside the inner loop — only the worst row's chunk is flagged

      if (!isTimingWarning && timingColumns.length > 0) {
        const pl = isNaN(p) ? NaN : p;
        const pth = isNaN(th) ? NaN : th;
        if ((isNaN(pl) || pl >= 1 || (isNaN(pth) || pth >= 5)) && (l >= LOAD_TIMING || bPsi > BOOST_DEMAND)) {
          for (const col of timingColumns) {
            const pull = num(r, col);
            if (!isNaN(pull) && pull <= -3) isTimingWarning = true;
          }
        }
      }
    }

    chartData.push({
      time: !isNaN(rawTime) ? roundN(rawTime, 2) : String(i),
      afrActual: afrDisplay,
      afrTarget: !isNaN(rawTarget) ? roundN(toAfr(rawTarget), 2) : undefined,
      boost: !isNaN(boostPsi) ? roundN(boostPsi, 1) : undefined,
      isLeanWarning,
      isHpfpWarning,
      isTimingWarning
    });
  }

  return chartData;
}

// ─── Key Points ──────────────────────────────────────────────────────────────

function buildKeyPoints(afr, hpfp, iat, timing, carDetails) {
  const points = [];
  const ethanol = Number(carDetails.ethanol) || 10;
  const engine = carDetails.engine || 'B58';
  const thresholds = getAfrThresholds(ethanol);

  // AFR context
  if (afr.actual !== null) {
    const verdictText =
      afr.status === 'Safe' ? 'well within safe range.'
        : afr.status === 'Caution' ? 'slightly lean — monitor for lean events and consider a tune revision.'
          : 'dangerously lean — stop high-load driving and review the tune immediately.';
    points.push(
      `For E${ethanol} fuel, stoichiometric AFR is ~${thresholds.stoich}:1. ` +
      `WOT average in this log: ${afr.actual}:1 — ${verdictText}`
    );
  } else if (afr.note?.includes('not found')) {
    points.push('No AFR column detected — verify your export includes lambda or AFR data.');
  }

  // HPFP context
  if (hpfp.actual !== null) {
    const isHighEthanol = ethanol >= 40;
    if (hpfp.status !== 'Safe') {
      const fuelNote = isHighEthanol
        ? `High-ethanol blends demand higher fuel flow — ensure your LPFP (low-side pump) is upgraded for E${ethanol}.`
        : `Check LPFP health, fuel filter condition, and HPFP cam lobe wear.`;
      points.push(
        `HPFP averaged ${hpfp.actual} psi under load with a ${hpfp.max_drop_pct}% drop vs target. ${fuelNote}`
      );
    } else if (isHighEthanol) {
      points.push(
        `HPFP at ${hpfp.actual} psi under load — acceptable for E${ethanol}. ` +
        `If you increase ethanol further, confirm your LPFP can support the higher flow demand.`
      );
    }
  }

  // Timing context
  if (timing.max_correction !== null && timing.max_correction < TIMING_CAUTION_DEG) {
    const isHighEthanol = ethanol >= 30;
    const pullNote = isHighEthanol
      ? `On E${ethanol}, knock retard is unexpected — check for heat soak, misfires, or a faulty knock sensor.`
      : `On E${ethanol}, consider raising ethanol content or adding water-methanol injection to reduce knock sensitivity.`;
    points.push(`Timing correction of ${timing.max_correction}° under load. ${pullNote}`);
  }

  // IAT context
  if (iat.value !== null && iat.status !== 'Safe') {
    const intercoolerNote =
      engine.includes('S58') ? 'The S58 generates significant heat — an upgraded charge cooler is strongly recommended.' :
        engine.includes('N55') || engine.includes('N54') ? 'N-series engines benefit from an upgraded FMIC at sustained high IAT.' :
          'A front-mount intercooler (FMIC) or upgraded top-mount will help significantly.';
    points.push(`Peak IAT of ${iat.peak_f}°F indicates heat soak. ${intercoolerNote}`);
  }

  return points;
}

// ─── Main Entry ──────────────────────────────────────────────────────────────

/**
 * @param {string} csvText     — file contents as a plain string (from FileReader)
 * @param {string} filename
 * @param {object} carDetails  — { ethanol, engine, tuneStage } from the UI form
 * @returns {object} Structured analysis result
 */
export function analyzeLog(csvText, filename, carDetails = {}) {
  const { rows, columns, timingColumns, boostUnit } = parseCsv(csvText);

  const sampleAfrs = rows
    .slice(0, 30)
    .map(r => num(r, columns.afr))
    .filter(v => !isNaN(v));
  const isLambdaAfr = sampleAfrs.length > 0 && sampleAfrs.every(v => v < 3.0);

  const thresholds = getAfrThresholds(carDetails.ethanol);

  const afr = analyzeAfr(rows, columns, isLambdaAfr, thresholds, boostUnit);
  const hpfp = analyzeHpfp(rows, columns, boostUnit);
  const iat = analyzeIat(rows, columns, boostUnit);
  const timing = analyzeTimingCorrections(rows, timingColumns, columns, boostUnit);
  const overall = worstStatus(afr.status, hpfp.status, iat.status, timing.status);

  const keyPoints = buildKeyPoints(afr, hpfp, iat, timing, carDetails);

  return {
    filename,
    row_count: rows.length,
    status: overall,
    carDetails,
    metrics: {
      afr,
      hpfp,
      iat,
      timingCorrections: timing,
    },
    chartData: buildChartData(rows, columns, isLambdaAfr, boostUnit, 150, thresholds, timingColumns),
    keyPoints,
    summary: {
      afr_status: afr.status,
      hpfp_status: hpfp.status,
      iat_status: iat.status,
      timing_status: timing.status,
      overall_safety_score: overall,
      notes: [afr.note, hpfp.note, iat.note, timing.note].filter(Boolean),
    },
  };
}
