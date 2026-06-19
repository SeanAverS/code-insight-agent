import React from 'react';
import { Layout, Activity, MessageSquareCode } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CodeDiffView from './components/CodeLineLogic';
import CodeView from './components/CodeView';
import FileLengthChart from './components/FileLengthChart';
import Sidebar from './Sidebar';
import { useDashboardData } from './hooks/useDashboardData';

export default function ScoutDashboard() {
  const { data, isAgentConnected } = useDashboardData();
  const hasChanges = data?.proposedCode && data.proposedCode !== data.currentCode;

  // handle ui display when navigating up a directory 
  const handleNavigateUp = () => {
    const currentFolder = data?.activeFile ? data.activeFile.replace(/\/$/, '') : '';
    if (!currentFolder || currentFolder === '.' || currentFolder === './') return;

    fetch('/api/select-dir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath: currentFolder, goUp: true }),
    })
    .catch(err => console.error("Error navigating up a directory:", err));
  };

  // handle ui display when clicking on a file 
  const handleFileClick = (file) => {
    const endpoint = file.type === 'file' ? '/api/select-file' : '/api/select-dir';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath: file.relativePath }),
    })
    .catch(err => console.error(`Error updating view for ${file.name}:`, err));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col">

       {/* top section */}
      <header className="h-16 border-b border-slate-800 flex items-center px-8 justify-between bg-[#0f172a] sticky top-0 z-10">
         {/* top section: title */}
        <div className="flex items-center gap-3">
          <Layout size={20}></Layout>
          <h1 className="font-bold text-xl">AGENT <span className="text-blue-400">DASHBOARD</span></h1>
        </div>
        
        {/* top section: agent connection status display */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {isAgentConnected ? (
            <span className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 border border-emerald-500/10 rounded-md">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              CONNECTED
            </span>
          ) : (
            <span className="flex items-center gap-2 text-rose-400 bg-rose-500/5 px-2.5 py-1.5 border border-rose-500/10 rounded-md">
              <div className="w-2 h-2 bg-rose-500 rounded-full" />
              DISCONNECTED
            </span>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <main className="flex-1 grid grid-cols-12 gap-0">
        <Sidebar 
          data={data} 
          onNavigateUp={handleNavigateUp} 
          onFileClick={handleFileClick} 
        />

        {/* middle section */}
        <section className="col-span-9 p-4 space-y-8">
          {/* chart to visualize file lengths */}
          <FileLengthChart files={data?.files} />

          {/* view latest file state and apply agent changes */}
          <CodeView data={data} hasChanges={hasChanges} />

        </section>
      </main>
    </div>
  );
}