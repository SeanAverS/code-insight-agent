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
              <div
                onClick={() => {
                  const currentFolder = data?.activeFile ? data.activeFile.replace(/\/$/, '') : ''; // remove slash

                  // do not navigate past root 
                  if (!currentFolder || currentFolder === '.' || currentFolder === './') return;

                  fetch('/api/select-dir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ relativePath: currentFolder, goUp: true }),
                  })
                    .catch(err => console.error("Error navigating up a directory:", err));
                }}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400 max-w-full truncate select-none transition-colors ${data?.activeFile && data.activeFile !== './' && data.activeFile !== ''
                    ? 'cursor-pointer hover:bg-blue-500/20 hover:text-blue-300'
                    : 'cursor-not-allowed opacity-70'
                  }`}
                title={data?.activeFile && data.activeFile !== './' ? "Click to go up one folder" : "Root directory"}
              >
                <span className="opacity-60">
                  {data?.activeFile && data.activeFile !== './' && data.activeFile !== '' ? '⬆️' : '📂'}
                </span>
                <span className="truncate">
                  {data && data.activeFile
                    ? data.activeFile.replace(/\/$/, '') || './'
                    : './'}
                </span>
              </div>
            </div>

            {/* left sidebar: current folder/files agent is reading */}
            <div className="space-y-2">
              {data && data.files ? (
                data.files.map((file, idx) => {
                  const isSelected = data.activeFile && data.activeFile.endsWith(file.name);
                  const isFile = file.type === 'file';

                  // sidebar navigation requests 
                  const handleItemClick = () => {
                    const endpoint = isFile ? '/api/select-file' : '/api/select-dir';

                    fetch(endpoint, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ relativePath: file.relativePath }),
                    })
                      .catch(err => console.error(`Error updating view for ${file.name}:`, err));
                  };

                  return (
                    <div
                      key={idx}
                      onClick={handleItemClick}
                      className={`flex items-center gap-2 text-sm transition-all px-2 py-1 rounded-md cursor-pointer select-none ${isSelected
                          ? 'text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20'
                          : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/40'
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
                <MessageSquareCode size={16} className="text-purple-400" /> Proposed Changes
              </h2>
              {data && data.activeFile && (
                <span className="text-[10px] font-mono text-slate-500">{data.activeFile}</span>
              )}
            </div>


            {data && data.currentCode ? (
              <div className="flex flex-col h-[400px] bg-black/30 rounded-xl border border-slate-800/60 overflow-hidden font-mono text-[12px]">
                {/* middle bottom section: labels */}
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


               {/* middle bottom section: proposed changes code */}
               <div className="flex-1 p-3 overflow-auto leading-relaxed select-text whitespace-pre">
                  {(() => {
                    const originalLines = data.currentCode.split('\n');
                    const proposedLines = data.proposedCode ? data.proposedCode.split('\n') : [];

                    // fallback: no proposal yet
                    if (proposedLines.length === 0) {
                      return originalLines.map((line, idx) => (
                        <div key={idx} className="hover:bg-slate-800/20 px-2 rounded font-normal text-slate-400">
                          <span className="inline-block w-6 select-none opacity-30 text-right mr-4">{idx + 1}</span>
                          {line || ' '}
                        </div>
                      ));
                    }

                    // track original and proposed lines at same time
                    const renderedElements = [];
                    let origIdx = 0;
                    let propIdx = 0;

                    while (origIdx < originalLines.length || propIdx < proposedLines.length) {
                      const origLine = originalLines[origIdx];
                      const propLine = proposedLines[propIdx];

                      // case 1: show original lines deleted 
                      // reaches end of proposed lines but original still has lines 
                      if (propLine === undefined && origLine !== undefined) {
                        // render deleted line red
                        renderedElements.push(
                          <div key={`rem-${origIdx}`} className="bg-rose-950/20 text-rose-300 border-l-2 border-rose-500 px-2 my-0.5 line-through decoration-rose-500/50">
                            <span className="inline-block w-6 select-none text-rose-600/60 text-right mr-4">-</span>
                            {origLine}
                          </div>
                        );
                        origIdx++; // scan next deleted line
                        continue;
                      }

                      // case 2: show added proposed lines
                      // reaches end of original lines but proposed still has lines 
                      if (origLine === undefined && propLine !== undefined) {
                        // render proposed line green 
                        renderedElements.push(
                          <div key={`add-${propIdx}`} className="bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500 px-2 my-0.5 font-medium">
                            <span className="inline-block w-6 select-none text-emerald-600/60 text-right mr-4">+</span>
                            {propLine}
                          </div>
                        );
                        propIdx++; // scan next proposed line
                        continue;
                      }

                      // case 3: lines match perfectly(unchanged code)
                      const cleanOrig = origLine.trim();
                      const cleanProp = propLine.trim();

                      if (cleanOrig === cleanProp) {
                        // render line grey 
                        renderedElements.push(
                          <div key={`match-${propIdx}`} className="hover:bg-slate-800/10 text-slate-400 px-2 opacity-80">
                            <span className="inline-block w-6 select-none opacity-20 text-right mr-4">{propIdx + 1}</span>
                            {propLine || ' '}
                          </div>
                        );
                        // scan next line together
                        origIdx++;
                        propIdx++;
                      } else { // lines do not match 
                        // case 4: check if line was deleted or inserted
                        // can the proposed file eventually come across current line from the original file?
                        const existsAheadInProp = proposedLines.slice(propIdx).some(pl => pl.trim() === cleanOrig);

                        if (!existsAheadInProp) { // original line was deleted, render this red 
                          renderedElements.push(
                            <div key={`rem-${origIdx}`} className="bg-rose-950/20 text-rose-300 border-l-2 border-rose-500 px-2 my-0.5 line-through decoration-rose-500/50">
                              <span className="inline-block w-6 select-none text-rose-600/60 text-right mr-4">-</span>
                              {origLine}
                            </div>
                          );
                          origIdx++; // check if next line matches proposed pointer
                        } else { // proposed line was inserted, render this green
                          renderedElements.push(
                            <div key={`add-${propIdx}`} className="bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500 px-2 my-0.5 font-medium">
                              <span className="inline-block w-6 select-none text-emerald-600/60 text-right mr-4">+</span>
                              {propLine}
                            </div>
                          );
                          propIdx++; // check if next line matches original pointer 
                        }
                      }
                    }

                    return renderedElements;
                  })()}
               </div>
             </div>
           ) : (
             <div className="font-mono text-sm text-slate-400 leading-relaxed bg-black/20 p-4 rounded-lg">
               Ready for project analysis - Ask agent to recommend code improvements.
             </div>
           )}
         </div>


        </section>
      </main>
    </div>
  );
}