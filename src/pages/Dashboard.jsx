import { ArrowRight, Activity, Droplet, FileText, Settings2, Zap, MonitorPlay } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dashboard Title & Top section */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Overview of your analysis tools and recent logs.</p>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Log History & Quick Drop */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Quick Drop Card */}
          <SectionPanel title="Quick Start" icon={Zap}>
            <Link to="/viewer" className="flex flex-col items-center justify-center h-48 mt-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors text-gray-500 dark:text-zinc-400 cursor-pointer group">
              <FileText size={32} className="mb-3 opacity-50 group-hover:opacity-80 group-hover:text-brand-500 transition-colors" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Log Viewer</p>
              <p className="text-xs mt-1">Analyze a BM3 or MHD CSV</p>
            </Link>
          </SectionPanel>

          {/* Bottom Grid: Reports and Performance */}
          <div className="grid grid-cols-1 gap-6">
            {/* Reports List Card */}
            <SectionPanel title="Recently Analyzed Logs" icon={FileText}>
              <div className="flex flex-col items-center justify-center h-24 mt-4 rounded-lg border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 text-gray-500 dark:text-zinc-500">
                <p className="text-xs font-medium">No logs analyzed yet.</p>
              </div>
            </SectionPanel>
          </div>

        </div>

        {/* Right Column: Analytics, Profile, Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Profile/Status Card */}
          <SectionPanel title="Active Blend" icon={Droplet}>
            <div className="flex items-center gap-4 mt-2 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500 font-medium text-lg">
                —
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">None Active</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Calculate blend to view</p>
              </div>
            </div>

            <Link to="/settings" className="flex items-center justify-center w-full py-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/80 text-gray-900 dark:text-white rounded-lg shadow-sm text-sm font-medium transition-colors gap-2">
              <Settings2 size={16} strokeWidth={1.5} />
              Configure Target
            </Link>
          </SectionPanel>

          {/* Quick Actions Card */}
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

// Reusable Basic Panel
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
