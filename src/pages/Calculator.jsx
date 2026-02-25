import { useState } from 'react';
import { api } from '../api/mockApi';
import { Droplet, Info, Settings2, AlertTriangle, ListOrdered } from 'lucide-react';

const Calculator = () => {
  const [formData, setFormData] = useState({
    currentFuel: 5.0,
    currentE: 10,
    targetE: 40,
    tankSize: 13.7,
  });
  const [precisionMode, setPrecisionMode] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || '' }));
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.calculateBlend({ ...formData, precisionMode });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 flex items-center gap-3">
          <Droplet className="text-brand-500" size={26} />
          Ethanol Blend Calculator
        </h1>
        <p className="text-slate-500 dark:text-gray-400 mt-1.5 text-sm">Dial in your precise E-mix for your B58 tune.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-gray-100">Parameters</h2>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 block">Precision Mode</span>
                {precisionMode && <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">staged fill</span>}
              </div>
              <button
                onClick={() => setPrecisionMode(!precisionMode)}
                className={`w-10 h-5 rounded-full transition-colors relative ${precisionMode ? 'bg-brand-500' : 'bg-slate-200 dark:bg-zinc-700'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform shadow-sm dark:shadow-none ${precisionMode ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <InputGroup label="Current Fuel in Tank (Gal)" name="currentFuel" value={formData.currentFuel} onChange={handleChange} step="0.1" />
            <InputGroup label="Current Ethanol %" name="currentE" value={formData.currentE} onChange={handleChange} step="1" />
            <InputGroup label="Target Ethanol %" name="targetE" value={formData.targetE} onChange={handleChange} step="1" />
            <InputGroup label="Tank Capacity (Gal)" name="tankSize" value={formData.tankSize} onChange={handleChange} step="0.1" />
          </div>

          <button
            onClick={calculate}
            disabled={loading}
            className="w-full mt-8 bg-slate-900 dark:bg-brand-500 hover:bg-slate-800 dark:hover:bg-brand-400 text-white py-3 rounded-xl font-bold tracking-wide transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm dark:shadow-none"
          >
            {loading ? 'CALCULATING...' : 'CALCULATE BLEND'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col">
          <h2 className="text-base font-bold text-slate-900 dark:text-gray-100 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">Mix Instructions</h2>

          {result ? (
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {/* E85 card */}
              <div className="bg-brand-50 dark:bg-brand-500/5 border border-brand-200 dark:border-brand-500/20 p-5 rounded-2xl flex justify-between items-center group hover:border-brand-300 dark:hover:border-brand-500/40 transition-colors">
                <div>
                  <p className="text-brand-600 dark:text-brand-400 text-xs uppercase tracking-wider font-bold mb-1">Add E85</p>
                  <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                    {result.e85Gallons} <span className="text-base text-slate-400 dark:text-gray-500 font-medium">gal</span>
                  </p>
                </div>
                <Droplet size={36} className="text-brand-300 dark:text-brand-500/30 group-hover:text-brand-400 dark:group-hover:text-brand-500/50 transition-colors" />
              </div>

              {/* Premium card */}
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                <div>
                  <p className="text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Add Premium (91/93)</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-gray-100">
                    {result.pumpGallons} <span className="text-base text-slate-400 dark:text-gray-500 font-medium">gal</span>
                  </p>
                </div>
                <Droplet size={36} className="text-slate-300 dark:text-gray-700 group-hover:text-slate-400 dark:group-hover:text-gray-600 transition-colors" />
              </div>

              {/* Resulting blend */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
                <p className="text-center text-slate-500 dark:text-gray-400 flex items-center justify-center gap-2 text-sm">
                  <Info size={15} /> Estimated Resulting Blend:{' '}
                  <span className="text-slate-900 dark:text-gray-100 font-bold text-lg">E{result.resultingBlend}</span>
                </p>
              </div>

              {/* Precision mode staged fill */}
              {result.precisionModeActive && result.fillSteps && (
                <div className="mt-2 bg-brand-50 dark:bg-brand-500/5 border border-brand-200 dark:border-brand-500/20 rounded-2xl p-4">
                  <p className="text-brand-600 dark:text-brand-400 text-sm font-bold flex items-center gap-2 mb-3">
                    <ListOrdered size={15} /> Staged Fill Steps
                  </p>
                  <div className="space-y-3">
                    {result.fillSteps.map(step => (
                      <div key={step.step} className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {step.step}
                        </span>
                        <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{step.note}</p>
                      </div>
                    ))}
                  </div>
                  {result.precisionNote && (
                    <p className="text-slate-400 dark:text-gray-500 text-xs mt-4 italic">{result.precisionNote}</p>
                  )}
                </div>
              )}

              {/* Warnings */}
              {result.warnings?.length > 0 && (
                <div className="space-y-2 mt-2">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl text-yellow-700 dark:text-yellow-500 text-sm">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-gray-600 space-y-4 py-12">
              <Settings2 size={44} className="opacity-40" />
              <p className="text-sm text-slate-400 dark:text-gray-500">Enter parameters and calculate to see mix instructions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, name, value, onChange, step }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      step={step}
      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 focus:border-brand-400 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-400/30 dark:focus:ring-brand-500/30 rounded-xl px-4 py-2.5 text-slate-900 dark:text-gray-100 text-sm outline-none transition-all placeholder-slate-300 dark:placeholder-gray-600"
      placeholder="0.0"
    />
  </div>
);

export default Calculator;
