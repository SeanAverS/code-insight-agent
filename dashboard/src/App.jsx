import React from 'react';
import { Layout, Activity, MessageSquareCode } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CodeDiffView from './CodeDiffView';
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

        {/* middle top section */}
        <section className="col-span-9 p-4 space-y-8">
          {/* File Length */}
          <FileLengthChart files={data?.files} />

          {/* middle bottom section */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-2 gap-5">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                {/* handle file with proposed or no proposed changes */}
                <MessageSquareCode size={16} className={hasChanges ? "text-purple-400" : "text-slate-400"} />
                {hasChanges ? "Proposed Changes" : "File Contents"}
              </h2>

              {/* apply proposed changes */}
              {hasChanges && (
                <button
                  onClick={() => {
                    fetch('/api/apply-changes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        relative_path: data.activeFile,
                        content: data.proposedCode
                      }),
                    })
                      .then(() => alert("Changes applied!"))
                      .catch(err => console.error("Error applying changes:", err));
                  }}
                  className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-md hover:bg-purple-500/30 transition-all"
                >
                  Apply Changes
                </button>
              )}

              {/* sync dashboard to local file state */}
              {data && data.activeFile && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetch('/api/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ relativePath: data.activeFile }),
                      })
                        .catch(err => console.error("Sync error:", err));
                    }}
                    className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors"
                    title="Sync dashboard with actual file content"
                  >
                    🔄 Sync
                  </button>
                </div>
              )}
             
             {/* the current selected file */}
              {data && data.activeFile && (
                <span className="text-[11px] font-mono text-slate-500">{data.activeFile}</span>
              )}
            </div>

              {/* prompt instructions */}
              {!hasChanges && (
                <span className="text-[12px] text-slate-400 italic block mb-3">
                  Prompt: "suggest changes for [File Path] on dashboard"
                </span>
              )}

            {data && data.currentCode ? (
              <div className="flex flex-col h-[400px] bg-black/30 rounded-xl border border-slate-800/60 overflow-hidden font-mono text-[12px]">

                {/* render legend for file with proposed changes */}
                {hasChanges && (
                  <div className="bg-slate-950/50 px-3 py-1.5 border-b border-slate-800/60 text-[10px] text-slate-500 font-bold tracking-wider">
                    <div className="flex gap-4">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Additions
                      </span>
                      <span className="text-rose-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Removals
                      </span>
                    </div>
                  </div>
                )}


               {/* middle bottom section: proposed changes code */}
                <div className="flex-1 p-3 overflow-auto leading-relaxed select-text whitespace-pre">
                  <CodeDiffView currentCode={data.currentCode} proposedCode={data.proposedCode} />
                </div>
             </div>
           ) : ( // instructions to see changes on dashboard
             <div className="font-mono text-sm text-slate-400 leading-relaxed bg-black/20 p-4 rounded-lg">
              Click a file to see it's code, then Prompt to see agent suggestions
             </div>
           )}
         </div>


        </section>
      </main>
    </div>
  );
}