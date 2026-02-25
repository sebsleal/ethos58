import React, { useState } from 'react';
import { UploadCloud, Activity, AlertTriangle, CheckCircle, BarChart2, XCircle, Lightbulb, Info } from 'lucide-react';
import { api } from '../api/mockApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceDot } from 'recharts';

const ETHANOL_OPTIONS = [0, 10, 30, 40, 50, 85];
const ENGINE_OPTIONS = ['B58 Gen1', 'B58 Gen2', 'S58', 'N55', 'N54', 'Other'];
const TUNE_OPTIONS = ['Stage 1', 'Stage 2', 'Stage 2+', 'Custom E-tune'];

const LogAnalyzer = () => {
  const [carDetails, setCarDetails] = useState({ ethanol: 10, engine: 'B58 Gen1', tuneStage: 'Stage 1' });
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const unitPref = localStorage.getItem('ethos_units') || 'US';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = async (file) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await api.analyzeLog(file, carDetails);
      setAnalysis(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setAnalysis(null); setError(null); };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Safe': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Caution': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Risk': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Safe': return <CheckCircle size={18} className="text-green-400" />;
      case 'Caution': return <AlertTriangle size={18} className="text-yellow-400" />;
      case 'Risk': return <AlertTriangle size={18} className="text-red-400" />;
      default: return null;
    }
  };

  const AfrWarningDot = (props) => {
    const { cx = 0, cy = 0, payload } = props;
    if (!payload?.isLeanWarning) return <circle r={0} fill="none" />;
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill="#f43f5e" opacity={0.35} className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
        <circle cx={cx} cy={cy} r={3.5} fill="#f43f5e" stroke="#111113" strokeWidth={1.5} />
      </g>
    );
  };

  const BoostWarningDot = (props) => {
    const { cx = 0, cy = 0, payload } = props;
    if (payload?.isHpfpWarning) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} fill="#f97316" opacity={0.35} className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
          <circle cx={cx} cy={cy} r={3.5} fill="#f97316" stroke="#111113" strokeWidth={1.5} />
        </g>
      );
    }
    if (payload?.isTimingWarning) {
      return <circle cx={cx} cy={cy} r={3.5} fill="#eab308" stroke="#111113" strokeWidth={1.5} />;
    }
    return <circle r={0} fill="none" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Activity className="text-brand-400" size={32} />
            Log Analyzer
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-2 py-0.5 rounded-full ml-1">
              Beta Models
            </span>
          </h1>
          <p className="text-gray-400 dark:text-gray-400 mt-2">Upload BM3 or MHD CSV datalogs for instant health analysis.</p>
          <div className="flex items-center gap-2 mt-3 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10 px-3 py-2 rounded-lg">
            <AlertTriangle size={16} className="shrink-0" />
            <p><strong>Heads up:</strong> Analysis models are currently being trained. Information provided may be inaccurate.</p>
          </div>
        </div>

        {analysis && (
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-400 bg-white dark:bg-surface-200 border border-gray-200 dark:border-white/5 px-3 py-1.5 rounded-md">
              {analysis.carDetails?.engine || 'B58'} · E{analysis.carDetails?.ethanol ?? 10} · {analysis.carDetails?.tuneStage || 'Stage 1'}
            </span>
            <div className={`px-4 py-1.5 rounded-md border flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${getStatusColor(analysis.status)}`}>
              {getStatusIcon(analysis.status)}
              {analysis.status}
            </div>
          </div>
        )}
      </header>

      {/* Car details card & Upload area */}
      {!analysis && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-surface-200 border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm dark:shadow-none h-fit">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-5">Vehicle Profile</h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide">Engine</label>
                  <div className="group relative flex items-center">
                    <Info size={14} className="text-gray-400 dark:text-gray-500 cursor-help hover:text-brand-500 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] leading-tight rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg text-center font-medium">
                      Different engines have varying heat tolerances and HPFP capacities. This sets the baseline for the analysis.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-gray-900 dark:border-t-white"></div>
                    </div>
                  </div>
                </div>
                <select
                  value={carDetails.engine}
                  onChange={e => setCarDetails(prev => ({ ...prev, engine: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-surface-300 border border-gray-300 dark:border-white/10 focus:border-brand-500 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-sm outline-none transition-colors"
                >
                  {ENGINE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide">Tune Stage</label>
                  <div className="group relative flex items-center">
                    <Info size={14} className="text-gray-400 dark:text-gray-500 cursor-help hover:text-brand-500 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] leading-tight rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg text-center font-medium">
                      Higher stages push boost targets further, so the analyzer expects higher engine load and adjusted scaling.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-gray-900 dark:border-t-white"></div>
                    </div>
                  </div>
                </div>
                <select
                  value={carDetails.tuneStage}
                  onChange={e => setCarDetails(prev => ({ ...prev, tuneStage: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-surface-300 border border-gray-300 dark:border-white/10 focus:border-brand-500 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-sm outline-none transition-colors"
                >
                  {TUNE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide">Fuel Mix</label>
                  <div className="group relative flex items-center">
                    <Info size={14} className="text-gray-400 dark:text-gray-500 cursor-help hover:text-brand-500 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] leading-tight rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg text-center font-medium">
                      Ethanol changes the stoichiometric AFR ratio (e.g. E40 drops stoich to ~12.4). Used to calculate lean/rich safety limits.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-gray-900 dark:border-t-white"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {ETHANOL_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setCarDetails(prev => ({ ...prev, ethanol: e }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all
                        ${carDetails.ethanol === e
                          ? 'bg-slate-900 dark:bg-brand-500 text-white dark:text-slate-900 shadow-md'
                          : 'bg-gray-50 dark:bg-surface-300 border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-brand-500/50 hover:bg-gray-100 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                      E{e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 h-full">
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle size={20} className="text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">Analysis Failed</p>
                    <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
                  </div>
                </div>
                <button onClick={reset} className="text-xs font-medium text-red-400 hover:text-red-300 border border-red-400/30 px-3 py-1.5 rounded-md">Dismiss</button>
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-xl h-full min-h-[300px] flex flex-col items-center justify-center transition-colors relative overflow-hidden group
                ${dragActive ? 'border-brand-500 bg-brand-500/5' : 'border-gray-300 dark:border-white/10 bg-white dark:bg-surface-200 hover:bg-surface-200/80 hover:border-gray-400 dark:hover:border-white/20'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-surface-300 border border-gray-200 dark:border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud size={32} className={dragActive ? 'text-brand-400' : 'text-gray-400 dark:text-gray-400'} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Drag & Drop Datalog CSV</h3>
              <p className="text-gray-400 dark:text-gray-500 mt-1 text-sm text-center max-w-sm">
                Supports MHD and bootmod3 exported CSV files.
              </p>

              <label className="mt-6 cursor-pointer bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 text-gray-800 dark:text-gray-200 px-5 py-2 rounded-md text-sm font-medium transition-all relative z-10">
                Browse Files
                <input type="file" className="hidden" accept=".csv,text/csv,text/plain,application/vnd.ms-excel" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="bg-white dark:bg-surface-200 rounded-xl p-16 flex flex-col items-center justify-center border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none min-h-[400px]">
          <div className="w-12 h-12 border-2 border-gray-300 dark:border-white/10 border-t-brand-400 rounded-full animate-spin" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">Analyzing Telemetry...</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-1 text-sm">Checking AFR, HPFP targets, and timing corrections.</p>
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary notes */}
          {analysis.summary?.notes?.length > 0 && (
            <div className="space-y-2">
              {analysis.summary.notes.map((note, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${getStatusColor(analysis.status)}`}>
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  {note}
                </div>
              ))}
            </div>
          )}

          {/* Metric boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricBox
              title="AFR (Air/Fuel)"
              value={analysis.metrics.afr.actual ?? '—'}
              target={analysis.metrics.afr.target ? `Target: ${analysis.metrics.afr.target}` : 'WOT avg'}
              status={analysis.metrics.afr.status}
            />
            <MetricBox
              title="HPFP"
              value={analysis.metrics.hpfp.actual != null ? `${analysis.metrics.hpfp.actual} psi` : '—'}
              target={analysis.metrics.hpfp.target != null ? `Target: ${analysis.metrics.hpfp.target} psi` : 'No data'}
              status={analysis.metrics.hpfp.status}
            />
            <MetricBox
              title="Intake Air Temp"
              value={analysis.metrics.iat.peak_f != null
                ? `${Math.round(unitPref === 'Metric' ? (analysis.metrics.iat.peak_f - 32) * 5 / 9 : analysis.metrics.iat.peak_f)}°${unitPref === 'Metric' ? 'C' : 'F'}`
                : '—'}
              target="Peak value"
              status={analysis.metrics.iat.status}
            />
            <MetricBox
              title="Timing Corrections"
              value={analysis.metrics.timingCorrections.max_correction != null
                ? `${analysis.metrics.timingCorrections.max_correction}°`
                : '—'}
              target={analysis.metrics.timingCorrections.cylinders}
              status={analysis.metrics.timingCorrections.status}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Insights */}
            {analysis.keyPoints?.length > 0 && (
              <div className="lg:col-span-1 bg-white dark:bg-surface-200 border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm dark:shadow-none h-fit">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-5 uppercase tracking-wide">
                  <Lightbulb className="text-brand-400" size={18} />
                  Key Insights
                </h2>
                <ul className="space-y-4">
                  {analysis.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-surface-200 border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
                  <BarChart2 className="text-brand-400" size={18} />
                  Telemetry Graph (AFR & Boost)
                </h2>
                <button onClick={reset} className="text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-md transition-colors">
                  Upload New Log
                </button>
              </div>

              {/* Event marker legend */}
              {(analysis.metrics.afr.lean_events > 0 || analysis.metrics.hpfp.status !== 'Safe' || analysis.metrics.timingCorrections.status !== 'Safe') && (
                <div className="flex flex-wrap gap-3 mb-3 text-[11px] font-medium">
                  {analysis.metrics.afr.lean_events > 0 && (
                    <span className="flex items-center gap-1.5 text-red-400">
                      <span className="relative flex w-3 h-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50" />
                        <span className="relative inline-flex rounded-full w-3 h-3 bg-red-500" />
                      </span>
                      Lean warning
                    </span>
                  )}
                  {analysis.metrics.hpfp.status !== 'Safe' && (
                    <span className="flex items-center gap-1.5 text-orange-400">
                      <span className="relative flex w-3 h-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-50" />
                        <span className="relative inline-flex rounded-full w-3 h-3 bg-orange-500" />
                      </span>
                      HPFP drop
                    </span>
                  )}
                  {analysis.metrics.timingCorrections.status !== 'Safe' && (
                    <span className="flex items-center gap-1.5 text-yellow-400">
                      <span className="inline-flex rounded-full w-3 h-3 bg-yellow-500" />
                      Timing pull
                    </span>
                  )}
                </div>
              )}

              <div className="h-[350px] w-full bg-gray-50/50 dark:bg-surface-300/30 rounded-lg p-2 border border-gray-200 dark:border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717A" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#71717A" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" stroke="#71717A" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#F4F4F5', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                      itemStyle={{ color: '#F4F4F5' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="afrActual" stroke="#14b8a6" name="AFR Actual" strokeWidth={2} dot={AfrWarningDot} connectNulls={false} />
                    <Line yAxisId="left" type="monotone" dataKey="afrTarget" stroke="#f43f5e" name="AFR Target" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} />
                    <Line yAxisId="right" type="monotone" dataKey="boost" stroke="#3b82f6" name="Boost (psi)" strokeWidth={2} dot={BoostWarningDot} connectNulls={false} />

                    {/* Single worst HPFP drop — one vertical line + one dot */}
                    {(() => {
                      const pt = analysis.chartData.find(p => p.isHpfpWarning);
                      if (!pt) return null;
                      return <>
                        <ReferenceLine x={pt.time} yAxisId="left"
                          stroke="#f97316" strokeWidth={1.5} strokeOpacity={0.8} strokeDasharray="4 3"
                          label={{ value: 'HPFP ↓', fill: '#f97316', fontSize: 9, fontWeight: 700, position: 'insideTopLeft', dy: -2 }}
                        />
                        {pt.afrActual != null && (
                          <ReferenceDot x={pt.time} y={pt.afrActual} yAxisId="left"
                            r={5} fill="#f97316" stroke="#111113" strokeWidth={2}
                          />
                        )}
                      </>;
                    })()}

                    {/* Lean AFR markers */}
                    {analysis.chartData.reduce((acc, pt, i, arr) => {
                      if (pt.isLeanWarning && (i === 0 || !arr[i - 1].isLeanWarning)) acc.push(pt.time);
                      return acc;
                    }, []).map(t => (
                      <ReferenceLine key={`lean-${t}`} x={t} yAxisId="left"
                        stroke="#f43f5e" strokeWidth={1.5} strokeOpacity={0.75} strokeDasharray="4 3"
                        label={{ value: 'Lean', fill: '#f43f5e', fontSize: 9, fontWeight: 700, position: 'insideTopLeft', dy: -2 }}
                      />
                    ))}

                    {/* Timing pull markers */}
                    {analysis.chartData.reduce((acc, pt, i, arr) => {
                      if (pt.isTimingWarning && (i === 0 || !arr[i - 1].isTimingWarning)) acc.push(pt.time);
                      return acc;
                    }, []).map(t => (
                      <ReferenceLine key={`timing-${t}`} x={t} yAxisId="left"
                        stroke="#eab308" strokeWidth={1.5} strokeOpacity={0.75} strokeDasharray="4 3"
                        label={{ value: 'Pull', fill: '#eab308', fontSize: 9, fontWeight: 700, position: 'insideTopLeft', dy: -2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricBox = ({ title, value, target, status }) => {
  const getStatusColor = (s) => {
    if (s === 'Safe') return 'text-green-400';
    if (s === 'Caution') return 'text-yellow-400';
    if (s === 'Risk') return 'text-red-400';
    return 'text-gray-400 dark:text-gray-400';
  };

  const getStatusBgColor = (s) => {
    if (s === 'Safe') return 'bg-green-500/10 border-green-500/20';
    if (s === 'Caution') return 'bg-yellow-500/10 border-yellow-500/20';
    if (s === 'Risk') return 'bg-red-500/10 border-red-500/20';
    return 'bg-gray-50 dark:bg-surface-300 border-gray-200 dark:border-white/5';
  };

  return (
    <div className="bg-white dark:bg-surface-200 border border-gray-200 dark:border-white/5 rounded-xl p-5 shadow-sm dark:shadow-none relative overflow-hidden">
      <div className="flex justify-between items-start mb-2 relative z-10">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBgColor(status)} ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 relative z-10">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 relative z-10">{target}</p>
    </div>
  );
};

export default LogAnalyzer;
