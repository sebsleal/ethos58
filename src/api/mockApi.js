/**
 * API client for Ethos85.
 * Calls the Express backend; maps field names between the UI (camelCase)
 * and the server (snake_case per API spec).
 */

const BASE = '/api';
const TIMEOUT_MS = 15_000; // 15 s — prevents silently hung requests

/**
 * fetch() wrapper that rejects after TIMEOUT_MS with a clear error message.
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — is the API server running? (npm run server)');
    }
    throw new Error(`Network error: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // POST /api/calculate-blend
  calculateBlend: async ({ currentFuel, currentE, targetE, tankSize, precisionMode }) => {
    const res = await fetchWithTimeout(`${BASE}/calculate-blend`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        current_gallons:         currentFuel,
        current_ethanol_percent: currentE,
        target_ethanol_percent:  targetE,
        tank_size:               tankSize,
        precision_mode:          precisionMode,
      }),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const d = json.data;
    return {
      success: true,
      data: {
        e85Gallons:          d.gallons_of_e85_to_add,
        pumpGallons:         d.gallons_of_93_to_add,
        resultingBlend:      d.resulting_percent,
        precisionModeActive: d.precision_mode,
        fillSteps:           d.fill_steps   ?? null,
        precisionNote:       d.precision_note ?? null,
        warnings:            d.warnings,
      },
    };
  },

  // POST /api/analyze-log
  analyzeLog: async (file, carDetails = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('car_details', JSON.stringify(carDetails));

    const res = await fetchWithTimeout(`${BASE}/analyze-log`, {
      method: 'POST',
      body:   formData,
      // Do NOT set Content-Type — browser sets it with the correct multipart boundary
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    return { success: true, data: json.data };
  },
};
