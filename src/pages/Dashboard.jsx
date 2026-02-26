import { useState, useEffect } from 'react';
import { ArrowRight, Activity, Droplet, FileText, Settings2, Zap, MonitorPlay, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getRecentLogs, clearRecentLogs, getActiveBlend, clearActiveBlend, getLogResult } from '../utils/storage';

const STATUS_ICON = {
  Safe:    <CheckCircle size={14} className="text-green-400" />,
  Caution: <AlertTriangle size={14} className="text-yellow-400" />,
  Risk:    <AlertTriangle size={14} className="text-red-400" />,
};

const STATUS_COLOR = {
  Safe:    'text-green-400 bg-green-500/10 border-green-500/20',
  Caution: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Risk:    'text-red-400 bg-red-500/10 border-red-500/20',
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const Dashboard = () => {
  const [recentLogs, setRecentLogs] = useState([]);
  const [activeBlend, setActiveBlend] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRecentLogs(getRecentLogs());
    setActiveBlend(getActiveBlend());
  }, []);

  const handleClearLogs = () => {
    clearRecentLogs();
    setRecentLogs([]);
  };

  const handleClearBlend = () => {
    clearActiveBlend();
    setActiveBlend(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Overview of your analysis tools and recent logs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Quick Start */}
          <SectionPanel title="Quick Start" icon={Zap}>
            <Link to="/viewer" className="flex flex-col items-center justify-center h-48 mt-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors text-gray-500 dark:text-zinc-400 cursor-pointer group">
              <FileText size={32} className="mb-3 opacity-50 group-hover:opacity-80 group-hover:text-brand-500 transition-colors" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Log Viewer</p>
              <p className="text-xs mt-1">Analyze a BM3 or MHD CSV</p>
            </Link>
          </SectionPanel>

          {/* Recently Analyzed Logs */}
          <SectionPanel
            title="Recently Analyzed Logs"
            icon={FileText}
            action={recentLogs.length > 0 && (
              <button onClick={handleClearLogs} className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-red-400 transition-colors">
                <Trash2 size={12} /> Clear
              </button>
            )}
          >
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 mt-4 rounded-lg border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 text-gray-500 dark:text-zinc-500">
                <p className="text-xs font-medium">No logs analyzed yet.</p>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {recentLogs.map(log => (
                  <button
                    key={log.id}
                    onClick={() => {
                      const result = getLogResult(log.id);
                      navigate('/analyzer', result ? { state: { analysis: result } } : {});
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800 hover:border-brand-500/30 transition-colors group text-left w-full"
                  >
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase shrink-0 ${STATUS_COLOR[log.status] || STATUS_COLOR.Safe}`}>
                      {STATUS_ICON[log.status]}
                      {log.status}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{log.filename}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{log.engine} · E{log.ethanol} · {formatDate(log.date)}</p>
                    </div>
                    {log.afr && <p className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">AFR {log.afr}</p>}
                    <ArrowRight size={14} className="text-gray-300 dark:text-zinc-600 group-hover:text-brand-400 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </SectionPanel>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Active Blend */}
          <SectionPanel
            title="Active Blend"
            icon={Droplet}
            action={activeBlend && (
              <button onClick={handleClearBlend} className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-red-400 transition-colors">
                <Trash2 size={12} /> Clear
              </button>
            )}
          >
            {activeBlend ? (
              <div className="mt-2 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 font-bold text-sm">
                    E{activeBlend.resultingBlend}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">E{activeBlend.resultingBlend} Blend</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatDate(activeBlend.date)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-brand-50 dark:bg-brand-500/5 border border-brand-200 dark:border-brand-500/20 rounded-lg p-2 text-center">
                    <p className="text-brand-600 dark:text-brand-400 font-bold text-base">{activeBlend.e85Gallons} gal</p>
                    <p className="text-gray-500 dark:text-zinc-400">E85</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-lg p-2 text-center">
                    <p className="text-gray-800 dark:text-white font-bold text-base">{activeBlend.pumpGallons} gal</p>
                    <p className="text-gray-500 dark:text-zinc-400">93 Oct</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-2 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500 font-medium text-lg">—</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">None Active</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Calculate blend to view</p>
                </div>
              </div>
            )}
            <Link to="/calculator" className="flex items-center justify-center w-full py-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/80 text-gray-900 dark:text-white rounded-lg shadow-sm text-sm font-medium transition-colors gap-2">
              <Settings2 size={16} strokeWidth={1.5} />
              {activeBlend ? 'Recalculate' : 'Configure Target'}
            </Link>
          </SectionPanel>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 dark:text-zinc-500 uppercase px-1 mt-2">Quick Actions</h2>
            <Link to="/calculator" className="flex items-center gap-3 w-full p-3 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl shadow-sm hover:border-brand-500/50 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all group">
              <div className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 p-2 rounded-lg border border-brand-100 dark:border-brand-500/20">
                <Droplet size={16} strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Calculate Content</span>
              <ArrowRight size={16} className="ml-auto text-gray-400 dark:text-zinc-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
            </Link>
            <Link to="/viewer" className="flex items-center gap-3 w-full p-3 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all group">
              <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 p-2 rounded-lg border border-gray-200 dark:border-zinc-700">
                <MonitorPlay size={16} strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors">View Data Log</span>
              <ArrowRight size={16} className="ml-auto text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

const SectionPanel = ({ title, icon: Icon, action, children }) => (
  <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
        {Icon && <Icon size={16} className="text-gray-500 dark:text-zinc-400" strokeWidth={1.5} />}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
    {children}
  </div>
);

export default Dashboard;
