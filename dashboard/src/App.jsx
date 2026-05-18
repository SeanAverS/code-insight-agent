import React, { useState, useEffect } from 'react';
import { Layout, FolderTree, Activity, MessageSquareCode, Terminal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ScoutDashboard() {
  const [data, setData] = useState(null);
  const [isAgentConnected, setIsAgentConnected] = useState(false);

  // check agent connection status
  useEffect(() => {
    const fetchData = () => {
      fetch('/data.json')
        .then(res => {
          if (!res.ok) throw new Error("Offline");
          return res.json();
        })
        .then(json => {
          setData(json);
          setIsAgentConnected(true); 
        })
        .catch(err => {
          console.log("Waiting...");
          setIsAgentConnected(false); 
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // check for dashboard changes every 3 seconds
    return () => clearInterval(interval);
  }, []);

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

      {/* left sidebar */}
      <main className="flex-1 grid grid-cols-12 gap-0">
        {/* left sidebar: title */}
        <aside className="col-span-3 border-r border-slate-800 p-6 bg-[#0f172a]/30 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
          <div>
            <div className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <FolderTree size={16} /> Current Directory
              </h2>
        
              {/* left sidebar: current folder title */}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400 max-w-full truncate">
                <span className="opacity-60">📂</span>
                <span className="truncate">
                  {data && data.activeFile
                    ? data.activeFile.split('/').slice(0, -1).join('/') || './'
                    : 'root'}
                </span>
              </div>
            </div>

            {/* left sidebar: current folder/files agent is reading */}
            <div className="space-y-2">
              {data && data.files ? (
                data.files.map((file, idx) => {
                  const isSelected = data.activeFile && data.activeFile.endsWith(file.name);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 text-sm cursor-default transition-colors ${
                        isSelected ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-blue-400'
                      }`}
                    >
                      <span>{file.type === 'directory' ? '📂' : '📄'}</span>
                      <span className="truncate">{file.name}</span>
                    </div>
                  );
                })
              ) : (
                <div className="opacity-50 italic text-sm text-slate-500">
                  Prompt agent for improvements to desired file
                </div>
              )}
            </div>
          </div>

          {/* left sidebar: current file agent is analyzing */}
          <div className="border-t border-slate-800/60 pt-6 mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Terminal size={14} /> Live Activity
            </h2>
            <div className="space-y-2">
              <div className="p-2 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                
                 <p className="text-xs truncate">
                   {data && data.activeFile ? `Analyzing ${data.activeFile.split('/').pop()}` : 'Idle - Awaiting file to analyze'}
                 </p>
              </div>
              {data && data.lastUpdated && (
                <div className="p-3 bg-slate-900/30 border border-slate-800/60 rounded-xl font-mono text-[10px] text-slate-500 space-y-0.5">
                  <div>TIMESTAMP: {data.lastUpdated}</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* middle top section */}
        <section className="col-span-9 p-4 space-y-8">
          {/* File Length */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Activity size={16} className="text-blue-400" /> File Length
            </h2>
            {/* bar chart for file lengths */}
            <div className="h-64">
              {data && data.files ? (
                <ResponsiveContainer width="100%" height="100%">
                  {/* show up to 20 files */}
                  <BarChart data={data.files.slice(0, 20)}> 
                    <XAxis dataKey="name" hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Bar dataKey={(file) => file.name.length} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                  No data analyzed yet.
                </div>
              )}
            </div>
          </div>

          {/* middle bottom section */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquareCode size={16} className="text-purple-400" /> Code Suggestions
              </h2>
              {data && data.activeFile && (
                <span className="text-[10px] font-mono text-slate-500">{data.activeFile}</span>
              )}
            </div>

            {data && data.currentCode ? (
              <div className="grid grid-cols-2 gap-4 font-mono text-[11px] h-72">
                {/* local code */}
                <div className="flex flex-col h-full bg-black/30 rounded-xl border border-slate-800/60 overflow-hidden">
                  <div className="bg-slate-950/50 px-3 py-1.5 border-b border-slate-800/60 text-[10px] text-slate-500 font-bold tracking-wider">LOCAL SOURCE</div>
                  <div className="flex-1 p-3 overflow-auto text-slate-400 leading-relaxed whitespace-pre select-text">
                    {data.currentCode}
                  </div>
                </div>
                {/* ai recommended code */}
                <div className="flex flex-col h-full bg-purple-950/5 rounded-xl border border-purple-900/20 overflow-hidden">
                  <div className="bg-purple-950/20 px-3 py-1.5 border-b border-purple-900/20 text-[10px] text-purple-400 font-bold tracking-wider">AI RECOMMENDATION</div>
                  <div className="flex-1 p-3 overflow-auto text-purple-300 leading-relaxed whitespace-pre select-text">
                    {data.proposedCode || '// Staging complete. Awaiting optimization criteria instructions...'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="font-mono text-sm text-slate-400 leading-relaxed bg-black/20 p-4 rounded-lg">
                 Ready for project analysis - Use a tool show code recommendations.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}